import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryUtil } from '../common/utils/geometry.util';
import * as crypto from 'crypto';

const MAX_OFFLINE_HOURS = 24;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class TreatmentLogsService {
  private readonly logger = new Logger(TreatmentLogsService.name);

  constructor(private prisma: PrismaService) {}

  /** Same rule as field-entries: base from env + device accuracy (m). */
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

  async create(userId: string, dto: {
    parcelId: string;
    productId: string;
    productName: string;
    dosage: string;
    waterVolume?: number;
    reason?: string;
    appliedAt: string; // ISO
    gpsLatitude: number;
    gpsLongitude: number;
    gpsAccuracy?: number;
    deviceId?: string;
    deviceTimestamp: string;
  }) {
    const parcel = await this.prisma.parcels.findFirst({
      where: {
        id: dto.parcelId,
        estates: { ownerId: userId },
      },
      include: { estates: true },
    });
    if (!parcel) throw new NotFoundException('Parcel not found or access denied');
    if (!parcel.approvedAt) {
      throw new ForbiddenException(
        'This parcel is not approved yet. Spraying and other field work are available after an administrator approves the parcel.',
      );
    }

    const product = await this.prisma.bio_white_list.findFirst({
      where: { id: dto.productId, isActive: true },
    });
    if (!product) throw new BadRequestException('Product not on whitelist or inactive');

    const appliedAt = new Date(dto.appliedAt);
    const deviceTs = new Date(dto.deviceTimestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - deviceTs.getTime()) / (1000 * 60 * 60);
    const needsAudit = hoursDiff > MAX_OFFLINE_HOURS;

    const polygonRaw = (parcel.polygonCoordinates || parcel.estates?.polygonCoordinates) as unknown;
    const ring = GeometryUtil.polygonFromJson(polygonRaw);
    const point = { lat: dto.gpsLatitude, lng: dto.gpsLongitude };
    const tol = this.effectiveGpsToleranceMeters(dto.gpsAccuracy);
    if (
      ring.length >= 3 &&
      !GeometryUtil.isPointInPolygonOrWithinBoundaryMeters(point, ring, tol)
    ) {
      throw new ForbiddenException(
        'GPS is outside the saved parcel/farm boundary (within normal GPS error). Move closer, redraw the parcel to include this point, or check that coordinates are not swapped.',
      );
    }

    return this.prisma.treatment_logs.create({
      data: {
        id: crypto.randomUUID(),
        parcelId: dto.parcelId,
        userId,
        productId: dto.productId,
        productName: dto.productName,
        dosage: dto.dosage,
        waterVolume: dto.waterVolume,
        reason: dto.reason,
        appliedAt,
        gpsLatitude: dto.gpsLatitude,
        gpsLongitude: dto.gpsLongitude,
        gpsAccuracy: dto.gpsAccuracy,
        deviceId: dto.deviceId,
        deviceTimestamp: deviceTs,
        needsAudit,
      },
    });
  }

  async findByParcel(userId: string, parcelId: string) {
    const parcel = await this.prisma.parcels.findFirst({
      where: { id: parcelId, estates: { ownerId: userId } },
    });
    if (!parcel) throw new NotFoundException('Parcel not found');
    return this.prisma.treatment_logs.findMany({
      where: { parcelId },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async findByUser(userId: string, parcelId?: string) {
    const where: any = { userId };
    if (parcelId) where.parcelId = parcelId;
    return this.prisma.treatment_logs.findMany({
      where,
      include: { parcels: { select: { cropType: true, estates: { select: { name: true } } } } },
      orderBy: { appliedAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get earliest harvest-allowed date for a parcel (last treatment + max PHI).
   * Missing whitelist rows or legacy product ids are skipped — never fail the whole check.
   */
  async getEarliestHarvestDate(parcelId: string): Promise<{ date: Date | null; reason?: string }> {
    let logs: Array<{ productId: string; appliedAt: Date }>;
    try {
      logs = await this.prisma.treatment_logs.findMany({
        where: { parcelId },
        orderBy: { appliedAt: 'desc' },
        select: { productId: true, appliedAt: true },
      });
    } catch (e) {
      this.logger.error(`treatment_logs lookup failed parcelId=${parcelId}`, e);
      throw e;
    }

    if (logs.length === 0) return { date: null };

    const productIds = [...new Set(logs.map((l) => l.productId).filter(Boolean))];
    const uuidIds = productIds.filter((id) => UUID_RE.test(id));
    const otherIds = productIds.filter((id) => !UUID_RE.test(id));

    const phiByKey = new Map<string, number>();
    try {
      if (uuidIds.length > 0) {
        const products = await this.prisma.bio_white_list.findMany({
          where: { id: { in: uuidIds } },
          select: { id: true, barcode: true, phiDays: true },
        });
        for (const p of products) {
          phiByKey.set(p.id, p.phiDays ?? 0);
          if (p.barcode) phiByKey.set(p.barcode, p.phiDays ?? 0);
        }
      }
      if (otherIds.length > 0) {
        const byBarcode = await this.prisma.bio_white_list.findMany({
          where: { barcode: { in: otherIds } },
          select: { id: true, barcode: true, phiDays: true },
        });
        for (const p of byBarcode) {
          phiByKey.set(p.barcode, p.phiDays ?? 0);
          if (p.id) phiByKey.set(p.id, p.phiDays ?? 0);
        }
      }
    } catch (e) {
      this.logger.error(`bio_white_list PHI lookup failed parcelId=${parcelId}`, e);
      throw e;
    }

    let latestBlocking = new Date(0);
    for (const log of logs) {
      const phi = phiByKey.get(log.productId) ?? 0;
      if (phi <= 0) continue;
      const applied = new Date(log.appliedAt);
      if (Number.isNaN(applied.getTime())) continue;
      const harvestOk = new Date(applied);
      harvestOk.setDate(harvestOk.getDate() + phi);
      if (harvestOk > latestBlocking) latestBlocking = harvestOk;
    }

    if (latestBlocking.getTime() === new Date(0).getTime()) return { date: null };
    return { date: latestBlocking, reason: 'Pre-harvest interval (PHI) from last treatment' };
  }
}
