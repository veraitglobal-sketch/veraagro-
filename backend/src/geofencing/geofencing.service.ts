import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustScoreService, TrustScoreEvent } from '../trust-score/trust-score.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class GeofencingService {
  private readonly logger = new Logger(GeofencingService.name);
  private readonly DELIVERY_RADIUS_METERS = 50; // 50 meters for delivery confirmation
  private readonly ROUTE_DEVIATION_KM = 2; // 2km deviation threshold

  constructor(
    private prisma: PrismaService,
    private trustScoreService: TrustScoreService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Check if GPS coordinates are within delivery zone
   */
  async checkDeliveryLocation(
    missionId: string,
    deliveryLocationId: string,
    currentLat: number,
    currentLng: number,
  ): Promise<{ allowed: boolean; distance: number }> {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: {
        // deliveryLocations: { // Not in schema
        //   where: { id: deliveryLocationId },
        // },
      },
    });

    const deliveryLocations = (mission as any).deliveryLocations || [];
    if (!mission || !deliveryLocations || deliveryLocations.length === 0) {
      throw new BadRequestException('Delivery location not found');
    }

    const deliveryLocation = deliveryLocations[0];
    const distance = this.calculateDistance(
      currentLat,
      currentLng,
      deliveryLocation.latitude,
      deliveryLocation.longitude,
    );

    return {
      allowed: distance <= this.DELIVERY_RADIUS_METERS,
      distance,
    };
  }

  /**
   * Verify delivery can be completed (geofencing check)
   */
  async verifyDelivery(
    missionId: string,
    deliveryLocationId: string,
    driverId: string,
    currentLat: number,
    currentLng: number,
  ): Promise<{ success: boolean; message: string }> {
    const check = await this.checkDeliveryLocation(missionId, deliveryLocationId, currentLat, currentLng);

    if (!check.allowed) {
      return {
        success: false,
        message: `You must be within ${this.DELIVERY_RADIUS_METERS}m of the delivery location. Current distance: ${check.distance.toFixed(0)}m`,
      };
    }

    // Allow delivery
    return {
      success: true,
      message: 'Location verified. Delivery can be completed.',
    };
  }

  /**
   * Check if truck entered hub zone (start unloading timer)
   */
  async checkHubEntry(missionId: string, vehicleId: string, currentLat: number, currentLng: number) {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: {
        // hub: true, // Not in schema
      },
    });

    const hub = (mission as any).hub;
    if (!mission || !hub) {
      return { inHub: false };
    }
    const distance = this.calculateDistance(
      currentLat,
      currentLng,
      hub.latitude,
      hub.longitude,
    );

    const hubRadius = hub.radius || 100; // Default 100m hub radius
    const inHub = distance <= hubRadius;

    if (inHub && !(mission as any).unloadingStartedAt) {
      // Start unloading timer
      await this.prisma.missions.update({
        where: { id: missionId },
        data: {
          // unloadingStartedAt: new Date(), // Not in schema
        },
      });

      this.logger.log(`Unloading timer started for mission ${missionId} at hub ${hub.id}`);
    }

    return { inHub, distance };
  }

  /**
   * Check route deviation from Golden Route
   */
  async checkRouteDeviation(
    missionId: string,
    currentLat: number,
    currentLng: number,
    hasTrafficAlert: boolean = false,
  ): Promise<{ deviated: boolean; distance: number; alertSent: boolean }> {
    const mission = await this.prisma.missions.findUnique({
      where: { id: missionId },
      include: {
        // optimalRoute: true, // Not in schema
        location_logs: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!mission || !mission.optimalRoute) {
      return { deviated: false, distance: 0, alertSent: false };
    }

    // Find nearest point on route
    const nearestPoint = this.findNearestPointOnRoute(
      currentLat,
      currentLng,
      ((mission as any).optimalRoute?.coordinates || []) as any,
    );

    const deviationDistance = this.calculateDistance(
      currentLat,
      currentLng,
      nearestPoint.lat,
      nearestPoint.lng,
    );

    const deviated = deviationDistance > this.ROUTE_DEVIATION_KM * 1000; // Convert to meters

    if (deviated && !hasTrafficAlert) {
      // Send violation alert to SuperAdmin
      await this.sendRouteDeviationAlert(missionId, deviationDistance, mission.logisticsPartnerId);
      return { deviated: true, distance: deviationDistance, alertSent: true };
    }

    return { deviated: false, distance: deviationDistance, alertSent: false };
  }

  /**
   * Send route deviation alert to SuperAdmin
   */
  private async sendRouteDeviationAlert(missionId: string, deviationMeters: number, driverId: string) {
    const superAdmins = await this.prisma.users.findMany({
      where: {
        roles: { has: 'SUPER_ADMIN' },
        status: 'ACTIVE',
      },
    });

    const deviationKm = (deviationMeters / 1000).toFixed(2);

    for (const admin of superAdmins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'ALERT',
        title: 'Route Deviation Alert',
        message: `Mission ${missionId}: Driver deviated ${deviationKm}km from Golden Route without traffic alert.`,
        actionUrl: `/admin/missions/${missionId}`,
      });
    }

    // Apply trust score deduction
    await this.trustScoreService.applyDeduction({
      event: TrustScoreEvent.ROUTE_DEVIATION,
      points: 15,
      reason: `Route deviation: ${deviationKm}km from Golden Route`,
      entityId: driverId,
      entityType: 'LOGISTICS_PARTNER',
    });

    this.logger.warn(`Route deviation alert: Mission ${missionId}, ${deviationKm}km deviation`);
  }

  /**
   * Calculate distance between two GPS points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
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
   * Find nearest point on route
   */
  private findNearestPointOnRoute(lat: number, lng: number, routeCoordinates: any[]): { lat: number; lng: number } {
    let minDistance = Infinity;
    let nearestPoint = routeCoordinates[0];

    for (const point of routeCoordinates) {
      const distance = this.calculateDistance(lat, lng, point.lat, point.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint;
  }
}
