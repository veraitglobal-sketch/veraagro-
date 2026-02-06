import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * GPS Validator Service
 * Implements point-in-polygon check to prevent GPS spoofing
 * 
 * CRITICAL SECURITY: Validates that GPS coordinates are within farm boundaries
 */
@Injectable()
export class GpsValidatorService {
  private readonly logger = new Logger(GpsValidatorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check if GPS coordinates are within farm polygon boundaries
   * 
   * @param lat Latitude
   * @param lng Longitude
   * @param farmId Farm (Estate) ID
   * @returns True if GPS is within farm boundaries
   */
  async isWithinFarmBoundaries(
    lat: number,
    lng: number,
    farmId: string,
  ): Promise<{ valid: boolean; reason?: string; distance?: number }> {
    try {
      // Step 1: Get farm with polygon coordinates
      const estate = await this.prisma.estates.findUnique({
        where: { id: farmId },
        select: {
          id: true,
          polygonCoordinates: true,
          calculatedArea: true,
          name: true,
        },
      });

      if (!estate) {
        return {
          valid: false,
          reason: 'Farma nije pronađena',
        };
      }

      // Step 2: Check if farm has polygon coordinates
      if (!estate.polygonCoordinates) {
        this.logger.warn(
          `Farm ${farmId} does not have polygon coordinates. GPS validation skipped.`,
        );
        // If no polygon, allow entry but log warning
        return {
          valid: true,
          reason: 'Farma nema definisane granice. Validacija preskočena.',
        };
      }

      const polygon = estate.polygonCoordinates as any;

      // Step 3: Validate polygon format
      if (!Array.isArray(polygon) || polygon.length < 3) {
        this.logger.warn(
          `Farm ${farmId} has invalid polygon format. GPS validation skipped.`,
        );
        return {
          valid: true,
          reason: 'Farma ima nevalidan format granica. Validacija preskočena.',
        };
      }

      // Step 4: Perform point-in-polygon check (Ray casting algorithm)
      const isInside = this.pointInPolygon({ lat, lng }, polygon);

      if (!isInside) {
        // Calculate distance to nearest polygon point for logging
        const distance = this.calculateDistanceToPolygon({ lat, lng }, polygon);

        this.logger.warn(
          `GPS coordinates (${lat}, ${lng}) are outside farm ${farmId} boundaries. Distance: ${distance.toFixed(2)}m`,
        );

        return {
          valid: false,
          reason: `GPS koordinate (${lat}, ${lng}) nisu unutar granica farme. Udaljenost: ${distance.toFixed(2)}m`,
          distance: distance,
        };
      }

      // GPS is within farm boundaries
      this.logger.log(
        `GPS coordinates (${lat}, ${lng}) validated for farm ${farmId}`,
      );

      return {
        valid: true,
      };
    } catch (error) {
      this.logger.error('Error validating GPS coordinates:', error);
      // On error, block entry for security
      return {
        valid: false,
        reason: 'Greška pri validaciji GPS koordinata',
      };
    }
  }

  /**
   * Point-in-polygon check using Ray casting algorithm
   * 
   * @param point Point to check {lat, lng}
   * @param polygon Array of polygon points [{lat, lng}, ...]
   * @returns True if point is inside polygon
   */
  private pointInPolygon(
    point: { lat: number; lng: number },
    polygon: Array<{ lat: number; lng: number } | [number, number]>,
  ): boolean {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      // Handle both object and array formats
      const xi = Array.isArray(polygon[i])
        ? (polygon[i] as [number, number])[0]
        : (polygon[i] as any).lng ?? (polygon[i] as any)[0];
      const yi = Array.isArray(polygon[i])
        ? (polygon[i] as [number, number])[1]
        : (polygon[i] as any).lat ?? (polygon[i] as any)[1];
      const xj = Array.isArray(polygon[j])
        ? (polygon[j] as [number, number])[0]
        : (polygon[j] as any).lng ?? (polygon[j] as any)[0];
      const yj = Array.isArray(polygon[j])
        ? (polygon[j] as [number, number])[1]
        : (polygon[j] as any).lat ?? (polygon[j] as any)[1];

      const intersect =
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Calculate distance from point to nearest polygon edge
   * 
   * @param point Point to check
   * @param polygon Polygon points
   * @returns Distance in meters
   */
  private calculateDistanceToPolygon(
    point: { lat: number; lng: number },
    polygon: Array<{ lat: number; lng: number } | [number, number]>,
  ): number {
    let minDistance = Infinity;

    for (let i = 0; i < polygon.length; i++) {
      const nextIndex = (i + 1) % polygon.length;

      const p1 = Array.isArray(polygon[i])
        ? { lat: (polygon[i] as [number, number])[1], lng: (polygon[i] as [number, number])[0] }
        : {
            lat: (polygon[i] as any).lat ?? (polygon[i] as any)[1],
            lng: (polygon[i] as any).lng ?? (polygon[i] as any)[0],
          };
      const p2 = Array.isArray(polygon[nextIndex])
        ? {
            lat: (polygon[nextIndex] as [number, number])[1],
            lng: (polygon[nextIndex] as [number, number])[0],
          }
        : {
            lat: (polygon[nextIndex] as any).lat ?? (polygon[nextIndex] as any)[1],
            lng: (polygon[nextIndex] as any).lng ?? (polygon[nextIndex] as any)[0],
          };

      // Calculate distance to line segment
      const distance = this.distanceToLineSegment(point, p1, p2);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  /**
   * Calculate distance from point to line segment
   */
  private distanceToLineSegment(
    point: { lat: number; lng: number },
    lineStart: { lat: number; lng: number },
    lineEnd: { lat: number; lng: number },
  ): number {
    const A = point.lng - lineStart.lng;
    const B = point.lat - lineStart.lat;
    const C = lineEnd.lng - lineStart.lng;
    const D = lineEnd.lat - lineStart.lat;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx: number, yy: number;

    if (param < 0) {
      xx = lineStart.lng;
      yy = lineStart.lat;
    } else if (param > 1) {
      xx = lineEnd.lng;
      yy = lineEnd.lat;
    } else {
      xx = lineStart.lng + param * C;
      yy = lineStart.lat + param * D;
    }

    const dx = point.lng - xx;
    const dy = point.lat - yy;

    // Convert to meters using Haversine formula
    return this.calculateDistance(point.lat, point.lng, yy, xx);
  }

  /**
   * Calculate distance between two GPS points (Haversine formula)
   * 
   * @returns Distance in meters
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
