import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class VeraTransparencyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Batch Manager: Grupiše batch-ove po Sorti i Farmeru
   * Blokira mešanje različitih sorti u istoj digitalnoj isporuci
   */
  async groupBatchesByVarietyAndFarmer(batchIds: string[]) {
    if (!batchIds || batchIds.length === 0) {
      throw new BadRequestException('Batch IDs are required');
    }

    // Get all batches with their details
    const batches = await this.prisma.batches.findMany({
      where: {
        id: { in: batchIds },
      },
      include: {
        estates: {
          include: {
            users: true, // This is the owner via ownerId relation
          },
        },
        parcels: {
          include: {
            seeds: {
              select: {
                name: true,
                serialNumber: true,
                batchNumber: true,
              },
            },
          },
        },
      },
    });

    if (batches.length === 0) {
      throw new NotFoundException('No batches found');
    }

    // Extract variety from productName or seed name
    const getVariety = (batch: any): string => {
      // Try to extract variety from productName (e.g., "Raspberry - Heritage - Organic")
      const productName = batch.productName || '';
      const parts = productName.split(' - ');
      if (parts.length >= 2) {
        return parts[1]; // Variety is usually second part
      }
      // Fallback to seed name
      if (batch.parcels?.seeds?.name) {
        return batch.parcels.seeds.name;
      }
      // Fallback to cropType
      if (batch.parcels?.cropType) {
        return batch.parcels.cropType;
      }
      return 'Unknown';
    };

    // Group by variety and farmer
    const groups = new Map<string, {
      variety: string;
      farmerId: string;
      farmerName: string;
      farmerCode: string;
      estateId: string;
      estateName: string;
      batches: any[];
    }>();

    batches.forEach((batch) => {
      const variety = getVariety(batch);
      // Get farmer from estate users (estate owner via ownerId)
      const farmer = batch.estates?.users;
      const farmerId = farmer?.id || 'unknown';
      const farmerName = farmer
        ? `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim() || 'Unknown Farmer'
        : 'Unknown Farmer';
      const farmerCode = farmer?.partnerCode || 'UNKNOWN';
      const estateId = batch.estateId;
      const estateName = batch.estates?.name || 'Unknown Estate';

      const groupKey = `${variety}_${farmerId}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          variety,
          farmerId,
          farmerName,
          farmerCode,
          estateId,
          estateName,
          batches: [],
        });
      }

      groups.get(groupKey)!.batches.push(batch);
    });

    // Validate: Check if all batches have the same variety
    const varieties = Array.from(groups.keys()).map(key => groups.get(key)!.variety);
    const uniqueVarieties = [...new Set(varieties)];

    if (uniqueVarieties.length > 1) {
      throw new BadRequestException(
        `Cannot mix different varieties in same delivery. Found varieties: ${uniqueVarieties.join(', ')}`
      );
    }

    // Validate: Check if all batches are from the same farmer
    const farmerIds = Array.from(groups.keys()).map(key => groups.get(key)!.farmerId);
    const uniqueFarmerIds = [...new Set(farmerIds)];

    if (uniqueFarmerIds.length > 1) {
      throw new BadRequestException(
        `Cannot mix batches from different farmers in same delivery. Found farmers: ${uniqueFarmerIds.length}`
      );
    }

    return {
      grouped: Array.from(groups.values()),
      summary: {
        totalBatches: batches.length,
        variety: uniqueVarieties[0],
        farmer: groups.values().next().value?.farmerName || 'Unknown',
        canProceed: uniqueVarieties.length === 1 && uniqueFarmerIds.length === 1,
      },
    };
  }

  /**
   * Generate QR Code for batch
   * QR code contains deep dive URL
   */
  async generateBatchQRCode(batchId: string): Promise<{ qrCode: string; qrCodeUrl: string; deepDiveUrl: string }> {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Generate deep dive URL
    const deepDiveUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/transparency/batch/${batchId}`;

    // Generate QR code as data URL
    try {
      const qrCodeUrl = await QRCode.toDataURL(deepDiveUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
      });

      return {
        qrCode: batchId,
        qrCodeUrl,
        deepDiveUrl,
      };
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  /**
   * Get Deep Dive data for buyer (Aldi)
   * Returns: Map location, Variety, Photo gallery, Full traceability
   */
  async getDeepDiveData(batchId: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
      include: {
        estates: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                partnerCode: true,
              },
            },
          },
        },
        parcels: {
          include: {
            seeds: {
              select: {
                name: true,
                serialNumber: true,
                batchNumber: true,
                type: true,
              },
            },
          },
        },
        compliance_photos: {
          orderBy: { uploadedAt: 'desc' },
          select: {
            id: true,
            photoUrl: true,
            photoType: true,
            uploadedAt: true,
            isVerified: true,
          },
        },
        freshness_trackers: {
          select: {
            timestampHarvested: true,
            shelfLifeHours: true,
            remainingShelfLifeHours: true,
            expiresAt: true,
          },
        },
        temperature_logs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: {
            temperature: true,
            timestamp: true,
            location: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Extract variety information
    const getVariety = (): { name: string; type: string; organic: boolean } => {
      const productName = batch.productName || '';
      const parts = productName.split(' - ');
      
      let variety = 'Unknown';
      let type = 'Standard';
      let organic = false;

      if (parts.length >= 2) {
        variety = parts[1];
        if (parts.length >= 3) {
          type = parts[2];
          organic = parts[2].toLowerCase().includes('organic');
        }
      } else if (batch.parcels?.seeds?.name) {
        variety = batch.parcels.seeds.name;
      } else if (batch.parcels?.cropType) {
        variety = batch.parcels.cropType;
      }

      return { name: variety, type, organic };
    };

    const varietyInfo = getVariety();

    // Get farm location (polygon coordinates)
    const farmLocation = batch.estates?.polygonCoordinates as any;
    const centerPoint = this.calculateCenterPoint(farmLocation);

    // Get recent photos (last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const recentPhotos = batch.compliance_photos.filter(
      (photo) => new Date(photo.uploadedAt) >= oneHourAgo
    );

    // Build journey timeline
    const timeline = this.buildJourneyTimeline(batch);

    return {
      batchId: batch.batchId,
      productName: batch.productName,
      variety: {
        name: varietyInfo.name,
        display: `${varietyInfo.name}${varietyInfo.organic ? ' - Organic' : ''}`,
        type: varietyInfo.type,
        organic: varietyInfo.organic,
      },
      farm: {
        id: batch.estateId,
        name: batch.estates?.name || 'Unknown Farm',
        farmer: batch.estates?.users
          ? {
              name: `${batch.estates.users.firstName} ${batch.estates.users.lastName}`,
              code: batch.estates.users.partnerCode,
            }
          : null,
        location: {
          coordinates: farmLocation,
          center: centerPoint,
          address: batch.estates?.name || 'Farm Location',
        },
      },
      photos: {
        all: batch.compliance_photos.map((photo) => ({
          id: photo.id,
          url: photo.photoUrl,
          type: photo.photoType,
          uploadedAt: photo.uploadedAt,
          isVerified: photo.isVerified,
          isRecent: new Date(photo.uploadedAt) >= oneHourAgo,
        })),
        recent: recentPhotos.map((photo) => ({
          id: photo.id,
          url: photo.photoUrl,
          type: photo.photoType,
          uploadedAt: photo.uploadedAt,
          isVerified: photo.isVerified,
        })),
      },
      traceability: {
        harvestDate: batch.harvestDate,
        quantity: batch.quantity,
        unit: batch.unit,
        status: batch.status,
        timeline,
        seed: batch.parcels?.seeds
          ? {
              name: batch.parcels.seeds.name,
              serialNumber: batch.parcels.seeds.serialNumber,
              batchNumber: batch.parcels.seeds.batchNumber,
            }
          : null,
        freshness: batch.freshness_trackers
          ? {
              harvestedAt: batch.freshness_trackers.timestampHarvested,
              shelfLife: batch.freshness_trackers.shelfLifeHours,
              remaining: batch.freshness_trackers.remainingShelfLifeHours,
              expiresAt: batch.freshness_trackers.expiresAt,
            }
          : null,
        temperature: batch.temperature_logs.map((log) => ({
          temperature: log.temperature,
          timestamp: log.timestamp,
          location: log.location,
        })),
      },
      qrCode: await this.generateBatchQRCode(batchId),
    };
  }

  /**
   * Calculate center point of polygon coordinates
   */
  private calculateCenterPoint(polygon: any): { lat: number; lng: number } | null {
    if (!polygon || !Array.isArray(polygon) || polygon.length === 0) {
      return null;
    }

    let sumLat = 0;
    let sumLng = 0;

    polygon.forEach((point: any) => {
      sumLat += point.lat || point.latitude || 0;
      sumLng += point.lng || point.longitude || 0;
    });

    return {
      lat: sumLat / polygon.length,
      lng: sumLng / polygon.length,
    };
  }

  /**
   * Build journey timeline from location history
   */
  private buildJourneyTimeline(batch: any): Array<{
    stage: string;
    date: Date;
    location: string;
    details?: any;
  }> {
    const timeline: Array<{
      stage: string;
      date: Date;
      location: string;
      details?: any;
    }> = [];

    // Add harvest
    timeline.push({
      stage: 'Harvested',
      date: batch.harvestDate,
      location: batch.estates?.name || 'Farm',
      details: {
        farmer: batch.estates?.users
          ? `${batch.estates.users.firstName} ${batch.estates.users.lastName}`
          : null,
      },
    });

    // Parse location history
    const locationHistory = (batch.locationHistory as any[]) || [];
    
    locationHistory.forEach((entry) => {
      if (entry.status === 'PACKED') {
        timeline.push({
          stage: 'Packed',
          date: new Date(entry.timestamp),
          location: batch.estates?.name || 'Farm',
        });
      } else if (entry.hubId || entry.hubName) {
        timeline.push({
          stage: 'In Hub',
          date: new Date(entry.timestamp),
          location: entry.hubName || 'Hub',
          details: {
            hubId: entry.hubId,
          },
        });
      } else if (entry.status === 'IN_TRANSIT') {
        timeline.push({
          stage: 'In Transit',
          date: new Date(entry.timestamp),
          location: entry.location || 'In Transit',
        });
      }
    });

    // Sort by date
    timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

    return timeline;
  }

  /**
   * Validate batch grouping before creating delivery
   * Throws error if varieties or farmers are mixed
   */
  async validateBatchGrouping(batchIds: string[]): Promise<{
    valid: boolean;
    message?: string;
    groups?: any;
  }> {
    try {
      const result = await this.groupBatchesByVarietyAndFarmer(batchIds);
      return {
        valid: result.summary.canProceed,
        message: result.summary.canProceed
          ? 'All batches are from same variety and farmer'
          : 'Batches cannot be mixed',
        groups: result.grouped,
      };
    } catch (error: any) {
      return {
        valid: false,
        message: error.message,
      };
    }
  }
}
