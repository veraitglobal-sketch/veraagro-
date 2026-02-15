import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryUtil } from '../common/utils/geometry.util';
import * as crypto from 'crypto';

@Injectable()
export class EstatesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    name: string;
    polygonCoordinates: any;
  }) {
    // Calculate area from polygon
    const points = Array.isArray(data.polygonCoordinates)
      ? data.polygonCoordinates
      : data.polygonCoordinates.coordinates || [];
    
    const calculatedArea = GeometryUtil.calculatePolygonArea(points);

    return this.prisma.estates.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        ownerId: userId,
        polygonCoordinates: data.polygonCoordinates,
        calculatedArea,
        status: 'PENDING_SETUP',
        updatedAt: new Date(),
      },
      include: {
        parcels: true,
      },
    });
  }

  async findAllByUser(userId: string) {
    try {
      return await this.prisma.estates.findMany({
        where: { ownerId: userId },
        include: {
          parcels: {
            include: {
              seeds: true,
              _count: {
                select: {
                  growth_logs: true,
                },
              },
            },
          },
          _count: {
            select: {
              growth_logs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error in findAllByUser:', error);
      throw error;
    }
  }

  async findAllPublic() {
    // Public endpoint - returns all active estates with basic info for map
    return this.prisma.estates.findMany({
      where: { 
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        polygonCoordinates: true,
        calculatedArea: true,
        status: true,
        users: {
          select: {
            firstName: true,
            lastName: true,
            partnerCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const estate = await this.prisma.estates.findUnique({
      where: { id },
      include: {
        parcels: {
          include: {
            seeds: true,
            growth_logs: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    if (estate.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Calculate days remaining for Bio-Ready certification
    if (estate.certificationStartDate) {
      const daysElapsed = Math.floor(
        (new Date().getTime() - estate.certificationStartDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      estate.daysRemaining = Math.max(0, 1095 - daysElapsed);
    }

    return estate;
  }

  async update(id: string, userId: string, data: { name?: string; polygonCoordinates?: any }) {
    // Verify ownership first
    const estate = await this.findOne(id, userId);

    // Calculate area if polygon is being updated
    let calculatedArea = estate.calculatedArea;
    if (data.polygonCoordinates) {
      const points = Array.isArray(data.polygonCoordinates)
        ? data.polygonCoordinates
        : data.polygonCoordinates.coordinates || [];
      calculatedArea = GeometryUtil.calculatePolygonArea(points);
    }

    return this.prisma.estates.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.polygonCoordinates && { polygonCoordinates: data.polygonCoordinates }),
        ...(calculatedArea !== estate.calculatedArea && { calculatedArea }),
        updatedAt: new Date(),
      },
      include: {
        parcels: true,
      },
    });
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const estate = await this.prisma.estates.findUnique({ where: { id } });
    if (!estate) throw new NotFoundException('Estate not found');

    // Admin can delete any estate; otherwise verify ownership
    if (!isAdmin && estate.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if estate has parcels
    const parcelsCount = await this.prisma.parcels.count({
      where: { estateId: id },
    });

    if (parcelsCount > 0) {
      throw new ForbiddenException('Cannot delete estate with existing parcels. Please delete parcels first.');
    }

    return this.prisma.estates.delete({
      where: { id },
    });
  }

  async startCertification(estateId: string, userId: string) {
    const estate = await this.findOne(estateId, userId);

    if (estate.status !== 'ACTIVE') {
      throw new ForbiddenException('Estate must be active to start certification');
    }

    return this.prisma.estates.update({
      where: { id: estateId },
      data: {
        certificationStartDate: new Date(),
        daysRemaining: 1095,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Admin: Approve estate (change status from PENDING_SETUP to ACTIVE)
   */
  async approveEstate(estateId: string) {
    const estate = await this.prisma.estates.findUnique({
      where: { id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    if (estate.status !== 'PENDING_SETUP') {
      throw new ForbiddenException(`Estate is already ${estate.status}. Cannot approve.`);
    }

    return this.prisma.estates.update({
      where: { id: estateId },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
      include: {
        users: true,
        parcels: true,
      },
    });
  }

  /**
   * Admin: Reject estate (change status to INVALID)
   */
  async rejectEstate(estateId: string, reason?: string) {
    const estate = await this.prisma.estates.findUnique({
      where: { id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    return this.prisma.estates.update({
      where: { id: estateId },
      data: {
        status: 'INVALID',
        updatedAt: new Date(),
      },
      include: {
        users: true,
      },
    });
  }

  /**
   * Admin: Get all estates pending approval
   */
  async getPendingEstates() {
    return this.prisma.estates.findMany({
      where: {
        status: 'PENDING_SETUP',
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            partnerCode: true,
          },
        },
        parcels: {
          select: {
            id: true,
            cropType: true,
            calculatedArea: true,
          },
        },
        _count: {
          select: {
            parcels: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
