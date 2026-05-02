import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryUtil } from '../common/utils/geometry.util';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class ParcelsService {
  constructor(private prisma: PrismaService) {}

  /** URL-safe, unique per parcel (uppercase for printing on labels). */
  private generatePublicCode(): string {
    return `BIO-PLOT-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  }

  /**
   * Assign when admin approves; retry once on unique collision.
   */
  private async generateUniquePublicCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = this.generatePublicCode();
      const exists = await this.prisma.parcels.findFirst({
        where: { publicCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    return `BIO-PLOT-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }

  private frontendUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:3001').replace(
      /\/$/,
      '',
    );
  }

  async create(
    estateId: string,
    userId: string,
    data: { polygonCoordinates: any; cropType?: string },
  ) {
    const estate = await this.prisma.estates.findFirst({
      where: {
        id: estateId,
        ownerId: userId,
      },
    });

    if (!estate) {
      throw new ForbiddenException('Estate not found or access denied');
    }

    const points = Array.isArray(data.polygonCoordinates)
      ? data.polygonCoordinates
      : data.polygonCoordinates.coordinates || [];

    const calculatedArea = GeometryUtil.calculatePolygonArea(points);

    return this.prisma.parcels.create({
      data: {
        id: crypto.randomUUID(),
        estateId,
        polygonCoordinates: data.polygonCoordinates,
        calculatedArea,
        cropType: data.cropType,
        status: 'INVALID',
        approvedAt: null,
        approvedByUserId: null,
        updatedAt: new Date(),
      },
    });
  }

  async findAllPending() {
    return this.prisma.parcels.findMany({
      where: { approvedAt: null },
      include: {
        estates: { select: { id: true, name: true, ownerId: true } },
        _count: { select: { growth_logs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(parcelId: string, approvedByUserId: string) {
    const parcel = await this.prisma.parcels.findUnique({
      where: { id: parcelId },
      include: { estates: true },
    });
    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }
    if (parcel.approvedAt) {
      throw new ForbiddenException('Parcel is already approved');
    }
    const publicCode =
      parcel.publicCode && parcel.publicCode.length > 0
        ? parcel.publicCode
        : await this.generateUniquePublicCode();

    const updated = await this.prisma.parcels.update({
      where: { id: parcelId },
      data: {
        approvedAt: new Date(),
        approvedByUserId,
        publicCode,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // Grower "My fields" shows estate status (PENDING_SETUP = "pending setup"). Approving a parcel
    // should unblock the farm in the app without a separate estate-approval step when parcels exist.
    await this.prisma.estates.updateMany({
      where: {
        id: parcel.estateId,
        status: 'PENDING_SETUP',
      },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Grower: ensure the parcel has a public code (approved parcels only; backfill for old rows).
   */
  async ensurePublicCodeForOwner(parcelId: string, userId: string) {
    const parcel = await this.prisma.parcels.findFirst({
      where: { id: parcelId, estates: { ownerId: userId } },
    });
    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }
    if (!parcel.approvedAt) {
      throw new ForbiddenException(
        'Parcel must be approved by admin before a store QR is issued',
      );
    }
    if (parcel.publicCode) {
      return { publicCode: parcel.publicCode, wasNew: false as const };
    }
    const publicCode = await this.generateUniquePublicCode();
    await this.prisma.parcels.update({
      where: { id: parcelId },
      data: { publicCode, updatedAt: new Date() },
    });
    return { publicCode, wasNew: true as const };
  }

  /**
   * Public JSON for consumer page /plot/{code} (retail, no auth).
   */
  async getPublicPlotData(rawCode: string) {
    const code = (rawCode || '').trim();
    if (!code) {
      throw new NotFoundException('Invalid code');
    }
    const parcel = await this.prisma.parcels.findFirst({
      where: { publicCode: code },
      include: {
        estates: { include: { users: { select: { firstName: true, productionCountry: true } } } },
        treatment_logs: { orderBy: { appliedAt: 'desc' }, take: 40 },
        growth_logs: { orderBy: { networkTimestamp: 'desc' }, take: 15 },
        harvest_announcements: { orderBy: { estimatedDate: 'desc' }, take: 8 },
        batches: {
          orderBy: { harvestDate: 'desc' },
          take: 25,
          select: {
            id: true,
            batchId: true,
            productName: true,
            quantity: true,
            unit: true,
            harvestDate: true,
            status: true,
          },
        },
      },
    });
    if (!parcel) {
      throw new NotFoundException('Plot not found. Check the code printed on the label.');
    }
    if (!parcel.approvedAt) {
      throw new NotFoundException('This plot is not yet published');
    }

    const owner = parcel.estates.users;
    const regionHint = parcel.estates.name;
    return {
      code: parcel.publicCode,
      plot: {
        cropType: parcel.cropType,
        areaHa: parcel.calculatedArea,
        plantingDate: parcel.plantingDate,
        expectedHarvestDate: parcel.expectedHarvestDate,
      },
      farm: {
        name: parcel.estates.name,
        growerFirstName: owner?.firstName ?? null,
        productionCountry: owner?.productionCountry ?? null,
        regionLabel: [regionHint, owner?.productionCountry].filter(Boolean).join(' · '),
      },
      treatments: parcel.treatment_logs.map((t) => ({
        appliedAt: t.appliedAt,
        productName: t.productName,
        reason: t.reason,
      })),
      growthHighlights: parcel.growth_logs.map((g) => ({
        at: g.networkTimestamp,
        stage: g.growthStage,
        note: g.notes,
      })),
      harvestPlans: parcel.harvest_announcements.map((h) => ({
        cropType: h.cropType,
        estimatedDate: h.estimatedDate,
        estimatedQuantity: h.estimatedQuantity,
        type: h.announcementType,
      })),
      recentLots: parcel.batches.map((b) => ({
        publicBatchId: b.batchId,
        productName: b.productName,
        quantity: b.quantity,
        unit: b.unit,
        harvestDate: b.harvestDate,
        status: b.status,
      })),
    };
  }

  /**
   * PNG data URL for grower to print; URL points to this deployment’s /plot page.
   */
  async getPlotQrDataUrlForOwner(parcelId: string, userId: string) {
    const { publicCode } = await this.ensurePublicCodeForOwner(parcelId, userId);
    const url = `${this.frontendUrl()}/plot/${encodeURIComponent(publicCode!)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 320,
      margin: 2,
    });
    return { publicCode, publicUrl: url, qrCodeDataUrl };
  }

  async findAllByEstate(estateId: string, userId: string) {
    const estate = await this.prisma.estates.findFirst({
      where: {
        id: estateId,
        ownerId: userId,
      },
    });

    if (!estate) {
      throw new ForbiddenException('Estate not found or access denied');
    }

    return this.prisma.parcels.findMany({
      where: { estateId },
      include: {
        seeds: true,
        _count: {
          select: {
            growth_logs: true,
          },
        },
      },
    });
  }
}
