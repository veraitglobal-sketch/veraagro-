import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryUtil } from '../common/utils/geometry.util';
import * as crypto from 'crypto';

@Injectable()
export class ParcelsService {
  constructor(private prisma: PrismaService) {}

  async create(estateId: string, userId: string, data: {
    polygonCoordinates: any;
    cropType?: string;
  }) {
    // Verify estate ownership
    const estate = await this.prisma.estates.findFirst({
      where: {
        id: estateId,
        ownerId: userId,
      },
    });

    if (!estate) {
      throw new ForbiddenException('Estate not found or access denied');
    }

    // Calculate area
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
        approvedAt: null, // Admin must approve before farmer can use for batch / field work
        approvedByUserId: null,
        updatedAt: new Date(),
      },
    });
  }

  /** Admin: list parcels pending approval (no approvedAt) */
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

  /** Admin: approve parcel so farmer can work on it and form batches */
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
    return this.prisma.parcels.update({
      where: { id: parcelId },
      data: {
        approvedAt: new Date(),
        approvedByUserId,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
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
