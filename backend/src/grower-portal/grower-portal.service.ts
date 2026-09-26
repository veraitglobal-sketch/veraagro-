import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
import { getFarmerOwnerUserId } from '../orders/order-fulfillment.util';
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

  /** Product/qty for tracker: prefer packed batch, else buyer order linked on mission (`admin/from-order`). */
  private missionTrackerCommerceFields(mission: {
    batches?: {
      productName?: string | null;
      quantity?: unknown;
      unit?: string | null;
      batchId?: string | null;
    } | null;
    orders?: {
      id?: string;
      orderNumber?: string;
      productName?: string;
      quantity?: unknown;
      unit?: string | null;
      status?: string;
    } | null;
    loadInstructions?: string | null;
  }) {
    const batch = mission.batches;
    const order = mission.orders;
    const productName =
      (batch?.productName && String(batch.productName).trim()) ||
      (order?.productName && String(order.productName).trim()) ||
      '—';
    let quantity: number | null = null;
    if (batch?.quantity != null && batch.quantity !== '') {
      const n = typeof batch.quantity === 'number' ? batch.quantity : Number(batch.quantity);
      quantity = Number.isFinite(n) ? n : null;
    } else if (order?.quantity != null && order.quantity !== '') {
      const n = typeof order.quantity === 'number' ? order.quantity : Number(order.quantity);
      quantity = Number.isFinite(n) ? n : null;
    }
    const unit =
      (batch?.unit && String(batch.unit).trim()) ||
      (order?.unit && String(order.unit).trim()) ||
      null;
    const loadInstructions =
      typeof mission.loadInstructions === 'string' && mission.loadInstructions.trim()
        ? mission.loadInstructions.trim()
        : null;
    return {
      productName,
      quantity,
      unit,
      orderId: order?.id ?? null,
      orderNumber: order?.orderNumber ?? null,
      orderStatus: order?.status ?? null,
      loadInstructions,
    };
  }

  /** Grower-visible commerce fields plus linked buyer-order summary (operations often ties mission ↔ order — grower sees same status wording as portal). */
  private missionTrackerCommerceFieldsForGrower(mission: Parameters<
    GrowerPortalService['missionTrackerCommerceFields']
  >[0]) {
    const full = this.missionTrackerCommerceFields(mission);
    return {
      productName: full.productName,
      quantity: full.quantity,
      unit: full.unit,
      buyerOrderNumber: full.orderNumber,
      buyerOrderStatus: full.orderStatus,
      buyerOrderId: full.orderId,
    };
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
      logistics_handovers: {
        select: {
          id: true,
          timestamp: true,
          pickupDriverSnapshot: true,
          pickupBadgePhotoUrl: true,
          pickupDriverSignatureUrl: true,
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
      assigned_logistics_driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          photoUrl: true,
        },
      },
      vehicles: { select: { vehicleNumber: true, licensePlate: true, make: true, model: true, type: true } },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          productName: true,
          quantity: true,
          unit: true,
          status: true,
        },
      },
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
            assigned_logistics_driver: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                photoUrl: true,
              },
            },
            vehicles: { select: { vehicleNumber: true, licensePlate: true, make: true, model: true, type: true } },
            orders: {
              select: {
                id: true,
                orderNumber: true,
                productName: true,
                quantity: true,
                unit: true,
                status: true,
              },
            },
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
    const assigned = mission.assigned_logistics_driver;
    const pickupDriverPerson =
      assigned && !mission.logistics_handovers?.pickupDriverSnapshot
        ? {
            firstName: assigned.firstName,
            lastName: assigned.lastName,
            email: assigned.email ?? null,
            phone: assigned.phone ?? null,
            photoUrl: assigned.photoUrl ?? null,
          }
        : null;
    const h = mission.logistics_handovers;
    const pickupAtFarm = h?.pickupBadgePhotoUrl && h?.pickupDriverSignatureUrl && h?.pickupDriverSnapshot
      ? {
          recorded: true,
          recordedAt: h.timestamp ? new Date(h.timestamp).toISOString() : null,
          badgePhotoUrl: h.pickupBadgePhotoUrl ?? null,
          driverSignatureUrl: h.pickupDriverSignatureUrl ?? null,
        }
      : {
          recorded: false,
          recordedAt: null,
          badgePhotoUrl: null,
          driverSignatureUrl: null,
        };
    const commerce = this.missionTrackerCommerceFieldsForGrower(mission);
    return {
      missionId: mission.id,
      missionNumber: mission.missionNumber,
      batchId: mission.batches?.batchId ?? null,
      productName: commerce.productName,
      quantity: commerce.quantity,
      unit: commerce.unit,
      ...(commerce.buyerOrderNumber
        ? {
            buyerOrderNumber: commerce.buyerOrderNumber,
            buyerOrderStatus: commerce.buyerOrderStatus ?? null,
            buyerOrderId: commerce.buyerOrderId ?? null,
          }
        : {}),
      status: mission.status,
      currentMilestone: '—',
      milestones: [],
      driver,
      pickupDriverPerson,
      pickupAtFarm,
      vehicle: GrowerPortalService.formatMissionVehicleLabel(mission.vehicles),
      vehicleInfo: GrowerPortalService.missionVehicleInfo(mission.vehicles),
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
        logistics_handovers: { select: { id: true, timestamp: true } },
        batches: {
          include: {
            estates: true,
            distributor_arrivals: {
              orderBy: { arrivalTime: 'desc' },
              take: 1,
            },
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

    const milestones = this.applyGrowerMilestonePrivacy(this.buildMilestones(mission) as Array<Record<string, unknown>>);
    const routePoints: any[] = [];
    const eta = this.calculateETAGrower(mission);

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
        distributor_arrivals: {
          orderBy: { arrivalTime: 'desc' },
          take: 1,
        },
        order_items: {
          include: {
            orders: {
              include: {
                payments: true,
                deliveries: true,
                fulfilling_estate: true,
                estates: true,
              },
            },
          },
        },
        missions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            completedAt: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    if (batch.estates.ownerId !== growerId) {
      throw new ForbiddenException('You can only view financial status for your own batches');
    }

    // Physical delivery: farm leg (mission) and/or last-mile (order.deliveries) and/or hub receipt
    const missionsList = batch.missions ?? [];
    const latestMission = missionsList[0];
    const missionCompleted = missionsList.some((m) => m.completedAt != null);
    const orderDelivered = (batch.order_items ?? []).some((oi) => {
      const o = oi.orders;
      if (!o) return false;
      if (o.deliveries?.deliveredAt) return true;
      const s = o.status;
      return s === 'DELIVERED' || s === 'COMPLETED';
    });
    const isDelivered =
      missionCompleted || orderDelivered || batch.status === 'DELIVERED';
    const isApproved = Array.isArray((batch as { distributor_arrivals?: unknown[] }).distributor_arrivals)
      ? (batch as { distributor_arrivals: unknown[] }).distributor_arrivals.length > 0
      : false;

    const orderById = new Map<
      string,
      (typeof batch.order_items)[number]['orders']
    >();
    for (const oi of batch.order_items ?? []) {
      const o = oi.orders;
      if (o) {
        orderById.set(o.id, o);
      }
    }

    let totalAmount = 0;
    let paidAmount = 0;
    let inEscrowAmount = 0;
    let pendingOtherAmount = 0;
    let releasedCount = 0;
    let escrowCount = 0;
    let otherPaymentCount = 0;
    let paymentsConsidered = 0;

    for (const order of orderById.values()) {
      if (getFarmerOwnerUserId(order) !== growerId) {
        continue;
      }
      const p = order.payments;
      if (!p) {
        continue;
      }
      paymentsConsidered += 1;
      const fa = p.farmerAmount;
      totalAmount += fa;
      if (p.status === 'RELEASED') {
        paidAmount += fa;
        releasedCount += 1;
      } else if (p.status === 'IN_ESCROW') {
        inEscrowAmount += fa;
        escrowCount += 1;
      } else {
        pendingOtherAmount += fa;
        otherPaymentCount += 1;
      }
    }

    const pendingAmount = Math.max(0, totalAmount - paidAmount);

    let paymentStatus: string;
    let paymentStatusMessage: string;

    if (paymentsConsidered === 0 || totalAmount <= 0) {
      paymentStatus = 'NO_ESCROW';
      paymentStatusMessage =
        'No escrow payment recorded for this batch yet (same basis as dashboard order totals)';
      if (isDelivered && isApproved) {
        paymentStatus = 'DELIVERY_NO_ESCROW';
        paymentStatusMessage =
          'Marked delivered — waiting for buyer payment / escrow to appear for your share';
      } else if (isDelivered) {
        paymentStatus = 'DELIVERY_NO_ESCROW';
        paymentStatusMessage =
          'Delivery in progress — escrow will show your share when the order is funded';
      }
    } else if (
      releasedCount > 0 &&
      escrowCount === 0 &&
      otherPaymentCount === 0
    ) {
      paymentStatus = 'RELEASED';
      paymentStatusMessage = 'Payment released — funds should appear in your wallet';
    } else if (
      escrowCount > 0 &&
      releasedCount === 0 &&
      otherPaymentCount === 0
    ) {
      paymentStatus = 'IN_ESCROW';
      paymentStatusMessage =
        'Your share is in escrow until delivery checks complete and payment is released';
    } else if (releasedCount > 0 && (escrowCount > 0 || otherPaymentCount > 0)) {
      paymentStatus = 'PARTIAL_RELEASE';
      paymentStatusMessage =
        'Part of your payout has been released; the rest is still pending or in escrow';
    } else if (otherPaymentCount > 0) {
      paymentStatus = 'PENDING';
      paymentStatusMessage = 'Payment is being set up or not yet in escrow';
    } else {
      paymentStatus = 'PENDING';
      paymentStatusMessage = 'Awaiting payment status update';
    }

    return {
      batchId: batch.batchId,
      paymentStatus,
      paymentStatusMessage,
      totalAmount,
      paidAmount,
      inEscrowAmount,
      pendingOtherAmount,
      pendingAmount,
      isDelivered,
      isApproved,
      deliveredAt: (() => {
        const fromMission = missionsList.map((m) => m.completedAt).find((d) => d != null);
        if (fromMission) return fromMission;
        for (const oi of batch.order_items ?? []) {
          const d = oi.orders?.deliveries?.deliveredAt;
          if (d) return d;
        }
        return null;
      })(),
    };
  }

  /**
   * Build mission tracker data
   */
  private buildMissionTrackerData(mission: any) {
    const milestones = this.buildMilestones(mission);
    const currentMilestone = milestones.find((m) => m.isCurrent) || milestones[0];

    const commerce = this.missionTrackerCommerceFieldsForGrower(mission);
    const handover = mission.logistics_handovers;
    const snap = handover?.pickupDriverSnapshot as Record<string, unknown> | null | undefined;
    const assigned = mission.assigned_logistics_driver;

    let pickupDriverPerson: Record<string, unknown> | null = null;
    if (snap && typeof snap === 'object') {
      pickupDriverPerson = {
        firstName: snap.firstName,
        lastName: snap.lastName,
        email: snap.email ?? null,
        phone: snap.phone ?? null,
        photoUrl: snap.photoUrl ?? null,
      };
    } else if (assigned) {
      pickupDriverPerson = {
        firstName: assigned.firstName,
        lastName: assigned.lastName,
        email: assigned.email ?? null,
        phone: assigned.phone ?? null,
        photoUrl: assigned.photoUrl ?? null,
      };
    }

    const pickupAtFarm =
      handover?.pickupBadgePhotoUrl &&
      handover?.pickupDriverSignatureUrl &&
      handover?.pickupDriverSnapshot
        ? {
            recorded: true,
            recordedAt: handover.timestamp ? new Date(handover.timestamp).toISOString() : null,
            badgePhotoUrl: handover.pickupBadgePhotoUrl ?? null,
            driverSignatureUrl: handover.pickupDriverSignatureUrl ?? null,
          }
        : {
            recorded: false,
            recordedAt: null,
            badgePhotoUrl: null,
            driverSignatureUrl: null,
          };

    return {
      missionId: mission.id,
      missionNumber: mission.missionNumber,
      batchId: mission.batches?.batchId,
      productName: commerce.productName,
      quantity: commerce.quantity,
      unit: commerce.unit,
      ...(commerce.buyerOrderNumber
        ? {
            buyerOrderNumber: commerce.buyerOrderNumber,
            buyerOrderStatus: commerce.buyerOrderStatus ?? null,
            buyerOrderId: commerce.buyerOrderId ?? null,
          }
        : {}),
      status: mission.status,
      currentMilestone: currentMilestone?.name,
      milestones,
      driver: mission.users_missions_logisticsPartnerIdTousers
        ? [mission.users_missions_logisticsPartnerIdTousers.firstName, mission.users_missions_logisticsPartnerIdTousers.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Not assigned'
        : 'Not assigned',
      pickupDriverPerson,
      pickupAtFarm,
      vehicle: GrowerPortalService.formatMissionVehicleLabel(mission.vehicles),
      vehicleInfo: GrowerPortalService.missionVehicleInfo(mission.vehicles),
      requestedAt: mission.requestedAt,
      pickedUpAt: mission.pickedUpAt,
      completedAt: mission.completedAt,
    };
  }

  private static missionVehicleInfo(vehicle: unknown): {
    vehicleNumber: string | null;
    licensePlate: string | null;
    make: string | null;
    model: string | null;
    type: string | null;
  } | null {
    if (!vehicle || typeof vehicle !== 'object') return null;
    const v = vehicle as Record<string, unknown>;
    return {
      vehicleNumber: v.vehicleNumber != null ? String(v.vehicleNumber) : null,
      licensePlate: v.licensePlate != null ? String(v.licensePlate) : null,
      make: v.make != null ? String(v.make) : null,
      model: v.model != null ? String(v.model) : null,
      type: v.type != null ? String(v.type) : null,
    };
  }

  private static formatMissionVehicleLabel(vehicle: unknown): string {
    const info = GrowerPortalService.missionVehicleInfo(vehicle);
    if (!info) return 'Not assigned';
    const parts = [
      info.licensePlate,
      info.vehicleNumber,
      [info.make, info.model].filter(Boolean).join(' ').trim() || null,
    ].filter((p) => p && String(p).trim());
    return parts.length ? parts.join(' · ') : 'Not assigned';
  }

  /**
   * Build milestones for journey map
   */
  private buildMilestones(mission: any) {
    const milestones: any[] = [];
    const st = mission.status as string;

    /** Docs + cold check at farm (logistics handover) — must happen before READY_FOR_LOADING / pickup. */
    const handoverRecorded = mission.logistics_handovers != null;
    const handoverComplete =
      handoverRecorded ||
      st === 'READY_FOR_LOADING' ||
      st === 'PICKED_UP' ||
      st === 'IN_TRANSIT' ||
      st === 'COMPLETED' ||
      Boolean(mission.pickedUpAt);

    let handoverStatus: 'completed' | 'in_progress' | 'pending' = 'pending';
    if (handoverComplete) {
      handoverStatus = 'completed';
    } else if (['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(st)) {
      handoverStatus = 'in_progress';
    }

    milestones.push({
      name: 'Farm: truck & loading handover',
      status: handoverStatus,
      timestamp: mission.logistics_handovers?.timestamp ?? null,
      location: mission.pickupLocation,
      isCurrent: false,
    });

    // Leave farm (goods on truck)
    if (mission.pickedUpAt) {
      milestones.push({
        name: 'Left farm (departure)',
        status: 'completed',
        timestamp: mission.pickedUpAt,
        location: mission.pickupLocation,
        isCurrent: false,
      });
    } else if (st === 'READY_FOR_LOADING') {
      milestones.push({
        name: 'Left farm (departure)',
        status: 'in_progress',
        timestamp: null,
        location: mission.pickupLocation,
        isCurrent: false,
      });
    } else if (st === 'IN_PROGRESS' || st === 'ACCEPTED') {
      milestones.push({
        name: 'Left farm (departure)',
        status: 'in_progress',
        timestamp: null,
        location: mission.pickupLocation,
        isCurrent: false,
      });
    } else {
      milestones.push({
        name: 'Left farm (departure)',
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
        isCurrent: false,
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
        isCurrent: false,
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
        isCurrent: false,
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

    this.applyCurrentMilestone(milestones);
    return milestones;
  }

  /** Exactly one milestone marked current: first in_progress, else first pending, else last. */
  private applyCurrentMilestone(milestones: { status: string; isCurrent?: boolean }[]) {
    for (const m of milestones) {
      m.isCurrent = false;
    }
    const inProg = milestones.findIndex((m) => m.status === 'in_progress');
    if (inProg >= 0) {
      milestones[inProg].isCurrent = true;
      return;
    }
    const pend = milestones.findIndex((m) => m.status === 'pending');
    if (pend >= 0) {
      milestones[pend].isCurrent = true;
      return;
    }
    if (milestones.length > 0) {
      milestones[milestones.length - 1].isCurrent = true;
    }
  }

  /**
   * Strip place names from milestone payloads on the grower journey UI (hub / border / addresses).
   */
  private applyGrowerMilestonePrivacy(milestones: Array<Record<string, unknown>>) {
    return milestones.map((m) => ({
      ...m,
      location: null,
    }));
  }

  /** ETA text without destination or hub names */
  private calculateETAGrower(mission: {
    status?: string;
    location_logs?: Array<unknown>;
    batches?: { distributor_arrivals?: Array<{ arrivalTime: Date | string; hubName?: string | null }> } | null;
  }): string | null {
    const st = mission.status;
    const arrivals = mission.batches?.distributor_arrivals;
    if (!arrivals?.length) {
      if (st === 'IN_TRANSIT' && mission.location_logs?.length) {
        return 'Shipment is en route; arrival time is estimated in the coming hours.';
      }
      return null;
    }
    const arrival = arrivals[0];
    const now = new Date();
    const arrivalTime = new Date(arrival.arrivalTime);
    if (arrivalTime > now) {
      const hoursRemaining = Math.ceil((arrivalTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      return `Shipment is expected to reach the destination hub in about ${hoursRemaining} hours.`;
    }
    return 'Shipment has reached the destination hub.';
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
    if (dto.clientReference.startsWith('supplier-order:')) throw new BadRequestException('Reserved product reference');
    return this.upsertMobileIngest(userId, 'PRODUCT', dto.clientReference, { ...dto } as object);
  }

  async listMobileProducts(userId: string) {
    const rows = await this.prisma.grower_mobile_ingest.findMany({
      where: { userId, kind: 'PRODUCT' }, orderBy: { createdAt: 'desc' },
    });
    return rows.map(row => {
      const payload = (row.payload ?? {}) as Record<string, unknown>;
      return {
        id: row.clientReference,
        source: payload.source === 'qr' ? 'qr' : 'manual',
        qrCode: typeof payload.qrCode === 'string' ? payload.qrCode : undefined,
        sourceOrderId: typeof payload.sourceOrderId === 'string' ? payload.sourceOrderId : undefined,
        name: String(payload.name ?? ''), contents: String(payload.contents ?? ''),
        quantity: Number(payload.quantity ?? 0), unit: String(payload.unit ?? ''),
        parcelOrEstate: typeof payload.parcelOrEstate === 'string' ? payload.parcelOrEstate : undefined,
        timestamp: typeof payload.timestamp === 'string' && payload.timestamp.trim()
          ? payload.timestamp : row.createdAt.toISOString(),
        status: 'synced' as const,
      };
    });
  }

  async ingestMobileCost(userId: string, dto: IngestMobileCostDto) {
    return this.upsertMobileIngest(userId, 'COST', dto.clientReference, { ...dto } as object);
  }

  async listMobileCosts(userId: string) {
    const rows = await this.prisma.grower_mobile_ingest.findMany({
      where: { userId, kind: 'COST' },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => {
      const payload = (row.payload ?? {}) as Record<string, unknown>;
      return {
        id: row.clientReference,
        type: payload.type === 'product' ? 'product' : 'manual',
        productId: typeof payload.productId === 'string' ? payload.productId : undefined,
        label: String(payload.label ?? ''),
        amount: Number(payload.amount ?? 0),
        currency: typeof payload.currency === 'string' ? payload.currency : 'EUR',
        note: typeof payload.note === 'string' ? payload.note : undefined,
        estateId: typeof payload.estateId === 'string' ? payload.estateId : undefined,
        parcelId: typeof payload.parcelId === 'string' ? payload.parcelId : undefined,
        harvestAnnouncementId:
          typeof payload.harvestAnnouncementId === 'string'
            ? payload.harvestAnnouncementId
            : undefined,
        parcelLabel: typeof payload.parcelLabel === 'string' ? payload.parcelLabel : undefined,
        plantingLabel: typeof payload.plantingLabel === 'string' ? payload.plantingLabel : undefined,
        timestamp:
          typeof payload.timestamp === 'string' && payload.timestamp.trim()
            ? payload.timestamp
            : row.createdAt.toISOString(),
        status: 'synced' as const,
      };
    });
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
