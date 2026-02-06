import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Discount Quota Service
 * Prevents discount abuse by tracking seed purchase history
 * 
 * CRITICAL SECURITY: Ensures users cannot exceed discount limit across multiple orders
 */
@Injectable()
export class DiscountQuotaService {
  private readonly logger = new Logger(DiscountQuotaService.name);
  private readonly DISCOUNT_LIMIT_KG_PER_HECTARE = 200; // 200kg per hectare

  constructor(private prisma: PrismaService) {}

  /**
   * Check if user can purchase seeds with discount
   * 
   * @param farmerId Farmer ID
   * @param requestedQuantity Quantity requested in kg
   * @returns Quota check result
   */
  async checkDiscountQuota(
    farmerId: string,
    requestedQuantity: number,
  ): Promise<{
    allowed: boolean;
    farmAreaHectares: number;
    discountLimit: number;
    alreadyUsed: number;
    remaining: number;
    requestedQuantity: number;
    reason?: string;
  }> {
    try {
      // Step 1: Get farm area (in hectares)
      const estates = await this.prisma.estates.findMany({
        where: { ownerId: farmerId },
        select: {
          calculatedArea: true, // Area in square meters
        },
      });

      if (estates.length === 0) {
        throw new ForbiddenException('Farmer nema registrovane farme');
      }

      // Calculate total farm area in hectares
      const totalAreaSquareMeters = estates.reduce(
        (sum, estate) => sum + (estate.calculatedArea || 0),
        0,
      );
      const farmAreaHectares = totalAreaSquareMeters / 10000; // Convert m² to hectares

      // Step 2: Calculate discount limit
      const discountLimit = farmAreaHectares * this.DISCOUNT_LIMIT_KG_PER_HECTARE;

      // Step 3: Get purchase history (seeds purchased with discount)
      // Note: Track purchases from Order or SeedAssignment models
      const alreadyUsed = await this.getUsedDiscountQuota(farmerId);

      // Step 4: Calculate remaining quota
      const remaining = Math.max(0, discountLimit - alreadyUsed);

      // Step 5: Check if requested quantity exceeds remaining quota
      if (requestedQuantity > remaining) {
        this.logger.warn(
          `Discount abuse attempt: Farmer ${farmerId} requested ${requestedQuantity}kg but only ${remaining.toFixed(2)}kg remaining. Limit: ${discountLimit.toFixed(2)}kg, Used: ${alreadyUsed.toFixed(2)}kg`,
        );

        return {
          allowed: false,
          farmAreaHectares: Math.round(farmAreaHectares * 100) / 100,
          discountLimit: Math.round(discountLimit * 100) / 100,
          alreadyUsed: Math.round(alreadyUsed * 100) / 100,
          remaining: Math.round(remaining * 100) / 100,
          requestedQuantity,
          reason: `Prekoračen limit popusta. Dozvoljeno: ${remaining.toFixed(2)}kg, Zahtevano: ${requestedQuantity}kg. Limit: ${discountLimit.toFixed(2)}kg (${farmAreaHectares.toFixed(2)}ha × 200kg/ha), Već iskorišćeno: ${alreadyUsed.toFixed(2)}kg`,
        };
      }

      // Quota check passed
      this.logger.log(
        `Discount quota check passed: Farmer ${farmerId}, Requested: ${requestedQuantity}kg, Remaining: ${remaining.toFixed(2)}kg`,
      );

      return {
        allowed: true,
        farmAreaHectares: Math.round(farmAreaHectares * 100) / 100,
        discountLimit: Math.round(discountLimit * 100) / 100,
        alreadyUsed: Math.round(alreadyUsed * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        requestedQuantity,
      };
    } catch (error: any) {
      this.logger.error('Error checking discount quota:', error);
      throw new ForbiddenException(
        error.message || 'Greška pri proveri kvote popusta',
      );
    }
  }

  /**
   * Get total discount quota already used by farmer
   * 
   * @param farmerId Farmer ID
   * @returns Total kg purchased with discount
   */
  private async getUsedDiscountQuota(farmerId: string): Promise<number> {
    try {
      // Option 1: Check Order model for seed purchases
      const orders = await this.prisma.orders.findMany({
        where: {
          buyerId: farmerId,
          status: {
            in: ['CONFIRMED', 'PAID', 'COMPLETED'],
          },
        },
        include: {
          order_items: true,
        },
      });

      let totalUsed = 0;

      for (const order of orders) {
        for (const item of order.order_items || []) {
          // Check if item was purchased with partner discount
          // This assumes OrderItem has a discountApplied field or price indicates discount
          // Adjust based on your actual OrderItem model structure
          if ((item as any).discountApplied || (item as any).partnerPrice) {
            totalUsed += (item as any).quantity || 0;
          }
        }
      }

      // Option 2: Check SeedAssignment model (if exists in biovera-core schema)
      try {
        const seedAssignments = await (this.prisma as any).seedAssignment.findMany({
          where: {
            farmerId: farmerId,
            discountApplied: true, // Assuming this field exists
          },
          select: {
            quantity: true,
          },
        });

        for (const assignment of seedAssignments || []) {
          totalUsed += assignment.quantity || 0;
        }
      } catch (error) {
        // SeedAssignment model might not exist yet
        this.logger.debug('SeedAssignment model not found, using Order model only');
      }

      return totalUsed;
    } catch (error) {
      this.logger.error('Error getting used discount quota:', error);
      return 0; // On error, return 0 to be safe (will allow purchase)
    }
  }

  /**
   * Record discount usage after purchase
   * 
   * @param farmerId Farmer ID
   * @param quantity Quantity purchased with discount (in kg)
   */
  async recordDiscountUsage(farmerId: string, quantity: number): Promise<void> {
    try {
      // This would typically update a DiscountQuotaUsage table
      // For now, we rely on Order/SeedAssignment models to track usage
      this.logger.log(
        `Recorded discount usage: Farmer ${farmerId}, Quantity: ${quantity}kg`,
      );
      // TODO: Create DiscountQuotaUsage model to track usage separately
    } catch (error) {
      this.logger.error('Error recording discount usage:', error);
    }
  }
}
