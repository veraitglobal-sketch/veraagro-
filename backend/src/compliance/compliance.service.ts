import { Injectable, ForbiddenException, Logger, Inject } from '@nestjs/common';
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
      whiteListEntry = await (this.prisma as any).bioWhiteList.findUnique({
        where: { barcode },
      }).catch(() => null);

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
        reason: 'Skenirani bar-kod đubriva nije na Bio-White-List. Zabranjene hemikalije nisu dozvoljene.',
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
        reason: 'Skenirani bar-kod đubriva je deaktiviran na Bio-White-List.',
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
                message: `Korisnik ${userName} (${user?.email || 'N/A'}) je pokušao da koristi đubrivo sa bar-kodom koji NIJE na Bio-White-List.\n\nBar-kod: ${data.barcode}\nRazlog: ${data.reason}\n${farmInfo}\n${entryInfo}\n\nUnos je BLOKIRAN.`,
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
              reason: `Zahtevana količina (${requestedQuantity}kg) premašuje dozvoljenu količinu za vašu farmu (${maxAllowedQuantity.toFixed(2)}kg za ${areaInHectares.toFixed(2)}ha)`,
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

  /**
   * Add barcode to Bio-White-List (Admin only)
   */
  async addToWhiteList(data: {
    barcode: string;
    productName: string;
    manufacturer: string;
    description?: string;
    addedBy: string;
  }) {
    return (this.prisma as any).bioWhiteList.create({
      data: {
        barcode: data.barcode,
        productName: data.productName,
        manufacturer: data.manufacturer,
        description: data.description,
        addedBy: data.addedBy,
        isActive: true,
      },
    });
  }

  /**
   * Remove or deactivate barcode from Bio-White-List
   */
  async removeFromWhiteList(barcode: string) {
    const result = await (this.prisma as any).bioWhiteList.update({
      where: { barcode },
      data: { isActive: false },
    });

    // PERFORMANCE: Invalidate cache for this barcode
    const cacheKey = `${this.WHITE_LIST_CACHE_KEY}:${barcode}`;
    await this.cacheManager.del(cacheKey);

    return result;
  }

  /**
   * Get all white list entries
   */
  async getWhiteList(activeOnly: boolean = true) {
    return (this.prisma as any).bioWhiteList.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
    });
  }
}
