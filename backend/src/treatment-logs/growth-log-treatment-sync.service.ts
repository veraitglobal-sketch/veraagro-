import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * When a grower logs spraying via growth_logs (field diary), mirror into treatment_logs for PHI.
 */
@Injectable()
export class GrowthLogTreatmentSyncService {
  private readonly logger = new Logger(GrowthLogTreatmentSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordPesticideApplication(params: {
    userId: string;
    parcelId: string;
    materialBarcode: string;
    deviceTimestamp: Date;
    gpsLatitude: number;
    gpsLongitude: number;
    gpsAccuracy?: number;
    deviceId?: string;
    notes?: string;
  }): Promise<void> {
    const bar = params.materialBarcode.trim().replace(/\s+/g, '');
    if (bar.length < 3) return;

    const whitelist = await this.prisma.bio_white_list.findFirst({
      where: { barcode: bar, isActive: true },
      select: { id: true, productName: true },
    });

    let productId: string;
    let productName: string;

    if (whitelist) {
      productId = whitelist.id;
      productName = whitelist.productName;
    } else {
      const unit = await this.prisma.supplier_material_barcodes.findUnique({
        where: { barcode: bar },
        include: { catalogItem: { select: { name: true } } },
      });
      productId = bar;
      productName = unit?.catalogItem?.name?.trim() || bar;
    }

    const deviceTs = params.deviceTimestamp;
    const now = new Date();
    const hoursDiff = (now.getTime() - deviceTs.getTime()) / (1000 * 60 * 60);
    const needsAudit = hoursDiff > 24;

    try {
      await this.prisma.treatment_logs.create({
        data: {
          id: crypto.randomUUID(),
          parcelId: params.parcelId,
          userId: params.userId,
          productId,
          productName,
          dosage: '—',
          reason: params.notes?.trim()?.slice(0, 500) || 'Field diary (spraying)',
          appliedAt: deviceTs,
          gpsLatitude: params.gpsLatitude,
          gpsLongitude: params.gpsLongitude,
          gpsAccuracy: params.gpsAccuracy,
          deviceId: params.deviceId,
          deviceTimestamp: deviceTs,
          needsAudit,
        },
      });
    } catch (e) {
      this.logger.warn(
        `treatment_logs mirror from growth_log failed parcelId=${params.parcelId} barcode=${bar}`,
        e instanceof Error ? e.message : e,
      );
    }
  }
}
