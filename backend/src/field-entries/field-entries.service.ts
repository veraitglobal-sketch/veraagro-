import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MaterialBarcodeValidationService,
  materialKindForFieldEntry,
  type LegacyFieldEntryType,
} from '../compliance/material-barcode-validation.service';
import { SmartLockService } from '../smart-lock/smart-lock.service';
import { SeedProductionService } from '../seed-production/seed-production.service';
import { GeometryUtil } from '../common/utils/geometry.util';
import { randomUUID } from 'crypto';

export type EntryType = LegacyFieldEntryType | string;

export type PlantingBagInput = {
  serial: string;
  quantityKg: number;
};

interface CreateFieldEntryDto {
  type: EntryType;
  farmId: string;
  clientReference?: string;
  seedSerialNumber?: string;
  packagingBarcode?: string;
  fertilizerBarcode?: string;
  data: {
    date: string;
    parcelId?: string;
    parcel_id?: string;
    plantingId?: string;
    areaHa?: number;
    materialName?: string;
    materialQuantity?: number;
    materialUnit?: string;
    bags?: PlantingBagInput[];
    location?: { lat: number; lng: number; accuracy?: number };
    notes?: string;
    photos?: string[];
    [key: string]: unknown;
  };
  createdAt?: string;
}

@Injectable()
export class FieldEntriesService {
  constructor(
    private prisma: PrismaService,
    private materialBarcodeValidation: MaterialBarcodeValidationService,
    private smartLockService: SmartLockService,
    private seedProduction: SeedProductionService,
  ) {}

  private effectiveGpsToleranceMeters(deviceAccuracy?: number): number {
    const raw = process.env.GPS_BOUNDARY_TOLERANCE_METERS;
    const parsed = raw != null && raw !== '' ? Number(raw) : NaN;
    const base = Number.isFinite(parsed) && parsed >= 0 ? parsed : 80;
    const acc =
      typeof deviceAccuracy === 'number' && Number.isFinite(deviceAccuracy) && deviceAccuracy > 0
        ? deviceAccuracy
        : 0;
    return Math.max(base, acc + 30);
  }

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

    const relax =
      process.env.FIELD_ENTRY_RELAX_GPS === '1' || process.env.FIELD_ENTRY_RELAX_GPS === 'true';
    if (relax) return { valid: true };

    const farm = await this.prisma.estates.findUnique({
      where: { id: farmId },
      select: { polygonCoordinates: true },
    });
    if (!farm) return { valid: false, reason: 'Farm not found' };

    const tol = this.effectiveGpsToleranceMeters(location.accuracy);
    const estatePts = GeometryUtil.polygonFromJson(farm.polygonCoordinates as unknown);
    const pt = { lat: location.lat, lng: location.lng };

    let insideEstate = false;
    if (estatePts.length === 1) {
      insideEstate = GeometryUtil.calculateDistance(pt, estatePts[0]) <= Math.max(100, tol);
    } else if (estatePts.length >= 3) {
      insideEstate = GeometryUtil.isPointInPolygonOrWithinBoundaryMeters(pt, estatePts, tol);
    }
    if (insideEstate) return { valid: true };

    const parcels = await this.prisma.parcels.findMany({
      where: { estateId: farmId },
      select: { polygonCoordinates: true },
    });

    for (const p of parcels) {
      const pPts = GeometryUtil.polygonFromJson(p.polygonCoordinates as unknown);
      if (pPts.length === 1) {
        if (GeometryUtil.calculateDistance(pt, pPts[0]) <= Math.max(100, tol)) return { valid: true };
        continue;
      }
      if (pPts.length >= 3 && GeometryUtil.isPointInPolygonOrWithinBoundaryMeters(pt, pPts, tol)) {
        return { valid: true };
      }
    }

    const hadEstateBoundary = estatePts.length === 1 || estatePts.length >= 3;
    if (!hadEstateBoundary && parcels.length === 0) return { valid: true };

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

  private async assertEstateHasApprovedParcelForFieldWork(farmId: string, type: EntryType) {
    const needsApproval: EntryType[] = ['SETVA', 'PRSKANJE', 'BERBA'];
    if (!needsApproval.includes(type)) return;

    const parcelCount = await this.prisma.parcels.count({ where: { estateId: farmId } });
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

  private resolveParcelId(dto: CreateFieldEntryDto): string {
    const fromData = dto.data.parcelId ?? dto.data.parcel_id;
    return typeof fromData === 'string' ? fromData.trim() : '';
  }

  private mapRow(row: {
    id: string;
    type: string;
    farmId: string;
    parcelId: string | null;
    plantingId: string | null;
    occurredAt: Date;
    materialName: string | null;
    materialQuantity: number | null;
    materialUnit: string | null;
    areaHa: number | null;
    seedSerialNumber: string | null;
    seedId: string | null;
    fertilizerBarcode: string | null;
    lat: number | null;
    lng: number | null;
    notes: string | null;
    photos: string[];
    data: unknown;
    clientReference: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      type: row.type,
      farmId: row.farmId,
      parcelId: row.parcelId,
      plantingId: row.plantingId,
      seedSerialNumber: row.seedSerialNumber,
      seedId: row.seedId,
      fertilizerBarcode: row.fertilizerBarcode,
      materialName: row.materialName,
      materialQuantity: row.materialQuantity,
      materialUnit: row.materialUnit,
      areaHa: row.areaHa,
      data: {
        ...(typeof row.data === 'object' && row.data ? (row.data as Record<string, unknown>) : {}),
        date: row.occurredAt.toISOString(),
        location: row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : undefined,
        notes: row.notes ?? undefined,
        photos: row.photos,
      },
      createdAt: row.createdAt.toISOString(),
      occurredAt: row.occurredAt.toISOString(),
      clientReference: row.clientReference,
      synced: true,
    };
  }

  async create(userId: string, dto: CreateFieldEntryDto) {
    const clientRef = dto.clientReference?.trim();
    if (clientRef) {
      const existing = await this.prisma.field_entries.findUnique({
        where: { userId_clientReference: { userId, clientReference: clientRef } },
      });
      if (existing) return this.mapRow(existing);
    }

    const farm = await this.prisma.estates.findFirst({
      where: { id: dto.farmId, ownerId: userId },
    });
    if (!farm) throw new NotFoundException('Farm not found or you do not have access');

    await this.assertEstateHasApprovedParcelForFieldWork(dto.farmId, dto.type);

    if (dto.data.location) {
      const gpsValidation = await this.validateGPSLocation(dto.data.location, dto.farmId);
      if (!gpsValidation.valid) {
        throw new ForbiddenException(gpsValidation.reason || 'GPS validation failed');
      }
    }

    const parcelId = this.resolveParcelId(dto);
    const plantingId =
      typeof dto.data.plantingId === 'string' && dto.data.plantingId.trim()
        ? dto.data.plantingId.trim()
        : null;
    const bags = Array.isArray(dto.data.bags) ? dto.data.bags : [];
    const primarySerial = dto.seedSerialNumber?.trim() || bags[0]?.serial?.trim() || '';

    if (dto.fertilizerBarcode?.trim()) {
      await this.materialBarcodeValidation.assertValidForGrower(
        userId,
        dto.fertilizerBarcode,
        materialKindForFieldEntry(dto.type as LegacyFieldEntryType, 'fertilizer'),
        { farmId: dto.farmId, entryType: dto.type as LegacyFieldEntryType },
      );
    }

    if (primarySerial && !bags.length) {
      await this.materialBarcodeValidation.assertValidForGrower(
        userId,
        primarySerial,
        materialKindForFieldEntry(dto.type as LegacyFieldEntryType, 'seed'),
        { farmId: dto.farmId, entryType: dto.type as LegacyFieldEntryType },
      );
    }

    const lat = dto.data.location?.lat ?? null;
    const lng = dto.data.location?.lng ?? null;

    if (dto.type === 'SETVA' && bags.length > 0) {
      if (!parcelId) throw new BadRequestException('Parcel is required for planting entries');
      if (lat == null || lng == null) throw new BadRequestException('GPS location is required');

      for (const bag of bags) {
        const check = await this.seedProduction.checkBagForPlanting(bag.serial, userId, {
          recordScan: false,
          parcelId,
          quantityKg: bag.quantityKg,
          gpsLatitude: lat,
          gpsLongitude: lng,
        });
        if (!check.ok) {
          throw new BadRequestException(`${bag.serial}: ${'message' in check ? check.message : 'Invalid bag'}`);
        }
      }

      for (const bag of bags) {
        const result = await this.seedProduction.markBagPlanted({
          serial: bag.serial,
          userId,
          parcelId,
          plantingId,
          quantityKg: bag.quantityKg,
          gpsLatitude: lat,
          gpsLongitude: lng,
        });
        if (!('ok' in result) || !result.ok) {
          const msg = 'message' in result ? result.message : 'Planting failed';
          throw new BadRequestException(`${bag.serial}: ${msg}`);
        }
      }
    } else if (dto.type === 'SETVA' && primarySerial && parcelId && lat != null && lng != null) {
      await this.smartLockService.ensureSeedLinkedToParcel({
        inputSerialNumber: primarySerial,
        userId,
        parcelId,
        gpsLatitude: lat,
        gpsLongitude: lng,
      });
    }

    const occurredAt = dto.data.date ? new Date(dto.data.date) : new Date();
    const materialQuantity =
      dto.data.materialQuantity ??
      (bags.length ? bags.reduce((s, b) => s + b.quantityKg, 0) : undefined);
    const materialUnit = dto.data.materialUnit ?? (bags.length || primarySerial ? 'kg' : undefined);
    const materialName = dto.data.materialName;
    const areaHa = dto.data.areaHa;
    const photos = Array.isArray(dto.data.photos) ? dto.data.photos.filter((p) => typeof p === 'string') : [];

    let seedId: string | null = null;
    if (primarySerial) {
      const seed = await this.prisma.seeds.findUnique({ where: { serialNumber: primarySerial } });
      seedId = seed?.id ?? null;
    }

    const row = await this.prisma.field_entries.create({
      data: {
        id: randomUUID(),
        userId,
        farmId: dto.farmId,
        parcelId: parcelId || null,
        plantingId,
        type: dto.type,
        occurredAt,
        materialName: materialName ?? null,
        materialQuantity: materialQuantity ?? null,
        materialUnit: materialUnit ?? null,
        areaHa: areaHa ?? null,
        seedSerialNumber: primarySerial || null,
        seedId,
        fertilizerBarcode: dto.fertilizerBarcode?.trim() || null,
        lat,
        lng,
        notes: dto.data.notes?.trim() || null,
        photos,
        data: dto.data as object,
        clientReference: clientRef || null,
      },
    });

    return this.mapRow(row);
  }

  async findAll(
    userId: string,
    filters?: {
      farmId?: string;
      parcelId?: string;
      type?: string;
      from?: string;
      to?: string;
    },
  ) {
    const farms = await this.prisma.estates.findMany({
      where: { ownerId: userId, ...(filters?.farmId ? { id: filters.farmId } : {}) },
      select: { id: true },
    });
    const farmIds = farms.map((f) => f.id);
    if (!farmIds.length) return [];

    const where: {
      userId: string;
      farmId: { in: string[] };
      parcelId?: string;
      type?: string;
      occurredAt?: { gte?: Date; lte?: Date };
    } = {
      userId,
      farmId: { in: farmIds },
    };
    if (filters?.parcelId) where.parcelId = filters.parcelId;
    if (filters?.type) where.type = filters.type;
    if (filters?.from || filters?.to) {
      where.occurredAt = {};
      if (filters.from) where.occurredAt.gte = new Date(filters.from);
      if (filters.to) where.occurredAt.lte = new Date(filters.to);
    }

    const rows = await this.prisma.field_entries.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: 500,
    });

    return rows.map((r) => this.mapRow(r));
  }
}
