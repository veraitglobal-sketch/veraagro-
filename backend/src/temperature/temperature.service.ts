import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../audit-trail/audit-trail.service';
import { KillSwitchService } from '../kill-switch/kill-switch.service';
import { CreateTemperatureLogDto } from './dto/temperature.dto';
import * as crypto from 'crypto';

@Injectable()
export class TemperatureService {
  constructor(
    private prisma: PrismaService,
    private auditTrailService: AuditTrailService,
    private killSwitchService: KillSwitchService,
  ) {}

  /**
   * Log temperature reading (from Logistics Partner or Sensor)
   */
  async logTemperature(userId: string, dto: CreateTemperatureLogDto) {
    // Verify user is Logistics Partner
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.roles.includes('LOGISTICS_PARTNER')) {
      throw new BadRequestException('Only logistics partners can log temperature');
    }

    // Check if temperature is out of range (0-12°C)
    const isOutOfRange = dto.temperature < 0 || dto.temperature > 12;

    // Create temperature log
    const log = await this.prisma.temperature_logs.create({
      data: {
        id: crypto.randomUUID(),
        missionId: dto.missionId,
        vehicleId: dto.vehicleId,
        batchId: dto.batchId,
        temperature: dto.temperature,
        humidity: dto.humidity,
        location: dto.location as any, // Convert LocationDto to JSON
        reportedByUserId: userId,
        sensorId: dto.sensorId,
        deviceId: dto.deviceId,
        isOutOfRange,
        alertSent: isOutOfRange,
        timestamp: new Date(),
      },
      include: {
        missions: true,
        vehicles: true,
        batches: true,
      },
    });

    // Create audit trail for temperature change
    await this.auditTrailService.createAuditTrail({
      eventType: 'TEMPERATURE_CHANGE',
      entityType: dto.batchId ? 'Batch' : dto.missionId ? 'Mission' : 'Vehicle',
      entityId: dto.batchId || dto.missionId || dto.vehicleId || '',
      performedByUserId: userId,
      newValue: {
        temperature: dto.temperature,
        humidity: dto.humidity,
        location: dto.location,
        isOutOfRange,
      },
      location: dto.location,
      temperature: dto.temperature,
      temperatureUnit: 'Celsius',
      deviceId: dto.deviceId,
      isCompliant: !isOutOfRange,
    });

    // If out of range, trigger alert (in production, send notification)
    if (isOutOfRange) {
      // TODO: Send notification to coordinator and grower
      console.warn(`Temperature out of range: ${dto.temperature}°C for batch ${dto.batchId}`);
    }

    // Check for kill-switch condition (>10°C for >30 minutes)
    if (dto.batchId && dto.temperature > 10) {
      // Trigger kill-switch check asynchronously
      this.killSwitchService.checkAndFlagCompromisedBatches().catch(err => {
        console.error('Kill-switch check failed:', err);
      });
    }

    return log;
  }

  /**
   * Get temperature history for a batch
   */
  async getTemperatureHistory(batchId: string) {
    return this.prisma.temperature_logs.findMany({
      where: { batchId },
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get temperature history for a mission
   */
  async getMissionTemperatureHistory(missionId: string) {
    return this.prisma.temperature_logs.findMany({
      where: { missionId },
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get alerts (out of range temperatures)
   */
  async getTemperatureAlerts() {
    return this.prisma.temperature_logs.findMany({
      where: {
        isOutOfRange: true,
        alertSent: true,
      },
      include: {
        batches: {
          include: {
            estates: true,
          },
        },
        missions: true,
        vehicles: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
    });
  }
}
