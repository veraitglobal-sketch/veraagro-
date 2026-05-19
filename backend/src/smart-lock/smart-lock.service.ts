import * as crypto from 'crypto';
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryUtil } from '../common/utils/geometry.util';
import { SeedsService } from '../seeds/seeds.service';

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
    private seedsService: SeedsService,
  ) {}

  private normalizeSerial(s: string): string {
    return s.trim().replace(/\s+/g, '');
  }

  /**
   * Field diary (PLANTING + SEED barcode): link parcel.seedId or allow repeat scans for same batch.
   */
  async ensureSeedLinkedToParcel(params: {
    inputSerialNumber: string;
    userId: string;
    parcelId: string;
    gpsLatitude: number;
    gpsLongitude: number;
    deviceId?: string;
  }) {
    const serial = this.normalizeSerial(params.inputSerialNumber);
    await this.seedsService.validateSeed(serial, params.userId);

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
      },
    });
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
    const serial = this.normalizeSerial(inputSerialNumber);
    const seed = await this.prisma.seeds.findUnique({
      where: { serialNumber: serial },
    });

    if (!seed) {
      throw new NotFoundException(`Seed with serial number ${serial} not found`);
    }

    if (seed.status === 'USED' || seed.status === 'EXPIRED') {
      throw new BadRequestException(`Seed ${serial} is already used or expired`);
    }

    if (seed.assignedToUserId && seed.assignedToUserId !== userId) {
      throw new ForbiddenException('This seed batch is not assigned to your account');
    }

    if (parcelId) {
      const parcel = await this.prisma.parcels.findUnique({
        where: { id: parcelId },
        include: { estates: true },
      });

      if (!parcel) {
        throw new NotFoundException(`Parcel ${parcelId} not found`);
      }

      // Check if parcel belongs to user
      if (parcel.estates.ownerId !== userId) {
        throw new BadRequestException('Parcel does not belong to this user');
      }

      // Validate area match (Smart-Lock core logic)
      const validationResult = await this.validateAreaMatch(
        parcel.calculatedArea,
        seed.areaCoverage,
        parcel.polygonCoordinates as any,
        { lat: gpsLatitude, lng: gpsLongitude },
      );

      if (!validationResult.isValid) {
        // Update parcel status to INVALID
        await this.prisma.parcels.update({
          where: { id: parcelId },
          data: {
            status: 'INVALID',
            validationError: validationResult.error,
          },
        });

        throw new BadRequestException(validationResult.error);
      }

      await this.prisma.parcels.update({
        where: { id: parcelId },
        data: {
          inputSerialNumber: serial,
          seedId: seed.id,
          status: 'ACTIVE',
          validationError: null,
        },
      });

      await this.prisma.seeds.update({
        where: { id: seed.id },
        data: {
          status: 'SCANNED',
          assignedToUserId: seed.assignedToUserId ?? userId,
          assignedAt: seed.assignedAt ?? new Date(),
        },
      });
    }

    const seedScan = await this.recordSeedScan({
      inputSerialNumber: serial,
      seedId: seed.id,
      userId,
      gpsLatitude,
      gpsLongitude,
      deviceId,
      parcelId: parcelId ?? null,
      isValid: Boolean(parcelId),
    });

    return {
      seedScan,
      seed,
      alreadyLinked: false as const,
      message: parcelId ? 'Seed successfully linked to parcel' : 'Seed scanned, awaiting parcel assignment',
    };
  }

  /**
   * Validate that parcel area matches seed coverage
   * Core Smart-Lock validation logic
   */
  private async validateAreaMatch(
    parcelArea: number, // in m²
    seedCoverage: number, // in m²
    parcelPolygon: any,
    scanLocation: { lat: number; lng: number },
  ): Promise<{ isValid: boolean; error?: string }> {
    // Allow 5% tolerance for measurement errors
    const tolerance = 0.05;
    const minArea = seedCoverage * (1 - tolerance);
    const maxArea = seedCoverage * (1 + tolerance);

    // Check if area matches
    if (parcelArea < minArea || parcelArea > maxArea) {
      return {
        isValid: false,
        error: `Area mismatch: Parcel is ${parcelArea.toFixed(2)}m², but seed covers ${seedCoverage.toFixed(2)}m². Allowed range: ${minArea.toFixed(2)}-${maxArea.toFixed(2)}m²`,
      };
    }

    // Check if scan location is within parcel polygon
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

    return parcel;
  }
}
