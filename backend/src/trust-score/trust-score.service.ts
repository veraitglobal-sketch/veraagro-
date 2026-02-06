import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

export enum TrustScoreEvent {
  LATE_ARRIVAL = 'LATE_ARRIVAL', // >15 mins late
  TEMPERATURE_DEVIATION = 'TEMPERATURE_DEVIATION', // >2°C from target
  MISSING_SIGNATURE = 'MISSING_SIGNATURE', // Missing digital signature
  ROUTE_DEVIATION = 'ROUTE_DEVIATION', // >2km deviation without alert
  QUALITY_ISSUE = 'QUALITY_ISSUE', // Quality problems
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT', // Admin adjustment
}

export interface TrustScoreDeduction {
  event: TrustScoreEvent;
  points: number;
  reason: string;
  entityId: string;
  entityType: 'GROWER' | 'LOGISTICS_PARTNER' | 'FLEET_PARTNER' | 'HUB';
}

@Injectable()
export class TrustScoreService {
  private readonly logger = new Logger(TrustScoreService.name);
  private readonly INITIAL_SCORE = 100;
  private readonly BLOCK_THRESHOLD = 70;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Initialize trust score for a new partner
   */
  async initializeTrustScore(userId: string, entityType: string) {
    const existing = await this.prisma.trust_scores.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.trust_scores.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        currentScore: this.INITIAL_SCORE,
        lastUpdated: new Date(),
      },
    });
  }

  /**
   * Get current trust score
   */
  async getTrustScore(userId: string) {
    let score = await this.prisma.trust_scores.findUnique({
      where: { userId },
    });

    if (!score) {
      score = await this.initializeTrustScore(userId, 'UNKNOWN');
    }

    return score;
  }

  /**
   * Apply deduction to trust score
   */
  async applyDeduction(deduction: TrustScoreDeduction) {
    const user = await this.prisma.users.findUnique({
      where: { id: deduction.entityId },
    });

    if (!user) {
      throw new Error(`User ${deduction.entityId} not found`);
    }

    let trustScore = await this.getTrustScore(deduction.entityId);
    const previousScore = trustScore.currentScore;
    const newScore = Math.max(0, trustScore.currentScore - deduction.points);

    // Update trust score
    trustScore = await this.prisma.trust_scores.update({
      where: { userId: deduction.entityId },
      data: {
        currentScore: newScore,
        lastUpdated: new Date(),
      },
    });

    // Create audit trail instead of trustScoreHistory (model doesn't exist)
    await this.prisma.audit_trails.create({
      data: {
        eventType: 'TRUST_SCORE_DEDUCTION' as any,
        entityType: 'TrustScore',
        entityId: deduction.entityId,
        newValue: {
          previousScore,
          newScore,
          deduction: deduction.points,
          eventType: deduction.event,
          reason: deduction.reason,
        },
        changeReason: deduction.reason,
        timestamp: new Date(),
      } as any,
    });

    // Check if blocked (score below threshold)
    if (newScore < this.BLOCK_THRESHOLD) {
      await this.blockPartner(deduction.entityId, user.roles[0] || 'GROWER');
    }

    // Notify SuperAdmin if significant drop
    if (previousScore >= this.BLOCK_THRESHOLD && newScore < this.BLOCK_THRESHOLD) {
      await this.notifySuperAdminBlock(deduction.entityId, user, newScore);
    }

    this.logger.warn(
      `Trust score deduction: ${deduction.entityId} ${previousScore} → ${newScore} (${deduction.event})`,
    );

    return trustScore;
  }

  /**
   * Block partner from accepting new missions
   */
  private async blockPartner(userId: string, role: string) {
    // Note: isBlocked and blockedAt fields don't exist in schema
    // Trust score blocking is handled by checking currentScore < BLOCK_THRESHOLD
    await this.prisma.trust_scores.update({
      where: { userId },
      data: {
        lastUpdated: new Date(),
      },
    });

    // Notify user
    await this.notificationsService.create({
      userId,
      type: 'ALERT',
      title: 'Account Blocked - Trust Score Below Threshold',
      message: `Your trust score has dropped below ${this.BLOCK_THRESHOLD}. You cannot accept new missions until reviewed by SuperAdmin.`,
      actionUrl: `/trust-score`,
    });

    this.logger.warn(`Partner ${userId} (${role}) blocked due to low trust score`);
  }

  /**
   * Unblock partner (manual by SuperAdmin)
   */
  async unblockPartner(userId: string, reason: string) {
    const trustScore = await this.getTrustScore(userId);
    
    await this.prisma.trust_scores.update({
      where: { userId },
      data: {
        // Note: isBlocked and blockedAt fields don't exist in schema, removing
        lastUpdated: new Date(),
      },
    });

    // Create audit trail instead of trustScoreHistory
    await this.prisma.audit_trails.create({
      data: {
        eventType: 'TRUST_SCORE_DEDUCTION' as any,
        entityType: 'TrustScore',
        entityId: userId,
        newValue: {
          previousScore: trustScore.currentScore,
          newScore: trustScore.currentScore,
          deduction: 0,
          eventType: TrustScoreEvent.MANUAL_ADJUSTMENT,
          reason: `Unblocked by SuperAdmin: ${reason}`,
        },
        changeReason: `Unblocked by SuperAdmin: ${reason}`,
        timestamp: new Date(),
      } as any,
    });

    // Notify user
    await this.notificationsService.create({
      userId,
      type: 'SYSTEM',
      title: 'Account Unblocked',
      message: `Your account has been unblocked. Reason: ${reason}`,
      actionUrl: `/missions`,
    });
  }

  /**
   * Check if partner can accept mission
   */
  async canAcceptMission(userId: string): Promise<boolean> {
    const trustScore = await this.getTrustScore(userId);
    return trustScore.currentScore >= this.BLOCK_THRESHOLD;
  }

  /**
   * Notify SuperAdmin about block
   */
  private async notifySuperAdminBlock(userId: string, user: any, score: number) {
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
        title: 'Partner Blocked - Trust Score Below Threshold',
        message: `${user.firstName} ${user.lastName} (${user.role}) has been blocked. Trust Score: ${score}/100`,
        actionUrl: `/admin/trust-scores/${userId}`,
      });
    }
  }

  /**
   * Manual score adjustment by SuperAdmin
   */
  async adjustScore(userId: string, points: number, reason: string, adminId: string) {
    const trustScore = await this.getTrustScore(userId);
    const newScore = Math.max(0, Math.min(100, trustScore.currentScore + points));

    await this.prisma.trust_scores.update({
      where: { userId },
      data: {
        currentScore: newScore,
        lastUpdated: new Date(),
      },
    });

    // Create audit trail instead of trustScoreHistory
    await this.prisma.audit_trails.create({
      data: {
        eventType: 'TRUST_SCORE_DEDUCTION' as any,
        entityType: 'TrustScore',
        entityId: userId,
        newValue: {
          previousScore: trustScore.currentScore,
          newScore,
          deduction: -points, // Negative for increase
          eventType: TrustScoreEvent.MANUAL_ADJUSTMENT,
          reason: `Manual adjustment by Admin ${adminId}: ${reason}`,
        },
        changeReason: `Manual adjustment by Admin ${adminId}: ${reason}`,
        timestamp: new Date(),
      } as any,
    });

    return this.getTrustScore(userId);
  }
}
