import * as crypto from 'crypto';
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AntiFraudService } from '../anti-fraud/anti-fraud.service';
import { CryptoUtil } from '../common/utils/crypto.util';
import {
  getPlantingProgressNotesMinLength,
} from '../harvest-announcements/planting-progress.util';
import {
  MaterialBarcodeValidationService,
  type GrowerMaterialKind,
} from '../compliance/material-barcode-validation.service';
import { GrowthLogTreatmentSyncService } from '../treatment-logs/growth-log-treatment-sync.service';
import { SmartLockService } from '../smart-lock/smart-lock.service';

const MATERIAL_KINDS = new Set<GrowerMaterialKind>(['SEED', 'FERTILIZER', 'PESTICIDE']);

@Injectable()
export class GrowthLogsService {
  constructor(
    private prisma: PrismaService,
    private antiFraudService: AntiFraudService,
    private materialBarcodeValidation: MaterialBarcodeValidationService,
    private growthLogTreatmentSync: GrowthLogTreatmentSyncService,
    private smartLockService: SmartLockService,
  ) {}

  async create(userId: string, data: {
    estateId: string;
    parcelId: string;
    harvestAnnouncementId: string;
    imageUrl: string;
    imageHash: string;
    gpsLatitude: number;
    gpsLongitude: number;
    deviceId: string;
    deviceTimestamp: Date | string;
    notes?: string;
    growthStage?: string;
    materialBarcode?: string;
    materialKind?: string;
    /** When true, materialBarcode + materialKind are required (setva / đubrivo / prskanje). */
    requiresMaterialBarcode?: boolean;
  }) {
    const deviceTimestamp =
      data.deviceTimestamp instanceof Date
        ? data.deviceTimestamp
        : new Date(String(data.deviceTimestamp));
    if (Number.isNaN(deviceTimestamp.getTime())) {
      throw new BadRequestException('Invalid deviceTimestamp');
    }
    if (!data.parcelId?.trim()) {
      throw new BadRequestException('Parcel is required (choose a parcel on the field list).');
    }
    if (!data.harvestAnnouncementId?.trim()) {
      throw new BadRequestException('Crop plan is required: register a planting or harvest plan for this parcel first.');
    }
    // Verify estate ownership
    const estate = await this.prisma.estates.findFirst({
      where: {
        id: data.estateId,
        ownerId: userId,
      },
    });

    if (!estate) {
      throw new ForbiddenException('Estate not found or access denied');
    }

    const parcel = await this.prisma.parcels.findFirst({
      where: { id: data.parcelId, estateId: data.estateId },
    });
    if (!parcel) {
      throw new ForbiddenException('Parcel not found on this estate');
    }
    if (!parcel.approvedAt) {
      throw new ForbiddenException(
        'This parcel is not approved yet. Journal entries are available after an administrator approves the parcel.',
      );
    }

    const plan = await this.prisma.harvest_announcements.findFirst({
      where: {
        id: data.harvestAnnouncementId,
        userId,
        parcelId: data.parcelId,
        status: { not: 'CANCELLED' },
      },
    });
    if (!plan) {
      throw new BadRequestException(
        'No matching crop plan for this parcel, or the plan is cancelled. Open “New planting” or your harvest plan first.',
      );
    }

    if (plan.announcementType === 'PLANTING') {
      const minNotes = getPlantingProgressNotesMinLength();
      const notesLen = data.notes?.trim().length ?? 0;
      if (notesLen < minNotes) {
        throw new BadRequestException(
          `For planting plans, describe progress and any changes in Notes (at least ${minNotes} characters).`,
        );
      }
      if (!data.growthStage?.trim()) {
        throw new BadRequestException(
          'For planting plans, choose or enter a growth stage (required with the progress photo).',
        );
      }
    }

    const requiresMaterial =
      data.requiresMaterialBarcode === true ||
      (typeof data.materialKind === 'string' && MATERIAL_KINDS.has(data.materialKind as GrowerMaterialKind));

    const materialBarcode = data.materialBarcode?.trim().replace(/\s+/g, '') ?? '';
    const materialKindRaw = data.materialKind?.trim().toUpperCase() ?? '';

    if (requiresMaterial) {
      if (!materialBarcode) {
        throw new BadRequestException(
          'Material barcode is required for planting, fertilizing, and spraying entries.',
        );
      }
      if (!MATERIAL_KINDS.has(materialKindRaw as GrowerMaterialKind)) {
        throw new BadRequestException('Material kind must be SEED, FERTILIZER, or PESTICIDE.');
      }
      await this.materialBarcodeValidation.assertValidForGrower(
        userId,
        materialBarcode,
        materialKindRaw as GrowerMaterialKind,
        { farmId: data.estateId, entryType: 'GROWTH_LOG' },
      );
    } else if (materialBarcode) {
      if (!MATERIAL_KINDS.has(materialKindRaw as GrowerMaterialKind)) {
        throw new BadRequestException('Material kind must be SEED, FERTILIZER, or PESTICIDE when barcode is sent.');
      }
      await this.materialBarcodeValidation.assertValidForGrower(
        userId,
        materialBarcode,
        materialKindRaw as GrowerMaterialKind,
        { farmId: data.estateId, entryType: 'GROWTH_LOG' },
      );
    }

    // Anti-fraud validation
    const fraudValidation = await this.antiFraudService.validateGrowthLogSubmission({
      gpsLatitude: data.gpsLatitude,
      gpsLongitude: data.gpsLongitude,
      deviceTimestamp,
      deviceId: data.deviceId,
      imageHash: data.imageHash,
    });

    if (!fraudValidation.isValid) {
      throw new BadRequestException(`Fraud validation failed: ${fraudValidation.errors.join(', ')}`);
    }

    // Calculate time offset
    const networkTimestamp = new Date();
    const timestampValidation = this.antiFraudService.validateTimestamp(
      deviceTimestamp,
      networkTimestamp,
    );

    // Get previous log hash for chaining (same parcel + same crop plan)
    const previousLog = await this.prisma.growth_logs.findFirst({
      where: {
        estateId: data.estateId,
        parcelId: data.parcelId,
        harvestAnnouncementId: data.harvestAnnouncementId,
      },
      orderBy: { createdAt: 'desc' },
      select: { dataHash: true },
    });

    // Generate cryptographic hash for this log (Immutable proof)
    const dataHash = CryptoUtil.hashGrowthLog({
      userId,
      estateId: data.estateId,
      parcelId: data.parcelId,
      harvestAnnouncementId: data.harvestAnnouncementId,
      imageHash: data.imageHash,
      gpsLatitude: data.gpsLatitude,
      gpsLongitude: data.gpsLongitude,
      networkTimestamp,
    });

    // Check for duplicate hash (data integrity)
    const existingLog = await this.prisma.growth_logs.findUnique({
      where: { dataHash },
    });

    if (existingLog) {
      throw new BadRequestException('Duplicate log detected. This entry already exists.');
    }

    if (
      materialKindRaw === 'SEED' &&
      materialBarcode &&
      data.parcelId?.trim() &&
      plan.announcementType === 'PLANTING'
    ) {
      await this.smartLockService.ensureSeedLinkedToParcel({
        inputSerialNumber: materialBarcode,
        userId,
        parcelId: data.parcelId.trim(),
        gpsLatitude: data.gpsLatitude,
        gpsLongitude: data.gpsLongitude,
        deviceId: data.deviceId,
      });
    }

    // Create immutable log
    const growthLog = await this.prisma.growth_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        estateId: data.estateId,
        parcelId: data.parcelId,
        harvestAnnouncementId: data.harvestAnnouncementId,
        imageUrl: data.imageUrl,
        imageHash: data.imageHash,
        gpsLatitude: data.gpsLatitude,
        gpsLongitude: data.gpsLongitude,
        deviceId: data.deviceId,
        networkTimestamp,
        deviceTimestamp,
        timeOffset: timestampValidation.timeOffset,
        notes: data.notes,
        growthStage: data.growthStage,
        materialBarcode: materialBarcode || null,
        materialKind: materialKindRaw || null,
        dataHash,
        previousLogHash: previousLog?.dataHash || null,
      },
    });

    if (
      materialKindRaw === 'PESTICIDE' &&
      materialBarcode &&
      data.parcelId?.trim()
    ) {
      await this.growthLogTreatmentSync.recordPesticideApplication({
        userId,
        parcelId: data.parcelId.trim(),
        materialBarcode,
        deviceTimestamp,
        gpsLatitude: data.gpsLatitude,
        gpsLongitude: data.gpsLongitude,
        deviceId: data.deviceId,
        notes: data.notes,
      });
    }

    return growthLog;
  }

  async findAllByEstate(estateId: string, userId: string) {
    // Verify ownership
    const estate = await this.prisma.estates.findFirst({
      where: {
        id: estateId,
        ownerId: userId,
      },
    });

    if (!estate) {
      throw new ForbiddenException('Estate not found or access denied');
    }

    return this.prisma.growth_logs.findMany({
      where: { estateId },
      orderBy: { createdAt: 'desc' },
      include: {
        parcels: {
          select: {
            id: true,
            cropType: true,
          },
        },
        harvest_announcements: {
          select: {
            id: true,
            cropType: true,
            announcementType: true,
            estimatedDate: true,
            status: true,
          },
        },
      },
    });
  }

  async findAllByParcel(parcelId: string, userId: string) {
    const parcel = await this.prisma.parcels.findFirst({
      where: {
        id: parcelId,
        estates: {
          ownerId: userId,
        },
      },
    });

    if (!parcel) {
      throw new ForbiddenException('Parcel not found or access denied');
    }

    return this.prisma.growth_logs.findMany({
      where: { parcelId },
      orderBy: { createdAt: 'desc' },
      include: {
        parcels: {
          select: {
            id: true,
            cropType: true,
          },
        },
        harvest_announcements: {
          select: {
            id: true,
            cropType: true,
            announcementType: true,
            estimatedDate: true,
            status: true,
          },
        },
      },
    });
  }
}
