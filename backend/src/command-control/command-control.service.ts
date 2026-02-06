import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TrustScoreService, TrustScoreEvent } from '../trust-score/trust-score.service';

@Injectable()
export class CommandControlService {
  private readonly logger = new Logger(CommandControlService.name);
  private systemPaused = false;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private trustScoreService: TrustScoreService,
  ) {}

  /**
   * Pause entire system (Kill-Switch)
   */
  async pauseSystem(adminId: string, reason: string) {
    this.systemPaused = true;

    // Create system event (commented out - systemEvent model not in schema)
    // await this.prisma.systemEvent.create({
    //   data: {
    //     eventType: 'SYSTEM_PAUSED',
    //     initiatedBy: adminId,
    //     reason,
    //     timestamp: new Date(),
    //   },
    // });

    // Notify all active users
    const activeUsers = await this.prisma.users.findMany({
      where: {
        status: 'ACTIVE',
        roles: {
          hasSome: ['GROWER', 'LOGISTICS_PARTNER', 'COORDINATOR'],
        },
      },
    });

    for (const user of activeUsers) {
      await this.notificationsService.create({
        userId: user.id,
        type: 'ALERT',
        title: 'System Paused',
        message: `Bio Vera system has been paused. Reason: ${reason}`,
        actionUrl: '/',
      });
    }

    this.logger.warn(`System paused by ${adminId}: ${reason}`);
    return { paused: true, reason };
  }

  /**
   * Resume system
   */
  async resumeSystem(adminId: string) {
    this.systemPaused = false;

    // Create system event (commented out - systemEvent model not in schema)
    // await this.prisma.systemEvent.create({
    //   data: {
    //     eventType: 'SYSTEM_RESUMED',
    //     initiatedBy: adminId,
    //     reason: 'System resumed',
    //     timestamp: new Date(),
    //   },
    // });

    this.logger.log(`System resumed by ${adminId}`);
    return { paused: false };
  }

  /**
   * Check if system is paused
   */
  isSystemPaused(): boolean {
    return this.systemPaused;
  }

  /**
   * Reassign mission to another driver
   */
  async reassignMission(
    missionId: string,
    newDriverId: string,
    adminId: string,
    reason: string,
  ) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: {
        users_missions_logisticsPartnerIdTousers: true,
      },
    });

    if (!mission) {
      throw new BadRequestException(`Mission ${missionId} not found`);
    }

    const oldDriverId = mission.logisticsPartnerId;

    // Update mission
    await this.prisma.missions.update({
      where: { id: missionId },
      data: {
        logisticsPartnerId: newDriverId,
        status: 'ASSIGNED',
          // reassignedAt: new Date(), // Not in schema
        // reassignedBy: adminId, // Not in schema
        // reassignmentReason: reason, // Not in schema
      },
    });

    // Notify old driver
    if (oldDriverId) {
      await this.notificationsService.create({
        userId: oldDriverId,
        type: 'ALERT',
        title: 'Mission Reassigned',
        message: `Mission ${mission.missionNumber} has been reassigned to another driver. Reason: ${reason}`,
        actionUrl: '/missions',
      });
    }

    // Notify new driver
    await this.notificationsService.create({
      userId: newDriverId,
      type: 'ACTION_REQUIRED',
      title: 'New Mission Assigned',
      message: `Mission ${mission.missionNumber} has been assigned to you.`,
      actionUrl: `/missions/${missionId}`,
    });

    // Create audit trail
    await this.prisma.audit_trails.create({
      data: {
        id: crypto.randomUUID(),
        eventType: 'MISSION_UPDATED' as any,
        entityType: 'Mission',
        entityId: missionId,
        oldValue: { driverId: oldDriverId },
        newValue: { driverId: newDriverId },
        changeReason: reason,
        timestamp: new Date(),
        performedByUserId: adminId,
      } as any,
    });

    this.logger.warn(`Mission ${missionId} reassigned from ${oldDriverId} to ${newDriverId} by ${adminId}`);

    return {
      success: true,
      missionId,
      oldDriverId,
      newDriverId,
    };
  }

  /**
   * Check late arrival and apply trust score deduction
   */
  async checkLateArrival(missionId: string, actualArrivalTime: Date) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
    });

    if (!mission || !(mission as any).scheduledArrivalTime) {
      return;
    }

    const delayMinutes = (actualArrivalTime.getTime() - ((mission as any).scheduledArrivalTime?.getTime() || actualArrivalTime.getTime())) / (1000 * 60);

    if (delayMinutes > 15) {
      // Apply trust score deduction
      await this.trustScoreService.applyDeduction({
        event: TrustScoreEvent.LATE_ARRIVAL,
        points: 10,
        reason: `Late arrival: ${delayMinutes.toFixed(0)} minutes late`,
        entityId: mission.logisticsPartnerId,
        entityType: 'LOGISTICS_PARTNER',
      });

      // Notify SuperAdmin
      const superAdmins = await this.prisma.users.findMany({
        where: { roles: { has: 'SUPER_ADMIN' }, status: 'ACTIVE' },
      });

      for (const admin of superAdmins) {
        await this.notificationsService.create({
          userId: admin.id,
          type: 'ALERT',
          title: 'Late Arrival Alert',
          message: `Mission ${mission.missionNumber}: Driver arrived ${delayMinutes.toFixed(0)} minutes late.`,
          actionUrl: `/admin/missions/${missionId}`,
        });
      }
    }
  }

  /**
   * Check temperature deviation and apply trust score deduction
   */
  async checkTemperatureDeviation(
    missionId: string,
    targetTemp: number,
    actualTemp: number,
  ) {
    const deviation = Math.abs(actualTemp - targetTemp);

    if (deviation > 2) {
      const mission = await this.prisma.missions.findUnique({
        where: { id: missionId },
      });

      if (mission) {
        await this.trustScoreService.applyDeduction({
          event: TrustScoreEvent.TEMPERATURE_DEVIATION,
          points: 20,
          reason: `Temperature deviation: ${deviation.toFixed(1)}°C from target (${targetTemp}°C)`,
          entityId: mission.logisticsPartnerId,
          entityType: 'LOGISTICS_PARTNER',
        });
      }
    }
  }

  /**
   * Check missing digital signature
   */
  async checkMissingSignature(missionId: string, driverId: string) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: {
        // digitalSignatures: true, // Not in schema
      },
    });

    if (!mission) {
      return;
    }

    // Check if required signatures are present
    const requiredSignatures = (mission as any).requiredSignatures || [];
    const presentSignatures = ((mission as any).digitalSignatures || []).map((s: any) => s.signatureType);

    const missing = requiredSignatures.filter(req => !presentSignatures.includes(req));

    if (missing.length > 0) {
      await this.trustScoreService.applyDeduction({
        event: TrustScoreEvent.MISSING_SIGNATURE,
        points: 50,
        reason: `Missing digital signatures: ${missing.join(', ')}`,
        entityId: driverId,
        entityType: 'LOGISTICS_PARTNER',
      });
    }
  }
}
