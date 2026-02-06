import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditTrailDto } from './dto/audit-trail.dto';

@Injectable()
export class AuditTrailService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create audit trail entry
   */
  async createAuditTrail(dto: CreateAuditTrailDto) {
    return this.prisma.audit_trails.create({
      data: {
        eventType: dto.eventType as any,
        entityType: dto.entityType,
        entityId: dto.entityId,
        performedByUserId: dto.performedByUserId || null,
        oldValue: dto.oldValue || null,
        newValue: dto.newValue,
        changeReason: dto.changeReason || null,
        location: dto.location || null,
        temperature: dto.temperature || null,
        temperatureUnit: dto.temperatureUnit || null,
        deviceId: dto.deviceId || null,
        deviceModel: dto.deviceModel || null,
        ipAddress: dto.ipAddress || null,
        userAgent: dto.userAgent || null,
        isCompliant: dto.isCompliant ?? true,
        timestamp: dto.timestamp || new Date(),
      } as any,
    });
  }

  /**
   * Get audit trail for an entity
   */
  async getAuditTrailForEntity(entityType: string, entityId: string) {
    return this.prisma.audit_trails.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            roles: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * Get audit trail by event type
   */
  async getAuditTrailByEventType(eventType: string, limit = 100) {
    return this.prisma.audit_trails.findMany({
      where: {
        eventType: eventType as any,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            roles: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get compliance report (AEO)
   */
  async getComplianceReport(startDate: Date, endDate: Date) {
    const trails = await this.prisma.audit_trails.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            roles: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const compliant = trails.filter(t => t.isCompliant).length;
    const nonCompliant = trails.filter(t => !t.isCompliant).length;
    const complianceRate = trails.length > 0 ? (compliant / trails.length) * 100 : 100;

    return {
      totalEvents: trails.length,
      compliant,
      nonCompliant,
      complianceRate: complianceRate.toFixed(2),
      events: trails,
    };
  }
}
