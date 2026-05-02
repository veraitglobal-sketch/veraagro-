import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeometryUtil } from '../common/utils/geometry.util';
import * as crypto from 'crypto';
import { isSystemEstateId, VERA_PLATFORM_ESTATE_ID, PRE_ORDER_ESTATE_ID } from '../orders/order-fulfillment.util';

@Injectable()
export class EstatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * If parcels are already admin-approved but the estate row stayed PENDING_SETUP (older approvals,
   * or before parcel-approval auto-activation), promote to ACTIVE on read so grower apps show the right state.
   */
  private async promotePendingEstatesWithApprovedParcels(
    estates: Array<{ id: string; status: string }>,
  ): Promise<Set<string>> {
    const pendingIds = estates.filter((e) => e.status === 'PENDING_SETUP').map((e) => e.id);
    if (pendingIds.length === 0) {
      return new Set();
    }
    const grouped = await this.prisma.parcels.groupBy({
      by: ['estateId'],
      where: {
        estateId: { in: pendingIds },
        approvedAt: { not: null },
      },
      _count: { _all: true },
    });
    const toActivate = grouped.map((g) => g.estateId);
    if (toActivate.length === 0) {
      return new Set();
    }
    await this.prisma.estates.updateMany({
      where: { id: { in: toActivate }, status: 'PENDING_SETUP' },
      data: { status: 'ACTIVE', updatedAt: new Date() },
    });
    return new Set(toActivate);
  }

  async create(userId: string, data: {
    name: string;
    polygonCoordinates: any;
  }) {
    // Calculate area from polygon
    const points = Array.isArray(data.polygonCoordinates)
      ? data.polygonCoordinates
      : data.polygonCoordinates.coordinates || [];
    
    const calculatedArea = GeometryUtil.calculatePolygonArea(points);
    const id = crypto.randomUUID();
    const estateQrCode = `ESTATE-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    return this.prisma.estates.create({
      data: {
        id,
        name: data.name,
        ownerId: userId,
        estateQrCode,
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
      const rows = await this.prisma.estates.findMany({
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
      const activated = await this.promotePendingEstatesWithApprovedParcels(
        rows.map((r) => ({ id: r.id, status: r.status })),
      );
      if (activated.size === 0) {
        return rows;
      }
      return rows.map((r) =>
        activated.has(r.id) ? { ...r, status: 'ACTIVE' as (typeof r)['status'] } : r,
      );
    } catch (error) {
      console.error('Error in findAllByUser:', error);
      throw error;
    }
  }

  /**
   * Admin: real farms suitable for order fulfillment (excludes system / platform rows).
   */
  async findAllForFulfillmentAssignment() {
    const rows = await this.prisma.estates.findMany({
      where: {
        status: 'ACTIVE',
        NOT: {
          id: { in: [VERA_PLATFORM_ESTATE_ID, PRE_ORDER_ESTATE_ID, 'PRE-ORDER'] },
        },
      },
      select: { id: true, name: true, ownerId: true },
      orderBy: { name: 'asc' },
    });
    return rows.filter((e) => !isSystemEstateId(e.id));
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

    const activated = await this.promotePendingEstatesWithApprovedParcels([
      { id: estate.id, status: estate.status },
    ]);
    if (activated.has(estate.id)) {
      estate.status = 'ACTIVE';
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

  /**
   * Lightweight boundary payload for mobile map / offline cache sync (owner only).
   */
  async getBoundaryForSync(id: string, userId: string) {
    const estate = await this.prisma.estates.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        polygonCoordinates: true,
        ownerId: true,
      },
    });
    if (!estate) {
      throw new NotFoundException('Estate not found');
    }
    if (estate.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return {
      id: estate.id,
      name: estate.name,
      updatedAt: estate.updatedAt.toISOString(),
      polygonCoordinates: estate.polygonCoordinates,
    };
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
    if (isSystemEstateId(id)) {
      throw new BadRequestException('Cannot delete a system estate');
    }

    const estate = await this.prisma.estates.findUnique({ where: { id } });
    if (!estate) throw new NotFoundException('Estate not found');

    // Admin can delete any estate; otherwise verify ownership
    if (!isAdmin && estate.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const [batchCount, orderCount] = await Promise.all([
      this.prisma.batches.count({ where: { estateId: id } }),
      this.prisma.orders.count({
        where: {
          OR: [{ estateId: id }, { fulfillingEstateId: id }],
        },
      }),
    ]);

    if (batchCount > 0) {
      throw new ForbiddenException(
        'Cannot delete an estate that has product batches. Remove or reassign those batches first.',
      );
    }
    if (orderCount > 0) {
      throw new ForbiddenException(
        'Cannot delete an estate that is linked to shop or delivery orders.',
      );
    }

    const parcelIds = (
      await this.prisma.parcels.findMany({
        where: { estateId: id },
        select: { id: true },
      })
    ).map((p) => p.id);

    await this.prisma.$transaction(async (tx) => {
      if (parcelIds.length > 0) {
        await tx.harvest_announcements.deleteMany({
          where: { parcelId: { in: parcelIds } },
        });
        await tx.plot_blueprints.deleteMany({
          where: { parcelId: { in: parcelIds } },
        });
        await tx.parcels.deleteMany({ where: { estateId: id } });
      }
      await tx.growth_logs.deleteMany({ where: { estateId: id } });
      await tx.compliance_logs.deleteMany({ where: { estateId: id } });
      await tx.digital_passports.deleteMany({ where: { estateId: id } });
      await tx.security_alerts.deleteMany({ where: { estateId: id } });
      await tx.inventory.deleteMany({ where: { estateId: id } });
      await tx.estates.delete({ where: { id } });
    });

    return { id, deleted: true as const };
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
