import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMissionDto, AcceptMissionDto } from './dto/mission.dto';
import { FreshnessService } from '../freshness/freshness.service';
import { MaterialControlService } from '../material-control/material-control.service';
import * as crypto from 'crypto';
import { AuditTrailService } from '../audit-trail/audit-trail.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

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
  ) {}

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

    // Get batch if provided
    let batch = null;
    if (dto.batchId) {
      batch = await this.prisma.batches.findUnique({
        where: { id: dto.batchId },
        include: {
          estates: true,
        },
      });
      if (!batch) {
        throw new NotFoundException(`Batch with ID ${dto.batchId} not found`);
      }

      // Compliance + ownership only (do not block on virtual crate stock — that was stopping valid requests).
      // Material deduction can be tied to pickup/handover later; see deductMaterialsOnShipment for admin/logistics flows.
      try {
        await this.materialControlService.validateBatchForShipment(dto.batchId, growerId, {
          requireCrateBalance: false,
        });
      } catch (error: any) {
        if (error instanceof ForbiddenException || error instanceof NotFoundException) {
          throw error;
        }
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(
          error?.message || 'Batch validation failed. Cannot create shipment.',
        );
      }
    }

    // Find nearest available logistics partner with frigo vehicle
    const logisticsPartner = await this.findNearestLogisticsPartner(
      pickupLocation.lat,
      pickupLocation.lng,
    );

    // Calculate optimal route (using simple distance calculation for now)
    const routeCalc = await this.calculateOptimalRoute(
      pickupLocation,
      logisticsPartner ? MissionsService.parseJsonLatLng(logisticsPartner.currentLocation) : null,
    );
    // Prisma JSON: no Date/undefined/NaN in stored objects
    const optimalRoute = MissionsService.routeToJsonValue(routeCalc);

    // Generate mission number
    const missionNumber = await this.generateMissionNumber();

    // Create mission
    let mission;
    try {
      mission = await this.prisma.missions.create({
        data: {
          id: crypto.randomUUID(),
          missionNumber,
          growerId,
          batchId: dto.batchId,
          pickupLocation: pickupLocation as any,
          pickupAddress: (dto.pickupAddress || '').trim() || '—',
          logisticsPartnerId: logisticsPartner?.id ?? null,
          vehicleId: logisticsPartner?.vehicleId ?? null,
          optimalRoute: optimalRoute as Prisma.InputJsonValue,
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
        },
      });
    } catch (e: unknown) {
      this.logger.error(
        `missions.create failed: ${
          e instanceof Prisma.PrismaClientKnownRequestError ? e.code : 'non-prisma'
        } ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new BadRequestException(
            'Could not assign a unique mission number. Please try again in a few seconds.',
          );
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(
            'Invalid link to batch, vehicle, or user. Check your selection and retry.',
          );
        }
        /** DB behind API deploy — missing table/column vs Prisma schema (e.g. `missions.harvestAnnouncementId`) */
        if (e.code === 'P2021' || e.code === 'P2022') {
          this.logger.error(
            `DB schema out of date (${e.code}): ${e.message} meta=${JSON.stringify(e.meta)}`,
          );
          const meta = e.meta as { table?: string; column?: string } | undefined;
          const target =
            meta?.column != null
              ? String(meta.column)
              : meta?.table != null
                ? `table ${String(meta.table)}`
                : 'unknown (see server logs for meta)';
          throw new ServiceUnavailableException(
            'The API database is missing a table or column that the app expects. ' +
              'This is not a problem with the pickup address you typed — the server must run the latest Prisma migrations. ' +
              `Prisma ${e.code} (${e.code === 'P2022' ? 'missing column' : 'missing table'}: ${target}). ` +
              'Administrator: in `backend/`, with production `DATABASE_URL`, run `npx prisma migrate deploy` and restart the API.',
          );
        }
        // Any other Prisma client error: show code for support
        throw new BadRequestException(
          `Could not save the transport request (database ${e.code}). Try again, or contact support and mention this code.`,
        );
      }
      throw e;
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

    return mission;
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
    const ann = await this.prisma.harvest_announcements.findFirst({
      where: { id: announcementId, userId: growerId, announcementType: 'HARVEST' },
      include: { parcel: { include: { estates: true } } },
    });
    if (!ann) {
      return null;
    }

    const existing = await this.prisma.missions.findFirst({
      where: { harvestAnnouncementId: announcementId },
    });
    if (existing) {
      return existing;
    }

    const estate = ann.parcel?.estates;
    if (!estate) {
      this.logger.warn(`Harvest mission skipped: no estate on parcel for announcement ${announcementId}`);
      return null;
    }

    const pickup = MissionsService.centroidFromEstatePolygon(estate.polygonCoordinates);
    if (!pickup) {
      this.logger.warn(`Harvest mission skipped: estate ${estate.id} has no drawable boundary`);
      return null;
    }

    const grower = await this.prisma.users.findUnique({ where: { id: growerId } });
    if (!grower || !this.isGrowerAccount(grower.roles as string[])) {
      return null;
    }

    const logisticsPartner = await this.findNearestLogisticsPartner(pickup.lat, pickup.lng);
    const partnerLoc = logisticsPartner
      ? MissionsService.parseJsonLatLng(logisticsPartner.currentLocation)
      : null;
    const routeCalc = await this.calculateOptimalRoute(pickup, partnerLoc);
    const optimalRoute = MissionsService.routeToJsonValue(routeCalc);
    const missionNumber = await this.generateMissionNumber();
    const qty = ann.loadQuantityKg ?? ann.estimatedQuantity;
    const pickupAddress = `${estate.name} — ${ann.cropType}${qty != null ? ` (~${Number(qty).toFixed(0)} kg)` : ''} · plan berbe`;
    const plannedTime = ann.plannedLoadingStart ?? ann.estimatedDate;
    const estimatedPickupTime =
      MissionsService.toSafeDateTime(plannedTime) ??
      MissionsService.toSafeDateTime(routeCalc.estimatedArrival) ??
      new Date();

    const mission = await this.prisma.missions.create({
      data: {
        id: crypto.randomUUID(),
        missionNumber,
        growerId,
        batchId: null,
        harvestAnnouncementId: ann.id,
        pickupLocation: pickup as any,
        pickupAddress,
        logisticsPartnerId: logisticsPartner?.id ?? null,
        vehicleId: logisticsPartner?.vehicleId ?? null,
        optimalRoute: optimalRoute as any,
        estimatedPickupTime,
        status: logisticsPartner ? 'ASSIGNED' : 'PENDING',
        assignedAt: logisticsPartner ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        users_missions_growerIdTousers: true,
        users_missions_logisticsPartnerIdTousers: true,
        vehicles: true,
        batches: true,
        harvest_announcement: true,
      },
    });

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

    try {
      await this.notificationsGateway.notifyMissionUpdate(growerId, mission);
    } catch (error) {
      this.logger.warn(`notifyMissionUpdate failed: ${(error as Error).message}`);
    }

    return mission;
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

    const updated = await this.prisma.missions.update({
      where: { id: missionId },
      data: {
        status: 'ACCEPTED',
        vehicleId: dto.vehicleId || mission.vehicleId,
        acceptedAt: new Date(),
      },
      include: {
        users_missions_growerIdTousers: true,
        users_missions_logisticsPartnerIdTousers: true,
        vehicles: true,
        batches: true,
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
        vehicles: true,
        batches: true,
      };
      const logisticsInclude = {
        users_missions_growerIdTousers: true,
        vehicles: true,
        batches: true,
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
        return this.prisma.missions.findMany({
          where: { growerId: userId },
          include: growerInclude,
          orderBy: { createdAt: 'desc' },
        });
      }
      if (isGrower) {
        return this.prisma.missions.findMany({
          where: { growerId: userId },
          include: growerInclude,
          orderBy: { createdAt: 'desc' },
        });
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
    return this.prisma.missions.update({
      where: { id: missionId },
      data: {
        logisticsPartnerId,
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
      },
    });
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
