import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';
import { QualityControlLevelsService } from '../quality-control-levels/quality-control-levels.service';

@Injectable()
export class QrService {
  constructor(
    private prisma: PrismaService,
    private qualityControlLevelsService: QualityControlLevelsService,
  ) {}

  /**
   * Generate QR code for a batch
   * Returns QR code data URL and public certificate URL
   */
  async generateBatchQR(batchId: string): Promise<{
    qrCodeDataUrl: string;
    certificateUrl: string;
    qrId: string;
  }> {
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
        freshness_trackers: true,
        missions: true,
        temperature_logs: true,
      },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${batchId} not found`);
    }

    // Generate unique QR ID (using batch ID as base)
    const qrId = `BIO-VERA-${batch.batchId}`;

    // Public verification URL (consumer-facing portal)
    const certificateUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify/${batch.batchId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(certificateUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    // Store QR ID in batch (if we add a qrId field to Batch model)
    // For now, we'll use the batchId as the QR identifier

    return {
      qrCodeDataUrl,
      certificateUrl,
      qrId,
    };
  }

  /**
   * Get certificate data by QR ID
   */
  async getCertificateData(qrId: string) {
    // QR ID format: BIO-VERA-BATCH-2026-001
    // Extract batch number from QR ID
    const batchIdMatch = qrId.replace('BIO-VERA-', '');
    if (!batchIdMatch) {
      throw new Error('Invalid QR ID format');
    }

    const batchNumber = batchIdMatch;

    const batch = await this.prisma.batches.findUnique({
      where: { batchId: batchNumber },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
        parcels: true,
        compliance_photos: {
          orderBy: { uploadedAt: 'desc' },
        },
        users_batches_harvestedByUserIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        freshness_trackers: true,
        temperature_logs: {
          orderBy: {
            timestamp: 'asc',
          },
        },
        missions: {
          include: {
            users_missions_logisticsPartnerIdTousers: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            vehicles: true,
            location_logs: {
              orderBy: {
                timestamp: 'asc',
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new Error(`Batch not found for QR ID: ${qrId}`);
    }

    // Calculate timeline
    const timeline = {
      harvested: batch.harvestDate,
      verified: null as Date | null,
      loaded: null as Date | null,
      arrived: null as Date | null,
    };

    // Find verification time (coordinator action)
    const verificationAudit = await this.prisma.audit_trails.findFirst({
      where: {
        entityType: 'Batch',
        entityId: batch.id,
        eventType: 'QUALITY_CHECK',
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (verificationAudit) {
      timeline.verified = verificationAudit.timestamp;
    }

    // Find loaded time (mission picked up)
    const mission = batch.missions?.[0];
    if (mission?.pickedUpAt) {
      timeline.loaded = mission.pickedUpAt;
    }

    // Find arrived time (mission delivered)
    if (mission?.completedAt) {
      timeline.arrived = mission.completedAt;
    } else if (mission?.status === 'COMPLETED') {
      // If status is delivered but no timestamp, use current time as fallback
      timeline.arrived = new Date();
    }

    // Calculate total distance traveled
    let totalDistance = 0;
    if (mission?.location_logs && mission.location_logs.length > 1) {
      for (let i = 1; i < mission.location_logs.length; i++) {
        const prev = mission.location_logs[i - 1];
        const curr = mission.location_logs[i];
        const distance = this.calculateDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude,
        );
        totalDistance += distance;
      }
    }

    // Calculate sustainability score (lower distance = better score)
    const sustainabilityScore = Math.max(0, Math.min(100, 100 - (totalDistance / 10)));

    // Get temperature data for cold chain proof
    const temperatureData = batch.temperature_logs.map((log) => ({
      timestamp: log.timestamp,
      temperature: log.temperature,
      location: log.location,
    }));

    // Check if batch is compromised
    const isCompromised = await this.checkBatchCompromised(batch.id);

    return {
      qrId,
      batch: {
        id: batch.id,
        batchId: batch.batchId,
        productName: batch.productName,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
        status: batch.status,
        isCompromised,
      },
      origin: {
        farmName: batch.estates.name,
        // Privacy protection: Only first name for Buyer view
        ownerName: batch.estates.users.firstName,
        ownerLastName: undefined, // Never send to Buyer
        // Extract region from address, don't send exact address
        location: this.extractRegionFromAddress(batch.estates.name),
        gpsLocation: undefined, // No GPS for privacy
        address: undefined, // No exact address for privacy
      },
      timeline,
      coldChainProof: {
        temperatureData,
        minTemp: Math.min(...temperatureData.map(d => d.temperature)),
        maxTemp: Math.max(...temperatureData.map(d => d.temperature)),
        avgTemp: temperatureData.reduce((sum, d) => sum + d.temperature, 0) / temperatureData.length,
        isWithinRange: temperatureData.every(d => d.temperature >= 2 && d.temperature <= 8),
      },
      sustainability: {
        totalDistanceKm: totalDistance.toFixed(2),
        sustainabilityScore: sustainabilityScore.toFixed(1),
        route: mission?.optimalRoute || null,
      },
      freshness: batch.freshness_trackers ? {
        timestampHarvested: batch.freshness_trackers.timestampHarvested,
        remainingShelfLifeHours: batch.freshness_trackers.remainingShelfLifeHours,
        expiresAt: batch.freshness_trackers.expiresAt,
        isExpired: batch.freshness_trackers.isExpired,
      } : null,
      missions: batch.missions.map(m => ({
        id: m.id,
        missionNumber: m.missionNumber,
        status: m.status,
        vehicle: m.vehicles ? {
          id: m.vehicles.id,
          vehicleNumber: m.vehicles.vehicleNumber,
          licensePlate: m.vehicles.licensePlate,
        } : null,
        pickedUpAt: m.pickedUpAt,
        deliveredAt: m.completedAt,
      })),
      farmer: {
        // Privacy protection: Only first name
        name: batch.estates.users.firstName,
        lastName: undefined, // Never send to Buyer
        bio: batch.estates.users.farmerBio || `Grown by ${batch.estates.users.firstName}${batch.estates.users.generation ? `, ${batch.estates.users.generation} generation grower` : ''}${batch.estates.users.yearsOfExperience ? ` with ${batch.estates.users.yearsOfExperience} years of experience` : ''}`,
        photo: batch.estates.users.farmerPhoto || null,
        generation: batch.estates.users.generation || '3rd',
        yearsOfExperience: batch.estates.users.yearsOfExperience || null,
        farmerQrCode: batch.estates.users.farmerQrCode || null,
        farmerProfileUrl: batch.estates.users.farmerProfileUrl || null,
        phone: undefined, // Never send to Buyer
        email: undefined, // Never send to Buyer
      },
      // Product photos (compliance / packaging) for passport
      photos: (batch.compliance_photos || []).map((p) => ({
        url: p.photoUrl,
        type: p.photoType,
        verified: p.isVerified,
      })),
      // Protocol 360: Quality Control Levels
      protocol360: await this.getProtocol360Data(batch.id),
    };
  }

  /**
   * Get Protocol 360 data for certificate
   */
  private async getProtocol360Data(batchId: string) {
    try {
      const protocol360 = await this.qualityControlLevelsService.getProtocol360Status(batchId);
      return {
        overallStatus: protocol360.overallStatus,
        levels: protocol360.levels.map(level => ({
          level: level.level,
          name: level.name,
          status: level.status,
          badgeText: level.badgeText,
        })),
        brandingSlogan: protocol360.brandingSlogan,
      };
    } catch (error) {
      // If Protocol 360 data is not available, return null
      return null;
    }
  }

  /**
   * Check if batch is compromised (temperature >10°C for >30 minutes)
   */
  private async checkBatchCompromised(batchId: string): Promise<boolean> {
    const compromisedBatches = await this.prisma.batches.findMany({
      where: {
        id: batchId,
        temperature_logs: {
          some: {
            temperature: {
              gt: 10,
            },
          },
        },
      },
      include: {
        temperature_logs: {
          where: {
            temperature: {
              gt: 10,
            },
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (compromisedBatches.length === 0) {
      return false;
    }

    const batch = compromisedBatches[0];
    const highTempLogs = batch.temperature_logs;

    if (highTempLogs.length === 0) {
      return false;
    }

    // Check if there's a continuous period >30 minutes above 10°C
    let startTime: Date | null = null;
    for (const log of highTempLogs) {
      if (!startTime) {
        startTime = log.timestamp;
      } else {
        const duration = (log.timestamp.getTime() - startTime.getTime()) / (1000 * 60); // minutes
        if (duration > 30) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Extract region from address (privacy protection)
   * Returns only region/city, not exact address
   */
  private extractRegionFromAddress(address?: string): string {
    if (!address) return 'Unknown Region';
    
    // Try to extract city/region from address
    // Common patterns: "City, Country", "City", "Region District"
    const cityMatch = address.match(/^([^,]+)/);
    if (cityMatch) {
      const city = cityMatch[1].trim();
      
      // If it already contains "Region" or "District", return as is
      if (city.toLowerCase().includes('region') || city.toLowerCase().includes('district')) {
        return city;
      }
      
      // Otherwise add "Region" suffix
      return `${city} Region`;
    }
    
    return 'Unknown Region';
  }

  /**
   * Calculate distance between two GPS points (Haversine formula)
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
   * Generate QR code for testing (SEED or FERTILIZER)
   * Used for creating test QR codes for development
   */
  async generateTestQR(type: 'SEED' | 'FERTILIZER', value: string) {
    const qrData = `${type}:${value}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return {
      qrCodeDataUrl,
      value,
      type,
      qrData, // For testing - what's encoded in QR
    };
  }
}
