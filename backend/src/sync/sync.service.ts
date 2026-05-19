import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import {
  MaterialBarcodeValidationService,
  materialKindForFieldEntry,
} from '../compliance/material-barcode-validation.service';
import { GrowthLogTreatmentSyncService } from '../treatment-logs/growth-log-treatment-sync.service';
import { SmartLockService } from '../smart-lock/smart-lock.service';
import { GeometryUtil, type Point } from '../common/utils/geometry.util';
import * as crypto from 'crypto';

/**
 * Sync Engine Service
 * Handles offline-to-online synchronization of field entries
 * Validates timestamps and marks late entries for review
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly LATE_ENTRY_THRESHOLD_HOURS = 24; // 24 hours threshold
  private readonly BATCH_SIZE = 50; // PERFORMANCE: Process entries in batches of 50

  constructor(
    private prisma: PrismaService,
    private complianceService: ComplianceService,
    private materialBarcodeValidation: MaterialBarcodeValidationService,
    private growthLogTreatmentSync: GrowthLogTreatmentSyncService,
    private smartLockService: SmartLockService,
  ) {}

  /** Normalize estate `polygonCoordinates` JSON to { lat, lng }[] for point-in-polygon. */
  private polygonJsonToPoints(coords: unknown): Point[] {
    if (!coords || !Array.isArray(coords) || coords.length === 0) return [];
    return (coords as unknown[]).map((p: unknown) => {
      const o = p as Record<string, unknown>;
      if (typeof o?.lat === 'number' && typeof o?.lng === 'number') {
        return { lat: o.lat, lng: o.lng };
      }
      const arr = p as number[];
      if (Array.isArray(arr) && arr.length >= 2) {
        return { lat: arr[1], lng: arr[0] };
      }
      return null;
    }).filter((x): x is Point => x !== null && Number.isFinite(x.lat) && Number.isFinite(x.lng));
  }

  /**
   * Whether device GPS lies inside the estate boundary (if polygon has ≥3 points).
   */
  private async isLocationWithinEstate(
    estateId: string,
    location: { lat: number; lng: number },
  ): Promise<boolean> {
    const estate = await this.prisma.estates.findUnique({
      where: { id: estateId },
      select: { polygonCoordinates: true },
    });
    if (!estate?.polygonCoordinates) return true;
    const raw = estate.polygonCoordinates as unknown;
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'lat' in (raw as object) && 'lng' in (raw as object)) {
      const c = raw as { lat: number; lng: number };
      const d = GeometryUtil.calculateDistance(
        { lat: location.lat, lng: location.lng },
        { lat: c.lat, lng: c.lng },
      );
      return d <= 100;
    }
    const pts = this.polygonJsonToPoints(raw);
    if (pts.length < 3) return true;
    return GeometryUtil.isPointInPolygon({ lat: location.lat, lng: location.lng }, pts);
  }

  /**
   * Sync multiple field entries from offline storage
   * 
   * @param entries Array of field entries to sync
   * @param userId User ID who is syncing
   * @returns Sync result with synced, late, and failed entries
   */
  async syncFieldEntries(
    entries: Array<{
      id?: string; // Offline ID
      type: 'PRSKANJE' | 'SETVA' | 'BERBA';
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
      createdAt: string; // ISO timestamp from device
      deviceFingerprint?: string;
      deviceId?: string; // CRITICAL SECURITY: Device ID for fingerprinting
    }>,
    userId: string,
  ): Promise<{
    synced: number;
    late: number;
    failed: number;
    lateEntries: Array<{ id: string; reason: string }>;
    failedEntries: Array<{ id: string; reason: string }>;
  }> {
    const result = {
      synced: 0,
      late: 0,
      failed: 0,
      lateEntries: [] as Array<{ id: string; reason: string }>,
      failedEntries: [] as Array<{ id: string; reason: string }>,
    };

    // PERFORMANCE: Process entries in batches
    const batches = this.createBatches(entries, this.BATCH_SIZE);
    this.logger.log(`Processing ${entries.length} entries in ${batches.length} batches`);

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      this.logger.debug(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} entries)`);

      // Process entries in batch
      for (const entry of batch) {
        try {
        let isWithinFarmFlag = true;
        if (entry.data.location?.lat != null && entry.data.location?.lng != null) {
          try {
            isWithinFarmFlag = await this.isLocationWithinEstate(entry.farmId, entry.data.location);
          } catch (e) {
            this.logger.warn(`GPS boundary check failed for estate ${entry.farmId}: ${e}`);
            isWithinFarmFlag = false;
          }
        }

        // Step 1: Validate timestamp (check if entry is late)
        const entryDate = new Date(entry.createdAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > this.LATE_ENTRY_THRESHOLD_HOURS) {
          // Entry is older than 24 hours - mark as late
          this.logger.warn(
            `Late entry detected: ${entry.id || 'unknown'}, ${hoursDiff.toFixed(2)} hours old`,
          );

          // Create late entry record for review
          try {
            await this.prisma.compliance_logs.create({
              data: {
                id: crypto.randomUUID(),
                farmerId: userId,
                estateId: entry.farmId,
                entryType: entry.type,
                scannedBarcode: entry.fertilizerBarcode || entry.seedSerialNumber || entry.packagingBarcode || 'N/A',
                barcodeType: entry.fertilizerBarcode ? 'FERTILIZER' : entry.seedSerialNumber ? 'SEED' : 'PACKAGING',
                isCompliant: false, // Mark as non-compliant until reviewed
                complianceStatus: 'PENDING',
                blockedReason: `Late entry: ${hoursDiff.toFixed(2)} hours old (threshold: ${this.LATE_ENTRY_THRESHOLD_HOURS}h)`,
                gpsLatitude: entry.data.location?.lat || 0,
                gpsLongitude: entry.data.location?.lng || 0,
                isWithinFarm: isWithinFarmFlag,
                photos: [],
                deviceFingerprint: entry.deviceFingerprint || entry.deviceId || 'unknown',
                deviceId: entry.deviceId || entry.deviceFingerprint || 'unknown', // CRITICAL: Track device ID
                deviceTimestamp: entryDate,
                synced: true, // Mark as synced but flagged
                networkTimestamp: now,
              },
            });
          } catch (error) {
            this.logger.warn('ComplianceLog model not found. Late entry logged but not persisted.', error);
          }

          result.late++;
          result.lateEntries.push({
            id: entry.id || 'unknown',
            reason: `Entry is ${hoursDiff.toFixed(2)} hours old (threshold: ${this.LATE_ENTRY_THRESHOLD_HOURS}h)`,
          });
          continue; // Skip normal processing for late entries
        }

        // Step 2: Validate barcode through Integrity Guard
        if (entry.fertilizerBarcode) {
          const complianceCheck = await this.complianceService.checkCompliance({
            barcode: entry.fertilizerBarcode,
            userId,
            farmId: entry.farmId,
            entryType: entry.type,
          });

          if (!complianceCheck.compliant) {
            // Barcode not on white list - block entry
            this.logger.error(
              `Compliance violation: Barcode ${entry.fertilizerBarcode} not on Bio-White-List`,
            );

            result.failed++;
            result.failedEntries.push({
              id: entry.id || 'unknown',
              reason: complianceCheck.reason || 'Barcode not on Bio-White-List',
            });
            continue; // Skip this entry
          }
        }

        // Step 3–4: Create compliance log (GPS vs estate boundary already computed above)
        try {
          await this.prisma.compliance_logs.create({
            data: {
              id: crypto.randomUUID(),
              farmerId: userId,
              estateId: entry.farmId,
              entryType: entry.type,
              scannedBarcode: entry.fertilizerBarcode || entry.seedSerialNumber || entry.packagingBarcode || 'N/A',
              barcodeType: entry.fertilizerBarcode ? 'FERTILIZER' : entry.seedSerialNumber ? 'SEED' : 'PACKAGING',
              isCompliant: isWithinFarmFlag,
              complianceStatus: isWithinFarmFlag ? 'APPROVED' : 'REVIEW',
              gpsLatitude: entry.data.location?.lat || 0,
              gpsLongitude: entry.data.location?.lng || 0,
              isWithinFarm: isWithinFarmFlag,
              blockedReason: isWithinFarmFlag ? null : 'GPS outside registered farm boundary',
              photos: [],
              deviceFingerprint: entry.deviceFingerprint || entry.deviceId || 'unknown',
              deviceId: entry.deviceId || entry.deviceFingerprint || 'unknown', // CRITICAL: Track device ID
              deviceTimestamp: entryDate,
              synced: true,
              networkTimestamp: now,
            },
          });
        } catch (error) {
          this.logger.warn('ComplianceLog model not found. Entry logged but not persisted.', error);
        }

        const dataExtra = entry.data as { parcelId?: string; parcel_id?: string };
        const syncParcelId =
          typeof dataExtra.parcelId === 'string'
            ? dataExtra.parcelId.trim()
            : typeof dataExtra.parcel_id === 'string'
              ? dataExtra.parcel_id.trim()
              : '';

        if (
          entry.type === 'SETVA' &&
          entry.seedSerialNumber?.trim() &&
          syncParcelId &&
          entry.data.location?.lat != null &&
          entry.data.location?.lng != null
        ) {
          try {
            await this.smartLockService.ensureSeedLinkedToParcel({
              inputSerialNumber: entry.seedSerialNumber.trim(),
              userId,
              parcelId: syncParcelId,
              gpsLatitude: entry.data.location.lat,
              gpsLongitude: entry.data.location.lng,
              deviceId: entry.deviceId || entry.deviceFingerprint,
            });
          } catch (linkErr: unknown) {
            const reason = linkErr instanceof Error ? linkErr.message : 'Seed link to parcel failed';
            result.failed++;
            result.failedEntries.push({ id: entry.id || 'unknown', reason });
            continue;
          }
        }

        if (
          entry.type === 'PRSKANJE' &&
          entry.fertilizerBarcode?.trim() &&
          entry.data.location?.lat != null &&
          entry.data.location?.lng != null
        ) {
          if (syncParcelId) {
            await this.growthLogTreatmentSync.recordPesticideApplication({
              userId,
              parcelId: syncParcelId,
              materialBarcode: entry.fertilizerBarcode.trim(),
              deviceTimestamp: entryDate,
              gpsLatitude: entry.data.location.lat,
              gpsLongitude: entry.data.location.lng,
              deviceId: entry.deviceId || entry.deviceFingerprint,
              notes: entry.data.notes,
            });
          }
        }

        result.synced++;
        this.logger.log(`Entry synced successfully: ${entry.id || 'unknown'}`);
      } catch (error: unknown) {
        this.logger.error(`Error syncing entry ${entry.id || 'unknown'}:`, error);
        result.failed++;
        result.failedEntries.push({
          id: entry.id || 'unknown',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      }
    }

    return result;
  }

  /**
   * Get late entries for review
   * 
   * @param userId Optional: filter by user
   * @returns Array of late entries
   */
  async getLateEntries(userId?: string): Promise<any[]> {
    try {
      return await this.prisma.compliance_logs.findMany({
        where: {
          complianceStatus: 'PENDING',
          blockedReason: {
            contains: 'Late entry',
          },
          ...(userId && { farmerId: userId }),
        },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          estates: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.warn('ComplianceLog model not found.', error);
      return [];
    }
  }

  /**
   * Split array into batches for processing
   * 
   * @param items Array to split
   * @param batchSize Size of each batch
   * @returns Array of batches
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
