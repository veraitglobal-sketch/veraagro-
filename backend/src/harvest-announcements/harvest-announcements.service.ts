import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TreatmentLogsService } from '../treatment-logs/treatment-logs.service';
import * as crypto from 'crypto';

export interface CreateHarvestAnnouncementDto {
  parcelId: string;
  announcementType: 'HARVEST' | 'PLANTING';
  cropType: string;
  estimatedDate: string; // ISO date string
  estimatedQuantity?: number; // kg
  notes?: string;
}

@Injectable()
export class HarvestAnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private treatmentLogsService: TreatmentLogsService,
  ) {}

  /**
   * Create harvest/planting announcement
   * Notifies admins automatically
   */
  async create(userId: string, dto: CreateHarvestAnnouncementDto) {
    // 1. Verify parcel ownership
    const parcel = await this.prisma.parcels.findFirst({
      where: {
        id: dto.parcelId,
        estates: {
          ownerId: userId,
        },
      },
      include: {
        estates: true,
      },
    });

    if (!parcel) {
      throw new ForbiddenException('Parcel not found or access denied');
    }

    // 2. PHI Check: Block harvest if Pre-Harvest Interval not elapsed
    const { date: earliestHarvest, reason } = await this.treatmentLogsService.getEarliestHarvestDate(dto.parcelId);
    const harvestDate = new Date(dto.estimatedDate);
    if (earliestHarvest && harvestDate < earliestHarvest) {
      throw new BadRequestException(
        `Harvest blocked: ${reason || 'Pre-harvest interval'}. Earliest harvest date: ${earliestHarvest.toISOString().split('T')[0]}`,
      );
    }

    // 3. Create announcement
    const announcement = await this.prisma.harvest_announcements.create({
      data: {
        id: crypto.randomUUID(),
        parcelId: dto.parcelId,
        userId,
        announcementType: dto.announcementType,
        cropType: dto.cropType,
        estimatedDate: new Date(dto.estimatedDate),
        estimatedQuantity: dto.estimatedQuantity,
        notes: dto.notes,
        status: 'PENDING',
        updatedAt: new Date(),
      },
      include: {
        parcel: {
          include: {
            estates: {
              include: {
                users: true,
              },
            },
          },
        },
        user: true,
      },
    });

    // 4. Notify admins (async, non-blocking)
    this.notifyAdmins(announcement).catch((err) => {
      console.error('Error notifying admins:', err);
    });

    return announcement;
  }

  /**
   * Get all announcements for a farmer
   */
  async getFarmerAnnouncements(userId: string) {
    return this.prisma.harvest_announcements.findMany({
      where: { userId },
      include: {
        parcel: {
          include: {
            estates: true,
          },
        },
      },
      orderBy: {
        estimatedDate: 'desc',
      },
    });
  }

  /**
   * Get all announcements (admin view)
   */
  async getAllAnnouncements(filters?: {
    status?: string;
    announcementType?: string;
    cropType?: string;
  }) {
    return this.prisma.harvest_announcements.findMany({
      where: filters || {},
      include: {
        parcel: {
          include: {
            estates: {
              include: {
                users: true,
              },
            },
          },
        },
        user: true,
      },
      orderBy: {
        estimatedDate: 'desc',
      },
    });
  }

  /**
   * Update announcement status (admin only)
   */
  async updateStatus(announcementId: string, status: string) {
    const announcement = await this.prisma.harvest_announcements.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.prisma.harvest_announcements.update({
      where: { id: announcementId },
      data: {
        status,
        confirmedAt: status === 'CONFIRMED' ? new Date() : announcement.confirmedAt,
      },
    });
  }

  /**
   * Notify all admins about new announcement
   */
  private async notifyAdmins(announcement: any) {
    const admins = await this.prisma.users.findMany({
      where: {
        OR: [
          { roles: { has: 'ADMIN' } },
          { roles: { has: 'SUPER_ADMIN' } },
        ],
      },
    });

    const farmerName = `${announcement.user?.firstName || ''} ${announcement.user?.lastName || ''}`.trim();
    const estateName = announcement.parcel?.estates?.name || 'Unknown Estate';
    const announcementTypeLabel = announcement.announcementType === 'HARVEST' ? 'branje' : 'sadnicu';

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'ACTION_REQUIRED',
        title: `New harvest announcement: ${announcementTypeLabel}`,
        message: `${farmerName} announced ${announcementTypeLabel}: ${announcement.cropType} - ${new Date(announcement.estimatedDate).toLocaleDateString()}${announcement.estimatedQuantity ? ` (${announcement.estimatedQuantity}kg)` : ''}`,
        actionUrl: `/admin/harvest-announcements/${announcement.id}`,
      });
    }
  }
}
