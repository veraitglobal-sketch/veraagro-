import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MaterialBarcodeValidationService,
  materialKindForFieldEntry,
  type LegacyFieldEntryType,
} from '../compliance/material-barcode-validation.service';
import { SmartLockService } from '../smart-lock/smart-lock.service';
import { ImageResizeService } from '../common/image/image-resize.service';
import { GeometryUtil } from '../common/utils/geometry.util';

export type EntryType = LegacyFieldEntryType;

interface CreateFieldEntryDto {
  type: EntryType;
  farmId: string;
  seedSerialNumber?: string;
  packagingBarcode?: string;
  fertilizerBarcode?: string; // For compliance check
  data: {
    date: string;
    location?: { lat: number; lng: number; accuracy?: number };
    notes?: string;
    [key: string]: any;
  };
  createdAt?: string;
}

@Injectable()
export class FieldEntriesService {
  constructor(
    private prisma: PrismaService,
    private materialBarcodeValidation: MaterialBarcodeValidationService,
    private smartLockService: SmartLockService,
  ) {}

  /**
   * Base tolerance (m) from env; widened by device-reported GPS accuracy when sent by client.
   */
  private effectiveGpsToleranceMeters(deviceAccuracy?: number): number {
    const raw = process.env.GPS_BOUNDARY_TOLERANCE_METERS;
    const parsed = raw != null && raw !== '' ? Number(raw) : NaN;
    const base = Number.isFinite(parsed) && parsed >= 0 ? parsed : 80;
    const acc =
      typeof deviceAccuracy === 'number' &&
      Number.isFinite(deviceAccuracy) &&
      deviceAccuracy > 0
        ? deviceAccuracy
        : 0;
    return Math.max(base, acc + 30);
  }

  /**
   * GPS must be inside the estate boundary and/or parcel polygons, with a tolerance band for real-world GPS error.
   */
  private async validateGPSLocation(
    location: { lat: number; lng: number; accuracy?: number },
    farmId: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    if (
      location == null ||
      typeof location.lat !== 'number' ||
      typeof location.lng !== 'number' ||
      !Number.isFinite(location.lat) ||
      !Number.isFinite(location.lng)
    ) {
      return { valid: false, reason: 'GPS location is required' };
    }

    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      return { valid: false, reason: 'Invalid GPS coordinates' };
    }

    /** Local/staging only: skip boundary check (never enable in production). */
    const relax =
      process.env.FIELD_ENTRY_RELAX_GPS === '1' ||
      process.env.FIELD_ENTRY_RELAX_GPS === 'true';
    if (relax) {
      return { valid: true };
    }

    const farm = await this.prisma.estates.findUnique({
      where: { id: farmId },
      select: { polygonCoordinates: true },
    });

    if (!farm) {
      return { valid: false, reason: 'Farm not found' };
    }

    const tol = this.effectiveGpsToleranceMeters(location.accuracy);
    const estatePts = GeometryUtil.polygonFromJson(farm.polygonCoordinates as unknown);
    const pt = { lat: location.lat, lng: location.lng };

    let insideEstate = false;
    if (estatePts.length === 1) {
      insideEstate =
        GeometryUtil.calculateDistance(pt, estatePts[0]) <= Math.max(100, tol);
    } else if (estatePts.length >= 3) {
      insideEstate = GeometryUtil.isPointInPolygonOrWithinBoundaryMeters(pt, estatePts, tol);
    }
    if (insideEstate) {
      return { valid: true };
    }

    const parcels = await this.prisma.parcels.findMany({
      where: { estateId: farmId },
      select: { polygonCoordinates: true },
    });

    for (const p of parcels) {
      const pPts = GeometryUtil.polygonFromJson(p.polygonCoordinates as unknown);
      if (pPts.length === 1) {
        if (GeometryUtil.calculateDistance(pt, pPts[0]) <= Math.max(100, tol)) {
          return { valid: true };
        }
        continue;
      }
      if (pPts.length >= 3 && GeometryUtil.isPointInPolygonOrWithinBoundaryMeters(pt, pPts, tol)) {
        return { valid: true };
      }
    }

    const hadEstateBoundary = estatePts.length === 1 || estatePts.length >= 3;
    if (!hadEstateBoundary && parcels.length === 0) {
      return { valid: true };
    }

    if (parcels.length > 0) {
      return {
        valid: false,
        reason:
          'GPS location is outside your parcel polygons and estate boundary. Draw parcels around where you actually work (or include your test point), refresh, and try sync again; after approval, the same polygons are used for security checks.',
      };
    }

    return {
      valid: false,
      reason: 'GPS location is outside your farm boundaries. Entry blocked for security.',
    };
  }

  /**
   * Planting, spraying, and harvest log entries require at least one admin-approved parcel on the estate.
   */
  private async assertEstateHasApprovedParcelForFieldWork(farmId: string, type: EntryType) {
    const needsApproval: EntryType[] = ['SETVA', 'PRSKANJE', 'BERBA'];
    if (!needsApproval.includes(type)) {
      return;
    }
    const parcelCount = await this.prisma.parcels.count({
      where: { estateId: farmId },
    });
    if (parcelCount === 0) {
      throw new ForbiddenException(
        'Add at least one parcel under your field, get it approved by an administrator, then you can add entry log entries (planting, spraying, harvest).',
      );
    }
    const approved = await this.prisma.parcels.count({
      where: { estateId: farmId, approvedAt: { not: null } },
    });
    if (approved === 0) {
      throw new ForbiddenException(
        'Entry log entries (planting, spraying, harvest) are available after an administrator has approved at least one of your parcels.',
      );
    }
  }

  async create(userId: string, dto: CreateFieldEntryDto) {
    // Validate farm ownership (using Estate model)
    const farm = await this.prisma.estates.findFirst({
      where: {
        id: dto.farmId,
        ownerId: userId,
      },
    });

    if (!farm) {
      throw new NotFoundException('Farm not found or you do not have access');
    }

    await this.assertEstateHasApprovedParcelForFieldWork(dto.farmId, dto.type);

    // SECURITY FIX: Validate GPS location against farm boundaries
    if (dto.data.location) {
      const gpsValidation = await this.validateGPSLocation(dto.data.location, dto.farmId);
      if (!gpsValidation.valid) {
        throw new ForbiddenException(gpsValidation.reason || 'GPS validation failed');
      }
    }

    if (dto.seedSerialNumber?.trim()) {
      await this.materialBarcodeValidation.assertValidForGrower(
        userId,
        dto.seedSerialNumber,
        materialKindForFieldEntry(dto.type, 'seed'),
        { farmId: dto.farmId, entryType: dto.type },
      );
    }

    if (dto.fertilizerBarcode?.trim()) {
      await this.materialBarcodeValidation.assertValidForGrower(
        userId,
        dto.fertilizerBarcode,
        materialKindForFieldEntry(dto.type, 'fertilizer'),
        { farmId: dto.farmId, entryType: dto.type },
      );
    }

    const dataExtra = dto.data as { parcelId?: string; parcel_id?: string };
    const parcelId =
      typeof dataExtra.parcelId === 'string'
        ? dataExtra.parcelId.trim()
        : typeof dataExtra.parcel_id === 'string'
          ? dataExtra.parcel_id.trim()
          : '';
    if (
      dto.type === 'SETVA' &&
      dto.seedSerialNumber?.trim() &&
      parcelId &&
      dto.data.location?.lat != null &&
      dto.data.location?.lng != null
    ) {
      await this.smartLockService.ensureSeedLinkedToParcel({
        inputSerialNumber: dto.seedSerialNumber,
        userId,
        parcelId,
        gpsLatitude: dto.data.location.lat,
        gpsLongitude: dto.data.location.lng,
      });
    }

    // Create entry (you might want to create a FieldEntry model in Prisma)
    // For now, we'll store it as JSON or create a simple model
    // This is a placeholder - adjust based on your actual schema needs

    return {
      id: `entry_${Date.now()}`,
      type: dto.type,
      farmId: dto.farmId,
      seedSerialNumber: dto.seedSerialNumber,
      packagingBarcode: dto.packagingBarcode,
      data: dto.data,
      createdAt: dto.createdAt || new Date().toISOString(),
      synced: true,
    };
  }

  async findAll(userId: string, farmId?: string) {
    // Get user's farms (using Estate model)
    const farms = await this.prisma.estates.findMany({
      where: {
        ownerId: userId,
        ...(farmId && { id: farmId }),
      },
    });

    const farmIds = farms.map((f) => f.id);

    // Return entries for user's farms
    // This is a placeholder - adjust based on your actual schema
    return [];
  }
}
