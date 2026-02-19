import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class FarmerProfileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get farmer profile by QR code (public endpoint)
   * Used when scanning QR code on product box
   */
  async getFarmerProfileByQrCode(qrCode: string) {
    const user = await this.prisma.users.findUnique({
      where: { farmerQrCode: qrCode },
      include: {
        estates: {
          include: {
            parcels: {
              include: {
                growth_logs: {
                  orderBy: { createdAt: 'desc' },
                  take: 5, // Latest 5 growth logs with photos
                },
              },
            },
          },
        },
        batches_batches_harvestedByUserIdTousers: {
          orderBy: { harvestDate: 'desc' },
          take: 10, // Latest 10 harvests
          select: {
            batchId: true,
            productName: true,
            harvestDate: true,
            quantity: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Farmer profile not found');
    }

    // Check if user is a farmer/grower
    const isFarmer = user.roles.includes('FARMER') || user.roles.includes('GROWER');
    if (!isFarmer) {
      throw new NotFoundException('User is not a farmer');
    }

    // Get all compliance photos from estates
    const compliancePhotos = await this.prisma.compliance_photos.findMany({
      where: {
        batchId: {
          in: user.batches_batches_harvestedByUserIdTousers.map(b => b.batchId),
        },
      },
      orderBy: { uploadedAt: 'desc' },
      take: 10, // Latest 10 compliance photos
      select: {
        photoUrl: true,
        photoType: true,
        uploadedAt: true,
      },
    });

    // Calculate years of experience (from first estate creation or default)
    const firstEstate = user.estates[0];
    const yearsOfExperience = user.yearsOfExperience || 
      (firstEstate?.createdAt 
        ? Math.floor((new Date().getTime() - new Date(firstEstate.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))
        : null);

    // Get location from first estate (use polygonCoordinates)
    const location = firstEstate?.polygonCoordinates || null;
    const region = this.extractRegionFromLocation(location);

    // Get latest harvest year
    const latestHarvest = user.batches_batches_harvestedByUserIdTousers[0];
    const harvestYear = latestHarvest?.harvestDate 
      ? new Date(latestHarvest.harvestDate).getFullYear()
      : new Date().getFullYear();

    return {
      farmer: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName, // Full name for profile (not privacy-protected)
        photo: user.farmerPhoto,
        bio: user.farmerBio || `Ovo je domaćinstvo ${user.firstName} ${user.lastName}${region ? ` iz ${region}` : ' iz Evrope'}, gaje ${this.getCropTypes(user.estates)} ${yearsOfExperience ? `već ${yearsOfExperience} godina` : 'dugo godina'}.`,
        generation: user.generation || '3rd',
        yearsOfExperience: yearsOfExperience,
        isVeraPartner: user.isVeraPartner,
        partnerCode: user.partnerCode,
      },
      location: {
        region: region,
        estates: user.estates.map(estate => ({
          name: estate.name,
          location: this.extractRegionFromLocation(estate.polygonCoordinates || null),
        })),
      },
      stats: {
        totalEstates: user.estates.length,
        totalBatches: user.batches_batches_harvestedByUserIdTousers.length,
        latestHarvestYear: harvestYear,
        crops: this.getCropTypes(user.estates),
      },
      photos: {
        profile: user.farmerPhoto,
        field: compliancePhotos.map(p => p.photoUrl),
        growth: user.estates.flatMap(estate => 
          estate.parcels.flatMap(parcel => 
            parcel.growth_logs
              .filter(log => log.imageUrl)
              .map(log => log.imageUrl)
          )
        ).slice(0, 10), // Latest 10 growth photos
      },
      recentHarvests: user.batches_batches_harvestedByUserIdTousers.map(batch => ({
        batchId: batch.batchId,
        productName: batch.productName,
        harvestDate: batch.harvestDate,
        harvestYear: new Date(batch.harvestDate).getFullYear(),
        quantity: batch.quantity,
      })),
    };
  }

  /**
   * Get farmer profile by user ID (authenticated)
   */
  async getFarmerProfileByUserId(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        estates: {
          include: {
            parcels: true,
          },
        },
        batches_batches_harvestedByUserIdTousers: {
          orderBy: { harvestDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is a farmer/grower
    const isFarmer = user.roles.includes('FARMER') || user.roles.includes('GROWER');
    if (!isFarmer) {
      throw new NotFoundException('User is not a farmer');
    }

    // Ensure grower has a unique farmerQrCode for their public profile / QR
    let farmerQrCode = user.farmerQrCode;
    if (!farmerQrCode) {
      const code = user.partnerCode || user.id.replace(/-/g, '').slice(0, 8).toUpperCase();
      farmerQrCode = `FARMER-${code}`;
      await this.prisma.users.update({
        where: { id: userId },
        data: { farmerQrCode },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const farmerProfileUrl = `${frontendUrl}/farmer/${farmerQrCode}`;

    // Get location from first estate
    const firstEstate = user.estates[0];
    const location = firstEstate?.polygonCoordinates || null;
    const region = this.extractRegionFromLocation(location);

    return {
      farmer: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        photo: user.farmerPhoto,
        bio: user.farmerBio || `Ovo je domaćinstvo ${user.firstName} ${user.lastName}${region ? ` iz ${region}` : ' iz Evrope'}, gaje ${this.getCropTypes(user.estates)} ${user.yearsOfExperience ? `već ${user.yearsOfExperience} godina` : 'dugo godina'}.`,
        generation: user.generation || '3rd',
        yearsOfExperience: user.yearsOfExperience,
        isVeraPartner: user.isVeraPartner,
        partnerCode: user.partnerCode,
      },
      location: {
        region: region,
        estates: user.estates.map(estate => ({
          name: estate.name,
          location: this.extractRegionFromLocation(estate.polygonCoordinates || null),
        })),
      },
      farmerQrCode,
      farmerProfileUrl,
    };
  }

  /**
   * Get QR code image for the authenticated grower (by user ID).
   * Ensures farmerQrCode exists, then returns data URL of the QR image.
   */
  async getMyQrCodeImageForUserId(userId: string): Promise<string> {
    const profile = await this.getFarmerProfileByUserId(userId);
    const qrCode = (profile as any).farmerQrCode;
    if (!qrCode) {
      throw new NotFoundException('Farmer QR code not found');
    }
    return this.generateFarmerQrCodeImage(qrCode);
  }

  /**
   * Update farmer profile
   */
  async updateFarmerProfile(userId: string, data: {
    farmerPhoto?: string;
    farmerBio?: string;
    yearsOfExperience?: number;
    generation?: string;
  }) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        farmerPhoto: data.farmerPhoto,
        farmerBio: data.farmerBio,
        yearsOfExperience: data.yearsOfExperience,
        generation: data.generation,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Generate QR code image for farmer
   */
  async generateFarmerQrCodeImage(qrCode: string): Promise<string> {
    if (!qrCode) {
      throw new NotFoundException('Farmer QR code not found');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const profileUrl = `${frontendUrl}/farmer/${qrCode}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return qrCodeDataUrl;
  }

  /**
   * Extract region from location (privacy protection)
   */
  private extractRegionFromLocation(location: any): string | null {
    if (!location) return null;
    
    // If location is a string, try to extract region
    if (typeof location === 'string') {
      // Try to extract city/region from address string
      const parts = location.split(',');
      return parts[parts.length - 1]?.trim() || null;
    }
    
    // If location is coordinates, we can't extract region
    return null;
  }

  /**
   * Get crop types from estates
   */
  private getCropTypes(estates: any[]): string {
    const crops = new Set<string>();
    estates.forEach(estate => {
      estate.parcels?.forEach((parcel: any) => {
        if (parcel.cropType) {
          crops.add(parcel.cropType);
        }
      });
    });
    
    const cropArray = Array.from(crops);
    if (cropArray.length === 0) return 'voće i povrće';
    if (cropArray.length === 1) return cropArray[0].toLowerCase();
    if (cropArray.length === 2) return `${cropArray[0].toLowerCase()} i ${cropArray[1].toLowerCase()}`;
    return `${cropArray.slice(0, -1).join(', ').toLowerCase()} i ${cropArray[cropArray.length - 1].toLowerCase()}`;
  }
}
