import { syncMissionDelivery } from '../deliveries/mission-delivery';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  HttpException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMissionDto,
  AcceptMissionDto,
  AdminAssignMissionDto,
  AdminCreateMissionFromOrderDto,
} from './dto/mission.dto';
import { UpdateMissionLogisticsDriverDto } from '../logistics-partner/dto/update-mission-driver.dto';
import { FreshnessService } from '../freshness/freshness.service';
import { MaterialControlService } from '../material-control/material-control.service';
import * as crypto from 'crypto';
import { AuditTrailService } from '../audit-trail/audit-trail.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { saveWorkflowMission } from './save-workflow-mission';
import { BatchesService } from '../batches/batches.service';

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  constructor(
    private prisma: PrismaService,
    private freshnessService: FreshnessService,
    @Inject(forwardRef(() => MaterialControlService))
    private materialControlService: MaterialControlService,
    private auditTrailService: AuditTrailService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private notificationsService: NotificationsService,
    private batchesService: BatchesService,
  ) {}

  /**
   * Growers see pickup + cold chain only; destination and buyer-linked routing are admin / logistics.
   */
  private static scrubMissionForGrowerView(mission: Record<string, unknown>): Record<string, unknown> {
    const out = { ...mission };
    out.destinationAddress = null;
    out.destinationCity = null;
    out.loadInstructions = null;
    out.optimalRoute = null;
    if (out.batches != null && typeof out.batches === 'object') {
      out.batches = { ...(out.batches as Record<string, unknown>), distributor_arrivals: [] };
    }
    return out;
  }

  /** Driver, vehicle, and carrier labels for mobile/web (keeps Prisma relation keys). */
  private static enrichMissionLogisticsFields(mission: Record<string, unknown>): Record<string, unknown> {
    const out = { ...mission };
    const assigned = out.assigned_logistics_driver as Record<string, unknown> | null | undefined;
    const vehicle = out.vehicles as Record<string, unknown> | null | undefined;
    const lp = out.users_missions_logisticsPartnerIdTousers as Record<string, unknown> | null | undefined;

    const assignedDriver = assigned
      ? {
          id: assigned.id,
          firstName: assigned.firstName,
          lastName: assigned.lastName,
          phone: assigned.phone ?? null,
          email: assigned.email ?? null,
          photoUrl: assigned.photoUrl ?? null,
        }
      : null;

    const vehicleInfo = vehicle
      ? {
          id: vehicle.id,
          vehicleNumber: vehicle.vehicleNumber,
          licensePlate: vehicle.licensePlate,
          make: vehicle.make ?? null,
          model: vehicle.model ?? null,
          type: vehicle.type,
        }
      : null;

    const logisticsCompanyContact = lp
      ? {
          firstName: lp.firstName,
          lastName: lp.lastName,
          phone: lp.phone ?? null,
          email: lp.email ?? null,
          partnerCode: lp.partnerCode ?? null,
        }
      : null;

    const logisticsPartnerLabel = lp
      ? [lp.firstName, lp.lastName]
          .filter((v) => v != null && String(v).trim() !== '')
          .join(' ')
          .trim() ||
        (lp.partnerCode != null ? String(lp.partnerCode) : '') ||
        (lp.email != null ? String(lp.email) : '') ||
        null
      : null;

    out.assignedDriver = assignedDriver;
    out.vehicleInfo = vehicleInfo;
    out.logisticsCompanyContact = logisticsCompanyContact;
    out.logisticsPartnerLabel = logisticsPartnerLabel;
    out.hasAssignedPickupDriver = Boolean(assignedDriver?.firstName || assignedDriver?.lastName);
    out.driver = assignedDriver
      ? {
          firstName: assignedDriver.firstName,
          lastName: assignedDriver.lastName,
          phone: assignedDriver.phone,
        }
      : null;

    return out;
  }

  /** Grower-facing mission JSON with driver + vehicle blocks (Prisma relations stay for compatibility). */
  private static mapMissionForGrowerApi(mission: Record<string, unknown>): Record<string, unknown> {
    return MissionsService.enrichMissionLogisticsFields(MissionsService.scrubMissionForGrowerView(mission));
  }

  /** When false (default), new transport requests stay PENDING until an admin assigns a driver. */
  private shouldAutoAssignLogistics(): boolean {
    return process.env.MISSIONS_AUTO_ASSIGN_LOGISTICS_PARTNER === 'true';
  }

  /** Grower transport must pass ops compliance review before logistics (default on). */
  requireAdminTransportApproval(): boolean {
    return process.env.MISSIONS_SKIP_ADMIN_APPROVAL !== 'true';
  }

  /**
   * Duplicate `@prisma/client` copies break `instanceof PrismaClientKnownRequestError` and turn real DB errors into 500.
   * Detect known-request + validation errors by shape/name as well.
   */
  private static prismaKnownRequestCode(e: unknown): string | null {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return e.code;
    }
    if (typeof e === 'object' && e !== null) {
      const c = (e as { code?: unknown }).code;
      if (typeof c === 'string' && /^P[0-9]{4,5}$/.test(c)) {
        return c;
      }
    }
    return null;
  }

  private static prismaErrorMeta(e: unknown): { table?: string; column?: string } | undefined {
    if (typeof e === 'object' && e !== null && 'meta' in e) {
      const m = (e as { meta?: unknown }).meta;
      return m && typeof m === 'object' ? (m as { table?: string; column?: string }) : undefined;
    }
    return undefined;
  }

  private static isPrismaClientValidationError(e: unknown): boolean {
    if (e instanceof Prisma.PrismaClientValidationError) {
      return true;
    }
    return e instanceof Error && e.name === 'PrismaClientValidationError';
  }

  private static isHarvestAnnouncementsSchemaError(e: unknown): boolean {
    const code = MissionsService.prismaKnownRequestCode(e);
    if (code !== 'P2021' && code !== 'P2022') {
      return false;
    }
    const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
    const meta = MissionsService.prismaErrorMeta(e);
    const table = String(meta?.table ?? '').toLowerCase();
    return table.includes('harvest_announcements') || msg.includes('harvest_announcements');
  }

  private static harvestSchemaUnavailableException(e: unknown): ServiceUnavailableException {
    const code = MissionsService.prismaKnownRequestCode(e) ?? 'P2021';
    const meta = MissionsService.prismaErrorMeta(e);
    const target =
      meta?.column != null
        ? String(meta.column)
        : meta?.table != null
          ? `table ${String(meta.table)}`
          : 'harvest_announcements';
    return new ServiceUnavailableException(
      'The API database is missing a table or column that the app expects. ' +
        'This is not a problem with the pickup address you typed — the server must run the latest Prisma migrations. ' +
        `Prisma ${code} (missing table: ${target}). ` +
        'Administrator: in `backend/`, with production `DATABASE_URL`, run `npx prisma migrate deploy` and restart the API.',
    );
  }

  /**
   * JSON for POST /missions — explicit fields only. Spreading the full Prisma graph + JSON.stringify
   * has produced non-HttpException failures (response serialization) that surface as 500 "Internal server error".
   */
  private static missionCreateHttpPayload(mission: Record<string, unknown>): Record<string, unknown> {
    const iso = (v: unknown): unknown => {
      if (v instanceof Date && Number.isFinite(v.getTime())) return v.toISOString();
      return v ?? null;
    };
    const safeUser = (u: unknown): unknown => {
      if (!u || typeof u !== 'object') return u ?? null;
      const o = u as Record<string, unknown>;
      return {
        id: o.id,
        email: o.email,
        phone: o.phone,
        firstName: o.firstName,
        lastName: o.lastName,
        partnerCode: o.partnerCode,
        roles: o.roles,
        status: o.status,
        isVeraPartner: o.isVeraPartner,
        createdAt: iso(o.createdAt),
        updatedAt: iso(o.updatedAt),
      };
    };
    const safeBatch = (b: unknown): unknown => {
      if (!b || typeof b !== 'object') return b ?? null;
      const o = b as Record<string, unknown>;
      return {
        id: o.id,
        batchId: o.batchId,
        estateId: o.estateId,
        parcelId: o.parcelId,
        productName: o.productName,
        quantity: o.quantity,
        unit: o.unit,
        harvestDate: iso(o.harvestDate),
        status: o.status,
        qualityIssues: o.qualityIssues,
        locationHistory: o.locationHistory,
        createdAt: iso(o.createdAt),
        updatedAt: iso(o.updatedAt),
      };
    };
    const safeVehicle = (v: unknown): unknown => {
      if (!v || typeof v !== 'object') return v ?? null;
      const o = v as Record<string, unknown>;
      return {
        id: o.id,
        vehicleNumber: o.vehicleNumber,
        licensePlate: o.licensePlate,
        type: o.type,
        make: o.make,
        model: o.model,
        hasFrigo: o.hasFrigo,
        status: o.status,
        currentLocation: o.currentLocation,
        createdAt: iso(o.createdAt),
        updatedAt: iso(o.updatedAt),
      };
    };
    return {
      id: mission.id,
      missionNumber: mission.missionNumber,
      growerId: mission.growerId,
      batchId: mission.batchId ?? null,
      harvestAnnouncementId: mission.harvestAnnouncementId ?? null,
      pickupLocation: mission.pickupLocation,
      pickupAddress: mission.pickupAddress,
      destinationAddress: mission.destinationAddress ?? null,
      destinationCity: mission.destinationCity ?? null,
      loadInstructions: mission.loadInstructions ?? null,
      logisticsPartnerId: mission.logisticsPartnerId ?? null,
      assignedLogisticsDriverId: mission.assignedLogisticsDriverId ?? null,
      vehicleId: mission.vehicleId ?? null,
      optimalRoute: mission.optimalRoute ?? null,
      estimatedPickupTime: iso(mission.estimatedPickupTime),
      status: mission.status,
      requestedAt: iso(mission.requestedAt),
      assignedAt: iso(mission.assignedAt),
      acceptedAt: iso(mission.acceptedAt),
      pickedUpAt: iso(mission.pickedUpAt),
      completedAt: iso(mission.completedAt),
      createdAt: iso(mission.createdAt),
      updatedAt: iso(mission.updatedAt),
      users_missions_growerIdTousers: safeUser(mission.users_missions_growerIdTousers),
      users_missions_logisticsPartnerIdTousers: safeUser(mission.users_missions_logisticsPartnerIdTousers),
      batches: safeBatch(mission.batches),
      vehicles: safeVehicle(mission.vehicles),
    };
  }

  private async assertActiveLogisticsDriver(partnerId: string, driverId: string): Promise<void> {
    const d = await this.prisma.logistics_drivers.findFirst({
      where: { id: driverId, logisticsPartnerId: partnerId, isActive: true },
    });
    if (!d) {
      throw new BadRequestException('Invalid or inactive driver for your company');
    }
  }

  /**
   * When true, a batch with a parcel must have a CONFIRMED harvest (berba) plan before transport.
   * Admins confirm plans in /admin/harvest-plans. Set in production to match "ops order → then ship" flow.
   */
  private requireConfirmedHarvestPlan(): boolean {
    return process.env.MISSIONS_REQUIRE_CONFIRMED_HARVEST_PLAN === 'true';
  }

  /** Use the lot's persisted plan, never guess from the latest plan on its parcel. */
  private async resolveHarvestAnnouncementIdForCreate(
    growerId: string,
    batch: { id: string; parcelId: string | null; harvestAnnouncementId?: string | null } | null,
    dto: CreateMissionDto,
  ): Promise<string | null> {
    const explicit = dto.harvestAnnouncementId?.trim();
    if (batch?.harvestAnnouncementId && explicit && explicit !== batch.harvestAnnouncementId) {
      throw new BadRequestException('Harvest plan does not match the plan saved on this lot.');
    }
    const id = batch?.harvestAnnouncementId || explicit;
    if (!id) {
      if (batch?.parcelId && this.requireConfirmedHarvestPlan()) {
        throw new BadRequestException('This lot needs an explicitly linked, confirmed harvest plan before transport. Contact operations.');
      }
      return null;
    }
    const plan = await this.prisma.harvest_announcements.findFirst({
      where: { id, userId: growerId, announcementType: 'HARVEST' },
    });
    if (!plan || (batch && plan.parcelId !== batch.parcelId) || plan.status === 'CANCELLED') {
      throw new BadRequestException('Harvest plan is unavailable or does not match this lot.');
    }
    if (this.requireConfirmedHarvestPlan() && plan.status !== 'CONFIRMED') {
      throw new BadRequestException('Operations must confirm this harvest plan before transport.');
    }
    return id;
  }

  /** DB uses FARMER (default) and/or GROWER; both may create transport missions. */
  private isGrowerAccount(roles: string[]): boolean {
    const list = Array.isArray(roles) ? roles : [];
    return list.some((r) => r === 'GROWER' || r === 'FARMER');
  }

  /**
   * Coordinates must be finite numbers. Strips `address` from odd client payloads; prevents NaN/undefined in Prisma JSON.
   */
  private static sanitizePickupLocation(dto: CreateMissionDto): {
    lat: number;
    lng: number;
    address?: string;
  } {
    const lat = Number((dto as any).pickupLocation?.lat);
    const lng = Number((dto as any).pickupLocation?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException(
        'Pickup coordinates must be valid numbers (use GPS or enter latitude and longitude).',
      );
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new BadRequestException('Pickup coordinates are out of range.');
    }
    const rawAddr = (dto as any).pickupLocation?.address;
    const out: { lat: number; lng: number; address?: string } = { lat, lng };
    if (typeof rawAddr === 'string' && rawAddr.trim().length > 0) {
      out.address = rawAddr.trim().slice(0, 4000);
    }
    return out;
  }

  /**
   * Create mission when Grower clicks "Ready for Pickup"
   * Automatically finds nearest Logistics Partner
   */
  async createMission(growerId: string, dto: CreateMissionDto) {
    const pickupLocation = MissionsService.sanitizePickupLocation(dto);

    const grower = await this.prisma.users.findUnique({
      where: { id: growerId },
    });

    if (!grower || !this.isGrowerAccount(grower.roles as string[])) {
      throw new BadRequestException('Only growers (farmers) can create transport missions');
    }

    // Get batch if provided (internal UUID or public batchId e.g. BATCH-2026-0001)
    let batch = null;
    if (dto.batchId) {
      const ref = dto.batchId.trim();
      batch = await this.prisma.batches.findFirst({
        where: { OR: [{ id: ref }, { batchId: ref }] },
        include: {
          estates: true,
        },
      });
      if (!batch) {
        throw new NotFoundException(`Batch not found`);
      }

      // Compliance + ownership only (do not block on virtual crate stock — that was stopping valid requests).
      // Material deduction can be tied to pickup/handover later; see deductMaterialsOnShipment for admin/logistics flows.
      try {
        await this.materialControlService.validateBatchForShipment(batch.id, growerId, {
          requireCrateBalance: false,
        });
      } catch (error: unknown) {
        if (error instanceof ForbiddenException || error instanceof NotFoundException) {
          throw error;
        }
        if (error instanceof BadRequestException) {
          throw error;
        }
        const msg =
          error instanceof Error ? error.message : 'Batch validation failed. Cannot create shipment.';
        throw new BadRequestException(msg);
      }
    }

    let mission;
    try {
      const needsApproval = this.requireAdminTransportApproval();
      const autoAssign = !needsApproval && this.shouldAutoAssignLogistics();
      const logisticsPartner = autoAssign
        ? await this.findNearestLogisticsPartner(pickupLocation.lat, pickupLocation.lng)
        : null;

      const routeCalc = await this.calculateOptimalRoute(
        pickupLocation,
        logisticsPartner ? MissionsService.parseJsonLatLng(logisticsPartner.currentLocation) : null,
      );
      const optimalRoute = MissionsService.routeToJsonValue(routeCalc);
      const routeWithDest = {
        ...optimalRoute,
        destination: {
          address: dto.destinationAddress?.trim() || null,
          city: dto.destinationCity?.trim() || null,
        },
      } as Prisma.InputJsonValue;

      const linkedHarvestId = await this.resolveHarvestAnnouncementIdForCreate(
        growerId,
        batch ? { id: batch.id, parcelId: batch.parcelId, harvestAnnouncementId: batch.harvestAnnouncementId } : null,
        dto,
      );
      const missionNumber = await this.generateMissionNumber();
      const saved = await saveWorkflowMission(this.prisma, {
        id: crypto.randomUUID(),
        missionNumber,
        growerId,
        batchId: batch?.id ?? null,
        harvestAnnouncementId: linkedHarvestId,
        pickupLocation: pickupLocation as any,
        pickupAddress: (dto.pickupAddress || '').trim() || '—',
        destinationAddress: dto.destinationAddress?.trim() || null,
        destinationCity: dto.destinationCity?.trim() || null,
        loadInstructions: dto.loadInstructions?.trim() || null,
        optimalRoute: routeWithDest,
        estimatedPickupTime: MissionsService.toSafeDateTime(routeCalc.estimatedArrival),
        status: needsApproval
          ? 'AWAITING_APPROVAL'
          : logisticsPartner
            ? 'ASSIGNED'
            : 'PENDING',
        assignedAt: !needsApproval && logisticsPartner ? new Date() : null,
        logisticsPartnerId: needsApproval ? null : logisticsPartner?.id ?? null,
        vehicleId: needsApproval ? null : logisticsPartner?.vehicleId ?? null,
        updatedAt: new Date(),
      });
      mission = saved.mission;
      if (!saved.created && !saved.attached) return MissionsService.missionCreateHttpPayload(mission as unknown as Record<string, unknown>);
    } catch (e: unknown) {
      if (e instanceof HttpException) {
        throw e;
      }
      const code = MissionsService.prismaKnownRequestCode(e);
      this.logger.error(
        `missions.create failed: ${code ?? 'non-prisma'} ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
      if (code) {
        if (code === 'P2002') {
          const rawMeta =
            typeof e === 'object' && e !== null && 'meta' in e
              ? ((e as { meta?: { target?: string | string[] } }).meta ?? undefined)
              : undefined;
          const tg = rawMeta?.target;
          const tStr = Array.isArray(tg) ? tg.map(String).join(' ') : tg != null ? String(tg) : '';
          if (/harvestAnnouncementId/i.test(tStr)) {
            throw new BadRequestException(
              'A transport request is already linked to this harvest plan. Open Missions or finish the existing run first. If you need help, contact Vera support.',
            );
          }
          throw new BadRequestException(
            'Could not assign a unique mission number. Please try again in a few seconds.',
          );
        }
        if (code === 'P2003') {
          throw new BadRequestException(
            'Invalid link to batch, vehicle, or user. Check your selection and retry.',
          );
        }
        /** DB behind API deploy — missing table/column vs Prisma schema (e.g. `missions.harvestAnnouncementId`) */
        if (code === 'P2021' || code === 'P2022') {
          const msg = e instanceof Error ? e.message : String(e);
          const meta = MissionsService.prismaErrorMeta(e);
          this.logger.error(
            `DB schema out of date (${code}): ${msg} meta=${JSON.stringify(meta ?? e)}`,
          );
          if (MissionsService.isHarvestAnnouncementsSchemaError(e)) {
            throw MissionsService.harvestSchemaUnavailableException(e);
          }
          const target =
            meta?.column != null
              ? String(meta.column)
              : meta?.table != null
                ? `table ${String(meta.table)}`
                : 'unknown (see server logs for meta)';
          throw new ServiceUnavailableException(
            'The API database is missing a table or column that the app expects. ' +
              'This is not a problem with the pickup address you typed — the server must run the latest Prisma migrations. ' +
              `Prisma ${code} (${code === 'P2022' ? 'missing column' : 'missing table'}: ${target}). ` +
              'Administrator: in `backend/`, with production `DATABASE_URL`, run `npx prisma migrate deploy` and restart the API.',
          );
        }
        // Any other Prisma client error: show code for support
        throw new BadRequestException(
          `Could not save the transport request (database ${code}). Try again, or contact support and mention this code.`,
        );
      }
      if (MissionsService.isPrismaClientValidationError(e)) {
        const msg = e instanceof Error ? e.message.replace(/\r?\n/g, ' ') : String(e);
        throw new BadRequestException(
          `Could not save the transport request (invalid data). ${msg.slice(0, 600)}`,
        );
      }
      {
        const name = e instanceof Error ? e.name : '';
        if (
          e instanceof Prisma.PrismaClientInitializationError ||
          e instanceof Prisma.PrismaClientRustPanicError ||
          name === 'PrismaClientInitializationError' ||
          name === 'PrismaClientRustPanicError'
        ) {
          throw new ServiceUnavailableException(
            'The database is temporarily unavailable. Please try again in a moment.',
          );
        }
      }
      throw new BadRequestException(
        'Could not save the transport request. Please try again, or contact support if the problem continues.',
      );
    }

    // If batch exists, create freshness tracker (idempotent; duplicate batchId must not break mission)
    if (batch) {
      try {
        await this.freshnessService.createFreshnessTracker(batch.id, batch.productName);
      } catch (e) {
        this.logger.warn(
          `Freshness tracker skipped for batch ${batch.id}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    try {
      await this.auditTrailService.createAuditTrail({
        eventType: 'STATUS_CHANGE',
        entityType: 'Mission',
        entityId: mission.id,
        performedByUserId: growerId,
        newValue: { status: mission.status, missionNumber: mission.missionNumber },
        location: { lat: pickupLocation.lat, lng: pickupLocation.lng },
      });
    } catch (e) {
      this.logger.warn(
        `Audit trail failed for mission ${mission.id}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Real-time notification to grower
    try {
      await this.notificationsGateway.notifyMissionUpdate(growerId, mission);
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }

    if (
      mission.status === 'AWAITING_APPROVAL' ||
      (mission.status === 'PENDING' && !mission.logisticsPartnerId)
    ) {
      try {
        const g = mission.users_missions_growerIdTousers;
        const growerLabel = g
          ? `${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Grower'
          : 'Grower';
        await this.notificationsService.notifyAdminsForNewTransportRequest({
          missionNumber: mission.missionNumber,
          growerLabel,
          destinationCity: mission.destinationCity,
          missionId: mission.id,
          awaitingApproval: mission.status === 'AWAITING_APPROVAL',
        });
      } catch (e) {
        this.logger.warn(
          `notifyAdminsForNewTransportRequest failed: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    try {
      return MissionsService.missionCreateHttpPayload(mission as unknown as Record<string, unknown>);
    } catch (ser: unknown) {
      this.logger.error(
        `missionCreateHttpPayload serialization failed (${mission?.id ?? '?'})`,
        ser instanceof Error ? ser.stack : String(ser),
      );
      return {
        id: mission.id,
        missionNumber: mission.missionNumber,
        growerId: mission.growerId,
        batchId: mission.batchId ?? null,
        harvestAnnouncementId: mission.harvestAnnouncementId ?? null,
        pickupLocation: mission.pickupLocation,
        pickupAddress: mission.pickupAddress,
        optimalRoute: mission.optimalRoute ?? null,
        status: mission.status,
        logisticsPartnerId: mission.logisticsPartnerId ?? null,
        vehicleId: mission.vehicleId ?? null,
        createdAt:
          mission.createdAt instanceof Date ? mission.createdAt.toISOString() : mission.createdAt,
        updatedAt:
          mission.updatedAt instanceof Date ? mission.updatedAt.toISOString() : mission.updatedAt,
      } as Record<string, unknown>;
    }
  }

  /**
   * Find nearest available logistics partner with frigo vehicle
   */
  private async findNearestLogisticsPartner(
    pickupLat: number,
    pickupLng: number,
  ) {
    // Get all logistics partners with available vehicles
    const partners = await this.prisma.users.findMany({
      where: {
        roles: { has: 'LOGISTICS_PARTNER' },
        status: 'ACTIVE',
        vehicles: {
          some: {
            status: 'AVAILABLE',
            hasFrigo: true,
          },
        },
      },
      include: {
        vehicles: {
          where: {
            status: 'AVAILABLE',
            hasFrigo: true,
          },
          take: 1,
        },
      },
    });

    if (partners.length === 0) {
      return null;
    }

    // Calculate distance to each partner (simple Haversine formula)
    let nearestPartner = null;
    let minDistance = Infinity;

    for (const partner of partners) {
      const vehicle = partner.vehicles?.[0];
      const loc = vehicle?.currentLocation;
      const latLng = MissionsService.parseJsonLatLng(loc);
      if (latLng) {
        const distance = this.calculateDistance(pickupLat, pickupLng, latLng.lat, latLng.lng);
        if (!Number.isFinite(distance) || distance < 0) continue;
        if (distance < minDistance) {
          minDistance = distance;
          nearestPartner = {
            id: partner.id,
            vehicleId: vehicle.id,
            currentLocation: loc,
          };
        }
      }
    }

    return nearestPartner;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /** Tolerate Json stored as {lat,lng}, {latitude,longitude}, or a JSON string. */
  private static parseJsonLatLng(
    loc: unknown,
  ): { lat: number; lng: number } | null {
    if (loc == null) return null;
    let o: Record<string, unknown> | null = null;
    if (typeof loc === 'string') {
      try {
        o = JSON.parse(loc) as Record<string, unknown>;
      } catch {
        return null;
      }
    } else if (typeof loc === 'object') {
      o = loc as Record<string, unknown>;
    }
    if (!o) return null;
    const lat = Number((o as { lat?: unknown; latitude?: unknown }).lat ?? o.latitude);
    const lng = Number((o as { lng?: unknown; longitude?: unknown }).lng ?? o.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  /** Prisma DateTime: reject Invalid Date (Prisma/JSON drivers choke on it). */
  private static toSafeDateTime(d: Date | null | undefined): Date | null {
    if (!(d instanceof Date) || !Number.isFinite(d.getTime())) return null;
    return d;
  }

  /** Prisma Json columns must be JSON-serializable; Date in nested objects can break drivers. */
  private static routeToJsonValue(route: {
    distance: string | null;
    duration: string | null;
    waypoints: unknown[];
    estimatedArrival: Date | null;
  }): { distance: string | null; duration: string | null; waypoints: unknown[]; estimatedArrival: string | null } {
    const ar = MissionsService.toSafeDateTime(route.estimatedArrival);
    return {
      distance: route.distance,
      duration: route.duration,
      waypoints: MissionsService.sanitizeWaypointsForJson(route.waypoints),
      estimatedArrival: ar ? ar.toISOString() : null,
    };
  }

  private static sanitizeWaypointsForJson(waypoints: unknown[]): unknown[] {
    return (waypoints || []).map((w) => {
      if (w && typeof w === 'object' && 'lat' in w && 'lng' in w) {
        const o = w as { lat: unknown; lng: unknown };
        const la = Number(o.lat);
        const ln = Number(o.lng);
        if (Number.isFinite(la) && Number.isFinite(ln)) {
          return { lat: la, lng: ln };
        }
      }
      return w;
    });
  }

  /**
   * Calculate optimal route (simplified - in production use Maps API)
   */
  private async calculateOptimalRoute(
    pickupLocation: { lat: number; lng: number },
    vehicleLocation: { lat: number; lng: number } | null,
  ) {
    if (!vehicleLocation) {
      return {
        distance: null,
        duration: null,
        waypoints: [pickupLocation],
        estimatedArrival: null,
      };
    }

    if (
      !Number.isFinite(pickupLocation.lat) ||
      !Number.isFinite(pickupLocation.lng) ||
      !Number.isFinite(vehicleLocation.lat) ||
      !Number.isFinite(vehicleLocation.lng)
    ) {
      return {
        distance: null,
        duration: null,
        waypoints: [pickupLocation],
        estimatedArrival: null,
      };
    }

    // Simple calculation (in production, use Google Maps Directions API)
    const distance = this.calculateDistance(
      vehicleLocation.lat,
      vehicleLocation.lng,
      pickupLocation.lat,
      pickupLocation.lng,
    );
    if (!Number.isFinite(distance) || distance < 0) {
      return {
        distance: null,
        duration: null,
        waypoints: [vehicleLocation, pickupLocation],
        estimatedArrival: null,
      };
    }

    // Estimate duration (assuming average speed of 60 km/h)
    const durationMinutes = (distance / 60) * 60;
    const estimatedArrivalRaw = new Date(Date.now() + durationMinutes * 60 * 1000);
    const estimatedArrival = MissionsService.toSafeDateTime(estimatedArrivalRaw);

    return {
      distance: `${distance.toFixed(2)} km`,
      duration: `${Math.round(durationMinutes)} minutes`,
      waypoints: [vehicleLocation, pickupLocation],
      estimatedArrival,
    };
  }

  /**
   * Generate unique mission number (count + random suffix so concurrent creates rarely collide on @unique).
   */
  private async generateMissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.missions.count({
      where: {
        missionNumber: {
          startsWith: `MISSION-${year}-`,
        },
      },
    });
    const seq = String(count + 1).padStart(4, '0');
    const salt = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `MISSION-${year}-${seq}-${salt}`;
  }

  /** Geometric center of estate boundary for pickup when no batch GPS yet. */
  private static centroidFromEstatePolygon(polygonCoordinates: unknown): { lat: number; lng: number } | null {
    if (polygonCoordinates == null) return null;
    const points: { lat: number; lng: number }[] = [];
    if (Array.isArray(polygonCoordinates)) {
      for (const p of polygonCoordinates) {
        if (p && typeof p === 'object' && 'lat' in p && 'lng' in p) {
          const lat = (p as { lat: number }).lat;
          const lng = (p as { lng: number }).lng;
          if (typeof lat === 'number' && typeof lng === 'number') {
            points.push({ lat, lng });
          }
        } else if (Array.isArray(p) && p.length >= 2) {
          points.push({ lng: Number(p[0]), lat: Number(p[1]) });
        }
      }
    } else if (typeof polygonCoordinates === 'object' && polygonCoordinates !== null) {
      const o = polygonCoordinates as { coordinates?: number[][][] };
      const ring = o.coordinates?.[0];
      if (Array.isArray(ring)) {
        for (const pt of ring) {
          if (Array.isArray(pt) && pt.length >= 2) {
            points.push({ lng: pt[0], lat: pt[1] });
          }
        }
      }
    }
    if (points.length === 0) return null;
    const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    return { lat, lng };
  }

  /**
   * Creates a transport mission (visible to logistics) when a grower files a HARVEST plan
   * (očekivana berba / prozor utovara). No batch is required; batch links later at packing.
   */
  async createMissionFromHarvestAnnouncement(announcementId: string, growerId: string) {
    try {
      const ann = await this.prisma.harvest_announcements.findFirst({
        where: { id: announcementId, userId: growerId, announcementType: 'HARVEST' },
        include: { parcel: { include: { estates: true } } },
      });
      if (!ann) {
        throw new NotFoundException('Harvest plan not found or access denied');
      }

      const existing = await this.prisma.missions.findFirst({
        where: { harvestAnnouncementId: announcementId },
      });
      if (existing) {
        if (existing.growerId !== growerId) throw new ForbiddenException('Mission belongs to another grower');
        return existing;
      }

      const estate = ann.parcel?.estates;
      if (!estate) {
        this.logger.warn(`Harvest mission skipped: no estate on parcel for announcement ${announcementId}`);
        throw new BadRequestException('Harvest parcel has no estate. Correct the parcel before retrying transport.');
      }

      const pickup = MissionsService.centroidFromEstatePolygon(estate.polygonCoordinates);
      if (
        !pickup ||
        !Number.isFinite(pickup.lat) ||
        !Number.isFinite(pickup.lng)
      ) {
        this.logger.warn(
          `Harvest mission skipped: invalid pickup centroid for estate ${estate.id} (announcement ${announcementId})`,
        );
        throw new BadRequestException('The farm needs valid map coordinates before transport can be requested.');
      }

      const grower = await this.prisma.users.findUnique({ where: { id: growerId } });
      if (!grower || !this.isGrowerAccount(grower.roles as string[])) {
        throw new ForbiddenException('Only growers can request harvest transport');
      }

      if (ann.status === 'CANCELLED' || ann.status === 'COMPLETED') throw new BadRequestException('This harvest plan is closed.');
      const needsApproval = this.requireAdminTransportApproval();
      const autoAssign = !needsApproval && this.shouldAutoAssignLogistics();
      const logisticsPartner = autoAssign
        ? await this.findNearestLogisticsPartner(pickup.lat, pickup.lng)
        : null;
      const partnerLoc = logisticsPartner
        ? MissionsService.parseJsonLatLng(logisticsPartner.currentLocation)
        : null;
      const routeCalc = await this.calculateOptimalRoute(pickup, partnerLoc);
      const optimalRoute = MissionsService.routeToJsonValue(routeCalc);
      const destAddr = ann.notes?.trim() || null;
      const destCity = ann.marketChannel?.trim() || null;
      const optimalRouteWithDest = {
        ...optimalRoute,
        destination: { address: destAddr, city: destCity },
      } as Prisma.InputJsonValue;
      const missionNumber = await this.generateMissionNumber();
      const qty = ann.loadQuantityKg ?? ann.estimatedQuantity;
      const qtyNum = qty != null ? Number(qty) : NaN;
      const qtyLabel = Number.isFinite(qtyNum) ? ` (~${qtyNum.toFixed(0)} kg)` : '';
      const pickupAddress = `${estate.name} — ${ann.cropType}${qtyLabel} · plan berbe`;
      const plannedTime = ann.plannedLoadingStart ?? ann.estimatedDate;
      const estimatedPickupTime =
        MissionsService.toSafeDateTime(plannedTime) ??
        MissionsService.toSafeDateTime(routeCalc.estimatedArrival) ??
        new Date();

      const loadInstructions =
        Number.isFinite(qtyNum) && qtyNum > 0
          ? `Harvest plan: ~${qtyNum.toFixed(0)} kg ${ann.cropType} (confirm dock & time with buyer/hub)`
          : `Harvest plan: ${ann.cropType} (confirm quantity and drop-off)`;

      const saved = await saveWorkflowMission(this.prisma, {
        id: crypto.randomUUID(),
        missionNumber,
        growerId,
        batchId: null,
        harvestAnnouncementId: ann.id,
        pickupLocation: pickup as any,
        pickupAddress,
        destinationAddress: destAddr,
        destinationCity: destCity,
        loadInstructions,
        logisticsPartnerId: logisticsPartner?.id ?? null,
        vehicleId: logisticsPartner?.vehicleId ?? null,
        optimalRoute: optimalRouteWithDest,
        estimatedPickupTime,
        status: needsApproval ? 'AWAITING_APPROVAL' : logisticsPartner ? 'ASSIGNED' : 'PENDING',
        assignedAt: logisticsPartner ? new Date() : null,
        updatedAt: new Date(),
      });
      const mission = saved.mission;
      if (!saved.created) return mission;

      try {
        await this.auditTrailService.createAuditTrail({
          eventType: 'STATUS_CHANGE',
          entityType: 'Mission',
          entityId: mission.id,
          performedByUserId: growerId,
          newValue: {
            status: mission.status,
            missionNumber: mission.missionNumber,
            fromHarvestPlan: true,
            harvestAnnouncementId: ann.id,
          },
          location: pickup,
        });
      } catch (auditErr) {
        this.logger.warn(
          `createMissionFromHarvestAnnouncement: audit trail failed for mission ${mission.id}`,
          auditErr instanceof Error ? auditErr.stack : auditErr,
        );
      }

      try {
        await this.notificationsGateway.notifyMissionUpdate(growerId, mission);
      } catch (error) {
        this.logger.warn(`notifyMissionUpdate failed: ${(error as Error).message}`);
      }

      if (mission.status === 'AWAITING_APPROVAL' || (mission.status === 'PENDING' && !mission.logisticsPartnerId)) {
        try {
          const g = mission.users_missions_growerIdTousers;
          const growerLabel = g
            ? `${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Grower'
            : 'Grower';
          await this.notificationsService.notifyAdminsForNewTransportRequest({
            missionNumber: mission.missionNumber,
            growerLabel,
            destinationCity: mission.destinationCity,
            missionId: mission.id,
          });
        } catch (e) {
          this.logger.warn(
            `notifyAdminsForNewTransportRequest (harvest mission) failed: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }

      return mission;
    } catch (e) {
      this.logger.error(
        `createMissionFromHarvestAnnouncement failed (announcementId=${announcementId}, growerId=${growerId}): ${
          e instanceof Error ? e.message : String(e)
        }`,
        e instanceof Error ? e.stack : undefined,
      );
      throw e;
    }
  }

  /**
   * Accept mission by logistics partner
   */
  async acceptMission(logisticsPartnerId: string, missionId: string, dto: AcceptMissionDto) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      throw new NotFoundException(`Mission with ID ${missionId} not found`);
    }

    if (mission.logisticsPartnerId !== logisticsPartnerId) {
      throw new BadRequestException('Mission not assigned to this logistics partner');
    }

    if (mission.status !== 'ASSIGNED') {
      throw new BadRequestException(`Mission is not in ASSIGNED status`);
    }

    // Update vehicle status
    if (dto.vehicleId) {
      await this.prisma.vehicles.update({
        where: { id: dto.vehicleId },
        data: { status: 'IN_USE' },
      });
    }

    let nextDriverId: string | null | undefined;
    if (dto.logisticsDriverId !== undefined) {
      const raw = dto.logisticsDriverId?.trim() ?? '';
      nextDriverId = raw.length > 0 ? raw : null;
      if (nextDriverId) {
        await this.assertActiveLogisticsDriver(logisticsPartnerId, nextDriverId);
      }
    }

    const updated = await this.prisma.missions.update({
      where: { id: missionId },
      data: {
        status: 'ACCEPTED',
        vehicleId: dto.vehicleId || mission.vehicleId,
        acceptedAt: new Date(),
        ...(nextDriverId !== undefined ? { assignedLogisticsDriverId: nextDriverId } : {}),
      },
      include: {
        users_missions_growerIdTousers: true,
        users_missions_logisticsPartnerIdTousers: true,
        vehicles: true,
        batches: true,
        assigned_logistics_driver: true,
      },
    });

    // Real-time notification to grower
    try {
      await this.notificationsGateway.notifyMissionUpdate(mission.growerId, updated);
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }

    // Create audit trail
    await this.auditTrailService.createAuditTrail({
      eventType: 'STATUS_CHANGE',
      entityType: 'Mission',
      entityId: mission.id,
      performedByUserId: logisticsPartnerId,
      oldValue: { status: mission.status },
      newValue: { status: updated.status },
    });

    if (updated.orderId) {
      void this.notifyLinkedBuyerShipmentMilestone(
        updated.orderId,
        'Carrier accepted your pickup',
        'The assigned cold-chain partner has accepted this run. Your order timeline will update as the truck reaches the farm and loading checks complete.',
      );
    }

    return updated;
  }

  /** In-app inbox for buyer when a linked portal order (`missions.orderId`) exists — complements `shipmentTracking` on GET /orders/:id. */
  private async notifyLinkedBuyerShipmentMilestone(
    orderId: string | null | undefined,
    title: string,
    messageBody: string,
  ): Promise<void> {
    if (!orderId?.trim()) return;
    try {
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        select: { buyerId: true, orderNumber: true, status: true },
      });
      if (!order || order.status === 'CANCELLED' || order.status === 'REFUNDED') return;
      await this.notificationsService.create({
        userId: order.buyerId,
        type: 'SYSTEM',
        title,
        message: messageBody.includes(order.orderNumber) ? messageBody : `${order.orderNumber}: ${messageBody}`,
        actionUrl: `/buyer-portal/orders`,
      });
    } catch (e) {
      this.logger.warn(
        `notifyLinkedBuyerShipmentMilestone failed (orderId=${orderId}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  /**
   * Logistics: move mission forward after loading handover and while en route.
   * Keeps grower portal milestones (pickedUpAt, IN_TRANSIT, COMPLETED) in sync.
   */
  async advanceMissionLifecycle(
    logisticsPartnerId: string,
    missionId: string,
    step: 'DEPART_FARM' | 'START_TRANSIT' | 'COMPLETE_DELIVERY',
  ) {
    const { updated, mission, oldStatus, changed } = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM missions WHERE id = ${missionId} FOR UPDATE`;
      const mission = await tx.missions.findUnique({
        where: { id: missionId },
        include: { logistics_handovers: true },
      });

      if (!mission) {
        throw new NotFoundException(`Mission with ID ${missionId} not found`);
      }
      if (mission.logisticsPartnerId !== logisticsPartnerId) {
        throw new BadRequestException('Mission not assigned to this logistics partner');
      }
      if (mission.status === 'CANCELLED') {
        throw new BadRequestException('This mission is cancelled');
      }

      const reached = { READY_FOR_LOADING: 0, PICKED_UP: 1, IN_TRANSIT: 2, COMPLETED: 3 };
      const requested = { DEPART_FARM: 1, START_TRANSIT: 2, COMPLETE_DELIVERY: 3 }[step];
      if (reached[mission.status] >= requested) {
        const updated = await tx.missions.findUniqueOrThrow({ where: { id: missionId }, include: MissionsService.missionDetailInclude });
        return { updated, mission, oldStatus: mission.status, changed: false };
      }
      const now = new Date();
      const patch: Prisma.missionsUpdateInput = { updatedAt: now };

      if (step === 'DEPART_FARM') {
        if (mission.status !== 'READY_FOR_LOADING') {
          throw new BadRequestException(
            `Leave farm is only allowed when status is READY_FOR_LOADING (after loading handover). Current: ${mission.status}`,
          );
        }
        if (!mission.logistics_handovers) {
          throw new BadRequestException('Complete loading handover on this mission before marking departure.');
        }
        patch.pickedUpAt = now;
        patch.status = 'PICKED_UP';
      } else if (step === 'START_TRANSIT') {
        if (mission.status !== 'PICKED_UP') {
          throw new BadRequestException(
            `Start EU transit requires status PICKED_UP (truck left farm). Current: ${mission.status}`,
          );
        }
        patch.status = 'IN_TRANSIT';
      } else {
        if (mission.status !== 'IN_TRANSIT') {
          throw new BadRequestException(
            `Mark delivered requires status IN_TRANSIT. Current: ${mission.status}`,
          );
        }
        patch.status = 'COMPLETED';
        patch.completedAt = now;
      }

      await syncMissionDelivery(tx, mission, step, now);
      const oldStatus = mission.status;
      const updated = await tx.missions.update({
        where: { id: missionId },
        data: patch,
        include: {
          users_missions_growerIdTousers: true,
          users_missions_logisticsPartnerIdTousers: true,
          vehicles: true,
          batches: true,
          assigned_logistics_driver: true,
        },
      });

      await tx.audit_trails.create({ data: { id: crypto.randomUUID(), eventType: 'STATUS_CHANGE', entityType: 'Mission', entityId: mission.id,
        performedByUserId: logisticsPartnerId, oldValue: { status: oldStatus, step }, newValue: { status: updated.status, step } } });
      return { updated, mission, oldStatus, changed: true };
    });
    if (!changed) return updated;

    try {
      await this.notificationsGateway.notifyMissionUpdate(mission.growerId, updated);
    } catch (error) {
      this.logger.warn(`notifyMissionUpdate failed for lifecycle ${missionId}: ${(error as Error)?.message}`);
    }




    if (updated.orderId && step === 'COMPLETE_DELIVERY') {
      void this.notifyLinkedBuyerShipmentMilestone(
        updated.orderId,
        'Linehaul completed',
        'The long-distance logistics leg for your order is marked complete. Any further leg to depot or retailer will still follow in your shipment timeline.',
      );
    }

    if (step === 'COMPLETE_DELIVERY' && updated.batchId && updated.batches?.batchId) {
      try {
        await this.batchesService.markDelivered(updated.batches.batchId);
      } catch (e) {
        this.logger.warn(
          `markDelivered after mission complete failed (mission=${missionId}, batch=${updated.batches.batchId}): ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    return updated;
  }

  /**
   * Set or clear the delegated pickup driver on a mission (logistics company only).
   */
  async setMissionAssignedLogisticsDriver(
    logisticsPartnerId: string,
    missionId: string,
    dto: UpdateMissionLogisticsDriverDto,
  ) {
    if (!Object.prototype.hasOwnProperty.call(dto, 'logisticsDriverId')) {
      throw new BadRequestException('logisticsDriverId is required (UUID or null to clear)');
    }
    const mission = await this.prisma.missions.findUnique({ where: { id: missionId } });
    if (!mission) {
      throw new NotFoundException(`Mission with ID ${missionId} not found`);
    }
    if (mission.logisticsPartnerId !== logisticsPartnerId) {
      throw new BadRequestException('Mission not assigned to this logistics partner');
    }
    if (mission.status === 'COMPLETED' || mission.status === 'CANCELLED') {
      throw new BadRequestException('Cannot change pickup driver on a finished mission');
    }
    const v = dto.logisticsDriverId;
    const nextId =
      v == null || (typeof v === 'string' && v.trim() === '') ? null : String(v).trim();
    if (nextId) {
      await this.assertActiveLogisticsDriver(logisticsPartnerId, nextId);
    }
    const updated = await this.prisma.missions.update({
      where: { id: missionId },
      data: { assignedLogisticsDriverId: nextId, updatedAt: new Date() },
      include: {
        users_missions_growerIdTousers: true,
        users_missions_logisticsPartnerIdTousers: true,
        vehicles: true,
        batches: true,
        assigned_logistics_driver: true,
      },
    });
    // The grower needs to know who is coming to load (name + phone on the mission screen).
    const driver = updated.assigned_logistics_driver;
    if (nextId && nextId !== mission.assignedLogisticsDriverId && driver) {
      const name = [driver.firstName, driver.lastName].filter(Boolean).join(' ');
      try {
        await this.notificationsService.create({
          userId: mission.growerId,
          type: 'SYSTEM',
          title: 'Vozač dodeljen',
          message: `${mission.missionNumber ?? missionId.slice(0, 8)}: ${name}${driver.phone ? ` (${driver.phone})` : ''} dolazi po robu.`,
          actionUrl: `/grower/portal?missionId=${encodeURIComponent(missionId)}`,
        });
      } catch (error) {
        this.logger.warn(`driver-assigned notification failed for ${missionId}: ${(error as Error).message}`);
      }
    }
    return updated;
  }

  /**
   * Logistics: missions assigned to this partner, plus unclaimed pool (PENDING, no partner yet).
   * Grower: their missions only. Uses `role` from controller so FARMER/GROWER + LOGISTICS dual accounts
   * can use ?scope= to pick which list (see missions.controller).
   */
  async getMissionsForUser(userId: string, role: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { roles: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const r = (user.roles as string[]) || [];
      const isGrower = r.includes('GROWER') || r.includes('FARMER');
      const isLogisticsPartner = r.includes('LOGISTICS_PARTNER');

      const growerInclude = {
        users_missions_logisticsPartnerIdTousers: true,
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
        vehicles: true,
        batches: true,
        harvest_announcement: true,
      };
      const logisticsInclude = {
        users_missions_growerIdTousers: true,
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
        vehicles: true,
        batches: true,
        harvest_announcement: true,
      };
      const logisticsPoolWhere: Prisma.missionsWhereInput = {
        OR: [
          { logisticsPartnerId: userId },
          { status: 'PENDING', logisticsPartnerId: null },
        ],
      };

      // Trust `role` from controller (JWT + ?scope=); do not require DB `users.roles` to match —
      // stale role arrays caused empty lists for logistics/grower dashboards.
      if (role === 'LOGISTICS_PARTNER') {
        return this.prisma.missions.findMany({
          where: logisticsPoolWhere,
          include: logisticsInclude,
          orderBy: { createdAt: 'desc' },
        });
      }
      if (role === 'GROWER') {
        const rows = await this.prisma.missions.findMany({
          where: { growerId: userId },
          include: growerInclude,
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((m) => MissionsService.mapMissionForGrowerApi(m as Record<string, unknown>));
      }
      if (isGrower) {
        const rows = await this.prisma.missions.findMany({
          where: { growerId: userId },
          include: growerInclude,
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((m) => MissionsService.mapMissionForGrowerApi(m as Record<string, unknown>));
      }
      if (isLogisticsPartner) {
        return this.prisma.missions.findMany({
          where: logisticsPoolWhere,
          include: logisticsInclude,
          orderBy: { createdAt: 'desc' },
        });
      }
      return [];
    } catch (error) {
      console.error('Error in getMissionsForUser:', error);
      return [];
    }
  }

  private static readonly missionDetailInclude = {
    delivery: { select: { id: true, status: true, deliveryNumber: true, digital_handovers: { select: { id: true, status: true } } } },
    users_missions_growerIdTousers: true,
    users_missions_logisticsPartnerIdTousers: true,
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
    vehicles: true,
    batches: true,
    harvest_announcement: true,
  } as const;

  /**
   * One mission for GET /missions/:id (mobile, notifications). Access: grower owner, assigned LP,
   * any LP for unclaimed PENDING pool, or SUPER_ADMIN/ADMIN.
   */
  async getMissionForRequestingUser(requestUserId: string, missionId: string) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: MissionsService.missionDetailInclude,
    });
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: requestUserId },
      select: { roles: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = (user.roles as string[]) || [];
    if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) {
      return mission;
    }
    if (roles.includes('GROWER') || roles.includes('FARMER')) {
      if (mission.growerId === requestUserId) {
        return MissionsService.mapMissionForGrowerApi(mission as Record<string, unknown>);
      }
    }
    if (roles.includes('LOGISTICS_PARTNER')) {
      if (mission.logisticsPartnerId === requestUserId) {
        return MissionsService.enrichMissionLogisticsFields(mission as Record<string, unknown>);
      }
      if (mission.status === 'PENDING' && mission.logisticsPartnerId == null) {
        return MissionsService.enrichMissionLogisticsFields(mission as Record<string, unknown>);
      }
    }

    throw new ForbiddenException('You do not have access to this mission');
  }

  /**
   * Partner takes a still-unclaimed transport job (PENDING, no logistics partner). Then use acceptMission.
   */
  async claimUnassignedMission(logisticsPartnerId: string, missionId: string, dto: AcceptMissionDto) {
    const mission = await this.prisma.missions.findUnique({ where: { id: missionId } });
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    if (mission.status !== 'PENDING' || mission.logisticsPartnerId != null) {
      throw new BadRequestException(
        'This mission is already assigned or is not available to claim. Refresh the list.',
      );
    }
    let vehicle = null as { id: string } | null;
    if (dto.vehicleId) {
      vehicle = await this.prisma.vehicles.findFirst({
        where: {
          id: dto.vehicleId,
          logisticsPartnerId,
          status: 'AVAILABLE',
          hasFrigo: true,
        },
        select: { id: true },
      });
    }
    if (!vehicle) {
      vehicle = await this.prisma.vehicles.findFirst({
        where: { logisticsPartnerId, status: 'AVAILABLE', hasFrigo: true },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      });
    }
    if (!vehicle) {
      throw new BadRequestException('No available refrigerated vehicle. Add or free a vehicle first.');
    }
    let assignedLogisticsDriverId: string | undefined;
    if (dto.logisticsDriverId?.trim()) {
      await this.assertActiveLogisticsDriver(logisticsPartnerId, dto.logisticsDriverId.trim());
      assignedLogisticsDriverId = dto.logisticsDriverId.trim();
    }
    const updated = await this.prisma.missions.update({
      where: { id: missionId },
      data: {
        logisticsPartnerId,
        vehicleId: vehicle.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
        updatedAt: new Date(),
        ...(assignedLogisticsDriverId ? { assignedLogisticsDriverId } : {}),
      },
      include: {
        users_missions_growerIdTousers: true,
        users_missions_logisticsPartnerIdTousers: true,
        vehicles: true,
        batches: true,
        assigned_logistics_driver: true,
      },
    });

    try {
      await this.notificationsGateway.notifyMissionUpdate(mission.growerId, updated);
    } catch (e) {
      this.logger.warn(`claim mission: notify grower failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    try {
      await this.auditTrailService.createAuditTrail({
        eventType: 'STATUS_CHANGE',
        entityType: 'Mission',
        entityId: missionId,
        performedByUserId: logisticsPartnerId,
        oldValue: { status: mission.status, logisticsPartnerId: mission.logisticsPartnerId },
        newValue: {
          status: 'ASSIGNED',
          missionNumber: mission.missionNumber,
          logisticsPartnerId,
          claimedByPartner: true,
        },
      });
    } catch (e) {
      this.logger.warn(`claim mission: audit failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    return updated;
  }

  /** Logistics partners (for admin dispatch dropdown). */
  async listLogisticsPartnersForAdmin() {
    return this.prisma.users.findMany({
      where: { roles: { has: 'LOGISTICS_PARTNER' }, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        partnerCode: true,
        vehicles: {
          where: { status: 'AVAILABLE', hasFrigo: true },
          select: { id: true, licensePlate: true, vehicleNumber: true, status: true },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  /**
   * Operations approves grower transport after compliance check → PENDING (ready for driver assign / logistics pool).
   */
  async adminApproveTransport(adminId: string, missionId: string) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: { users_missions_growerIdTousers: true, batches: true },
    });
    if (!mission) throw new NotFoundException('Mission not found');
    if (mission.status !== 'AWAITING_APPROVAL') {
      throw new BadRequestException('Only missions awaiting approval can be approved here');
    }

    let logisticsPartner: { id: string; vehicleId: string | null } | null = null;
    if (this.shouldAutoAssignLogistics()) {
      const pickup = MissionsService.parseJsonLatLng(mission.pickupLocation);
      if (pickup) {
        logisticsPartner = await this.findNearestLogisticsPartner(pickup.lat, pickup.lng);
      }
    }

    const updated = await this.prisma.missions.update({
      where: { id: missionId },
      data: {
        status: logisticsPartner ? 'ASSIGNED' : 'PENDING',
        logisticsPartnerId: logisticsPartner?.id ?? null,
        vehicleId: logisticsPartner?.vehicleId ?? null,
        assignedAt: logisticsPartner ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        users_missions_growerIdTousers: true,
        users_missions_logisticsPartnerIdTousers: true,
        vehicles: true,
        batches: true,
      },
    });

    try {
      await this.notificationsService.notifyGrowerTransportDecision({
        growerId: mission.growerId,
        missionNumber: mission.missionNumber,
        approved: true,
        missionId: mission.id,
      });
    } catch (e) {
      this.logger.warn(`notifyGrowerTransportDecision approve: ${e instanceof Error ? e.message : e}`);
    }

    if (updated.status === 'PENDING' && !updated.logisticsPartnerId) {
      try {
        const g = updated.users_missions_growerIdTousers;
        const growerLabel = g
          ? `${g.firstName || ''} ${g.lastName || ''}`.trim() || 'Grower'
          : 'Grower';
        await this.notificationsService.notifyAdminsForNewTransportRequest({
          missionNumber: updated.missionNumber,
          growerLabel,
          destinationCity: updated.destinationCity,
          missionId: updated.id,
          awaitingApproval: false,
        });
      } catch (e) {
        this.logger.warn(`notifyAdmins after transport approve: ${e instanceof Error ? e.message : e}`);
      }
    }

    return MissionsService.missionCreateHttpPayload(updated as unknown as Record<string, unknown>);
  }

  async adminRejectTransport(adminId: string, missionId: string, reason?: string) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: { users_missions_growerIdTousers: true },
    });
    if (!mission) throw new NotFoundException('Mission not found');
    if (mission.status !== 'AWAITING_APPROVAL') {
      throw new BadRequestException('Only missions awaiting approval can be rejected here');
    }

    const updated = await this.prisma.missions.update({
      where: { id: missionId },
      data: {
        status: 'CANCELLED',
        // Release the harvest plan (unique per mission) so the grower can request a new run.
        harvestAnnouncementId: null,
        updatedAt: new Date(),
      },
      include: {
        users_missions_growerIdTousers: true,
        batches: true,
      },
    });

    try {
      await this.notificationsService.notifyGrowerTransportDecision({
        growerId: mission.growerId,
        missionNumber: mission.missionNumber,
        approved: false,
        reason,
        missionId: mission.id,
      });
    } catch (e) {
      this.logger.warn(`notifyGrowerTransportDecision reject: ${e instanceof Error ? e.message : e}`);
    }

    return MissionsService.missionCreateHttpPayload(updated as unknown as Record<string, unknown>);
  }

  /** Statuses in which the truck has not left the farm yet — routing can still change or the run can be cancelled. */
  private static readonly PRE_DEPARTURE_STATUSES = new Set([
    'AWAITING_APPROVAL',
    'PENDING',
    'ASSIGNED',
    'ACCEPTED',
    'READY_FOR_LOADING',
  ]);

  async adminSetDestination(
    adminId: string,
    missionId: string,
    dto: { destinationCity: string; destinationAddress: string },
  ) {
    const city = dto.destinationCity?.trim() ?? '';
    const address = dto.destinationAddress?.trim() ?? '';
    if (!city || !address) {
      throw new BadRequestException('Destination city and address are required');
    }
    const mission = await this.prisma.missions.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');
    if (mission.status === 'COMPLETED' || mission.status === 'CANCELLED') {
      throw new BadRequestException('Destination cannot be changed on a closed mission');
    }

    const route =
      mission.optimalRoute && typeof mission.optimalRoute === 'object' && !Array.isArray(mission.optimalRoute)
        ? (mission.optimalRoute as Record<string, unknown>)
        : {};
    const updated = await this.prisma.missions.update({
      where: { id: missionId },
      data: {
        destinationCity: city,
        destinationAddress: address,
        optimalRoute: { ...route, destination: { address, city } } as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
      include: { users_missions_growerIdTousers: true, batches: true },
    });

    if (mission.logisticsPartnerId) {
      try {
        await this.notificationsService.create({
          userId: mission.logisticsPartnerId,
          type: 'SYSTEM',
          title: 'Odredište ažurirano',
          message: `${mission.missionNumber}: isporuka — ${address}`,
          actionUrl: '/logistics-partner/missions',
        });
      } catch (e) {
        this.logger.warn(`adminSetDestination notify: ${e instanceof Error ? e.message : e}`);
      }
    }
    this.logger.log(`Admin ${adminId} set destination on ${mission.missionNumber}`);
    return MissionsService.missionCreateHttpPayload(updated as unknown as Record<string, unknown>);
  }

  async adminCancelMission(adminId: string, missionId: string, reason?: string) {
    const mission = await this.prisma.missions.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');
    if (!MissionsService.PRE_DEPARTURE_STATUSES.has(mission.status)) {
      throw new BadRequestException('Only missions that have not left the farm can be cancelled');
    }

    const updated = await this.prisma.missions.update({
      where: { id: missionId },
      // Release the harvest plan (unique per mission) so the grower can request a new run; the lot link stays for history.
      data: { status: 'CANCELLED', harvestAnnouncementId: null, updatedAt: new Date() },
      include: { users_missions_growerIdTousers: true, batches: true },
    });

    // Free the truck if no other open run still uses it.
    if (mission.vehicleId) {
      const stillBusy = await this.prisma.missions.count({
        where: {
          vehicleId: mission.vehicleId,
          id: { not: mission.id },
          status: { in: ['ASSIGNED', 'ACCEPTED', 'READY_FOR_LOADING', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT'] },
        },
      });
      if (stillBusy === 0) {
        await this.prisma.vehicles
          .update({ where: { id: mission.vehicleId }, data: { status: 'AVAILABLE' } })
          .catch((e) => this.logger.warn(`adminCancelMission vehicle: ${e instanceof Error ? e.message : e}`));
      }
    }

    const why = reason?.trim() ? ` Razlog: ${reason.trim()}` : '';
    try {
      await this.notificationsService.create({
        userId: mission.growerId,
        type: 'ALERT',
        title: 'Prevoz otkazan',
        message: `${mission.missionNumber}: operativa je otkazala ovaj prevoz.${why}`,
        actionUrl: `/(producer)/mission/${encodeURIComponent(mission.id)}`,
      });
      if (mission.logisticsPartnerId) {
        await this.notificationsService.create({
          userId: mission.logisticsPartnerId,
          type: 'ALERT',
          title: 'Prevoz otkazan',
          message: `${mission.missionNumber}: operativa je otkazala ovaj prevoz.${why}`,
          actionUrl: '/logistics-partner/missions',
        });
      }
    } catch (e) {
      this.logger.warn(`adminCancelMission notify: ${e instanceof Error ? e.message : e}`);
    }
    this.logger.log(`Admin ${adminId} cancelled ${mission.missionNumber}`);
    return MissionsService.missionCreateHttpPayload(updated as unknown as Record<string, unknown>);
  }

  /**
   * Assign a driver to a mission that is still PENDING with no logistics partner (operations dispatch).
   */
  async adminAssignLogistics(adminId: string, missionId: string, dto: AdminAssignMissionDto) {
    const mission = await this.prisma.missions.findUnique({ where: { id: missionId } });
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    if (mission.status === 'CANCELLED' || mission.status === 'COMPLETED') {
      throw new BadRequestException('Cannot assign a completed or cancelled mission');
    }
    if (mission.logisticsPartnerId != null) {
      throw new BadRequestException(
        'This mission already has a logistics partner. Use Command Control to reassign the driver.',
      );
    }
    if (mission.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING missions awaiting dispatch can be assigned here');
    }

    const partner = await this.prisma.users.findFirst({
      where: {
        id: dto.logisticsPartnerId,
        roles: { has: 'LOGISTICS_PARTNER' },
        status: 'ACTIVE',
      },
    });
    if (!partner) {
      throw new BadRequestException('Invalid or inactive logistics partner');
    }

    let vehicle: { id: string } | null = null;
    if (dto.vehicleId) {
      vehicle = await this.prisma.vehicles.findFirst({
        where: {
          id: dto.vehicleId,
          logisticsPartnerId: partner.id,
          status: 'AVAILABLE',
          hasFrigo: true,
        },
        select: { id: true },
      });
    }
    if (!vehicle) {
      vehicle = await this.prisma.vehicles.findFirst({
        where: { logisticsPartnerId: partner.id, status: 'AVAILABLE', hasFrigo: true },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      });
    }
    if (!vehicle) {
      throw new BadRequestException('No available refrigerated vehicle for this partner');
    }

    const updated = await this.prisma.missions.update({
      where: { id: missionId },
      data: {
        logisticsPartnerId: partner.id,
        vehicleId: vehicle.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        users_missions_growerIdTousers: true,
        users_missions_logisticsPartnerIdTousers: true,
        vehicles: true,
        batches: true,
        assigned_logistics_driver: true,
      },
    });

    const growerPayload = MissionsService.mapMissionForGrowerApi(updated as Record<string, unknown>);

    try {
      await this.notificationsService.create({
        userId: partner.id,
        type: 'ACTION_REQUIRED',
        title: 'New mission assigned',
        message: `Mission ${mission.missionNumber} was assigned to you by operations.`,
        actionUrl: '/logistics-partner/missions',
      });
    } catch (e) {
      this.logger.warn(`admin assign: notify driver failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      await this.notificationsGateway.notifyMissionUpdate(mission.growerId, growerPayload);
    } catch (e) {
      this.logger.warn(`admin assign: notify grower failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      await this.auditTrailService.createAuditTrail({
        eventType: 'STATUS_CHANGE',
        entityType: 'Mission',
        entityId: missionId,
        performedByUserId: adminId,
        newValue: {
          status: 'ASSIGNED',
          missionNumber: mission.missionNumber,
          logisticsPartnerId: partner.id,
          adminAssigned: true,
        },
      });
    } catch (e) {
      this.logger.warn(`admin assign: audit failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    return updated;
  }

  private static estatePolygonCentroid(polygonCoordinates: unknown): { lat: number; lng: number } | null {
    if (polygonCoordinates == null) return null;
    const raw = polygonCoordinates as { lat?: number; lng?: number; coordinates?: unknown[] };
    if (Number.isFinite(raw.lat) && Number.isFinite(raw.lng)) {
      return { lat: Number(raw.lat), lng: Number(raw.lng) };
    }
    let ring: unknown[] | null = null;
    if (Array.isArray(polygonCoordinates)) {
      const arr = polygonCoordinates as unknown[];
      const a0 = arr[0];
      if (arr.length > 0 && Array.isArray(a0) && a0.length > 0) {
        const a00 = a0[0] as unknown;
        if (Array.isArray(a00) && typeof (a00 as number[])[0] === 'number') {
          ring = a0 as unknown[];
        } else {
          ring = arr;
        }
      } else {
        ring = arr;
      }
    } else if (Array.isArray(raw.coordinates?.[0])) {
      ring = raw.coordinates[0] as unknown[];
    } else if (Array.isArray(raw.coordinates)) {
      ring = raw.coordinates as unknown[];
    }
    if (!Array.isArray(ring) || ring.length < 1) return null;
    let sumLat = 0;
    let sumLng = 0;
    let n = 0;
    for (const p of ring) {
      let lat: number | undefined;
      let lng: number | undefined;
      if (Array.isArray(p) && p.length >= 2) {
        lng = Number(p[0]);
        lat = Number(p[1]);
      } else if (p && typeof p === 'object') {
        const o = p as Record<string, unknown>;
        lat = Number(o.lat ?? o.latitude);
        lng = Number(o.lng ?? o.longitude);
      }
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        sumLat += lat as number;
        sumLng += lng as number;
        n++;
      }
    }
    if (!n) return null;
    return { lat: sumLat / n, lng: sumLng / n };
  }

  private static formatOrderDestination(deliveryAddress: unknown): { full: string; city: string } {
    if (deliveryAddress == null) return { full: '—', city: '—' };
    if (typeof deliveryAddress === 'string') {
      const s = deliveryAddress.trim();
      return { full: s.slice(0, 2000) || '—', city: '—' };
    }
    const o = deliveryAddress as Record<string, unknown>;
    const city = String(o.city ?? o.town ?? '').trim() || '—';
    const parts = [o.street, o.address, o.postalCode, o.city, o.country]
      .map((x) => (x == null ? '' : String(x).trim()))
      .filter(Boolean);
    // An empty address object ({} on pre-orders) must read as "not set", never as raw JSON on the carrier's screen.
    const full = parts.join(', ').slice(0, 2000);
    return { full: full || '—', city: city.slice(0, 200) };
  }

  /**
   * Operations links a buyer order to a fulfilling farm, then creates a PENDING grower mission with
   * clear prep instructions. Grower sees it in the app; logistics is assigned here or self-claimed later.
   */
  async adminCreateMissionFromOrder(adminUserId: string, dto: AdminCreateMissionFromOrderDto) {
    const order = await this.prisma.orders.findUnique({
      where: { id: dto.orderId },
      include: {
        fulfilling_estate: { select: { id: true, name: true, ownerId: true, polygonCoordinates: true } },
        users: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (!order.fulfillingEstateId || !order.fulfilling_estate) {
      throw new BadRequestException(
        'Set a fulfilling farm on the order first (Fulfilling farm in Orders admin), then create the mission.',
      );
    }

    const existingOpen = await this.prisma.missions.findFirst({
      where: {
        orderId: order.id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });
    if (existingOpen) {
      throw new BadRequestException(
        `An open mission already exists for this order (${existingOpen.missionNumber}). Use Missions to assign or cancel it first.`,
      );
    }

    const estate = order.fulfilling_estate;
    const growerId = estate.ownerId;
    const c = MissionsService.estatePolygonCentroid(estate.polygonCoordinates);
    if (!c) {
      throw new BadRequestException(
        'Could not derive pickup GPS from the estate map. Update the field boundary, or the grower can still use Request transport with manual GPS when the lot is ready.',
      );
    }
    const pickupLocation = { lat: c.lat, lng: c.lng, address: estate.name };
    const { full: destFull, city: destCity } = MissionsService.formatOrderDestination(
      order.deliveryAddress,
    );

    const buyerName =
      [order.users?.firstName, order.users?.lastName].filter(Boolean).join(' ').trim() || 'buyer';
    const ch = dto.channel
      ? `Channel: ${dto.channel} (industrial / retail prep).`
      : '';
    const kg = dto.targetKg != null && Number.isFinite(dto.targetKg) ? `Target for this run: ${dto.targetKg} kg.` : '';
    const op = (dto.opsNotes || '').trim();
    const loadLines = [
      `[From buyer order ${order.orderNumber} — product: ${order.productName}, line qty ${order.quantity} ${order.unit} — buyer: ${buyerName}]`,
      ch,
      kg,
      `Order line notes: ${(order.deliveryNotes || '—').slice(0, 1500)}`,
      op ? `Operativa: ${op}` : '',
    ]
      .filter((line) => line && String(line).trim().length > 0)
      .join('\n');

    const autoAssign = this.shouldAutoAssignLogistics();
    const logisticsPartner = autoAssign
      ? await this.findNearestLogisticsPartner(pickupLocation.lat, pickupLocation.lng)
      : null;

    const routeCalc = await this.calculateOptimalRoute(
      pickupLocation,
      logisticsPartner ? MissionsService.parseJsonLatLng(logisticsPartner.currentLocation) : null,
    );
    const optimalRoute = MissionsService.routeToJsonValue(routeCalc);
    const routeWithDest = {
      ...optimalRoute,
      destination: { address: destFull, city: destCity },
    } as Prisma.InputJsonValue;

    const missionNumber = await this.generateMissionNumber();

    const mission = await this.prisma.missions.create({
      data: {
        id: crypto.randomUUID(),
        missionNumber,
        growerId,
        orderId: order.id,
        batchId: null,
        harvestAnnouncementId: null,
        pickupLocation: { lat: pickupLocation.lat, lng: pickupLocation.lng } as any,
        pickupAddress: `${estate.name} (farm)`,
        destinationAddress: destFull,
        destinationCity: destCity,
        loadInstructions: loadLines.slice(0, 10000),
        logisticsPartnerId: logisticsPartner?.id ?? null,
        vehicleId: logisticsPartner?.vehicleId ?? null,
        optimalRoute: routeWithDest,
        estimatedPickupTime: MissionsService.toSafeDateTime(routeCalc.estimatedArrival),
        status: logisticsPartner ? 'ASSIGNED' : 'PENDING',
        assignedAt: logisticsPartner ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        users_missions_growerIdTousers: true,
        users_missions_logisticsPartnerIdTousers: true,
        vehicles: true,
        batches: true,
        orders: { select: { id: true, orderNumber: true, productName: true, quantity: true, unit: true } },
      },
    });

    try {
      await this.auditTrailService.createAuditTrail({
        eventType: 'STATUS_CHANGE',
        entityType: 'Mission',
        entityId: mission.id,
        performedByUserId: adminUserId,
        newValue: {
          source: 'admin_from_order',
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: mission.status,
          missionNumber: mission.missionNumber,
        } as any,
      });
    } catch (e) {
      this.logger.warn(`adminCreateMissionFromOrder audit: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      await this.notificationsGateway.notifyMissionUpdate(growerId, mission);
    } catch (e) {
      this.logger.warn(`adminCreateMissionFromOrder socket grower: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      await this.notificationsService.create({
        userId: growerId,
        type: 'ACTION_REQUIRED',
        title: 'Action required: buyer order and prep',
        message: `Order ${order.orderNumber} — ${order.productName} (${order.quantity} ${order.unit}). ` +
          `Open Missions for prep and channel instructions. When your lot is ready, operations will assign transport (or an open run).`,
        actionUrl: `/grower/portal?missionId=${encodeURIComponent(mission.id)}`,
      });
    } catch (e) {
      this.logger.warn(`adminCreateMissionFromOrder notify grower: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (mission.status === 'PENDING' && !mission.logisticsPartnerId) {
      try {
        await this.notificationsService.notifyAdminsForNewTransportRequest({
          missionNumber: mission.missionNumber,
          growerLabel: estate.name,
          destinationCity: mission.destinationCity,
          missionId: mission.id,
        });
      } catch (e) {
        this.logger.warn(
          `adminCreateMissionFromOrder notify admins: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    return mission;
  }

  /**
   * Get all missions (Admin only)
   */
  async findAll(filters?: { status?: string; growerId?: string; logisticsPartnerId?: string }) {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.growerId) {
      where.growerId = filters.growerId;
    }
    
    if (filters?.logisticsPartnerId) {
      where.logisticsPartnerId = filters.logisticsPartnerId;
    }

    return this.prisma.missions.findMany({
      where,
      include: {
        users_missions_growerIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            partnerCode: true,
          },
        },
        users_missions_logisticsPartnerIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            partnerCode: true,
          },
        },
        vehicles: true,
        orders: { select: { id: true, orderNumber: true, productName: true, quantity: true, unit: true } },
        batches: {
          select: {
            id: true,
            batchId: true,
            productName: true,
            quantity: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

}
