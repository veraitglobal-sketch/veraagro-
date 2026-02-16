import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import { ImageResizeService } from '../common/image/image-resize.service';

export type EntryType = 'PRSKANJE' | 'SETVA' | 'BERBA';

interface CreateFieldEntryDto {
  type: EntryType;
  farmId: string;
  seedSerialNumber?: string;
  packagingBarcode?: string;
  fertilizerBarcode?: string; // For compliance check
  data: {
    date: string;
    location?: { lat: number; lng: number };
    notes?: string;
    [key: string]: any;
  };
  createdAt?: string;
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

    // Validate GPS coordinates range
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      return { valid: false, reason: 'Invalid GPS coordinates' };
    }

    // Get farm with coordinates (using Estate model)
    const farm = await this.prisma.estates.findUnique({
      where: { id: farmId },
      select: { polygonCoordinates: true },
    });

    if (!farm) {
      return { valid: false, reason: 'Farm not found' };
    }

    const farmCoords = farm.polygonCoordinates as any;

    // If farm has polygon coordinates, check if point is inside
    if (Array.isArray(farmCoords) && farmCoords.length > 0) {
      const isInside = this.isPointInPolygon({ lat: location.lat, lng: location.lng }, farmCoords);
      if (!isInside) {
        return {
          valid: false,
          reason: 'GPS location is outside your farm boundaries. Entry blocked for security.',
        };
      }
    } else if (farmCoords?.lat && farmCoords?.lng) {
      // Single point farm - check distance (allow 100m radius)
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        farmCoords.lat,
        farmCoords.lng
      );
      if (distance > 100) {
        return {
          valid: false,
          reason: `GPS lokacija je ${distance.toFixed(0)}m udaljena od farme. Maksimalna dozvoljena udaljenost: 100m.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Check if point is inside polygon (Ray casting algorithm)
   */
  private isPointInPolygon(point: { lat: number; lng: number }, polygon: any[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng ?? polygon[i][0];
      const yi = polygon[i].lat ?? polygon[i][1];
      const xj = polygon[j].lng ?? polygon[j][0];
      const yj = polygon[j].lat ?? polygon[j][1];

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

  async create(userId: string, dto: CreateFieldEntryDto) {
    // Validate farm ownership (using Estate model)
    const farm = await this.prisma.estates.findFirst({
      where: {
        id: dto.farmId,
        ownerId: userId,
      },
    });

    if (!farm) {
      throw new NotFoundException('Farm not found or you do not have access');
    }

    // SECURITY FIX: Validate GPS location against farm boundaries
    if (dto.data.location) {
      const gpsValidation = await this.validateGPSLocation(dto.data.location, dto.farmId);
      if (!gpsValidation.valid) {
        throw new ForbiddenException(gpsValidation.reason || 'GPS validation failed');
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
      const seedBatch = await (this.prisma as any).seedBatch.findUnique({
        where: { serialNumber: dto.seedSerialNumber },
      });

      if (!seedBatch) {
        throw new NotFoundException('Seed batch not found');
      }

      // Optional: Check if seed batch is purchased by this user
      if (seedBatch.purchasedBy && seedBatch.purchasedBy !== userId) {
        throw new BadRequestException('Seed batch is not purchased by you');
      }
    }

    // Create entry (you might want to create a FieldEntry model in Prisma)
    // For now, we'll store it as JSON or create a simple model
    // This is a placeholder - adjust based on your actual schema needs

    return {
      id: `entry_${Date.now()}`,
      type: dto.type,
      farmId: dto.farmId,
      seedSerialNumber: dto.seedSerialNumber,
      packagingBarcode: dto.packagingBarcode,
      data: dto.data,
      createdAt: dto.createdAt || new Date().toISOString(),
      synced: true,
    };
  }

  async findAll(userId: string, farmId?: string) {
    // Get user's farms (using Estate model)
    const farms = await this.prisma.estates.findMany({
      where: {
        ownerId: userId,
        ...(farmId && { id: farmId }),
      },
    });

    const farmIds = farms.map((f) => f.id);

    // Return entries for user's farms
    // This is a placeholder - adjust based on your actual schema
    return [];
  }
}
