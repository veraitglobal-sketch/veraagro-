import * as crypto from 'crypto';
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryUtil } from '../common/utils/geometry.util';
import { SeedProductionService } from '../seed-production/seed-production.service';
import { extractSerialFromInput } from '../seed-production/seed-serial';

/**
 * Smart-Lock Service
 *
 * Core business logic: Input_Serial_Number is the primary key for any parcel activity.
 * Validates that scanned seed quantity matches GPS polygon area.
 * If mismatch, parcel status remains INVALID.
 */
@Injectable()
export class SmartLockService {
  constructor(
    private prisma: PrismaService,
    private seedProduction: SeedProductionService,
  ) {}

  private async assertSeedValidForGrower(serialInput: string, userId: string): Promise<void> {
    const check = await this.seedProduction.checkBagForPlanting(serialInput, userId);
    if (!check.ok) {
      const failure = check as import('../seed-production/seed-production.service').PlantingCheckFailure;
      if (failure.code === 'NOT_A_BIO_VERA_CODE') throw new NotFoundException(failure.message);
      if (failure.code === 'NOT_YOURS') throw new ForbiddenException(failure.message);
      throw new BadRequestException(failure.message);
    }
  }

  /**
   * Field diary (PLANTING + SEED barcode): link parcel.seedId or allow repeat scans for same batch.
   * Bio Vera production bags: many bags per parcel via seeds.plantedParcelId; parcel.seedId = first bag only.
   */
  async ensureSeedLinkedToParcel(params: {
    inputSerialNumber: string;
    userId: string;
    parcelId: string;
    gpsLatitude: number;
    gpsLongitude: number;
    deviceId?: string;
  }) {
    const serial = extractSerialFromInput(params.inputSerialNumber);
    await this.assertSeedValidForGrower(params.inputSerialNumber, params.userId);

    const parcel = await this.prisma.parcels.findFirst({
      where: {
        id: params.parcelId,
        estates: { ownerId: params.userId },
      },
      include: { seeds: true, estates: true },
    });
    if (!parcel) {
      throw new NotFoundException('Parcel not found or access denied');
    }
    if (!parcel.approvedAt) {
      throw new ForbiddenException(
        'This parcel is not approved yet. Planting entries are available after administrator approval.',
      );
    }

    const incoming = await this.prisma.seeds.findUnique({
      where: { serialNumber: serial },
      include: { productionRun: { include: { approvedProduct: true } } },
    });

    const alreadyOnParcel = await this.prisma.seeds.findFirst({
      where: { serialNumber: serial, plantedParcelId: params.parcelId },
    });
    if (alreadyOnParcel) {
      await this.recordSeedScan({
        inputSerialNumber: serial,
        seedId: alreadyOnParcel.id,
        userId: params.userId,
        gpsLatitude: params.gpsLatitude,
        gpsLongitude: params.gpsLongitude,
        deviceId: params.deviceId,
        parcelId: params.parcelId,
        isValid: true,
      });
      return {
        alreadyLinked: true as const,
        seed: alreadyOnParcel,
        message: 'Seed already linked to this parcel',
      };
    }

    if (incoming?.productionRunId) {
      const others = await this.prisma.seeds.findMany({
        where: {
          plantedParcelId: params.parcelId,
          productionRunId: { not: null },
          serialNumber: { not: serial },
        },
        include: { productionRun: { include: { approvedProduct: true } } },
      });
      const newCrop = incoming.productionRun?.approvedProduct?.cropType?.trim();
      for (const other of others) {
        const otherCrop = other.productionRun?.approvedProduct?.cropType?.trim();
        if (newCrop && otherCrop && newCrop !== otherCrop) {
          throw new BadRequestException(
            `This parcel already has ${otherCrop} seed planted. Use the same crop or contact Bio Vera for an override.`,
          );
        }
      }

      return this.validateAndLinkSeed(
        serial,
        params.userId,
        params.gpsLatitude,
        params.gpsLongitude,
        params.parcelId,
        params.deviceId,
      );
    }

    if (parcel.seedId && parcel.seeds?.serialNumber === serial) {
      await this.recordSeedScan({
        inputSerialNumber: serial,
        seedId: parcel.seedId,
        userId: params.userId,
        gpsLatitude: params.gpsLatitude,
        gpsLongitude: params.gpsLongitude,
        deviceId: params.deviceId,
        parcelId: params.parcelId,
        isValid: true,
      });
      return {
        alreadyLinked: true as const,
        seed: parcel.seeds,
        message: 'Seed already linked to this parcel',
      };
    }

    if (parcel.seedId && parcel.seeds?.serialNumber && parcel.seeds.serialNumber !== serial) {
      throw new BadRequestException(
        `Parcel is already linked to seed ${parcel.seeds.serialNumber}. Use that batch or contact support.`,
      );
    }

    return this.validateAndLinkSeed(
      serial,
      params.userId,
      params.gpsLatitude,
      params.gpsLongitude,
      params.parcelId,
      params.deviceId,
    );
  }

  private async recordSeedScan(data: {
    inputSerialNumber: string;
    seedId: string;
    userId: string;
    gpsLatitude: number;
    gpsLongitude: number;
    deviceId?: string;
    parcelId: string | null;
    isValid: boolean;
    validationError?: string | null;
  }) {
    return this.prisma.seed_scans.create({
      data: {
        id: crypto.randomUUID(),
        inputSerialNumber: data.inputSerialNumber,
        seedId: data.seedId,
        scannedByUserId: data.userId,
        gpsLatitude: data.gpsLatitude,
        gpsLongitude: data.gpsLongitude,
        deviceId: data.deviceId?.trim() || 'unknown',
        networkTimestamp: new Date(),
        deviceTimestamp: new Date(),
        parcelId: data.parcelId,
        isValid: data.isValid,
        validationError: data.validationError ?? null,
      },
    });
  }

  private async plantedBagsForParcel(parcelId: string) {
    const bags = await this.prisma.seeds.findMany({
      where: { plantedParcelId: parcelId, productionRunId: { not: null } },
      include: {
        productionRun: { select: { lotNumber: true, bagSizeLabel: true } },
      },
      orderBy: { plantedAt: 'asc' },
    });

    let totalKg = 0;
    const lots = new Set<string>();
    const rows = bags.map((b) => {
      const kgMatch = b.productionRun?.bagSizeLabel?.match(/([\d.]+)\s*kg/i);
      const kg = kgMatch ? parseFloat(kgMatch[1]) : b.quantity || 0;
      totalKg += kg;
      if (b.productionRun?.lotNumber) lots.add(b.productionRun.lotNumber);
      return {
        serialNumber: b.serialNumber,
        status: b.status,
        lotNumber: b.productionRun?.lotNumber ?? null,
        bagSizeLabel: b.productionRun?.bagSizeLabel ?? null,
        bagKg: kg,
        plantedAt: b.plantedAt?.toISOString() ?? null,
      };
    });

    return {
      count: rows.length,
      totalKg,
      lots: [...lots],
      bags: rows,
    };
  }

  /**
   * Validate seed scan and link to parcel
   * This is the entry point for all parcel activities
   */
  async validateAndLinkSeed(
    inputSerialNumber: string,
    userId: string,
    gpsLatitude: number,
    gpsLongitude: number,
    parcelId?: string,
    deviceId?: string,
  ) {
    const check = await this.seedProduction.checkBagForPlanting(inputSerialNumber, userId, {
      recordScan: !parcelId ? false : true,
      gpsLatitude,
      gpsLongitude,
      deviceId,
      parcelId: parcelId ?? null,
    });

    if (!check.ok) {
      const failure = check as import('../seed-production/seed-production.service').PlantingCheckFailure;
      if (failure.code === 'NOT_A_BIO_VERA_CODE') {
        throw new NotFoundException(failure.message);
      }
      if (failure.code === 'NOT_YOURS') {
        throw new ForbiddenException(failure.message);
      }
      throw new BadRequestException(failure.message);
    }

    const seed = await this.prisma.seeds.findUnique({ where: { serialNumber: check.serial } });
    if (!seed) {
      throw new NotFoundException('Seed not found');
    }

    if (!parcelId) {
      const seedScan = await this.recordSeedScan({
        inputSerialNumber: check.serial,
        seedId: seed.id,
        userId,
        gpsLatitude,
        gpsLongitude,
        deviceId,
        parcelId: null,
        isValid: true,
        validationError: 'VALIDATION_ONLY',
      });
      return {
        seedScan,
        seed,
        origin: check.origin,
        alreadyLinked: false as const,
        validationOnly: true as const,
        message: 'Seed validated — select a parcel to register planting',
      };
    }

    const parcel = await this.prisma.parcels.findUnique({
      where: { id: parcelId },
      include: { estates: true },
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel ${parcelId} not found`);
    }

    if (parcel.estates.ownerId !== userId) {
      throw new BadRequestException('Parcel does not belong to this user');
    }

    if (seed.areaCoverage > 0 && !seed.productionRunId) {
      const validationResult = await this.validateAreaMatch(
        parcel.calculatedArea,
        seed.areaCoverage,
        parcel.polygonCoordinates as any,
        { lat: gpsLatitude, lng: gpsLongitude },
      );

      if (!validationResult.isValid) {
        await this.prisma.parcels.update({
          where: { id: parcelId },
          data: {
            status: 'INVALID',
            validationError: validationResult.error,
          },
        });
        throw new BadRequestException(validationResult.error);
      }
    }

    await this.prisma.parcels.update({
      where: { id: parcelId },
      data: {
        inputSerialNumber: check.serial,
        ...(parcel.seedId ? {} : { seedId: seed.id }),
        status: 'ACTIVE',
        validationError: null,
      },
    });

    if (seed.productionRunId) {
      const planted = await this.seedProduction.markBagPlanted({
        serial: inputSerialNumber,
        userId,
        parcelId,
        gpsLatitude,
        gpsLongitude,
        deviceId,
      });
      const updated = await this.prisma.seeds.findUnique({ where: { id: seed.id } });
      const plantingId = 'plantingId' in planted ? planted.plantingId : null;
      const plantedSummary = await this.plantedBagsForParcel(parcelId);
      return {
        seedScan: null,
        seed: updated,
        origin: check.origin,
        plantingId,
        plantedBags: plantedSummary,
        alreadyLinked: false as const,
        message: 'Genuine Bio Vera seed linked to parcel',
      };
    }

    await this.prisma.seeds.update({
      where: { id: seed.id },
      data: {
        status: 'SCANNED',
        assignedToUserId: seed.assignedToUserId ?? userId,
        assignedAt: seed.assignedAt ?? new Date(),
      },
    });

    const seedScan = await this.recordSeedScan({
      inputSerialNumber: check.serial,
      seedId: seed.id,
      userId,
      gpsLatitude,
      gpsLongitude,
      deviceId,
      parcelId,
      isValid: true,
    });

    return {
      seedScan,
      seed,
      origin: check.origin,
      alreadyLinked: false as const,
      message: 'Seed successfully linked to parcel',
    };
  }

  /**
   * Validate that parcel area matches seed coverage
   * Core Smart-Lock validation logic
   */
  private async validateAreaMatch(
    parcelArea: number,
    seedCoverage: number,
    parcelPolygon: any,
    scanLocation: { lat: number; lng: number },
  ): Promise<{ isValid: boolean; error?: string }> {
    const tolerance = 0.05;
    const minArea = seedCoverage * (1 - tolerance);
    const maxArea = seedCoverage * (1 + tolerance);

    if (parcelArea < minArea || parcelArea > maxArea) {
      return {
        isValid: false,
        error: `Area mismatch: Parcel is ${parcelArea.toFixed(2)}m², but seed covers ${seedCoverage.toFixed(2)}m². Allowed range: ${minArea.toFixed(2)}-${maxArea.toFixed(2)}m²`,
      };
    }

    const polygonPoints = Array.isArray(parcelPolygon)
      ? parcelPolygon
      : parcelPolygon.coordinates || [];

    if (polygonPoints.length > 0) {
      const isInside = GeometryUtil.isPointInPolygon(scanLocation, polygonPoints);
      if (!isInside) {
        return {
          isValid: false,
          error: 'Scan location is outside parcel boundaries',
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get parcel status and validation info
   */
  async getParcelStatus(parcelId: string, userId: string) {
    const parcel = await this.prisma.parcels.findFirst({
      where: {
        id: parcelId,
        estates: { ownerId: userId },
      },
      include: {
        seeds: true,
        estates: true,
        _count: {
          select: {
            growth_logs: true,
            seed_scans: true,
          },
        },
      },
    });

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    const plantedBags = await this.plantedBagsForParcel(parcelId);
    return { ...parcel, plantedBags };
  }

  /** Admin read — no grower ownership check */
  async getParcelPlantedBagsAdmin(parcelId: string) {
    const parcel = await this.prisma.parcels.findUnique({
      where: { id: parcelId },
      select: { id: true, cropType: true, calculatedArea: true },
    });
    if (!parcel) throw new NotFoundException('Parcel not found');
    const plantedBags = await this.plantedBagsForParcel(parcelId);
    return { parcel, plantedBags };
  }
}
