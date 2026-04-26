import { Injectable } from '@nestjs/common';
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
      },
      parcels: {
        total: totalParcels,
        pendingApproval: pendingParcelsCount,
      },
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
