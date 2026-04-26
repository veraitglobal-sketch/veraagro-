import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

/**
 * Group Sync Service
 *
 * Sends the same instruction (e.g. “Spray tomorrow due to humidity”) to all
 * farmers in a group in one action.
 */
@Injectable()
export class GroupSyncService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Send instruction to all farmers in a group
   */
  async sendGroupInstruction(
    groupId: string,
    instruction: {
      title: string;
      message: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      actionUrl?: string;
    },
    senderId: string,
  ) {
    // Get group (could be certification group, region, or custom group)
    const group = await this.getGroup(groupId);

    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    // Get all farmers in the group
    const farmers = await this.getGroupFarmers(groupId);

    if (farmers.length === 0) {
      throw new BadRequestException('No farmers found in this group');
    }

    // Send notification to all farmers
    const results = await Promise.allSettled(
      farmers.map((farmer) =>
        this.notificationsService.create({
          userId: farmer.id,
          type: 'ACTION_REQUIRED',
          title: instruction.title,
          message: instruction.message,
          actionUrl: instruction.actionUrl,
        }),
      ),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Log the group sync action
    await this.logGroupSyncAction({
      groupId,
      senderId,
      instruction,
      farmersCount: farmers.length,
      successful,
      failed,
    });

    return {
      success: true,
      message: `Instruction sent to ${successful} farmers in group`,
      groupId,
      groupName: group.name,
      farmersCount: farmers.length,
      successful,
      failed,
      instruction,
    };
  }

  /**
   * Get group by ID (supports multiple group types)
   */
  private async getGroup(groupId: string) {
    // Try to find as certification group
    // In production, this would check a groups table
    // For now, we'll use estates with same certification
    
    // Check if it's a certification group (e.g., "GLOBALGAP_GROUP_2026")
    if (groupId.startsWith('CERT_')) {
      const certificationType = groupId.replace('CERT_', '');
      // Note: estates model doesn't have certificationType field
      // Using status field instead
      const estates = await this.prisma.estates.findMany({
        where: {
          status: 'CERTIFIED',
        },
      });

      if (estates.length > 0) {
        return {
          id: groupId,
          name: `Certification Group: ${certificationType}`,
          type: 'CERTIFICATION',
        };
      }
    }

    // Check if it's a region group (e.g., "REGION_VOJVODINA")
    if (groupId.startsWith('REGION_')) {
      const region = groupId.replace('REGION_', '');
      return {
        id: groupId,
        name: `Region: ${region}`,
        type: 'REGION',
      };
    }

    // Default: return null if group not found
    return null;
  }

  /**
   * Get all farmers in a group
   */
  private async getGroupFarmers(groupId: string) {
    // If certification group
    if (groupId.startsWith('CERT_')) {
      const certificationType = groupId.replace('CERT_', '');
      const estates = await this.prisma.estates.findMany({
        where: {
          status: 'CERTIFIED',
        },
        include: {
          users: true,
        },
      });

      // Get unique farmers
      const farmerIds = new Set<string>();
      estates.forEach((estate) => {
        if (estate.ownerId) {
          farmerIds.add(estate.ownerId);
        }
      });

      const farmers = await this.prisma.users.findMany({
        where: {
          id: { in: Array.from(farmerIds) },
          roles: { has: 'GROWER' },
        },
      });

      return farmers;
    }

    // If region group
    if (groupId.startsWith('REGION_')) {
      const region = groupId.replace('REGION_', '');
      // In production, this would filter by region
      // For now, return all growers
      const farmers = await this.prisma.users.findMany({
        where: {
          roles: { has: 'GROWER' },
        },
      });

      return farmers;
    }

    // Default: return empty array
    return [];
  }

  /**
   * Log group sync action for audit
   */
  private async logGroupSyncAction(data: {
    groupId: string;
    senderId: string;
    instruction: any;
    farmersCount: number;
    successful: number;
    failed: number;
  }) {
    await this.prisma.audit_trails.create({
      data: {
        id: crypto.randomUUID(),
        eventType: 'STATUS_CHANGE', // Using existing event type
        entityType: 'GROUP',
        entityId: data.groupId,
        performedByUserId: data.senderId,
        newValue: {
          action: 'GROUP_SYNC',
          instruction: data.instruction,
          farmersCount: data.farmersCount,
          successful: data.successful,
          failed: data.failed,
        },
        timestamp: new Date(),
        isCompliant: true,
      },
    });
  }

  /**
   * Get available groups
   */
  async getAvailableGroups() {
    // Get certification groups
    // Note: estates model uses status field, not certificationType
    const certifiedEstates = await this.prisma.estates.findMany({
      where: {
        status: 'CERTIFIED',
      },
    });

    // Group by status (since we don't have certificationType)
    const groups = [
      {
        id: 'CERT_CERTIFIED',
        name: 'Certification: All Certified Estates',
        type: 'CERTIFICATION',
      },
    ];

    // Add region groups (hardcoded for now)
    groups.push(
      {
        id: 'REGION_VOJVODINA',
        name: 'Region: Vojvodina',
        type: 'REGION',
      },
      {
        id: 'REGION_CENTRAL_SERBIA',
        name: 'Region: Central Serbia',
        type: 'REGION',
      },
    );

    return groups;
  }

  /**
   * Get group statistics
   */
  async getGroupStatistics(groupId: string) {
    const farmers = await this.getGroupFarmers(groupId);
      const estates = await this.prisma.estates.findMany({
        where: {
          ownerId: { in: farmers.map((f) => f.id) },
        },
      });

    return {
      groupId,
      farmersCount: farmers.length,
      estatesCount: estates.length,
      certifiedEstates: estates.filter(
        (e) => e.status === 'CERTIFIED',
      ).length,
    };
  }
}
