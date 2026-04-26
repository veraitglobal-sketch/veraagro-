import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
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
        parcels: {
          include: {
            treatment_logs: { orderBy: { appliedAt: 'asc' } },
            growth_logs: { orderBy: { networkTimestamp: 'asc' } },
            harvest_announcements: { orderBy: { estimatedDate: 'asc' } },
          },
        },
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
        quality_entries: true,
        missions: {
          include: {
            users_missions_logisticsPartnerIdTousers: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            vehicles: true,
            border_wait_times: true,
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

    const regionName = this.extractRegionFromAddress(batch.estates.name);
    const country = batch.estates.users.productionCountry ?? null;
    const regionLabel = [regionName, country].filter(Boolean).join(' · ');

    return {
      qrId,
      batch: {
        id: batch.id,
        batchId: batch.batchId,
        estateId: batch.estateId,
        productName: batch.productName,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
        status: batch.status,
        isCompromised,
      },
      origin: {
        farmName: batch.estates.name,
        /** Human-readable “where in the world” for the passport (region + country). */
        regionLabel: regionLabel || regionName,
        productionCountry: country,
        // Where harvested: region + farm (for passport headline; no producer name)
        harvestLocation: `${batch.estates.name}${regionName ? `, ${regionName}` : ''}`,
        harvestRegion: regionName,
        // When harvested: date and period (e.g. "June 2026")
        harvestDate: batch.harvestDate,
        harvestPeriod: batch.harvestDate ? this.formatHarvestPeriod(batch.harvestDate) : null,
        ownerName: batch.estates.users.firstName,
        ownerLastName: undefined,
        location: regionName,
        /** Field (estate) and plot (parcel) size in ha + map centroids (traceability). */
        estateCalculatedAreaHa: batch.estates.calculatedArea,
        parcelCalculatedAreaHa: batch.parcels?.calculatedArea ?? null,
        estateMapCenter: this.polygonCentroid(batch.estates.polygonCoordinates as unknown),
        parcelMapCenter: this.polygonCentroid(batch.parcels?.polygonCoordinates as unknown),
        gpsLocation: undefined,
        address: undefined,
      },
      timeline,
      coldChainProof: temperatureData.length > 0 ? {
        temperatureData,
        minTemp: Math.min(...temperatureData.map(d => d.temperature)),
        maxTemp: Math.max(...temperatureData.map(d => d.temperature)),
        avgTemp: temperatureData.reduce((sum, d) => sum + d.temperature, 0) / temperatureData.length,
        isWithinRange: temperatureData.every(d => d.temperature >= 2 && d.temperature <= 8),
      } : { temperatureData: [], minTemp: null, maxTemp: null, avgTemp: null, isWithinRange: null },
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
      missions: (batch.missions ?? []).map((m) => ({
        id: m.id,
        missionNumber: m.missionNumber,
        status: m.status,
        pickupAddress: m.pickupAddress,
        pickupLocation: m.pickupLocation,
        estimatedPickupTime: m.estimatedPickupTime,
        assignedAt: m.assignedAt,
        acceptedAt: m.acceptedAt,
        logisticsPartner: m.users_missions_logisticsPartnerIdTousers
          ? {
              name: `${m.users_missions_logisticsPartnerIdTousers.firstName} ${m.users_missions_logisticsPartnerIdTousers.lastName}`.trim(),
            }
          : null,
        vehicle: m.vehicles
          ? {
              id: m.vehicles.id,
              vehicleNumber: m.vehicles.vehicleNumber,
              licensePlate: m.vehicles.licensePlate,
              type: m.vehicles.type,
              make: m.vehicles.make,
              model: m.vehicles.model,
            }
          : null,
        locationLogs: (m.location_logs ?? []).map((ll) => ({
          timestamp: ll.timestamp,
          latitude: ll.latitude,
          longitude: ll.longitude,
          accuracy: ll.accuracy,
          address: ll.address,
        })),
        borderWaits: (m.border_wait_times ?? []).map((b) => ({
          borderName: b.borderName,
          borderArrivalTime: b.borderArrivalTime,
          borderExitTime: b.borderExitTime,
          waitTimeMinutes: b.waitTimeMinutes,
        })),
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
      // Parcel & raw chronology: planting period, treatments (sredstva), growth logs, harvest announcements
      parcelInfo: batch.parcels
        ? {
            cropType: batch.parcels.cropType ?? null,
            plantingDate: batch.parcels.plantingDate ?? null,
            expectedHarvestDate: batch.parcels.expectedHarvestDate ?? null,
            calculatedAreaHa: batch.parcels.calculatedArea,
            mapCenter: this.polygonCentroid(batch.parcels.polygonCoordinates as unknown),
          }
        : null,
      treatments: (batch.parcels?.treatment_logs ?? []).map((t) => ({
        appliedAt: t.appliedAt,
        productName: t.productName,
        dosage: t.dosage,
        waterVolume: t.waterVolume,
        reason: t.reason ?? null,
        deviceTimestamp: t.deviceTimestamp,
        gpsLatitude: t.gpsLatitude,
        gpsLongitude: t.gpsLongitude,
        gpsAccuracyM: t.gpsAccuracy,
        needsAudit: t.needsAudit,
      })),
      growthLogs: (batch.parcels?.growth_logs ?? []).map((g) => ({
        networkTimestamp: g.networkTimestamp,
        deviceTimestamp: g.deviceTimestamp,
        growthStage: g.growthStage ?? null,
        notes: g.notes ?? null,
        labTestDate: g.labTestDate ?? null,
        gpsLatitude: g.gpsLatitude,
        gpsLongitude: g.gpsLongitude,
        gpsAccuracyM: g.gpsAccuracy,
      })),
      harvestAnnouncements: (batch.parcels?.harvest_announcements ?? []).map((h) => ({
        estimatedDate: h.estimatedDate,
        actualDate: h.actualDate ?? null,
        cropType: h.cropType,
        estimatedQuantity: h.estimatedQuantity ?? null,
        actualQuantity: h.actualQuantity ?? null,
        status: h.status,
        notes: h.notes ?? null,
      })),
      qualityEntry: batch.quality_entries ? {
        preCoolingStartTime: batch.quality_entries.preCoolingStartTime,
        weatherAtHarvest: batch.quality_entries.weatherAtHarvest,
        notes: batch.quality_entries.notes ?? null,
        status: batch.quality_entries.status,
      } : null,
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
   * Format harvest date as period (e.g. "June 2026") for passport display
   */
  private formatHarvestPeriod(harvestDate: Date): string {
    const d = new Date(harvestDate);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /**
   * Extract region from address (privacy protection)
   * Returns only region/city, not exact address
   */
  /** Approximate center of a polygon or point list (for passport “where on the map”). */
  private polygonCentroid(coords: unknown): { lat: number; lng: number } | null {
    if (coords == null) return null;
    const raw = coords as { lat?: number; lng?: number; coordinates?: unknown } | unknown[];
    const points = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { coordinates?: unknown }).coordinates)
        ? ((raw as { coordinates: unknown[] }).coordinates as unknown[])
        : [];
    if (!Array.isArray(points) || points.length === 0) return null;
    let sumLat = 0;
    let sumLng = 0;
    let n = 0;
    for (const p of points) {
      const pt = p as { lat?: number; lng?: number };
      const lat = typeof pt?.lat === 'number' ? pt.lat : Array.isArray(p) ? (p as number[])[1] : undefined;
      const lng = typeof pt?.lng === 'number' ? pt.lng : Array.isArray(p) ? (p as number[])[0] : undefined;
      if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
        sumLat += lat;
        sumLng += lng;
        n++;
      }
    }
    return n > 0 ? { lat: sumLat / n, lng: sumLng / n } : null;
  }

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

  /**
   * Generate detailed Product Passport PDF for a batch (for download from passport page)
   */
  async generatePassportPDF(batchId: string): Promise<Buffer> {
    const qrId = batchId.startsWith('BIO-VERA-') ? batchId : `BIO-VERA-${batchId}`;
    const data = await this.getCertificateData(qrId) as any;

    const veraGreen = '#2D5A27';
    const darkGray = '#1F2937';
    const lightGray = '#6B7280';
    const bgGreen = '#F0F9F0';

    const formatDate = (d: Date | string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatDateTime = (d: Date | string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const addHeader = (subtitle: string) => {
          doc.rect(0, 0, doc.page.width, 100).fill(bgGreen);
          doc.fontSize(24).fillColor(veraGreen).text('Bio Vera', 50, 25);
          doc.fontSize(14).fillColor(darkGray).text(subtitle, 50, 58);
          doc.y = 115;
        };

        const checkPage = (need: number) => {
          if (doc.y + need > doc.page.height - 60) {
            doc.addPage();
            addHeader('Product Passport – continued');
          }
        };

        addHeader('Product Passport');

        // 1. Product & Harvest
        doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('1. Product & harvest', 50, doc.y);
        doc.moveDown(0.5);
        const boxY = doc.y;
        doc.rect(50, boxY, doc.page.width - 100, 95).fill('#FFF').stroke(veraGreen, 1);
        doc.fontSize(10).fillColor(lightGray).text('Batch ID:', 60, boxY + 10);
        doc.fontSize(11).fillColor(darkGray).text(data.batch?.batchId ?? '—', 60, boxY + 24);
        doc.text('Product:', 60, boxY + 42);
        doc.text(data.batch?.productName ?? '—', 140, boxY + 42);
        doc.text('Quantity:', 60, boxY + 58);
        doc.text(`${data.batch?.quantity ?? '—'} ${data.batch?.unit ?? ''}`, 140, boxY + 58);
        doc.text('Status:', 60, boxY + 74);
        doc.text(data.batch?.status ?? '—', 140, boxY + 74);
        doc.text('Where harvested:', 320, boxY + 10);
        doc.text(data.origin?.harvestLocation ?? '—', 320, boxY + 24, { width: 200 });
        doc.text('When harvested:', 320, boxY + 42);
        doc.text(data.origin?.harvestDate ? formatDateTime(data.origin.harvestDate) : '—', 320, boxY + 58);
        doc.text('Period:', 320, boxY + 74);
        doc.text(data.origin?.harvestPeriod ?? '—', 320, boxY + 74, { width: 200 });
        doc.y = boxY + 100;
        doc.moveDown(1);

        // 2. Parcel & chronology intro
        if (data.parcelInfo && (data.parcelInfo.cropType || data.parcelInfo.plantingDate || data.parcelInfo.expectedHarvestDate)) {
          checkPage(80);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('2. Parcel & cultivation period', 50, doc.y);
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor(darkGray)
            .text(`Crop: ${data.parcelInfo.cropType ?? '—'}`, 50, doc.y)
            .text(`Planting date: ${data.parcelInfo.plantingDate ? formatDate(data.parcelInfo.plantingDate) : '—'}`, 50, doc.y + 16)
            .text(`Expected harvest: ${data.parcelInfo.expectedHarvestDate ? formatDate(data.parcelInfo.expectedHarvestDate) : '—'}`, 50, doc.y + 32);
          doc.y += 50;
          doc.moveDown(1);
        }

        // 3. Chronology (activities) – with sortKey for correct ordering
        const chronology: { sortKey: number; date: string; activity: string; detail: string }[] = [];
        const push = (sortKey: number, date: string, activity: string, detail: string) => chronology.push({ sortKey, date, activity, detail });
        if (data.parcelInfo?.plantingDate) push(new Date(data.parcelInfo.plantingDate).getTime(), formatDateTime(data.parcelInfo.plantingDate), 'Planting', data.parcelInfo.cropType ? `Crop: ${data.parcelInfo.cropType}` : '—');
        if (data.parcelInfo?.expectedHarvestDate) push(new Date(data.parcelInfo.expectedHarvestDate).getTime(), formatDate(data.parcelInfo.expectedHarvestDate), 'Expected harvest', '—');
        (data.treatments || []).forEach((t: any) => push(new Date(t.appliedAt).getTime(), formatDateTime(t.appliedAt), 'Treatment', `${t.productName} · ${t.dosage}${t.reason ? ` · ${t.reason}` : ''}`));
        (data.growthLogs || []).forEach((g: any) => push(new Date(g.networkTimestamp).getTime(), formatDateTime(g.networkTimestamp), 'Growth log', g.growthStage || g.notes || '—'));
        (data.harvestAnnouncements || []).forEach((h: any) => push(new Date(h.estimatedDate).getTime(), formatDate(h.estimatedDate), 'Harvest announcement', `${h.cropType} · ${h.status}`));
        if (data.timeline?.harvested) push(new Date(data.timeline.harvested).getTime(), formatDateTime(data.timeline.harvested), 'Harvested', data.origin?.harvestLocation ?? '—');
        if (data.qualityEntry?.preCoolingStartTime) push(new Date(data.qualityEntry.preCoolingStartTime).getTime(), formatDateTime(data.qualityEntry.preCoolingStartTime), 'Pre-cooling / quality', data.qualityEntry.status);
        if (data.timeline?.verified) push(new Date(data.timeline.verified).getTime(), formatDateTime(data.timeline.verified), 'Quality verified', '—');
        if (data.timeline?.loaded) push(new Date(data.timeline.loaded).getTime(), formatDateTime(data.timeline.loaded), 'Picked up', data.missions?.[0]?.vehicle?.vehicleNumber ?? '—');
        if (data.timeline?.arrived || data.missions?.[0]?.deliveredAt) push(new Date(data.timeline?.arrived || data.missions?.[0]?.deliveredAt).getTime(), formatDateTime(data.timeline?.arrived || data.missions?.[0]?.deliveredAt), 'Arrival', '—');
        chronology.sort((a, b) => a.sortKey - b.sortKey);

        if (chronology.length > 0) {
          checkPage(120);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('3. Chronology (what happened when)', 50, doc.y);
          doc.moveDown(0.5);
          const tableTop = doc.y;
          doc.fontSize(9).fillColor(lightGray);
          doc.text('Date & time', 50, tableTop);
          doc.text('Activity', 180, tableTop);
          doc.text('Detail', 320, tableTop);
          doc.moveTo(50, tableTop + 12).lineTo(doc.page.width - 50, tableTop + 12).stroke(veraGreen, 0.5);
          doc.y = tableTop + 18;
          chronology.slice(0, 20).forEach((row, i) => {
            checkPage(14);
            doc.fontSize(8).fillColor(darkGray).font('Helvetica').text(row.date, 50, doc.y, { width: 120 });
            doc.text(row.activity, 180, doc.y, { width: 130 });
            doc.text(row.detail, 320, doc.y, { width: doc.page.width - 370 });
            doc.y += 14;
          });
          if (chronology.length > 20) doc.fontSize(8).fillColor(lightGray).text(`+ ${chronology.length - 20} more entries`, 50, doc.y);
          doc.y += 12;
          doc.moveDown(1);
        }

        // 4. Applied inputs (treatments)
        if (data.treatments && data.treatments.length > 0) {
          checkPage(100);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('4. Applied inputs (treatments)', 50, doc.y);
          doc.moveDown(0.5);
          const tTop = doc.y;
          doc.fontSize(9).fillColor(lightGray);
          doc.text('Applied (server time)', 50, tTop);
          doc.text('Product', 160, tTop);
          doc.text('Rate', 300, tTop);
          doc.text('Water (L)', 380, tTop);
          doc.text('Reason', 430, tTop);
          doc.moveTo(50, tTop + 12).lineTo(doc.page.width - 50, tTop + 12).stroke(veraGreen, 0.5);
          doc.y = tTop + 18;
          data.treatments.forEach((t: any) => {
            checkPage(14);
            doc.fontSize(8).fillColor(darkGray).text(formatDateTime(t.appliedAt), 50, doc.y, { width: 105 });
            doc.text(t.productName, 160, doc.y, { width: 135 });
            doc.text(t.dosage, 300, doc.y, { width: 75 });
            doc.text(t.waterVolume != null ? String(t.waterVolume) : '—', 380, doc.y);
            doc.text(t.reason || '—', 430, doc.y, { width: doc.page.width - 435 });
            doc.y += 14;
          });
          doc.y += 10;
          doc.moveDown(1);
        }

        // 5. Cold chain & freshness
        if (data.coldChainProof && (data.coldChainProof.minTemp != null || data.coldChainProof.temperatureData?.length)) {
          checkPage(100);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('5. Cold chain & freshness', 50, doc.y);
          doc.moveDown(0.5);
          const cc = data.coldChainProof;
          doc.fontSize(10).fillColor(darkGray)
            .text(`Min temp: ${cc.minTemp != null ? cc.minTemp + ' °C' : '—'}  |  Max temp: ${cc.maxTemp != null ? cc.maxTemp + ' °C' : '—'}  |  Avg: ${cc.avgTemp != null ? Number(cc.avgTemp).toFixed(1) + ' °C' : '—'}  |  Within range: ${cc.isWithinRange === true ? 'Yes' : cc.isWithinRange === false ? 'No' : '—'}`, 50, doc.y);
          doc.y += 20;
          if (cc.temperatureData && cc.temperatureData.length > 0) {
            doc.fontSize(9).fillColor(lightGray).text('Temperature log (first 15):', 50, doc.y);
            doc.y += 12;
            cc.temperatureData.slice(0, 15).forEach((row: any) => {
              doc.fontSize(8).fillColor(darkGray).text(`${formatDateTime(row.timestamp)}  ${row.temperature} °C  ${row.location || '—'}`, 50, doc.y);
              doc.y += 10;
            });
            doc.y += 5;
          }
          doc.moveDown(0.5);
        }
        if (data.freshness) {
          checkPage(50);
          doc.fontSize(10).fillColor(darkGray)
            .text(`Remaining shelf life: ${data.freshness.remainingShelfLifeHours != null ? Math.round(data.freshness.remainingShelfLifeHours) + ' h' : '—'}  |  Expires: ${data.freshness.expiresAt ? formatDate(data.freshness.expiresAt) : '—'}  |  Harvested at: ${data.freshness.timestampHarvested ? formatDateTime(data.freshness.timestampHarvested) : '—'}`, 50, doc.y);
          doc.y += 25;
        }

        // 6. Timeline (journey)
        checkPage(90);
        doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('6. Journey (timeline)', 50, doc.y);
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor(darkGray);
        if (data.timeline?.harvested) doc.text(`Harvested: ${formatDateTime(data.timeline.harvested)}`, 60, doc.y), doc.y += 14;
        if (data.timeline?.verified) doc.text(`Quality verified: ${formatDateTime(data.timeline.verified)}`, 60, doc.y), doc.y += 14;
        if (data.timeline?.loaded) doc.text(`Picked up: ${formatDateTime(data.timeline.loaded)}`, 60, doc.y), doc.y += 14;
        if (data.timeline?.arrived) doc.text(`Arrived: ${formatDateTime(data.timeline.arrived)}`, 60, doc.y), doc.y += 14;
        doc.y += 10;

        // 7. Missions
        if (data.missions && data.missions.length > 0) {
          checkPage(60);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('7. Missions', 50, doc.y);
          doc.moveDown(0.5);
          data.missions.forEach((m: any, i: number) => {
            doc.fontSize(10).fillColor(darkGray).text(`${m.missionNumber || 'Mission ' + (i + 1)}  ·  ${m.status}  ·  Vehicle: ${m.vehicle?.vehicleNumber ?? m.vehicle?.licensePlate ?? '—'}  ·  Picked up: ${m.pickedUpAt ? formatDateTime(m.pickedUpAt) : '—'}  ·  Delivered: ${m.deliveredAt ? formatDateTime(m.deliveredAt) : '—'}`, 60, doc.y);
            doc.y += 14;
          });
          doc.y += 8;
        }

        // 8. Sustainability
        if (data.sustainability && (data.sustainability.totalDistanceKm != null || data.sustainability.sustainabilityScore != null)) {
          checkPage(40);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('8. Sustainability', 50, doc.y);
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor(darkGray).text(`Distance: ${data.sustainability.totalDistanceKm ?? '—'} km  |  Score: ${data.sustainability.sustainabilityScore ?? '—'}  |  Route: ${data.sustainability.route ?? '—'}`, 60, doc.y);
          doc.y += 25;
        }

        // 9. Protocol 360
        if (data.protocol360 && (data.protocol360.levels?.length || data.protocol360.overallStatus)) {
          checkPage(60);
          doc.fontSize(16).fillColor(veraGreen).font('Helvetica-Bold').text('9. Protocol 360', 50, doc.y);
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor(darkGray).text(`Overall: ${data.protocol360.overallStatus ?? '—'}`, 60, doc.y);
          doc.y += 14;
          (data.protocol360.levels || []).forEach((l: any) => {
            doc.fontSize(9).text(`Level ${l.level}: ${l.name}  –  ${l.badgeText || l.status}`, 60, doc.y);
            doc.y += 12;
          });
        }

        doc.fontSize(8).fillColor(lightGray).text(`Document generated: ${formatDateTime(new Date())}  ·  Bio Vera Product Passport  ·  Batch: ${data.batch?.batchId ?? batchId}`, 50, doc.page.height - 35);
        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}
