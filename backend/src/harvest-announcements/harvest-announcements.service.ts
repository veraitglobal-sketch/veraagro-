import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TreatmentLogsService } from '../treatment-logs/treatment-logs.service';
import { MissionsService } from '../missions/missions.service';
import * as crypto from 'crypto';

export interface CreateHarvestAnnouncementDto {
  parcelId: string;
  announcementType: 'HARVEST' | 'PLANTING';
  cropType: string;
  /** Planned harvest (picker) */
  estimatedDate: string; // ISO date or datetime
  estimatedQuantity?: number; // kg expected
  /** Planned loading window (optional) */
  plannedLoadingStart?: string; // ISO
  plannedLoadingEnd?: string; // ISO
  /** Load quantity (kg) — defaults to estimated quantity in UI if omitted */
  loadQuantityKg?: number;
  /** INDUSTRIAL | RETAIL | MIXED */
  marketChannel?: string;
  qualityGrade?: string;
  sortingSpec?: string;
  notes?: string;
}

export interface AdminUpdateHarvestAnnouncementDto {
  status?: string;
  adminNotes?: string;
  actualDate?: string;
  actualQuantity?: number;
  plannedLoadingStart?: string | null;
  plannedLoadingEnd?: string | null;
  loadQuantityKg?: number | null;
  marketChannel?: string | null;
  qualityGrade?: string | null;
  sortingSpec?: string | null;
}

@Injectable()
export class HarvestAnnouncementsService {
  private readonly logger = new Logger(HarvestAnnouncementsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private treatmentLogsService: TreatmentLogsService,
    private missionsService: MissionsService,
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
    if (!parcel.approvedAt) {
      throw new ForbiddenException(
        'Harvest and planting announcements require an administrator-approved parcel.',
      );
    }

    if (dto.announcementType === 'HARVEST') {
      const activeHarvest = await this.prisma.harvest_announcements.findFirst({
        where: {
          parcelId: dto.parcelId,
          announcementType: 'HARVEST',
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (activeHarvest) {
        throw new BadRequestException(
          'Berba je već prijavljena za ovu parcelu — nije potrebno ponovo slanje. Sledeći korak: otvorite Request transport (ili Missions) da prijavite prevoz, ili proverite Mission Tracker. / Harvest is already registered for this parcel. Next: open Request transport (Missions) to book pickup, or check Mission tracker.',
        );
      }
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
        plannedLoadingStart: dto.plannedLoadingStart ? new Date(dto.plannedLoadingStart) : undefined,
        plannedLoadingEnd: dto.plannedLoadingEnd ? new Date(dto.plannedLoadingEnd) : undefined,
        loadQuantityKg: dto.loadQuantityKg ?? undefined,
        marketChannel: dto.marketChannel ?? undefined,
        qualityGrade: dto.qualityGrade ?? undefined,
        sortingSpec: dto.sortingSpec ?? undefined,
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

    // 5. HARVEST plan → open a logistics mission (tura) so partners see pickup in missions list
    if (dto.announcementType === 'HARVEST') {
      try {
        await this.missionsService.createMissionFromHarvestAnnouncement(announcement.id, userId);
      } catch (err) {
        this.logger.error(
          `Could not create logistics mission for harvest announcement ${announcement.id}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }

    return this.prisma.harvest_announcements.findUnique({
      where: { id: announcement.id },
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
        mission: true,
      },
    });
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
        updatedAt: new Date(),
      },
    });
  }

  async findOneAdmin(announcementId: string) {
    const a = await this.prisma.harvest_announcements.findUnique({
      where: { id: announcementId },
      include: {
        parcel: { include: { estates: { include: { users: true } } } },
        user: true,
      },
    });
    if (!a) {
      throw new NotFoundException('Announcement not found');
    }
    return a;
  }

  async adminUpdate(announcementId: string, dto: AdminUpdateHarvestAnnouncementDto) {
    await this.findOneAdmin(announcementId);
    return this.prisma.harvest_announcements.update({
      where: { id: announcementId },
      data: {
        ...(dto.status != null
          ? {
              status: dto.status,
              ...(dto.status === 'CONFIRMED' ? { confirmedAt: new Date() } : {}),
            }
          : {}),
        ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes } : {}),
        ...(dto.actualDate ? { actualDate: new Date(dto.actualDate) } : {}),
        ...(dto.actualQuantity != null ? { actualQuantity: dto.actualQuantity } : {}),
        ...(dto.plannedLoadingStart !== undefined
          ? { plannedLoadingStart: dto.plannedLoadingStart ? new Date(dto.plannedLoadingStart) : null }
          : {}),
        ...(dto.plannedLoadingEnd !== undefined
          ? { plannedLoadingEnd: dto.plannedLoadingEnd ? new Date(dto.plannedLoadingEnd) : null }
          : {}),
        ...(dto.loadQuantityKg !== undefined ? { loadQuantityKg: dto.loadQuantityKg } : {}),
        ...(dto.marketChannel !== undefined ? { marketChannel: dto.marketChannel } : {}),
        ...(dto.qualityGrade !== undefined ? { qualityGrade: dto.qualityGrade } : {}),
        ...(dto.sortingSpec !== undefined ? { sortingSpec: dto.sortingSpec } : {}),
        updatedAt: new Date(),
      },
      include: {
        parcel: { include: { estates: { include: { users: true } } } },
        user: true,
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
    const estateName = announcement.parcel?.estates?.name || 'Unknown estate';
    const typeLabel = announcement.announcementType === 'HARVEST' ? 'Harvest plan' : 'Planting plan';
    const ch = announcement.marketChannel
      ? ` · ${String(announcement.marketChannel).toLowerCase()}`
      : '';

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'ACTION_REQUIRED',
        title: `New ${typeLabel.toLowerCase()}: ${estateName}`,
        message: `${farmerName}: ${announcement.cropType} — ${new Date(announcement.estimatedDate).toLocaleDateString()}${announcement.estimatedQuantity ? ` (~${announcement.estimatedQuantity} kg)` : ''}${ch}. Review in Harvest plans.`,
        actionUrl: `/admin/harvest-announcements?id=${announcement.id}`,
      });
    }
  }
}
