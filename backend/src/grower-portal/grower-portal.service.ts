import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
import {
  IngestMobileCertificatePhotoDto,
  IngestMobileCostDto,
  IngestMobileProductDto,
} from './dto/mobile-ingest.dto';

@Injectable()
export class GrowerPortalService {
  private readonly logger = new Logger(GrowerPortalService.name);

  constructor(
    private prisma: PrismaService,
    private qrService: QrService,
  ) {}

  /**
   * Web Mission Tracker and mobile pass either internal batch PK or public batch number (BATCH-…).
   * Missions are keyed by batches.id only — resolve to avoid empty lists / DB errors.
   */
  private async resolveBatchIdForGrower(
    ref: string,
    growerId: string,
  ): Promise<string | null> {
    const r = ref?.trim();
    if (!r) {
      return null;
    }
    try {
      const owned = { estates: { ownerId: growerId } } as const;
      const byId = await this.prisma.batches.findFirst({
        where: { id: r, ...owned },
        select: { id: true },
      });
      if (byId) {
        return byId.id;
      }
      const byCode = await this.prisma.batches.findFirst({
        where: { batchId: r, ...owned },
        select: { id: true },
      });
      return byCode?.id ?? null;
    } catch (e) {
      this.logger.warn(`resolveBatchIdForGrower failed for ref=${r}: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Prisma/Decimal/Date in nested objects can make Express JSON encoding throw → global filter returns 500.
   * This runs the same path as the HTTP response and normalizes to plain JSON types.
   */
  private toApiJson<T>(value: T): T {
    try {
      return JSON.parse(
        JSON.stringify(value, (_k, v) => {
          if (v == null) return v;
          if (typeof v === 'bigint') return v.toString();
          if (v instanceof Date) return v.toISOString();
          if (typeof v === 'object') {
            const ctor = (v as object).constructor?.name;
            const dec = v as { toNumber?: () => number; toString?: () => string };
            if (ctor === 'Decimal' && typeof dec.toNumber === 'function') {
              try {
                return dec.toNumber();
              } catch {
                return dec.toString?.() ?? null;
              }
            }
          }
          return v;
        }),
      ) as T;
    } catch (e) {
      this.logger.error(`toApiJson: ${(e as Error).message}`);
      return (Array.isArray(value) ? ([] as unknown) : (null as unknown)) as T;
    }
  }

  /** Core query + DTO build (may throw) */
  private async getMissionTrackerRows(growerId: string, batchId?: string): Promise<any[]> {
    const where: Prisma.missionsWhereInput = { growerId };
    if (batchId?.trim()) {
      const internalId = await this.resolveBatchIdForGrower(batchId, growerId);
      if (!internalId) {
        return [];
      }
      where.batchId = internalId;
    }

    const fullInclude: Prisma.missionsInclude = {
      batches: {
        include: {
          distributor_arrivals: {
            orderBy: { arrivalTime: 'desc' },
            take: 1,
          },
        },
      },
      users_missions_logisticsPartnerIdTousers: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      vehicles: { select: { vehicleNumber: true } },
      border_wait_times: {
        orderBy: { borderArrivalTime: 'desc' },
        take: 32,
      },
    };

    let missions: Awaited<ReturnType<typeof this.prisma.missions.findMany>>;
    try {
      try {
        missions = await this.prisma.missions.findMany({
          where,
          include: fullInclude,
          orderBy: { createdAt: 'desc' },
        });
      } catch (err) {
        this.logger.warn(
          `getMissionTracker full include failed, retrying minimal: ${(err as Error).message}`,
        );
        missions = await this.prisma.missions.findMany({
          where,
          include: {
            batches: {
              select: {
                batchId: true,
                productName: true,
                quantity: true,
                unit: true,
              },
            },
            users_missions_logisticsPartnerIdTousers: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            vehicles: { select: { vehicleNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch (err) {
      this.logger.error(
        `getMissionTracker findMany for grower ${growerId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return [];
    }

    return missions.map((mission) => {
      try {
        return this.buildMissionTrackerData(mission);
      } catch (err) {
        this.logger.error(
          `buildMissionTrackerData failed for mission ${(mission as { id: string }).id}: ${(err as Error).message}`,
          (err as Error).stack,
        );
        return this.buildMissionTrackerDataFallback(mission);
      }
    });
  }

  /**
   * Get grower's mission tracker data
   */
  async getMissionTracker(growerId: string, batchId?: string) {
    if (!growerId?.trim()) {
      throw new BadRequestException('Invalid session');
    }
    const gid = growerId.trim();
    try {
      const rows = await this.getMissionTrackerRows(gid, batchId);
      return this.toApiJson(rows);
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      this.logger.error(
        `getMissionTracker: ${(e as Error).message}`,
        (e as Error).stack,
      );
      return [];
    }
  }

  /**
   * Safe row when milestone logic cannot run on a mission (avoids 500 for the whole list)
   */
  private buildMissionTrackerDataFallback(mission: any) {
    const p = (v: string | null | undefined) => (v == null || v === '' ? '' : String(v).trim());
    const driver = mission.users_missions_logisticsPartnerIdTousers
      ? p(`${p(mission.users_missions_logisticsPartnerIdTousers.firstName)} ${p(
          mission.users_missions_logisticsPartnerIdTousers.lastName,
        )}`) || 'Not assigned'
      : 'Not assigned';
    return {
      missionId: mission.id,
      missionNumber: mission.missionNumber,
      batchId: mission.batches?.batchId ?? null,
      productName: mission.batches?.productName ?? '—',
      quantity:
        mission.batches?.quantity == null
          ? null
          : typeof mission.batches.quantity === 'number'
            ? mission.batches.quantity
            : Number(mission.batches.quantity),
      unit: mission.batches?.unit ?? null,
      status: mission.status,
      currentMilestone: '—',
      milestones: [],
      driver,
      vehicle: mission.vehicles?.vehicleNumber || 'Not assigned',
      requestedAt: mission.requestedAt,
      pickedUpAt: mission.pickedUpAt,
      completedAt: mission.completedAt,
      trackerPartial: true,
    };
  }

  /**
   * Get consumer feedback for a batch
   */
  async getConsumerFeedback(batchId: string, growerId: string) {
    const internalId = await this.resolveBatchIdForGrower(batchId, growerId);
    if (!internalId) {
      throw new NotFoundException(`Batch not found for your account`);
    }
    // Verify batch belongs to grower
    const batch = await this.prisma.batches.findUnique({
      where: { id: internalId },
      include: {
        estates: true,
        order_items: {
          include: {
            orders: {
              include: {
                users: true,
                ratings: {
                  where: {
                    ratingType: 'FARMER',
                    ratedUserId: growerId,
                  },
                  include: {
                    users_ratings_raterIdTousers: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    if (batch.estates.ownerId !== growerId) {
      throw new ForbiddenException('You can only view feedback for your own batches');
    }

    // Get all ratings for this batch
    const ratings = batch.order_items.flatMap((item) =>
      item.orders.ratings.map((rating) => ({
        id: rating.id,
        score: rating.score,
        comment: rating.comment,
        rater: rating.users_ratings_raterIdTousers,
        createdAt: rating.createdAt,
        orderNumber: item.orders.orderNumber,
      }))
    );

    // Calculate average rating
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

    // Check if batch has 5-star rating (excellence certificate)
    const hasExcellenceCertificate = ratings.length > 0 && ratings.every((r) => r.score === 5);

    return {
      batchId: batch.batchId,
      averageRating,
      totalRatings: ratings.length,
      ratings,
      hasExcellenceCertificate,
      certificate: hasExcellenceCertificate
        ? await this.generateExcellenceCertificate(internalId, batch.batchId, batch.estates.name)
        : null,
    };
  }

  /**
   * Get journey map data for a mission
   */
  async getJourneyMap(missionId: string, growerId: string) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: {
        batches: {
          include: {
            estates: true,
          },
        },
        location_logs: {
          orderBy: { timestamp: 'asc' },
        },
        border_wait_times: {
          orderBy: { borderArrivalTime: 'asc' },
        },
        temperature_logs: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!mission) {
      throw new NotFoundException(`Mission ${missionId} not found`);
    }

    if (mission.growerId !== growerId) {
      throw new ForbiddenException('You can only view your own missions');
    }

    // Build milestones
    const milestones = this.buildMilestones(mission);

    // Build route points (masked for privacy)
    const routePoints = this.buildRoutePoints(mission);

    // Calculate ETA
    const eta = this.calculateETA(mission);

    return {
      missionId: mission.missionNumber,
      batchId: mission.batches?.batchId,
      milestones,
      routePoints,
      eta,
      currentStatus: mission.status,
    };
  }

  /**
   * Get financial status for a batch
   */
  async getFinancialStatus(batchId: string, growerId: string) {
    const internalId = await this.resolveBatchIdForGrower(batchId, growerId);
    if (!internalId) {
      throw new NotFoundException(`Batch not found for your account`);
    }
    const batch = await this.prisma.batches.findUnique({
      where: { id: internalId },
      include: {
        estates: true,
        order_items: {
          include: {
            orders: {
              include: {
                payments: true,
                deliveries: true,
              },
            },
          },
        },
        missions: {
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    if (batch.estates.ownerId !== growerId) {
      throw new ForbiddenException('You can only view financial status for your own batches');
    }

    // Determine payment status based on delivery status
    const latestMission = batch.missions[0];
    const isDelivered = latestMission?.completedAt !== null;
    const isApproved = (batch as any).distributor_arrivals && (batch as any).distributor_arrivals.length > 0;

    let paymentStatus = 'PENDING';
    let paymentStatusMessage = 'Awaiting delivery';

    if (isDelivered && isApproved) {
      paymentStatus = 'PROCESSING';
      paymentStatusMessage = 'Delivered & Approved - Payment Processing';
    } else if (isDelivered) {
      paymentStatus = 'AWAITING_APPROVAL';
      paymentStatusMessage = 'Delivered - Awaiting Distributor Approval';
    }

    // Get payment details from orders
    const payments = batch.order_items
      .map((item) => item.orders.payments)
      .filter((p) => p !== null);

    const totalAmount = payments.reduce((sum, p) => sum + (p?.farmerAmount || 0), 0);
    const paidAmount = payments
      .filter((p) => p?.status === 'RELEASED')
      .reduce((sum, p) => sum + (p?.farmerAmount || 0), 0);

    return {
      batchId: batch.batchId,
      paymentStatus,
      paymentStatusMessage,
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
      isDelivered,
      isApproved,
      deliveredAt: latestMission?.completedAt,
    };
  }

  /**
   * Build mission tracker data
   */
  private buildMissionTrackerData(mission: any) {
    const milestones = this.buildMilestones(mission);
    const currentMilestone = milestones.find((m) => m.isCurrent) || milestones[0];

    const qty = mission.batches?.quantity;
    return {
      missionId: mission.id,
      missionNumber: mission.missionNumber,
      batchId: mission.batches?.batchId,
      productName: mission.batches?.productName,
      quantity: qty == null || typeof qty === 'number' ? qty : Number(qty),
      unit: mission.batches?.unit,
      status: mission.status,
      currentMilestone: currentMilestone?.name,
      milestones,
      driver: mission.users_missions_logisticsPartnerIdTousers
        ? [mission.users_missions_logisticsPartnerIdTousers.firstName, mission.users_missions_logisticsPartnerIdTousers.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Not assigned'
        : 'Not assigned',
      vehicle: mission.vehicles?.vehicleNumber || 'Not assigned',
      requestedAt: mission.requestedAt,
      pickedUpAt: mission.pickedUpAt,
      completedAt: mission.completedAt,
    };
  }

  /**
   * Build milestones for journey map
   */
  private buildMilestones(mission: any) {
    const milestones: any[] = [];

    // Left Farm
    if (mission.pickedUpAt) {
      milestones.push({
        name: 'Left Farm',
        status: 'completed',
        timestamp: mission.pickedUpAt,
        location: mission.pickupLocation,
        isCurrent: false,
      });
    } else if (mission.status === 'IN_PROGRESS' || mission.status === 'ACCEPTED') {
      milestones.push({
        name: 'Left Farm',
        status: 'in_progress',
        timestamp: null,
        location: mission.pickupLocation,
        isCurrent: true,
      });
    } else {
      milestones.push({
        name: 'Left Farm',
        status: 'pending',
        timestamp: null,
        location: mission.pickupLocation,
        isCurrent: false,
      });
    }

    // At Border
    if (mission.border_wait_times && mission.border_wait_times.length > 0) {
      const latestBorder = mission.border_wait_times[0];
      milestones.push({
        name: 'At Border',
        status: 'completed',
        timestamp: latestBorder.borderArrivalTime,
        location: {
          name: latestBorder.borderName || 'Border Crossing',
        },
        isCurrent: false,
      });
    } else if (mission.status === 'IN_TRANSIT') {
      milestones.push({
        name: 'At Border',
        status: 'in_progress',
        timestamp: null,
        location: null,
        isCurrent: true,
      });
    } else {
      milestones.push({
        name: 'At Border',
        status: 'pending',
        timestamp: null,
        location: null,
        isCurrent: false,
      });
    }

    // In Transit (EU)
    if (mission.status === 'IN_TRANSIT' && mission.border_wait_times?.length > 0) {
      milestones.push({
        name: 'In Transit (EU)',
        status: 'in_progress',
        timestamp: mission.border_wait_times[0].borderExitTime,
        location: null,
        isCurrent: true,
      });
    } else if (mission.status === 'COMPLETED') {
      milestones.push({
        name: 'In Transit (EU)',
        status: 'completed',
        timestamp: mission.completedAt,
        location: null,
        isCurrent: false,
      });
    } else {
      milestones.push({
        name: 'In Transit (EU)',
        status: 'pending',
        timestamp: null,
        location: null,
        isCurrent: false,
      });
    }

    // Arrived at Distributor
    if ((mission.batches?.distributor_arrivals?.length ?? 0) > 0) {
      const arrival = mission.batches.distributor_arrivals[0];
      milestones.push({
        name: 'Arrived at Distributor',
        status: 'completed',
        timestamp: arrival.arrivalTime,
        location: {
          name: arrival.hubName,
        },
        isCurrent: false,
      });
    } else if (mission.status === 'COMPLETED') {
      milestones.push({
        name: 'Arrived at Distributor',
        status: 'in_progress',
        timestamp: mission.completedAt,
        location: null,
        isCurrent: true,
      });
    } else {
      milestones.push({
        name: 'Arrived at Distributor',
        status: 'pending',
        timestamp: null,
        location: null,
        isCurrent: false,
      });
    }

    return milestones;
  }

  /**
   * Build route points (masked for privacy)
   */
  private buildRoutePoints(mission: any) {
    // Only show this grower's batch location, mask others
    const points: any[] = [];

    if (mission.location_logs && mission.location_logs.length > 0) {
      // Show key points only (not every single GPS update)
      const keyPoints = [
        mission.location_logs[0], // First point
        ...mission.location_logs.filter((log: any, index: number) => {
          // Include points at significant intervals or milestones
          return index % 10 === 0 || index === mission.location_logs.length - 1;
        }),
      ];

      points.push(...keyPoints.map((log: any) => ({
        lat: log.latitude,
        lng: log.longitude,
        timestamp: log.timestamp,
        address: log.address,
      })));
    }

    return points;
  }

  /**
   * Calculate ETA
   */
  private calculateETA(mission: any): string | null {
    if (!mission.batches?.distributor_arrivals || mission.batches.distributor_arrivals.length === 0) {
      // Estimate based on current status
      if (mission.status === 'IN_TRANSIT') {
        const lastLocation = mission.location_logs[mission.location_logs.length - 1];
        if (lastLocation) {
          // Rough estimate: assume average speed and remaining distance
          const hoursRemaining = 12; // Placeholder - would calculate based on route
          return `Estimated arrival in ${hoursRemaining} hours`;
        }
      }
      return null;
    }

    const arrival = mission.batches.distributor_arrivals[0];
    const now = new Date();
    const arrivalTime = new Date(arrival.arrivalTime);

    if (arrivalTime > now) {
      const hoursRemaining = Math.ceil((arrivalTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      return `Your fruit will be in ${arrival.hubName} in ${hoursRemaining} hours`;
    }

    return `Arrived at ${arrival.hubName}`;
  }

  /**
   * Checklist of certification / compliance document slots for the grower app.
   * Static list for now; can be moved to configuration or per-grower policy later.
   */
  getRequiredCertifications() {
    return [
      { id: 'cert_1', title: 'Training – good agricultural practice', description: 'Completed training' },
      { id: 'cert_2', title: 'Production certificate', description: 'Proof of production method' },
      { id: 'cert_3', title: 'GlobalG.A.P. (if applicable)', description: 'Optional' },
    ];
  }

  /**
   * Idempotent inbox for mobile offline sync (product / cost / cert metadata).
   * Same clientReference re-sent returns 200 with duplicate: true (mobile can drop local copy).
   */
  async ingestMobileProduct(userId: string, dto: IngestMobileProductDto) {
    return this.upsertMobileIngest(userId, 'PRODUCT', dto.clientReference, { ...dto } as object);
  }

  async ingestMobileCost(userId: string, dto: IngestMobileCostDto) {
    return this.upsertMobileIngest(userId, 'COST', dto.clientReference, { ...dto } as object);
  }

  async ingestMobileCertificatePhoto(userId: string, dto: IngestMobileCertificatePhotoDto) {
    return this.upsertMobileIngest(userId, 'CERT_PHOTO', dto.clientReference, { ...dto } as object);
  }

  private async upsertMobileIngest(
    userId: string,
    kind: 'PRODUCT' | 'COST' | 'CERT_PHOTO',
    clientReference: string,
    payload: object,
  ) {
    const where = { userId_kind_clientReference: { userId, kind, clientReference } };
    const existing = await this.prisma.grower_mobile_ingest.findUnique({ where });
    if (existing) {
      return { id: existing.id, duplicate: true, kind };
    }
    const created = await this.prisma.grower_mobile_ingest.create({
      data: { userId, kind, clientReference, payload },
    });
    return { id: created.id, duplicate: false, kind };
  }

  /**
   * Generate excellence certificate
   */
  private async generateExcellenceCertificate(
    batchId: string,
    batchNumber: string,
    estateName: string,
  ) {
    // Generate certificate data (in production, would generate PDF)
    return {
      certificateId: `CERT-${batchNumber}-${Date.now()}`,
      batchNumber,
      estateName,
      issuedAt: new Date(),
      type: 'EXCELLENCE',
      shareableUrl: `/certificates/${batchId}/excellence`,
      socialMediaText: `🏆 Bio Vera Certificate of Excellence! Our ${estateName} batch received a perfect 5-star rating! #BioVera #Quality #Freshness`,
    };
  }
}
