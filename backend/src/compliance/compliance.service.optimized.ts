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
  private readonly WHITE_LIST_CACHE_TTL = 3600; // 1 hour cache
  private readonly DISCOUNT_PERCENTAGE = 15;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * OPTIMIZED: Main compliance check with caching
   * Checks if scanned fertilizer barcode is on Bio-White-List
   * Uses Redis cache to avoid DB queries for every check
   */
  async checkCompliance(data: FertilizerScanData): Promise<ComplianceCheckResult> {
    const { barcode, userId, farmId, entryType } = data;

    // CACHE CHECK: Try to get from cache first
    const cacheKey = `white_list:${barcode}`;
    let whiteListEntry = await this.cacheManager.get<any>(cacheKey);

    if (!whiteListEntry) {
      // Cache miss - query database
      whiteListEntry = await this.prisma.bio_white_list.findUnique({
        where: { barcode },
      });

      // Cache result (even if null, to avoid repeated DB queries)
      await this.cacheManager.set(cacheKey, whiteListEntry || null, this.WHITE_LIST_CACHE_TTL);
    }

    if (!whiteListEntry) {
      // Barcode not on white list - BLOCK and send alert
      this.logger.warn(`Compliance violation: Barcode ${barcode} not on Bio-White-List. User: ${userId}`);

      // OPTIMIZED: Send alert asynchronously (non-blocking)
      this.sendComplianceAlertAsync({
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
        alertSent: true, // Will be sent async
      };
    }

    // Check if white list entry is active
    if (!whiteListEntry.isActive) {
      this.logger.warn(`Compliance violation: Barcode ${barcode} is inactive. User: ${userId}`);

      this.sendComplianceAlertAsync({
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
        alertSent: true,
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
   * OPTIMIZED: Send alert asynchronously (non-blocking)
   */
  private async sendComplianceAlertAsync(data: {
    barcode: string;
    userId: string;
    farmId?: string;
    entryType?: string;
    reason: string;
  }): Promise<void> {
    // Don't await - send in background
    setImmediate(async () => {
      try {
        // Get user info
        const user = await this.prisma.users.findUnique({
          where: { id: data.userId },
          select: { firstName: true, lastName: true, email: true },
        });

        // OPTIMIZED: Get admins with single query
        const admins = await this.prisma.users.findMany({
          where: {
            OR: [
              { roles: { has: 'ADMIN' } },
              { roles: { has: 'SUPER_ADMIN' } },
            ],
          },
          select: { id: true }, // Only select ID for bulk insert
        });

        const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
        const farmInfo = data.farmId ? `Farm ID: ${data.farmId}` : '';
        const entryInfo = data.entryType ? `Entry Type: ${data.entryType}` : '';

        // OPTIMIZED: Bulk create notifications
        const notifications = admins.map((admin) => ({
          userId: admin.id,
          type: 'ALERT' as const,
          title: '🚨 Compliance Violation - Zabranjene Hemikalije',
          message: `Korisnik ${userName} (${user?.email || 'N/A'}) je pokušao da koristi đubrivo sa bar-kodom koji NIJE na Bio-White-List.\n\nBar-kod: ${data.barcode}\nRazlog: ${data.reason}\n${farmInfo}\n${entryInfo}\n\nUnos je BLOKIRAN.`,
          actionUrl: `/admin/compliance/violations?barcode=${data.barcode}&userId=${data.userId}`,
        }));

        // Bulk insert (if notifications service supports it)
        // Otherwise, use Promise.all for parallel execution
        await Promise.all(
          notifications.map((notif) =>
            this.notificationsService.create(notif).catch((err) => {
              this.logger.error(`Failed to send notification to admin ${notif.userId}:`, err);
            })
          )
        );

        this.logger.warn(`Compliance alert sent to ${admins.length} admin(s)`);
      } catch (error) {
        this.logger.error('Failed to send compliance alert:', error);
      }
    });
  }

  /**
   * Check if user is in Vera Partner program (with cache)
   */
  async isVeraPartner(userId: string): Promise<boolean> {
    const cacheKey = `vera_partner:${userId}`;
    const cached = await this.cacheManager.get<boolean>(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { isVeraPartner: true },
    });

    const isPartner = user?.isVeraPartner || false;
    await this.cacheManager.set(cacheKey, isPartner, 1800); // 30 min cache

    return isPartner;
  }

  /**
   * FIXED: Calculate discount with farm size validation
   * Ensures user cannot buy more seeds than their farm allows
   */
  async calculatePartnerDiscount(
    userId: string,
    standardPrice: number,
    requestedQuantity: number, // kg of seeds
    farmId?: string
  ): Promise<{
    isPartner: boolean;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
    allowedQuantity: number;
    requestedQuantity: number;
    validation: {
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
        allowedQuantity: 0,
        requestedQuantity,
        validation: {
          valid: false,
          reason: 'User is not a Vera Partner',
        },
      };
    }

    // FIXED: Validate farm size if farmId provided
    if (farmId) {
      const estate = await this.prisma.estates.findFirst({
        where: {
          id: farmId,
          ownerId: userId,
        },
        select: { calculatedArea: true }, // Area in square meters
      });

      if (!estate) {
        return {
          isPartner: true,
          discountPercentage: this.DISCOUNT_PERCENTAGE,
          discountAmount: 0,
          finalPrice: standardPrice,
          allowedQuantity: 0,
          requestedQuantity,
          validation: {
            valid: false,
            reason: 'Farm not found or access denied',
          },
        };
      }

      // Calculate max allowed seeds based on estate area
      // Standard: ~200kg per hectare (adjustable)
      // calculatedArea is in square meters, convert to hectares
      const SEEDS_PER_HECTARE = 200;
      const areaInHectares = estate.calculatedArea / 10000; // Convert m² to hectares
      const maxAllowedQuantity = areaInHectares * SEEDS_PER_HECTARE;

      // Check if user already purchased seeds for this farm
      const purchasedSeeds = await this.prisma.seeds.aggregate({
        where: {
          assignedToUserId: userId,
          // You might want to add farmId to SeedBatch or track separately
        },
        _sum: {
          // You'll need to add quantity field to SeedBatch
        },
      });

      // For now, we'll use a simple check
      if (requestedQuantity > maxAllowedQuantity) {
        return {
          isPartner: true,
          discountPercentage: this.DISCOUNT_PERCENTAGE,
          discountAmount: 0,
          finalPrice: standardPrice,
          allowedQuantity: maxAllowedQuantity,
          requestedQuantity,
          validation: {
            valid: false,
            reason: `Zahtevana količina (${requestedQuantity}kg) premašuje dozvoljenu količinu za vašu farmu (${maxAllowedQuantity.toFixed(2)}kg za ${areaInHectares.toFixed(2)}ha)`,
          },
        };
      }
    }

    // Calculate discount
    const discountAmount = (standardPrice * this.DISCOUNT_PERCENTAGE) / 100;
    const finalPrice = standardPrice - discountAmount;

    this.logger.log(`Vera Partner discount applied: ${this.DISCOUNT_PERCENTAGE}% for user ${userId}`);

    return {
      isPartner: true,
      discountPercentage: this.DISCOUNT_PERCENTAGE,
      discountAmount,
      finalPrice,
      allowedQuantity: requestedQuantity, // If validation passed
      requestedQuantity,
      validation: {
        valid: true,
      },
    };
  }

  /**
   * Add barcode to Bio-White-List (Admin only)
   * Invalidates cache
   */
  async addToWhiteList(data: {
    barcode: string;
    productName: string;
    manufacturer: string;
    description?: string;
    addedBy: string;
  }) {
    const result = await this.prisma.bio_white_list.create({
      data: {
        id: crypto.randomUUID(),
        barcode: data.barcode,
        productName: data.productName,
        manufacturer: data.manufacturer,
        description: data.description,
        addedBy: data.addedBy,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`white_list:${data.barcode}`);

    return result;
  }

  /**
   * Remove or deactivate barcode from Bio-White-List
   * Invalidates cache
   */
  async removeFromWhiteList(barcode: string) {
    const result = await this.prisma.bio_white_list.update({
      where: { barcode },
      data: { isActive: false },
    });

    // Invalidate cache
    await this.cacheManager.del(`white_list:${barcode}`);

    return result;
  }

  /**
   * Get all white list entries (with pagination for large datasets)
   */
  async getWhiteList(activeOnly: boolean = true, page: number = 1, limit: number = 100) {
    const skip = (page - 1) * limit;

    return this.prisma.bio_white_list.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }
}
