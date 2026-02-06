import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class KillSwitchService {
  private readonly logger = new Logger(KillSwitchService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Check for compromised batches (temperature >10°C for >30 minutes)
   * Runs automatically every 5 minutes via cron
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAndFlagCompromisedBatchesScheduled() {
    this.logger.log('Running scheduled kill-switch check...');
    return this.checkAndFlagCompromisedBatches();
  }

  /**
   * Check for compromised batches (temperature >10°C for >30 minutes)
   * Can also be called manually
   */
  async checkAndFlagCompromisedBatches() {
    const batches = await this.prisma.batches.findMany({
      where: {
        status: {
          in: ['PACKED', 'IN_HUB', 'IN_TRANSIT'],
        },
      },
      include: {
        temperature_logs: {
          where: {
            temperature: {
              gt: 10,
            },
            timestamp: {
              gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
            },
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
        estates: {
          include: {
            users: true,
          },
        },
        missions: {
          include: {
            users_missions_logisticsPartnerIdTousers: true,
            vehicles: true,
          },
        },
      },
    });

    const compromisedBatches: any[] = [];

    for (const batch of batches) {
      if (batch.temperature_logs.length === 0) {
        continue;
      }

      // Check for continuous period >30 minutes above 10°C
      let startTime: Date | null = null;
      let maxDuration = 0;

      for (const log of batch.temperature_logs) {
        if (!startTime) {
          startTime = log.timestamp;
        } else {
          const duration = (log.timestamp.getTime() - startTime.getTime()) / (1000 * 60); // minutes
          maxDuration = Math.max(maxDuration, duration);

          // If temperature drops below 10°C, reset start time
          if (log.temperature <= 10) {
            startTime = null;
          }
        }
      }

      // Check if last log is still above 10°C and calculate duration from start
      if (startTime && batch.temperature_logs.length > 0) {
        const lastLog = batch.temperature_logs[batch.temperature_logs.length - 1];
        const currentDuration = (new Date().getTime() - startTime.getTime()) / (1000 * 60);
        maxDuration = Math.max(maxDuration, currentDuration);
      }

      if (maxDuration > 30) {
        // Flag batch as compromised
        await this.flagBatchAsCompromised(batch.id, maxDuration);
        compromisedBatches.push({
          batch,
          duration: maxDuration,
        });
      }
    }

    return {
      checked: batches.length,
      compromised: compromisedBatches.length,
      batches: compromisedBatches,
    };
  }

  /**
   * Flag batch as compromised
   */
  private async flagBatchAsCompromised(batchId: string, durationMinutes: number) {
    // Update batch status or add compromised flag
    // For now, we'll add it to qualityIssues
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return;
    }

    // Check if already flagged
    const existingIssue = batch.qualityIssues as any;
    if (existingIssue?.compromised) {
      return; // Already flagged
    }

    // Update batch with compromised flag
    await this.prisma.batches.update({
      where: { id: batchId },
      data: {
        qualityIssues: {
          ...existingIssue,
          compromised: true,
          compromisedAt: new Date(),
          compromisedReason: `Temperature exceeded 10°C for ${durationMinutes.toFixed(1)} minutes`,
          compromisedDuration: durationMinutes,
        },
        status: 'EXPIRED', // Or create a new status like 'COMPROMISED'
      },
    });

    // Create audit trail
    await this.prisma.audit_trails.create({
      data: {
        eventType: 'QUALITY_CHECK',
        entityType: 'Batch',
        entityId: batchId,
        newValue: {
          status: 'COMPROMISED',
          reason: 'Temperature exceeded 10°C for >30 minutes',
          duration: durationMinutes,
        },
        changeReason: 'Automatic kill-switch triggered',
        isCompliant: false,
        timestamp: new Date(),
      } as any,
    });

    // Notify SuperAdmin
    const superAdmins = await this.prisma.users.findMany({
      where: {
        roles: { has: 'SUPER_ADMIN' },
        status: 'ACTIVE',
      },
    });

    for (const admin of superAdmins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'ALERT',
        title: 'Batch Compromised - Kill Switch Triggered',
        message: `Batch ${batch.batchId} has been flagged as compromised. Temperature exceeded 10°C for ${durationMinutes.toFixed(1)} minutes.`,
        actionUrl: `/admin/batches/${batchId}`,
      });
    }

    this.logger.warn(
      `Batch ${batch.batchId} flagged as compromised. Temperature >10°C for ${durationMinutes.toFixed(1)} minutes.`,
    );
  }

  /**
   * Simulate IoT sensor data (for testing)
   */
  async simulateIoTData(batchId: string, missionId: string, vehicleId: string) {
    // Simulate temperature readings every 5 minutes
    const baseTemp = 4; // Base temperature in °C
    const variations = [-1, 0, 0.5, 1, -0.5]; // Small variations

    for (let i = 0; i < 12; i++) { // 12 readings = 1 hour
      const temp = baseTemp + variations[Math.floor(Math.random() * variations.length)];
      const timestamp = new Date(Date.now() - (12 - i) * 5 * 60 * 1000);

      // Simulate occasional high temperature (for testing kill-switch)
      const simulatedHighTemp = i >= 6 && i <= 9 ? 11 + Math.random() * 2 : temp;

      await this.prisma.temperature_logs.create({
        data: {
          id: crypto.randomUUID(),
          missionId,
          vehicleId,
          batchId,
          temperature: simulatedHighTemp,
          humidity: 60 + Math.random() * 10,
          location: {
            lat: 44.7866 + Math.random() * 0.1,
            lng: 20.4489 + Math.random() * 0.1,
          },
          reportedByUserId: 'system', // System-generated
          sensorId: `SENSOR-${vehicleId}`,
          deviceId: 'IOT-SIMULATOR',
          isOutOfRange: simulatedHighTemp < 0 || simulatedHighTemp > 12,
          timestamp,
        },
      });
    }
  }
}
