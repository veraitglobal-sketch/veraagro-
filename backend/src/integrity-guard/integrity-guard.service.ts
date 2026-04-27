import { Injectable, Logger, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GpsValidatorService } from './gps-validator.service';

/**
 * Integrity Guard Service
 * Validates all inputs before database write
 * Blocks unauthorized chemicals and creates security alerts
 */
@Injectable()
export class IntegrityGuardService {
  private readonly logger = new Logger(IntegrityGuardService.name);

  private readonly WHITE_LIST_CACHE_TTL = 3600; // 1 hour cache TTL
  private readonly WHITE_LIST_CACHE_KEY = 'bio_white_list';

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private gpsValidator: GpsValidatorService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Validate input before database write
   * 
   * @param input Input data to validate
   * @returns Validation result
   */
  async validateInput(input: {
    barcode: string;
    barcodeType: 'FERTILIZER' | 'SEED' | 'PACKAGING';
    userId: string;
    farmId: string;
    entryType: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
  }): Promise<{
    valid: boolean;
    reason?: string;
    alertCreated?: boolean;
  }> {
    const { barcode, barcodeType, userId, farmId, entryType } = input;

    // Step 1: Check if barcode exists in Bio-White-List (for fertilizers)
    if (barcodeType === 'FERTILIZER') {
      // PERFORMANCE: Check cache first
      const cacheKey = `${this.WHITE_LIST_CACHE_KEY}:${barcode}`;
      let whiteListEntry = await (this.cacheManager as any).get(cacheKey);

      if (!whiteListEntry) {
        // Cache miss - query database
        whiteListEntry = await this.prisma.bio_white_list
          .findUnique({
            where: { barcode },
          })
          .catch(() => null);

        // Cache result (even if null to prevent repeated queries)
        if (whiteListEntry) {
          await (this.cacheManager as any).set(cacheKey, whiteListEntry, this.WHITE_LIST_CACHE_TTL * 1000);
        } else {
          // Cache null result for shorter time (5 minutes) to allow for new entries
          await (this.cacheManager as any).set(cacheKey, null, 300 * 1000);
        }
      }

      if (!whiteListEntry) {
        // Barcode not on white list - BLOCK and create alert
        this.logger.error(
          `Security Alert: Unauthorized chemical detected. Barcode: ${barcode}, User: ${userId}`,
        );

        await this.createSecurityAlert({
          type: 'UNAUTHORIZED_CHEMICAL',
          severity: 'HIGH',
          barcode,
          userId,
          farmId,
          entryType,
          message: `Attempted use of unauthorized chemical: ${barcode}`,
        });

        return {
          valid: false,
          reason: `Barcode ${barcode} is not on Bio-White-List. Prohibited chemicals are not allowed.`,
          alertCreated: true,
        };
      }

      // Check if white list entry is active
      if (!whiteListEntry.isActive) {
        this.logger.warn(
          `Security Alert: Inactive chemical detected. Barcode: ${barcode}, User: ${userId}`,
        );

        // Create security alert (async, non-blocking)
        this.createSecurityAlert({
          type: 'INACTIVE_CHEMICAL',
          severity: 'MEDIUM',
          barcode,
          userId,
          farmId,
          entryType,
          message: `Attempted use of inactive chemical: ${barcode}`,
        });

        return {
          valid: false,
          reason: `Barcode ${barcode} is deactivated on Bio-White-List.`,
          alertCreated: true,
        };
      }
    }

    // Step 2: Validate seed barcode (if seed type)
    if (barcodeType === 'SEED') {
      const seed = await this.prisma.seeds.findUnique({
        where: { serialNumber: barcode },
      }).catch(() => null);

      if (!seed) {
        this.logger.warn(`Invalid seed barcode: ${barcode}`);
        return {
          valid: false,
          reason: `Seed barcode ${barcode} is not valid.`,
        };
      }

      // Check if seed is assigned to this farmer
      // TODO: Implement seed assignment validation
    }

    // Step 3: Validate GPS coordinates (if provided)
    // CRITICAL SECURITY: Prevent GPS spoofing by checking farm boundaries
    if (input.gpsLatitude && input.gpsLongitude) {
      const gpsValidation = await this.gpsValidator.isWithinFarmBoundaries(
        input.gpsLatitude,
        input.gpsLongitude,
        farmId,
      );

      if (!gpsValidation.valid) {
        this.logger.warn(
          `GPS Spoofing detected: Coordinates (${input.gpsLatitude}, ${input.gpsLongitude}) outside farm ${farmId} boundaries. Distance: ${gpsValidation.distance?.toFixed(2)}m`,
        );

        // Create security alert for GPS violation
        this.createSecurityAlert({
          type: 'GPS_VIOLATION',
          severity: 'HIGH', // HIGH severity for GPS spoofing
          barcode,
          userId,
          farmId,
          entryType,
          message: `GPS coordinates outside farm boundaries. Distance: ${gpsValidation.distance?.toFixed(2)}m`,
          gpsLatitude: input.gpsLatitude,
          gpsLongitude: input.gpsLongitude,
        });

        return {
          valid: false,
          reason: gpsValidation.reason || 'GPS koordinate nisu unutar granica farme.',
          alertCreated: true,
        };
      }
    }

    // All validations passed
    return {
      valid: true,
    };
  }

  // NOTE: GPS validation moved to GpsValidatorService for better security

  /**
   * Create security alert in database
   * 
   * @param alertData Alert data
   */
  private async createSecurityAlert(alertData: {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    barcode: string;
    userId: string;
    farmId: string;
    entryType: string;
    message: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
  }): Promise<void> {
    try {
      // Create security alert record
      // Note: SecurityAlert model needs to be added to schema
      try {
        await (this.prisma as any).securityAlert.create({
          data: {
            type: alertData.type,
            severity: alertData.severity,
            barcode: alertData.barcode,
            userId: alertData.userId,
            farmId: alertData.farmId,
            entryType: alertData.entryType,
            message: alertData.message,
            gpsLatitude: alertData.gpsLatitude,
            gpsLongitude: alertData.gpsLongitude,
            status: 'PENDING', // Needs admin review
          },
        });
      } catch (error) {
        this.logger.warn('SecurityAlert model not found. Alert logged but not persisted.');
        // TODO: Add SecurityAlert model to schema.prisma
      }

      // PERFORMANCE: Bulk notify admins (one query, bulk create)
      const admins = await this.prisma.users.findMany({
        where: {
          OR: [
            { roles: { has: 'SUPER_ADMIN' } },
            { roles: { has: 'ADMIN' } },
          ],
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (admins.length > 0) {
        // PERFORMANCE: Bulk create notifications
        const notificationData = admins.map((admin) => ({
          userId: admin.id,
          type: 'ALERT' as const,
          title: `Security Alert: ${alertData.type}`,
          message: alertData.message,
          actionUrl: `/admin/security-alerts`,
        }));

        // Try bulk create if available, otherwise parallel create
        if (typeof (this.notificationsService as any).createBulk === 'function') {
          await (this.notificationsService as any).createBulk(notificationData);
        } else {
          // Parallel create (non-blocking)
          Promise.allSettled(
            notificationData.map((notif) =>
              this.notificationsService.create(notif).catch((err) => {
                this.logger.error(`Failed to send notification to admin ${notif.userId}:`, err);
              }),
            ),
          );
        }
      }

      this.logger.log(`Security alert created: ${alertData.type}`);
    } catch (error) {
      this.logger.error('Error creating security alert:', error);
    }
  }
}
