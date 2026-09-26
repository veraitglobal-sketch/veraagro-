import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TreatmentLogsService } from '../treatment-logs/treatment-logs.service';
import { MissionsService } from '../missions/missions.service';
import * as crypto from 'crypto';
import {
  computePlantingProgress,
  getPlantingProgressIntervalDays,
} from './planting-progress.util';
import { CreateHarvestAnnouncementDto } from './dto/create-harvest-announcement.dto';

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

  /** Exposed on API responses — never include passwordHash or other secrets. */
  private static readonly growerUserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    roles: true,
  } as const;

  /** JSON-safe primitives for POST /harvest-announcements body (avoid Express 500 on odd Prisma driver values). */
  private static jsonIso(d: unknown): string | null {
    if (d instanceof Date && Number.isFinite(d.getTime())) return d.toISOString();
    return null;
  }

  private static jsonNum(n: unknown): number | null {
    if (n == null) return null;
    const x = Number(n);
    return Number.isFinite(x) ? x : null;
  }

  private buildSafeHarvestCreateResponse(announcement: {
    id: string;
    sourcePlantingId?: string | null;
    parcelId: string;
    userId: string;
    announcementType: string;
    cropType: string;
    estimatedDate: Date;
    estimatedQuantity: unknown;
    plannedLoadingStart: Date | null;
    plannedLoadingEnd: Date | null;
    loadQuantityKg: unknown;
    marketChannel: string | null;
    qualityGrade: string | null;
    sortingSpec: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      roles: unknown;
    } | null;
    parcel: {
      id: string;
      cropType: string | null;
      estateId: string;
      approvedAt: Date | null;
      estates: {
        id: string;
        name: string;
        status: unknown;
        ownerId: string;
      } | null;
    } | null;
  }): Record<string, unknown> {
    const safeUser = announcement.user
      ? {
          id: announcement.user.id,
          firstName: announcement.user.firstName,
          lastName: announcement.user.lastName,
          email: announcement.user.email ?? null,
          phone: announcement.user.phone ?? null,
          roles: Array.isArray(announcement.user.roles)
            ? announcement.user.roles.map((r) => String(r))
            : [],
        }
      : null;
    const pe = announcement.parcel?.estates;
    const safeParcelEstate = pe
      ? {
          id: pe.id,
          name: pe.name,
          status: String(pe.status),
          ownerId: pe.ownerId,
        }
      : undefined;

    const estIso = HarvestAnnouncementsService.jsonIso(announcement.estimatedDate);

    return {
      id: announcement.id,
      sourcePlantingId: announcement.sourcePlantingId ?? null,
      parcelId: announcement.parcelId,
      userId: announcement.userId,
      announcementType: announcement.announcementType,
      cropType: announcement.cropType,
      estimatedDate: estIso ?? new Date(0).toISOString(),
      estimatedQuantity: HarvestAnnouncementsService.jsonNum(announcement.estimatedQuantity),
      plannedLoadingStart: HarvestAnnouncementsService.jsonIso(announcement.plannedLoadingStart),
      plannedLoadingEnd: HarvestAnnouncementsService.jsonIso(announcement.plannedLoadingEnd),
      loadQuantityKg: HarvestAnnouncementsService.jsonNum(announcement.loadQuantityKg),
      marketChannel: announcement.marketChannel,
      qualityGrade: announcement.qualityGrade,
      sortingSpec: announcement.sortingSpec,
      notes: announcement.notes,
      status: announcement.status,
      createdAt:
        HarvestAnnouncementsService.jsonIso(announcement.createdAt) ?? new Date(0).toISOString(),
      updatedAt:
        HarvestAnnouncementsService.jsonIso(announcement.updatedAt) ?? new Date(0).toISOString(),
      mission: null as null,
      parcel: announcement.parcel
        ? {
            id: announcement.parcel.id,
            cropType: announcement.parcel.cropType,
            estateId: announcement.parcel.estateId,
            approvedAt: HarvestAnnouncementsService.jsonIso(announcement.parcel.approvedAt),
            estates: safeParcelEstate,
          }
        : null,
      user: safeUser,
    };
  }

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
    const parcelReadyForHarvest =
      parcel.approvedAt != null ||
      parcel.status === 'ACTIVE' ||
      parcel.status === 'CERTIFIED';
    if (dto.announcementType === 'HARVEST' && !parcelReadyForHarvest) {
      throw new ForbiddenException(
        'Harvest plans require an administrator-approved parcel.',
      );
    }

    if (dto.announcementType !== 'HARVEST' && dto.announcementType !== 'PLANTING') {
      throw new BadRequestException('Invalid announcement type.');
    }
    if (!dto.cropType?.trim()) {
      throw new BadRequestException('Crop / product type is required.');
    }

    if (dto.sourcePlantingId) {
      const planting = await this.prisma.harvest_announcements.findFirst({
        where: { id: dto.sourcePlantingId, userId, parcelId: dto.parcelId,
          announcementType: 'PLANTING', status: { notIn: ['CANCELLED', 'REJECTED'] } },
      });
      if (dto.announcementType !== 'HARVEST' || !planting) {
        throw new BadRequestException('Selected planting must belong to this grower and parcel.');
      }
    }

    const normalizedEstimatedQty =
      dto.estimatedQuantity === null || dto.estimatedQuantity === undefined
        ? undefined
        : Number(dto.estimatedQuantity);
    if (
      normalizedEstimatedQty !== undefined &&
      !Number.isFinite(normalizedEstimatedQty)
    ) {
      throw new BadRequestException('Invalid estimated quantity.');
    }
    const normalizedLoadQty =
      dto.loadQuantityKg === null || dto.loadQuantityKg === undefined
        ? undefined
        : Number(dto.loadQuantityKg);
    if (normalizedLoadQty !== undefined && !Number.isFinite(normalizedLoadQty)) {
      throw new BadRequestException('Invalid load quantity (kg).');
    }
    if (
      dto.announcementType === 'HARVEST' &&
      (normalizedEstimatedQty === undefined || normalizedEstimatedQty <= 0)
    ) {
      throw new BadRequestException('Estimated harvest quantity (kg) is required.');
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
          'Harvest is already registered for this parcel. Do not submit again. Next: open Request transport (Missions) to book pickup, or check Mission Tracker.',
        );
      }
    }

    const harvestDate = new Date(dto.estimatedDate);
    if (Number.isNaN(harvestDate.getTime())) {
      throw new BadRequestException(
        dto.announcementType === 'HARVEST'
          ? 'Invalid planned harvest date.'
          : 'Invalid planned date.',
      );
    }

    // PHI applies to planned harvest only — planting / "expected date" is not a harvest date
    if (dto.announcementType === 'HARVEST') {
      let earliestHarvest: Date | null = null;
      let reason: string | undefined;
      try {
        const phi = await this.treatmentLogsService.getEarliestHarvestDate(dto.parcelId);
        earliestHarvest = phi.date;
        reason = phi.reason;
      } catch (e) {
        const errText = e instanceof Error ? e.message : String(e);
        const prismaCode =
          e && typeof e === 'object' && 'code' in e ? String((e as { code?: string }).code) : '';
        this.logger.error(
          `getEarliestHarvestDate failed parcelId=${dto.parcelId} prismaCode=${prismaCode} err=${errText}`,
          e instanceof Error ? e.stack : undefined,
        );
        throw new BadRequestException(
          'Could not verify chemical withdrawal period (PHI). Try again or contact support.',
        );
      }
      if (earliestHarvest && harvestDate < earliestHarvest) {
        throw new BadRequestException(
          `Harvest blocked: ${reason || 'Pre-harvest interval'}. Earliest harvest date: ${earliestHarvest.toISOString().split('T')[0]}`,
        );
      }
    }

    const toValidDate = (iso: string | undefined, label: string): Date | undefined => {
      if (!iso?.trim()) return undefined;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException(`Invalid date: ${label}`);
      }
      return d;
    };

    // 3. Create announcement
    let announcement;
    try {
      announcement = await this.prisma.harvest_announcements.create({
        data: {
          id: crypto.randomUUID(),
          parcelId: dto.parcelId,
          userId,
          sourcePlantingId: dto.sourcePlantingId || null,
          announcementType: dto.announcementType,
          cropType: dto.cropType.trim(),
          estimatedDate: harvestDate,
          estimatedQuantity: normalizedEstimatedQty,
          plannedLoadingStart: toValidDate(dto.plannedLoadingStart, 'planned loading start'),
          plannedLoadingEnd: toValidDate(dto.plannedLoadingEnd, 'planned loading end'),
          loadQuantityKg: normalizedLoadQty ?? undefined,
          marketChannel: dto.marketChannel?.trim() || undefined,
          qualityGrade: dto.qualityGrade?.trim() || undefined,
          sortingSpec: dto.sortingSpec?.trim() || undefined,
          notes: dto.notes?.trim() || undefined,
          status: 'PENDING',
          updatedAt: new Date(),
        },
        include: {
          parcel: {
            select: {
              id: true,
              cropType: true,
              estateId: true,
              approvedAt: true,
              estates: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  ownerId: true,
                },
              },
            },
          },
          user: { select: HarvestAnnouncementsService.growerUserSelect },
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2003') {
        throw new BadRequestException(
          'Could not save this plan: parcel was removed or your session does not match the farm. Open My fields, refresh, and try again.',
        );
        }
        this.logger.error(
          `harvest_announcements.create Prisma ${e.code}: ${e.message} meta=${JSON.stringify(e.meta ?? {})}`,
        );
        throw new BadRequestException(
          'Could not save this plan. Please refresh the page and try again. If it keeps happening, contact support.',
        );
      }
      if (e instanceof Prisma.PrismaClientValidationError) {
        this.logger.error(`harvest_announcements.create validation: ${e.message}`);
        throw new BadRequestException('Invalid plan data. Check the form and try again.');
      }
      this.logger.error(
        `harvest_announcements.create unexpected: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw new BadRequestException(
        'Could not save this plan. Please try again or contact support.',
      );
    }

    // 4. Notify admins (async, non-blocking)
    this.notifyAdmins(announcement).catch((err) => {
      console.error('Error notifying admins:', err);
    });

    let transportMission: { id: string; missionNumber: string; status: string } | null = null;
    // 5. HARVEST plan → open a logistics mission (tura) so partners see pickup in missions list
    if (dto.announcementType === 'HARVEST') {
      try {
        transportMission = await this.missionsService.createMissionFromHarvestAnnouncement(announcement.id, userId);
      } catch (err) {
        this.logger.error(
          `Could not create logistics mission for harvest announcement ${announcement.id}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }

    try {
      return { ...this.buildSafeHarvestCreateResponse(announcement),
        mission: transportMission ? { id: transportMission.id, missionNumber: transportMission.missionNumber, status: transportMission.status } : null,
        transportStatus: dto.announcementType === 'HARVEST' ? (transportMission ? 'CREATED' : 'RETRY_REQUIRED') : null,
      };
    } catch (serializeErr) {
      this.logger.error(
        `harvest create: response serialization failed for ${announcement.id}: ${
          serializeErr instanceof Error ? serializeErr.message : String(serializeErr)
        }`,
        serializeErr instanceof Error ? serializeErr.stack : undefined,
      );
      return {
        id: announcement.id,
        parcelId: announcement.parcelId,
        userId: announcement.userId,
        announcementType: announcement.announcementType,
        status: announcement.status,
        mission: transportMission ? { id: transportMission.id, missionNumber: transportMission.missionNumber, status: transportMission.status } : null,
        transportStatus: dto.announcementType === 'HARVEST' ? (transportMission ? 'CREATED' : 'RETRY_REQUIRED') : null,
      };
    }
  }

  async retryTransport(userId: string, announcementId: string) {
    const mission = await this.missionsService.createMissionFromHarvestAnnouncement(announcementId, userId);
    return { id: mission.id, missionNumber: mission.missionNumber, status: mission.status };
  }

  /**
   * All harvest/planting plans for farmland this account owns (`estates.ownerId`),
   * not only rows where `harvest_announcements.userId` matches.
   *
   * Rationale: mobile/web parity, legacy rows, and avoiding “empty app” when
   * the row exists in DB under a mismatched creator id while the parcel is still theirs.
   */
  async getFarmerAnnouncements(userId: string) {
    const list = await this.prisma.harvest_announcements.findMany({
      where: {
        parcel: {
          estates: {
            ownerId: userId,
          },
        },
      },
      include: {
        mission: { select: { id: true, missionNumber: true, status: true, batchId: true } },
        batches: { where: { harvestedByUserId: userId }, select: { id: true, batchId: true, status: true }, orderBy: { createdAt: 'desc' } },
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

    const plantingIds = list
      .filter(
        (a) =>
          a.announcementType === 'PLANTING' &&
          a.status !== 'CANCELLED' &&
          a.status !== 'COMPLETED',
      )
      .map((a) => a.id);

    const lastLogByPlan = new Map<string, Date>();
    if (plantingIds.length > 0) {
      try {
        const agg = await this.prisma.growth_logs.groupBy({
          by: ['harvestAnnouncementId'],
          where: {
            harvestAnnouncementId: { in: plantingIds },
          },
          _max: { networkTimestamp: true },
        });
        for (const row of agg) {
          const id = row.harvestAnnouncementId;
          const maxTs = row._max.networkTimestamp;
          if (id && maxTs) {
            lastLogByPlan.set(id, maxTs);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`growth_logs groupBy for planting progress failed (userId=${userId}): ${msg}`);
      }
    }

    const intervalDays = getPlantingProgressIntervalDays();
    const now = new Date();

    return list.map((a) => {
      const shouldTrack =
        a.announcementType === 'PLANTING' && a.status !== 'CANCELLED' && a.status !== 'COMPLETED';
      let plantingProgress: ReturnType<typeof computePlantingProgress> | null = null;
      if (shouldTrack && !Number.isNaN(a.createdAt.getTime())) {
        try {
          plantingProgress = computePlantingProgress(
            a.createdAt,
            lastLogByPlan.get(a.id) ?? null,
            now,
            intervalDays,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`computePlantingProgress failed for plan ${a.id}: ${msg}`);
        }
      }
      return { ...a, plantingProgress, transportStatus: a.announcementType === 'HARVEST' ? (a.mission ? 'CREATED' : 'RETRY_REQUIRED') : null };
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
        mission: { select: { id: true, missionNumber: true, status: true } },
        batches: { select: { id: true, batchId: true, status: true } },
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
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
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
        mission: { select: { id: true, missionNumber: true, status: true } },
      },
    });
    if (!a) {
      throw new NotFoundException('Announcement not found');
    }
    return a;
  }

  async adminDeletePlanting(adminId: string, announcementId: string, reason?: string) {
    const row = await this.findOneAdmin(announcementId);
    if (row.announcementType !== 'PLANTING') {
      throw new BadRequestException('Only planting plans (zasadi) can be removed here. Use status REJECTED for harvest plans.');
    }
    if (row.mission) {
      throw new BadRequestException('Cannot delete: a transport mission is linked to this plan.');
    }

    if (await this.prisma.harvest_announcements.count({ where: { sourcePlantingId: announcementId } })) {
      throw new BadRequestException('Cannot delete a planting with linked harvests; its history must remain available.');
    }
    await this.prisma.harvest_announcements.delete({ where: { id: announcementId } });

    try {
      await this.notificationsService.notifyGrowerPlantingRemoved({
        growerId: row.userId,
        cropType: row.cropType,
        reason,
      });
    } catch (e) {
      this.logger.warn(`notifyGrowerPlantingRemoved: ${e instanceof Error ? e.message : e}`);
    }

    return { ok: true, id: announcementId, deletedBy: adminId };
  }

  async adminUpdate(announcementId: string, dto: AdminUpdateHarvestAnnouncementDto) {
    await this.findOneAdmin(announcementId);
    return this.prisma.harvest_announcements.update({
      where: { id: announcementId },
      data: {
        ...(dto.status != null
          ? {
              status: dto.status,
              confirmedAt: dto.status === 'CONFIRMED' ? new Date() : null,
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
      try {
        await this.notificationsService.create({
          userId: admin.id,
          type: 'ACTION_REQUIRED',
          title: `New ${typeLabel.toLowerCase()}: ${estateName}`,
          message: `${farmerName}: ${announcement.cropType} — ${new Date(announcement.estimatedDate).toLocaleDateString()}${announcement.estimatedQuantity ? ` (~${announcement.estimatedQuantity} kg)` : ''}${ch}. Review in Harvest plans.`,
          actionUrl: `/admin/grower-control?tab=plans&id=${announcement.id}`,
        });
      } catch (e) {
        this.logger.warn(`notifyAdmins: failed for user ${admin.id}`, e);
      }
    }
  }
}
