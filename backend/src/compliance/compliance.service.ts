import { Injectable, BadRequestException, Logger, Inject, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface ComplianceCheckResult {
  compliant: boolean;
  reason?: string;
  blocked: boolean;
  alertSent: boolean;
}

export interface FertilizerScanData {
  barcode: string;
  userId: string;
  farmId?: string;
  entryType?: string;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);
  private readonly WHITE_LIST_CACHE_TTL = 3600; // 1 hour cache TTL
  private readonly WHITE_LIST_CACHE_KEY = 'bio_white_list';

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async invalidateWhitelistCache(barcode: string): Promise<void> {
    try {
      await this.cacheManager.del(`${this.WHITE_LIST_CACHE_KEY}:${barcode}`);
    } catch (e) {
      this.logger.warn(`Whitelist cache invalidate failed for ${barcode}`, e);
    }
  }

  /**
   * Main compliance check middleware function
   * Checks if scanned fertilizer barcode is on Bio-White-List
   */
  async checkCompliance(data: FertilizerScanData): Promise<ComplianceCheckResult> {
    const { barcode, userId, farmId, entryType } = data;

    // PERFORMANCE: Check cache first
    const cacheKey = `${this.WHITE_LIST_CACHE_KEY}:${barcode}`;
    let whiteListEntry = await this.cacheManager.get<any>(cacheKey);

    if (!whiteListEntry) {
      // Cache miss - query database
      whiteListEntry = await this.prisma.bio_white_list
        .findUnique({
          where: { barcode },
        })
        .catch(() => null);

      // Cache result (even if null to prevent repeated queries)
      if (whiteListEntry) {
        await this.cacheManager.set(cacheKey, whiteListEntry, this.WHITE_LIST_CACHE_TTL * 1000);
      } else {
        // Cache null result for shorter time (5 minutes) to allow for new entries
        await this.cacheManager.set(cacheKey, null, 300 * 1000);
      }
    }

    if (!whiteListEntry) {
      // Barcode not on white list - BLOCK and send alert
      this.logger.warn(`Compliance violation: Barcode ${barcode} not on Bio-White-List. User: ${userId}`);

      // Send alert to admin dashboard
      const alertSent = await this.sendComplianceAlert({
        barcode,
        userId,
        farmId,
        entryType,
        reason: 'Barcode not found on Bio-White-List',
      });

      return {
        compliant: false,
        reason: 'Scanned fertilizer barcode is not on Bio-White-List. Prohibited chemicals are not allowed.',
        blocked: true,
        alertSent,
      };
    }

    // Check if white list entry is active
    if (!whiteListEntry.isActive) {
      this.logger.warn(`Compliance violation: Barcode ${barcode} is inactive. User: ${userId}`);

      const alertSent = await this.sendComplianceAlert({
        barcode,
        userId,
        farmId,
        entryType,
        reason: 'Barcode is inactive on Bio-White-List',
      });

      return {
        compliant: false,
        reason: 'Scanned fertilizer barcode is deactivated on Bio-White-List.',
        blocked: true,
        alertSent,
      };
    }

    // Compliance check passed
    this.logger.log(`Compliance check passed: Barcode ${barcode} is on Bio-White-List`);

    return {
      compliant: true,
      blocked: false,
      alertSent: false,
    };
  }

  /**
   * OPTIMIZED: Send compliance alert asynchronously (non-blocking)
   */
  private async sendComplianceAlert(data: {
    barcode: string;
    userId: string;
    farmId?: string;
    entryType?: string;
    reason: string;
  }): Promise<boolean> {
    // Send in background (non-blocking)
    setImmediate(async () => {
      try {
        // Get user info
        const user = await this.prisma.users.findUnique({
          where: { id: data.userId },
          select: { firstName: true, lastName: true, email: true },
        });

        // OPTIMIZED: Get admins with single query, only select ID
        const admins = await this.prisma.users.findMany({
          where: {
            OR: [
              { roles: { has: 'ADMIN' } },
              { roles: { has: 'SUPER_ADMIN' } },
            ],
          },
          select: { id: true },
        });

        const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
        const farmInfo = data.farmId ? `Farm ID: ${data.farmId}` : '';
        const entryInfo = data.entryType ? `Entry Type: ${data.entryType}` : '';

        // OPTIMIZED: Parallel notification creation
        await Promise.all(
          admins.map((admin) =>
            this.notificationsService
              .create({
                userId: admin.id,
                type: 'ALERT',
                title: '🚨 Compliance Violation - Zabranjene Hemikalije',
                message: `User ${userName} (${user?.email || 'N/A'}) attempted to use fertilizer with barcode that is NOT on Bio-White-List.\n\nBarcode: ${data.barcode}\nReason: ${data.reason}\n${farmInfo}\n${entryInfo}\n\nEntry BLOCKED.`,
                actionUrl: `/admin/compliance/violations?barcode=${data.barcode}&userId=${data.userId}`,
              })
              .catch((err) => {
                this.logger.error(`Failed to send notification to admin ${admin.id}:`, err);
              })
          )
        );

        this.logger.warn(`Compliance alert sent to ${admins.length} admin(s)`);
      } catch (error) {
        this.logger.error('Failed to send compliance alert:', error);
      }
    });

    return true; // Return immediately (async processing)
  }

  /**
   * Check if user is in Vera Partner program
   */
  async isVeraPartner(userId: string): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { isVeraPartner: true },
    });

    return user?.isVeraPartner || false;
  }

  /**
   * FIXED: Calculate discount with farm size validation
   * Ensures user cannot buy more seeds than their farm allows
   */
  async calculatePartnerDiscount(
    userId: string,
    standardPrice: number,
    requestedQuantity?: number, // kg of seeds
    farmId?: string
  ): Promise<{
    isPartner: boolean;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
    allowedQuantity?: number;
    validation?: {
      valid: boolean;
      reason?: string;
    };
  }> {
    const isPartner = await this.isVeraPartner(userId);

    if (!isPartner) {
      return {
        isPartner: false,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: standardPrice,
      };
    }

    // FIXED: Validate farm size if farmId and requestedQuantity provided
    if (farmId && requestedQuantity) {
      const estate = await this.prisma.estates.findFirst({
        where: {
          id: farmId,
          ownerId: userId,
        },
        select: { calculatedArea: true }, // Area in square meters
      });

      if (estate) {
        // Calculate max allowed seeds based on estate area
        // Standard: ~200kg per hectare (adjustable)
        // calculatedArea is in square meters, convert to hectares
        const SEEDS_PER_HECTARE = 200;
        const areaInHectares = estate.calculatedArea / 10000; // Convert m² to hectares
        const maxAllowedQuantity = areaInHectares * SEEDS_PER_HECTARE;

        if (requestedQuantity > maxAllowedQuantity) {
          return {
            isPartner: true,
            discountPercentage: 15,
            discountAmount: 0,
            finalPrice: standardPrice,
            allowedQuantity: maxAllowedQuantity,
            validation: {
              valid: false,
              reason: `Requested quantity (${requestedQuantity}kg) exceeds allowed quantity for your farm (${maxAllowedQuantity.toFixed(2)}kg for ${areaInHectares.toFixed(2)}ha)`,
            },
          };
        }
      }
    }

    // Vera Partner discount: 15% (configurable)
    const DISCOUNT_PERCENTAGE = 15;
    const discountAmount = (standardPrice * DISCOUNT_PERCENTAGE) / 100;
    const finalPrice = standardPrice - discountAmount;

    this.logger.log(`Vera Partner discount applied: ${DISCOUNT_PERCENTAGE}% for user ${userId}`);

    return {
      isPartner: true,
      discountPercentage: DISCOUNT_PERCENTAGE,
      discountAmount,
      finalPrice,
      allowedQuantity: requestedQuantity,
      validation: {
        valid: true,
      },
    };
  }

  private normalizeMaterialType(raw?: string): 'FERTILIZER' | 'PESTICIDE' | 'SEED' | 'OTHER' {
    const u = (raw || 'OTHER').toUpperCase();
    if (u === 'FERTILIZER' || u === 'PESTICIDE' || u === 'SEED' || u === 'OTHER') return u;
    return 'OTHER';
  }

  /**
   * Add barcode to Bio-White-List (Admin only)
   */
  async addToWhiteList(data: {
    barcode: string;
    productName: string;
    manufacturer: string;
    description?: string;
    materialType?: string;
    addedBy: string;
  }) {
    const row = await this.prisma.bio_white_list.create({
      data: {
        id: crypto.randomUUID(),
        barcode: data.barcode.trim(),
        productName: data.productName.trim(),
        manufacturer: data.manufacturer.trim(),
        materialType: this.normalizeMaterialType(data.materialType),
        description: data.description,
        addedBy: data.addedBy,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    await this.invalidateWhitelistCache(data.barcode.trim());
    return row;
  }

  /**
   * Grower registers a material on the whitelist (name + barcode + category). Same list as admin; ops can deactivate.
   */
  async submitGrowerMaterial(data: {
    barcode: string;
    productName: string;
    manufacturer?: string;
    materialType: string;
    description?: string;
    userId: string;
  }) {
    const barcode = data.barcode.trim();
    if (barcode.length < 3) {
      throw new BadRequestException('Barcode is too short (minimum 3 characters).');
    }
    if (barcode.length > 64) {
      throw new BadRequestException('Barcode is too long.');
    }
    const name = data.productName.trim();
    if (!name) {
      throw new BadRequestException('Enter the product / material name.');
    }
    let row;
    try {
      const exists = await this.prisma.bio_white_list.findUnique({ where: { barcode } });
      if (exists) {
        throw new BadRequestException(
          'This barcode is already on the list. Search for it or ask operations if it should be updated.',
        );
      }
      row = await this.prisma.bio_white_list.create({
        data: {
          id: crypto.randomUUID(),
          barcode,
          productName: name,
          manufacturer: (data.manufacturer || '—').trim() || '—',
          materialType: this.normalizeMaterialType(data.materialType),
          description: data.description?.trim() || null,
          addedBy: data.userId,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(
          `submitGrowerMaterial prisma ${e.code}: ${e.message}`,
          e.meta != null ? JSON.stringify(e.meta) : undefined,
        );
        if (e.code === 'P2002') {
          throw new BadRequestException(
            'This barcode is already on the list. Search for it or ask operations if it should be updated.',
          );
        }
        if (e.code === 'P2021' || e.code === 'P2022') {
          throw new ServiceUnavailableException(
            'The database is missing a column the app expects for materials (e.g. materialType). ' +
              'Run `npx prisma migrate deploy` on the server and restart the API.',
          );
        }
        throw new BadRequestException(
          `Could not save the material (database ${e.code}). Try again or contact support.`,
        );
      }
      if (e instanceof Prisma.PrismaClientValidationError) {
        this.logger.error(`submitGrowerMaterial validation: ${e.message}`);
        throw new BadRequestException('Invalid material data. Check the fields and try again.');
      }
      if (
        e instanceof Prisma.PrismaClientInitializationError ||
        e instanceof Prisma.PrismaClientRustPanicError
      ) {
        this.logger.error(`submitGrowerMaterial db unavailable: ${e instanceof Error ? e.message : e}`);
        throw new ServiceUnavailableException('Database is temporarily unavailable. Please try again.');
      }
      this.logger.error('submitGrowerMaterial: unexpected failure', e instanceof Error ? e.stack : e);
      throw new BadRequestException(
        'Could not save the material. Please try again — if it continues, contact support with the time of the attempt.',
      );
    }
    await this.invalidateWhitelistCache(barcode);
    return row;
  }

  /**
   * Remove or deactivate barcode from Bio-White-List
   */
  async removeFromWhiteList(barcode: string) {
    const result = await this.prisma.bio_white_list.update({
      where: { barcode },
      data: { isActive: false, updatedAt: new Date() },
    });

    // PERFORMANCE: Invalidate cache for this barcode
    await this.invalidateWhitelistCache(barcode);

    return result;
  }

  /**
   * Get all white list entries
   */
  async getWhiteList(activeOnly: boolean = true) {
    return this.prisma.bio_white_list.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
    });
  }
}
