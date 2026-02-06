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
        status: 'INVALID', // Will be validated when seed is scanned
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
