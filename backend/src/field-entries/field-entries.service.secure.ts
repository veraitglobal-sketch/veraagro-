import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';

export type EntryType = 'PRSKANJE' | 'SETVA' | 'BERBA';

interface CreateFieldEntryDto {
  type: EntryType;
  farmId: string;
  seedSerialNumber?: string;
  packagingBarcode?: string;
  fertilizerBarcode?: string;
  data: {
    date: string;
    location?: { lat: number; lng: number };
    notes?: string;
    [key: string]: any;
  };
  createdAt?: string;
  // SECURITY: Device fingerprinting
  deviceId?: string;
  deviceTimestamp?: string;
}

@Injectable()
export class FieldEntriesService {
  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
  ) {}

  /**
   * SECURITY FIX: Validate GPS location against farm boundaries
   */
  private async validateGPSLocation(
    location: { lat: number; lng: number },
    farmId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    if (!location || !location.lat || !location.lng) {
      return { valid: false, reason: 'GPS lokacija je obavezna' };
    }

    // Get farm with coordinates
    const estate = await this.prisma.estates.findUnique({
      where: { id: farmId },
      select: { polygonCoordinates: true },
    });

    if (!estate) {
      return { valid: false, reason: 'Farma nije pronađena' };
    }

    const farmCoords = estate.polygonCoordinates as any;

    // If farm has polygon coordinates
    if (Array.isArray(farmCoords) && farmCoords.length > 0) {
      // Check if point is inside polygon
      const isInside = this.isPointInPolygon(
        { lat: location.lat, lng: location.lng },
        farmCoords
      );

      if (!isInside) {
        return {
          valid: false,
          reason: 'GPS lokacija nije unutar granica vaše farme. Unos je blokiran zbog sigurnosti.',
        };
      }
    } else if (farmCoords.lat && farmCoords.lng) {
      // If farm has single point, check distance (allow 100m radius)
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        farmCoords.lat,
        farmCoords.lng
      );

      if (distance > 100) {
        // More than 100 meters away
        return {
          valid: false,
          reason: `GPS lokacija je ${distance.toFixed(0)}m udaljena od farme. Maksimalna dozvoljena udaljenost: 100m.`,
        };
      }
    }

    // Validate GPS accuracy (should be within reasonable range)
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      return { valid: false, reason: 'Nevažeće GPS koordinate' };
    }

    return { valid: true };
  }

  /**
   * Check if point is inside polygon (Ray casting algorithm)
   */
  private isPointInPolygon(point: { lat: number; lng: number }, polygon: any[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng || polygon[i][0];
      const yi = polygon[i].lat || polygon[i][1];
      const xj = polygon[j].lng || polygon[j][0];
      const yj = polygon[j].lat || polygon[j][1];

      const intersect =
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Calculate distance between two GPS points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
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
    return (degrees * Math.PI) / 180;
  }

  /**
   * SECURITY FIX: Validate device timestamp to prevent time manipulation
   */
  private validateDeviceTimestamp(deviceTimestamp?: string): { valid: boolean; reason?: string } {
    if (!deviceTimestamp) {
      return { valid: true }; // Optional for offline entries
    }

    const deviceTime = new Date(deviceTimestamp);
    const serverTime = new Date();
    const timeDiff = Math.abs(serverTime.getTime() - deviceTime.getTime());

    // Allow 5 minutes difference (for offline sync)
    const MAX_TIME_DIFF = 5 * 60 * 1000; // 5 minutes

    if (timeDiff > MAX_TIME_DIFF) {
      return {
        valid: false,
        reason: `Vremenska razlika između uređaja i servera je prevelika (${Math.round(timeDiff / 1000 / 60)} minuta). Maksimalna dozvoljena: 5 minuta.`,
      };
    }

    return { valid: true };
  }

  async create(userId: string, dto: CreateFieldEntryDto) {
    // Validate farm ownership
    const estate = await this.prisma.estates.findFirst({
      where: {
        id: dto.farmId,
        ownerId: userId,
      },
    });

    if (!estate) {
      throw new NotFoundException('Farm not found or you do not have access');
    }

    // SECURITY FIX: Validate GPS location against farm boundaries
    if (dto.data.location) {
      const gpsValidation = await this.validateGPSLocation(dto.data.location, dto.farmId);
      if (!gpsValidation.valid) {
        throw new ForbiddenException(gpsValidation.reason || 'GPS validation failed');
      }
    }

    // SECURITY FIX: Validate device timestamp
    if (dto.deviceTimestamp) {
      const timestampValidation = this.validateDeviceTimestamp(dto.deviceTimestamp);
      if (!timestampValidation.valid) {
        throw new BadRequestException(timestampValidation.reason || 'Timestamp validation failed');
      }
    }

    // COMPLIANCE CHECK: If fertilizer barcode is provided, check against Bio-White-List
    if (dto.fertilizerBarcode) {
      const complianceResult = await this.complianceService.checkCompliance({
        barcode: dto.fertilizerBarcode,
        userId,
        farmId: dto.farmId,
        entryType: dto.type,
      });

      if (!complianceResult.compliant || complianceResult.blocked) {
        throw new ForbiddenException(complianceResult.reason || 'Compliance check failed');
      }
    }

    // Validate seed batch if provided
    if (dto.seedSerialNumber) {
      const seed = await this.prisma.seeds.findUnique({
        where: { serialNumber: dto.seedSerialNumber },
      });

      if (!seed) {
        throw new NotFoundException('Seed batch not found');
      }

      // Optional: Check if seed is assigned to this user
      if (seed.assignedToUserId && seed.assignedToUserId !== userId) {
        throw new BadRequestException('Seed batch is not assigned to you');
      }
    }

    // Create entry with security metadata
    return {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: dto.type,
      farmId: dto.farmId,
      seedSerialNumber: dto.seedSerialNumber,
      packagingBarcode: dto.packagingBarcode,
      fertilizerBarcode: dto.fertilizerBarcode,
      data: {
        ...dto.data,
        // SECURITY: Add server timestamp (immutable)
        serverTimestamp: new Date().toISOString(),
        deviceId: dto.deviceId,
        deviceTimestamp: dto.deviceTimestamp,
      },
      createdAt: dto.createdAt || new Date().toISOString(),
      synced: true,
    };
  }

  async findAll(userId: string, farmId?: string) {
    // Get user's farms
    const estates = await this.prisma.estates.findMany({
      where: {
        ownerId: userId,
        ...(farmId && { id: farmId }),
      },
    });

    const farmIds = estates.map((e) => e.id);

    // Return entries for user's farms
    // This is a placeholder - adjust based on your actual schema
    return [];
  }
}
