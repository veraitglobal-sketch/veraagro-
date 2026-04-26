import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
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
    return roles.some((r) => r === 'GROWER' || r === 'FARMER');
  }

  /**
   * Create mission when Grower clicks "Ready for Pickup"
   * Automatically finds nearest Logistics Partner
   */
  async createMission(growerId: string, dto: CreateMissionDto) {
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
      dto.pickupLocation.lat,
      dto.pickupLocation.lng,
    );

    // Calculate optimal route (using simple distance calculation for now)
    const routeCalc = await this.calculateOptimalRoute(
      dto.pickupLocation,
      logisticsPartner ? MissionsService.parseJsonLatLng(logisticsPartner.currentLocation) : null,
    );
    // Prisma Json must not embed non-JSON-native values; Date breaks some runtimes.
    const optimalRoute = MissionsService.routeToJsonValue(routeCalc);

    // Generate mission number
    const missionNumber = await this.generateMissionNumber();

    // Create mission
    const mission = await this.prisma.missions.create({
      data: {
        id: crypto.randomUUID(),
        missionNumber,
        growerId,
        batchId: dto.batchId,
        pickupLocation: dto.pickupLocation as any,
        pickupAddress: dto.pickupAddress,
        logisticsPartnerId: logisticsPartner?.id,
        vehicleId: logisticsPartner?.vehicleId,
        optimalRoute: optimalRoute as any,
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
        location: dto.pickupLocation,
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
    // Invalid Date is still truthy — never call toISOString() without a finite time check (was causing RangeError → 500).
    const ar = MissionsService.toSafeDateTime(route.estimatedArrival);
    return {
      ...route,
      estimatedArrival: ar ? ar.toISOString() : null,
    };
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
   * Get missions for a user
   */
  async getMissionsForUser(userId: string, role: string) {
    try {
      // Get user to check roles
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { roles: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user has GROWER role
      const isGrower = user.roles.includes('GROWER');
      // Check if user has LOGISTICS_PARTNER role
      const isLogisticsPartner = user.roles.includes('LOGISTICS_PARTNER');

      if (isGrower) {
        return this.prisma.missions.findMany({
          where: { growerId: userId },
          include: {
            users_missions_logisticsPartnerIdTousers: true,
            vehicles: true,
            batches: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else if (isLogisticsPartner) {
        return this.prisma.missions.findMany({
          where: { logisticsPartnerId: userId },
          include: {
            users_missions_growerIdTousers: true,
            vehicles: true,
            batches: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      // If user has neither role, return empty array instead of throwing error
      return [];
    } catch (error) {
      console.error('Error in getMissionsForUser:', error);
      // Return empty array on error instead of throwing
      return [];
    }
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
