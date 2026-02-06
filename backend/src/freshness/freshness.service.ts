import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

// Shelf life in hours for different crop types
const SHELF_LIFE_HOURS: Record<string, number> = {
  RASPBERRIES: 48,
  BLACKBERRIES: 48,
  BLUEBERRIES: 48,
  APPLES: 30 * 24, // 30 days
  PEPPERS: 14 * 24, // 14 days
};

@Injectable()
export class FreshnessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create freshness tracker for a batch
   */
  async createFreshnessTracker(batchId: string, cropType: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }

    const cropTypeUpper = cropType.toUpperCase();
    const shelfLifeHours = SHELF_LIFE_HOURS[cropTypeUpper] || 48; // Default 48 hours

    const expiresAt = new Date(batch.harvestDate);
    expiresAt.setHours(expiresAt.getHours() + shelfLifeHours);

    return this.prisma.freshness_trackers.create({
      data: {
        id: crypto.randomUUID(),
        batchId,
        cropType: cropTypeUpper,
        timestampHarvested: batch.harvestDate,
        shelfLifeHours,
        remainingShelfLifeHours: shelfLifeHours,
        expiresAt,
        isExpired: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Calculate remaining shelf life for a batch
   */
  async calculateRemainingShelfLife(batchId: string) {
    const tracker = await this.prisma.freshness_trackers.findUnique({
      where: { batchId },
    });

    if (!tracker) {
      throw new NotFoundException(`Freshness tracker for batch ${batchId} not found`);
    }

    const now = new Date();
    const elapsedHours = (now.getTime() - tracker.timestampHarvested.getTime()) / (1000 * 60 * 60);
    const remainingHours = tracker.shelfLifeHours - elapsedHours;
    const isExpired = remainingHours <= 0;

    // Update tracker
    const updated = await this.prisma.freshness_trackers.update({
      where: { id: tracker.id },
      data: {
        remainingShelfLifeHours: Math.max(0, remainingHours),
        isExpired,
        alertSentAt: isExpired && !tracker.alertSentAt ? now : tracker.alertSentAt,
      },
    });

    return {
      batchId,
      cropType: tracker.cropType,
      timestampHarvested: tracker.timestampHarvested,
      shelfLifeHours: tracker.shelfLifeHours,
      remainingShelfLifeHours: updated.remainingShelfLifeHours,
      expiresAt: tracker.expiresAt,
      isExpired: updated.isExpired,
      hoursUntilExpiry: Math.max(0, remainingHours),
    };
  }

  /**
   * Get all batches expiring soon (within next 24 hours)
   */
  async getBatchesExpiringSoon() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.freshness_trackers.findMany({
      where: {
        expiresAt: {
          lte: tomorrow,
          gte: now,
        },
        isExpired: false,
      },
      include: {
        batches: {
          include: {
            estates: true,
          },
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });
  }

  /**
   * Get all expired batches
   */
  async getExpiredBatches() {
    return this.prisma.freshness_trackers.findMany({
      where: {
        isExpired: true,
      },
      include: {
        batches: {
          include: {
            estates: true,
          },
        },
      },
      orderBy: {
        expiresAt: 'desc',
      },
    });
  }
}
