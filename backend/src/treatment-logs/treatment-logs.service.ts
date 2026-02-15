import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

const MAX_OFFLINE_HOURS = 24;
const MAX_TIMESTAMP_DELTA_MINUTES = 15;

@Injectable()
export class TreatmentLogsService {
  constructor(private prisma: PrismaService) {}

  private isPointInPolygon(point: { lat: number; lng: number }, polygon: any[]): boolean {
    if (!polygon || polygon.length < 3) return true; // Skip check if no polygon
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng ?? polygon[i][0];
      const yi = polygon[i].lat ?? polygon[i][1];
      const xj = polygon[j].lng ?? polygon[j][0];
      const yj = polygon[j].lat ?? polygon[j][1];
      const intersect =
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
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

    const product = await this.prisma.bio_white_list.findFirst({
      where: { id: dto.productId, isActive: true },
    });
    if (!product) throw new BadRequestException('Product not on whitelist or inactive');

    const appliedAt = new Date(dto.appliedAt);
    const deviceTs = new Date(dto.deviceTimestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - deviceTs.getTime()) / (1000 * 60 * 60);
    const needsAudit = hoursDiff > MAX_OFFLINE_HOURS;

    const polygon = (parcel.polygonCoordinates || parcel.estates?.polygonCoordinates) as any;
    const coords = Array.isArray(polygon) ? polygon : polygon?.coordinates || [];
    const point = { lat: dto.gpsLatitude, lng: dto.gpsLongitude };
    if (coords.length >= 3 && !this.isPointInPolygon(point, coords)) {
      throw new ForbiddenException('GPS location is not within parcel boundaries');
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
   * Get earliest harvest-allowed date for a parcel (last treatment + max PHI)
   */
  async getEarliestHarvestDate(parcelId: string): Promise<{ date: Date | null; reason?: string }> {
    const logs = await this.prisma.treatment_logs.findMany({
      where: { parcelId },
      orderBy: { appliedAt: 'desc' },
    });
    let latestBlocking = new Date(0);
    for (const log of logs) {
      const product = await this.prisma.bio_white_list.findUnique({
        where: { id: log.productId },
      });
      const phi = product?.phiDays ?? 0;
      if (phi > 0) {
        const applied = new Date(log.appliedAt);
        const harvestOk = new Date(applied);
        harvestOk.setDate(harvestOk.getDate() + phi);
        if (harvestOk > latestBlocking) latestBlocking = harvestOk;
      }
    }
    if (latestBlocking.getTime() === new Date(0).getTime()) return { date: null };
    return { date: latestBlocking, reason: 'Pre-harvest interval (PHI) from last treatment' };
  }
}
