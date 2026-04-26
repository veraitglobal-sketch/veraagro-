import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStatistics() {
    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalOrders,
      totalMissions,
      totalBatches,
      totalSecurityAlerts,
      todayOrders,
      todayRevenue,
      activeMissions,
      pendingSecurityAlerts,
      totalEstates,
      totalParcels,
      pendingParcelsCount,
      pendingEstatesCount,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.count({
        where: {
          OR: [
            { roles: { has: 'FARMER' } },
            { roles: { has: 'GROWER' } },
          ],
        },
      }),
      this.prisma.users.count({
        where: {
          roles: { has: 'BUYER' },
        },
      }),
      this.prisma.orders.count(),
      this.prisma.missions.count(),
      this.prisma.batches.count(),
      this.prisma.security_alerts.count(),
      this.prisma.orders.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.orders.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          status: {
            notIn: ['CANCELLED', 'REFUNDED'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      this.prisma.missions.count({
        where: {
          status: {
            in: ['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT'],
          },
        },
      }),
      this.prisma.security_alerts.count({
        where: {
          status: 'PENDING',
        },
      }),
      this.prisma.estates.count(),
      this.prisma.parcels.count(),
      this.prisma.parcels.count({ where: { approvedAt: null } }),
      this.prisma.estates.count({ where: { status: 'PENDING_SETUP' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        farmers: totalFarmers,
        buyers: totalBuyers,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        todayRevenue: todayRevenue._sum.totalAmount || 0,
      },
      missions: {
        total: totalMissions,
        active: activeMissions,
      },
      batches: {
        total: totalBatches,
      },
      security: {
        total: totalSecurityAlerts,
        pending: pendingSecurityAlerts,
      },
      estates: {
        total: totalEstates,
        pendingSetup: pendingEstatesCount,
      },
      parcels: {
        total: totalParcels,
        pendingApproval: pendingParcelsCount,
      },
    };
  }

  /**
   * Single-farmer overview for admin: estates, field evidence, compliance photos, batches, treatments.
   */
  async getFarmDetailByFarmerId(farmerId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: farmerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        partnerCode: true,
        phone: true,
        roles: true,
        status: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const estates = await this.prisma.estates.findMany({
      where: { ownerId: farmerId },
      include: {
        parcels: {
          select: {
            id: true,
            cropType: true,
            calculatedArea: true,
          },
        },
      },
    });

    const estateIds = estates.map((e) => e.id);
    const parcelIds = estates.flatMap((e) => e.parcels.map((p) => p.id));

    const [growthLogs, batchesList, treatmentLogs, harvestAnnouncements] = await Promise.all([
      this.prisma.growth_logs.findMany({
        where: { userId: farmerId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      estateIds.length
        ? this.prisma.batches.findMany({
            where: { estateId: { in: estateIds } },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              compliance_photos: true,
            },
          })
        : Promise.resolve([]),
      parcelIds.length
        ? this.prisma.treatment_logs.findMany({
            where: { parcelId: { in: parcelIds } },
            orderBy: { appliedAt: 'desc' },
            take: 50,
          })
        : Promise.resolve([]),
      this.prisma.harvest_announcements.findMany({
        where: { userId: farmerId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const fieldPhotos = growthLogs.map((g) => ({
      id: g.id,
      imageUrl: g.imageUrl,
      imageHash: g.imageHash,
      createdAt: g.createdAt.toISOString(),
      growthStage: g.growthStage ?? undefined,
    }));

    const compliancePhotos = batchesList.flatMap((b) =>
      b.compliance_photos.map((c) => ({
        id: c.id,
        photoUrl: c.photoUrl,
        photoType: c.photoType,
        batchId: c.batchId,
      })),
    );

    const labResults = growthLogs
      .filter((g) => g.labResultUrl)
      .map((g) => ({
        id: g.id,
        labResultUrl: g.labResultUrl!,
        labTestDate: g.labTestDate?.toISOString(),
        source: 'growth_log' as const,
      }));

    const batches = batchesList.map((b) => ({
      id: b.id,
      batchId: b.batchId,
      productName: b.productName,
      quantity: b.quantity,
      status: b.status,
    }));

    const treatmentLogsOut = treatmentLogs.map((t) => ({
      id: t.id,
      productName: t.productName,
      appliedAt: t.appliedAt.toISOString(),
      parcelId: t.parcelId,
    }));

    const harvestOut = harvestAnnouncements.map((h) => ({
      id: h.id,
      cropType: h.cropType,
      estimatedDate: h.estimatedDate.toISOString(),
      estimatedQuantity: h.estimatedQuantity,
      status: h.status,
      plannedLoadingStart: h.plannedLoadingStart?.toISOString(),
      plannedLoadingEnd: h.plannedLoadingEnd?.toISOString(),
      loadQuantityKg: h.loadQuantityKg,
      marketChannel: h.marketChannel,
      qualityGrade: h.qualityGrade,
      sortingSpec: h.sortingSpec,
      adminNotes: h.adminNotes,
    }));

    return {
      farmer: user,
      estates: estates.map((e) => ({
        id: e.id,
        name: e.name,
        calculatedArea: e.calculatedArea,
        status: e.status,
        parcels: e.parcels,
      })),
      fieldPhotos,
      compliancePhotos,
      labResults,
      treatmentLogs: treatmentLogsOut,
      harvestAnnouncements: harvestOut,
      batches,
    };
  }

  async getRecentActivities(limit: number = 10) {
    const [recentOrders, recentMissions, recentAlerts, pendingParcels, recentBatches] = await Promise.all([
      this.prisma.orders.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              partnerCode: true,
            },
          },
          estates: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.missions.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users_missions_growerIdTousers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.security_alerts.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.parcels.findMany({
        where: { approvedAt: null },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          estates: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              users: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  partnerCode: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.batches.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          estates: {
            select: {
              id: true,
              name: true,
            },
          },
          parcels: {
            select: {
              id: true,
              cropType: true,
            },
          },
        },
      }),
    ]);

    return {
      orders: recentOrders,
      missions: recentMissions,
      alerts: recentAlerts,
      pendingParcels,
      recentBatches,
    };
  }
}
