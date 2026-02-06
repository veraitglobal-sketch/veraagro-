import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryUtil } from '../common/utils/geometry.util';

/**
 * Smart-Lock Service
 * 
 * Core business logic: Input_Serial_Number is the primary key for any parcel activity.
 * Validates that scanned seed quantity matches GPS polygon area.
 * If mismatch, parcel status remains INVALID.
 */
@Injectable()
export class SmartLockService {
  constructor(private prisma: PrismaService) {}

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
  ) {
    // 1. Find seed by serial number
    const seed = await this.prisma.seeds.findUnique({
      where: { serialNumber: inputSerialNumber },
    });

    if (!seed) {
      throw new NotFoundException(`Seed with serial number ${inputSerialNumber} not found`);
    }

    if (seed.status === 'USED' || seed.status === 'EXPIRED') {
      throw new BadRequestException(`Seed ${inputSerialNumber} is already used or expired`);
    }

    // 2. If parcelId provided, validate area match
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

      // Link seed to parcel
      await this.prisma.parcels.update({
        where: { id: parcelId },
        data: {
          inputSerialNumber: inputSerialNumber,
          seedId: seed.id,
          status: 'ACTIVE',
          validationError: null,
        },
      });

      // Mark seed as SCANNED
      await this.prisma.seeds.update({
        where: { id: seed.id },
        data: { status: 'SCANNED' },
      });
    }

    // 3. Create seed scan record
    const seedScan = await this.prisma.seed_scans.create({
      data: {
        id: crypto.randomUUID(),
        inputSerialNumber,
        seedId: seed.id,
        scannedByUserId: userId,
        gpsLatitude,
        gpsLongitude,
        deviceId: 'mobile-device', // Will be passed from mobile app
        networkTimestamp: new Date(),
        deviceTimestamp: new Date(),
        parcelId: parcelId || null,
        isValid: parcelId ? true : false,
      },
    });

    return {
      seedScan,
      seed,
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
        estates: {
          users: {
            id: userId,
          },
        },
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
