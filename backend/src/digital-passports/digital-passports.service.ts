import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoUtil } from '../common/utils/crypto.util';
import * as crypto from 'crypto';

@Injectable()
export class DigitalPassportsService {
  constructor(private prisma: PrismaService) {}

  async generatePassport(estateId: string, userId: string, parcelIds?: string[]) {
    // Verify ownership
    const estate = await this.prisma.estates.findFirst({
      where: {
        id: estateId,
        ownerId: userId,
      },
      include: {
        parcels: {
          where: parcelIds ? { id: { in: parcelIds } } : undefined,
          include: {
            seeds: true,
            growth_logs: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!estate) {
      throw new ForbiddenException('Estate not found or access denied');
    }

    // Build complete export data (Digital Passport)
    const exportData = {
      estates: {
        id: estate.id,
        name: estate.name,
        polygonCoordinates: estate.polygonCoordinates,
        calculatedArea: estate.calculatedArea,
        certificationStartDate: estate.certificationStartDate,
        daysRemaining: estate.daysRemaining,
      },
      parcels: estate.parcels.map((parcel) => ({
        id: parcel.id,
        polygonCoordinates: parcel.polygonCoordinates,
        calculatedArea: parcel.calculatedArea,
        cropType: parcel.cropType,
        plantingDate: parcel.plantingDate,
        seed: parcel.seeds
          ? {
              serialNumber: parcel.seeds.serialNumber,
              name: parcel.seeds.name,
              batchNumber: parcel.seeds.batchNumber,
            }
          : null,
        growthLogs: parcel.growth_logs.map((log) => ({
          id: log.id,
          imageHash: log.imageHash,
          gpsLatitude: log.gpsLatitude,
          gpsLongitude: log.gpsLongitude,
          networkTimestamp: log.networkTimestamp,
          growthStage: log.growthStage,
          notes: log.notes,
          dataHash: log.dataHash,
          previousLogHash: log.previousLogHash,
        })),
      })),
      generatedAt: new Date().toISOString(),
      generatedBy: userId,
    };

    // Generate cryptographic hash
    const passportHash = CryptoUtil.hashPassport(exportData);

    // Check if passport already exists
    const existing = await this.prisma.digital_passports.findUnique({
      where: { passportHash },
    });

    if (existing) {
      return existing;
    }

    // Create passport
    const passport = await this.prisma.digital_passports.create({
      data: {
        id: crypto.randomUUID(),
        estateId,
        parcelIds: estate.parcels.map((p) => p.id),
        exportData,
        passportHash,
        status: 'GENERATED',
        generatedByUserId: userId,
      },
    });

    return passport;
  }

  async getPassport(passportId: string, userId: string) {
    const passport = await this.prisma.digital_passports.findUnique({
      where: { id: passportId },
      include: {
        estates: true,
      },
    });

    if (!passport) {
      throw new ForbiddenException('Passport not found');
    }

    // Verify ownership
    if (passport.estates.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return passport;
  }

  /**
   * Get passport by batchId (for QR code scanning)
   * Public endpoint - no authentication required
   */
  async getPassportByBatchId(batchId: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
      include: {
        estates: {
          include: {
            users: true,
            parcels: true,
          },
        },
        parcels: true,
        users_batches_harvestedByUserIdTousers: true,
        hubs: true,
        order_items: {
          include: {
            orders: {
              include: {
                deliveries: {
                  include: {
                    users: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new ForbiddenException('Batch not found');
    }

    // Build timeline from location history
    const locationHistory = (batch.locationHistory as any[]) || [];
    const timeline = [
      {
        stage: 'Harvested',
        date: batch.harvestDate,
        location: batch.estates.name,
        farmer: batch.users_batches_harvestedByUserIdTousers
          ? `${batch.users_batches_harvestedByUserIdTousers.firstName} ${batch.users_batches_harvestedByUserIdTousers.lastName}`
          : null,
      },
    ];

    // Add loading/packing if exists
    const packedEntry = locationHistory.find((entry) => entry.status === 'PACKED');
    if (packedEntry) {
      timeline.push({
        stage: 'Packed',
        date: packedEntry.timestamp,
        location: batch.estates.name,
        farmer: null,
      });
    }

    // Add hub entries
    const hubEntries = locationHistory.filter((entry) => entry.hubId);
    hubEntries.forEach((entry) => {
      timeline.push({
        stage: 'In Hub',
        date: entry.timestamp,
        location: entry.hubName || 'Hub',
        farmer: null,
      });
    });

    // Add transit entries
    const transitEntries = locationHistory.filter((entry) => entry.status === 'IN_TRANSIT');
    transitEntries.forEach((entry) => {
      timeline.push({
        stage: 'In Transit',
        date: entry.timestamp,
        location: entry.location || 'On the way',
        farmer: null,
      });
    });

    // Add delivery if exists
    const deliveredOrder = batch.order_items.find((item) => item.orders.deliveries?.status === 'DELIVERED');
    if (deliveredOrder) {
      timeline.push({
        stage: 'Delivered',
        date: deliveredOrder.orders.deliveries?.deliveredAt || new Date(),
        location: (deliveredOrder.orders.deliveryAddress as any)?.city || 'Delivered',
        farmer: null,
      });
    }

    // Get parcel coordinates for map
    const parcelCoordinates = batch.parcels?.polygonCoordinates || batch.estates.polygonCoordinates;

    return {
      batch: {
        batchId: batch.batchId,
        productName: batch.productName,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
      },
      origin: {
        estates: {
          name: batch.estates.name,
          location: batch.estates.polygonCoordinates,
        },
        parcel: batch.parcels
          ? {
              cropType: batch.parcels.cropType,
              coordinates: batch.parcels.polygonCoordinates,
            }
          : null,
        farmer: {
          name: `${batch.estates.users.firstName} ${batch.estates.users.lastName}`,
          trustScore: 85, // TODO: Get from TrustScore model
        },
      },
      timeline,
      map: {
        center: parcelCoordinates && Array.isArray(parcelCoordinates) && parcelCoordinates.length > 0
          ? {
              latitude: parcelCoordinates[0][0],
              longitude: parcelCoordinates[0][1],
            }
          : null,
        polygon: parcelCoordinates,
      },
      trustScore: 85, // TODO: Get from TrustScore model
    };
  }
}
