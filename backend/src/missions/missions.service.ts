import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
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

      // Validate materials before allowing shipment
      try {
        await this.materialControlService.validateBatchForShipment(dto.batchId, growerId);
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

      // Deduct materials from balance
      await this.materialControlService.deductMaterialsOnShipment(dto.batchId, growerId);
    }

    // Find nearest available logistics partner with frigo vehicle
    const logisticsPartner = await this.findNearestLogisticsPartner(
      dto.pickupLocation.lat,
      dto.pickupLocation.lng,
    );

    // Calculate optimal route (using simple distance calculation for now)
    // In production, use Google Maps API or similar
    const optimalRoute = await this.calculateOptimalRoute(
      dto.pickupLocation,
      logisticsPartner?.currentLocation || null,
    );

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
        optimalRoute,
        estimatedPickupTime: optimalRoute?.estimatedArrival,
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

    // If batch exists, create freshness tracker
    if (batch) {
      await this.freshnessService.createFreshnessTracker(batch.id, batch.productName);
    }

    // Create audit trail
    await this.auditTrailService.createAuditTrail({
      eventType: 'STATUS_CHANGE',
      entityType: 'Mission',
      entityId: mission.id,
      performedByUserId: growerId,
      newValue: { status: mission.status, missionNumber: mission.missionNumber },
      location: dto.pickupLocation,
    });

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
      const vehicle = (partner as any).logisticsVehicles?.[0];
      if (vehicle?.currentLocation) {
        const distance = this.calculateDistance(
          pickupLat,
          pickupLng,
          vehicle.currentLocation['lat'],
          vehicle.currentLocation['lng'],
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestPartner = {
            id: partner.id,
            vehicleId: vehicle.id,
            currentLocation: vehicle.currentLocation,
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

    // Simple calculation (in production, use Google Maps Directions API)
    const distance = this.calculateDistance(
      vehicleLocation.lat,
      vehicleLocation.lng,
      pickupLocation.lat,
      pickupLocation.lng,
    );

    // Estimate duration (assuming average speed of 60 km/h)
    const durationMinutes = (distance / 60) * 60;
    const estimatedArrival = new Date(Date.now() + durationMinutes * 60 * 1000);

    return {
      distance: `${distance.toFixed(2)} km`,
      duration: `${Math.round(durationMinutes)} minutes`,
      waypoints: [vehicleLocation, pickupLocation],
      estimatedArrival,
    };
  }

  /**
   * Generate unique mission number
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
    return `MISSION-${year}-${String(count + 1).padStart(4, '0')}`;
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
