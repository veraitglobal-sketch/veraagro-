import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import { ImageResizeService } from '../common/image/image-resize.service';
import { GeometryUtil } from '../common/utils/geometry.util';

export type EntryType = 'PRSKANJE' | 'SETVA' | 'BERBA';

interface CreateFieldEntryDto {
  type: EntryType;
  farmId: string;
  seedSerialNumber?: string;
  packagingBarcode?: string;
  fertilizerBarcode?: string; // For compliance check
  data: {
    date: string;
    location?: { lat: number; lng: number };
    notes?: string;
    [key: string]: any;
  };
  createdAt?: string;
}

@Injectable()
export class FieldEntriesService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  /**
   * GPS must be inside the estate boundary and/or an admin-approved parcel.
   * Parcel check fixes common case: estate polygon still default (e.g. template) while real work follows parcel maps.
   */
  private async validateGPSLocation(
    location: { lat: number; lng: number },
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

    const farm = await this.prisma.estates.findUnique({
      where: { id: farmId },
      select: { polygonCoordinates: true },
    });

    if (!farm) {
      return { valid: false, reason: 'Farm not found' };
    }

    const estatePts = GeometryUtil.polygonFromJson(farm.polygonCoordinates as unknown);

    let insideEstate = false;
    if (estatePts.length === 1) {
      insideEstate =
        GeometryUtil.calculateDistance({ lat: location.lat, lng: location.lng }, estatePts[0]) <= 100;
    } else if (estatePts.length >= 3) {
      insideEstate = GeometryUtil.isPointInPolygon(
        { lat: location.lat, lng: location.lng },
        estatePts,
      );
    }
    if (insideEstate) {
      return { valid: true };
    }

    const parcels = await this.prisma.parcels.findMany({
      where: { estateId: farmId, approvedAt: { not: null } },
      select: { polygonCoordinates: true },
    });

    const pt = { lat: location.lat, lng: location.lng };
    for (const p of parcels) {
      const pPts = GeometryUtil.polygonFromJson(p.polygonCoordinates as unknown);
      if (pPts.length === 1) {
        if (GeometryUtil.calculateDistance(pt, pPts[0]) <= 100) {
          return { valid: true };
        }
        continue;
      }
      if (pPts.length >= 3 && GeometryUtil.isPointInPolygon(pt, pPts)) {
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
          'GPS location is outside your approved parcel boundaries. If parcels are correct in Grower → Fields, ask an admin to update the estate boundary; then try sync again.',
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

    // COMPLIANCE CHECK: If fertilizer barcode is provided, check against Bio-White-List
    if (dto.fertilizerBarcode) {
      const complianceResult = await this.complianceService.checkCompliance({
        barcode: dto.fertilizerBarcode,
        userId,
        farmId: dto.farmId,
        entryType: dto.type,
      });

      if (!complianceResult.compliant || complianceResult.blocked) {
        throw new ForbiddenException(complianceResult.reason || 'Compliance check failed');
      }
    }

    // Validate seed batch if provided
    if (dto.seedSerialNumber) {
      const seedBatch = await (this.prisma as any).seedBatch.findUnique({
        where: { serialNumber: dto.seedSerialNumber },
      });

      if (!seedBatch) {
        throw new NotFoundException('Seed batch not found');
      }

      // Optional: Check if seed batch is purchased by this user
      if (seedBatch.purchasedBy && seedBatch.purchasedBy !== userId) {
        throw new BadRequestException('Seed batch is not purchased by you');
      }
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
