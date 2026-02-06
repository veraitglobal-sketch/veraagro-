import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityAlertsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    type?: string;
    severity?: string;
    status?: string;
    userId?: string;
    estateId?: string;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.severity) {
      where.severity = filters.severity;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.estateId) {
      where.estateId = filters.estateId;
    }

    return this.prisma.security_alerts.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            partnerCode: true,
            firstName: true,
            lastName: true,
          },
        },
        estates: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const alert = await this.prisma.security_alerts.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            partnerCode: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        estates: {
          select: {
            id: true,
            name: true,
            polygonCoordinates: true,
          },
        },
      },
    });

    if (!alert) {
      throw new NotFoundException('Security alert not found');
    }

    return alert;
  }

  async updateStatus(
    id: string,
    status: string,
    reviewedBy: string,
    reviewNotes?: string,
    resolution?: string,
  ) {
    return this.prisma.security_alerts.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
        resolution,
        updatedAt: new Date(),
      },
    });
  }

  async getStatistics() {
    const [total, byType, bySeverity, byStatus] = await Promise.all([
      this.prisma.security_alerts.count(),
      this.prisma.security_alerts.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.prisma.security_alerts.groupBy({
        by: ['severity'],
        _count: true,
      }),
      this.prisma.security_alerts.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
