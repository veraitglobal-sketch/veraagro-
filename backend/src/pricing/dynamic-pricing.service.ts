import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountQuotaService } from './discount-quota.service';

/**
 * Dynamic Pricing Service
 * Calculates seed prices in real-time based on farmer status and farm size
 * 
 * Logic:
 * - If farmer is partner: 30% discount
 * - Discount applies only up to limit: 200kg per hectare
 * - Everything above limit: full price
 */
@Injectable()
export class DynamicPricingService {
  private readonly logger = new Logger(DynamicPricingService.name);
  private readonly PARTNER_DISCOUNT_RATE = 0.30; // 30% discount
  private readonly DISCOUNT_LIMIT_KG_PER_HECTARE = 200; // 200kg per hectare

  constructor(
    private prisma: PrismaService,
    private discountQuota: DiscountQuotaService,
  ) {}

  /**
   * Calculate seed price for a farmer
   * 
   * @param farmerId Farmer ID
   * @param quantity Quantity of seed in kg
   * @param seedType Optional: seed type (for specific pricing)
   * @returns Price calculation result
   */
  async calculateSeedPrice(
    farmerId: string,
    quantity: number,
    seedType?: string,
  ): Promise<{
    farmerId: string;
    quantity: number;
    isPartner: boolean;
    farmAreaHectares: number;
    discountLimit: number; // Max kg eligible for discount
    discountEligibleQuantity: number; // Quantity eligible for discount
    fullPriceQuantity: number; // Quantity at full price
    standardPricePerKg: number;
    partnerPricePerKg: number;
    discountAmount: number;
    subtotal: number;
    total: number;
    breakdown: {
      discounted: {
        quantity: number;
        pricePerKg: number;
        subtotal: number;
      };
      fullPrice: {
        quantity: number;
        pricePerKg: number;
        subtotal: number;
      };
    };
  }> {
    // Step 1: Get farmer profile
    // Note: Using FarmerProfile from biovera-core schema, fallback to User
    let farmerProfile;
    let isPartner = false;

    try {
      farmerProfile = await (this.prisma as any).farmerProfile.findUnique({
        where: { userId: farmerId },
        include: {
          user: {
            select: {
              id: true,
              isVeraPartner: true,
            },
          },
        },
      });
      isPartner = farmerProfile?.isVeraPartner || farmerProfile?.user?.isVeraPartner;
    } catch (error) {
      // Fallback: Check User model directly
      const user = await this.prisma.users.findUnique({
        where: { id: farmerId },
        select: {
          id: true,
        },
      });
      if (!user) {
        throw new NotFoundException(`User ${farmerId} not found`);
      }
      // User model has isVeraPartner field
      isPartner = (user as any).isVeraPartner || false;
    }

    // Step 2: Get farm area (in hectares)
    const estates = await this.prisma.estates.findMany({
      where: { ownerId: farmerId },
      select: {
        calculatedArea: true, // Area in square meters
      },
    });

    // Calculate total farm area in hectares
    const totalAreaSquareMeters = estates.reduce(
      (sum, estate) => sum + (estate.calculatedArea || 0),
      0,
    );
    const farmAreaHectares = totalAreaSquareMeters / 10000; // Convert m² to hectares

    // Step 3: Get seed pricing (from SeedInventory or default)
    let standardPricePerKg = 10.0; // Default price (should come from SeedInventory)
    let partnerPricePerKg = standardPricePerKg * (1 - this.PARTNER_DISCOUNT_RATE);

    if (seedType) {
      // Try to get price from SeedInventory (biovera-core schema)
      try {
        const seedInventory = await (this.prisma as any).seedInventory.findFirst({
          where: {
            seedType: seedType,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (seedInventory) {
          standardPricePerKg = seedInventory.standardPrice;
          partnerPricePerKg = seedInventory.partnerPrice;
        }
      } catch (error) {
        // Fallback: Try Seed model (if SeedBatch doesn't exist)
        try {
          const seed = await this.prisma.seeds.findFirst({
            where: {
              name: {
                contains: seedType,
                mode: 'insensitive',
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
          // Seed model doesn't have pricing, use defaults
        } catch (seedError) {
          // Use default pricing
          this.logger.warn(`Could not find seed pricing for ${seedType}, using defaults`);
        }
      }
    }

    // Step 4: CRITICAL SECURITY - Check discount quota to prevent abuse
    let discountEligibleQuantity = 0;
    let fullPriceQuantity = 0;
    let discountAmount = 0;
    let subtotal = 0;

    if (isPartner) {
      // Check discount quota (prevents abuse across multiple orders)
      const quotaCheck = await this.discountQuota.checkDiscountQuota(
        farmerId,
        quantity,
      );

      if (!quotaCheck.allowed) {
        // Discount quota exceeded - throw error
        throw new ForbiddenException(quotaCheck.reason || 'Discount limit exceeded');
      }

      // Calculate discount limit from quota check
      const discountLimit = quotaCheck.discountLimit;
      const remaining = quotaCheck.remaining;

      // Partner gets discount up to remaining quota
      if (quantity <= remaining) {
        // All quantity eligible for discount
        discountEligibleQuantity = quantity;
        fullPriceQuantity = 0;
      } else {
        // Only remaining quota eligible for discount
        discountEligibleQuantity = remaining;
        fullPriceQuantity = quantity - remaining;
      }

      // Calculate totals
      const discountedSubtotal = discountEligibleQuantity * partnerPricePerKg;
      const fullPriceSubtotal = fullPriceQuantity * standardPricePerKg;
      subtotal = discountedSubtotal + fullPriceSubtotal;
      discountAmount = discountEligibleQuantity * (standardPricePerKg - partnerPricePerKg);
    } else {
      // Non-partner: full price for all
      discountEligibleQuantity = 0;
      fullPriceQuantity = quantity;
      subtotal = quantity * standardPricePerKg;
      discountAmount = 0;
    }

    const total = subtotal;

    // Step 6: Return calculation result
    return {
      farmerId,
      quantity,
      isPartner,
      farmAreaHectares: Math.round(farmAreaHectares * 100) / 100, // Round to 2 decimals
      discountLimit: Math.round((discountEligibleQuantity > 0 ? (farmAreaHectares * this.DISCOUNT_LIMIT_KG_PER_HECTARE) : 0) * 100) / 100,
      discountEligibleQuantity: Math.round(discountEligibleQuantity * 100) / 100,
      fullPriceQuantity: Math.round(fullPriceQuantity * 100) / 100,
      standardPricePerKg: Math.round(standardPricePerKg * 100) / 100,
      partnerPricePerKg: Math.round(partnerPricePerKg * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      breakdown: {
        discounted: {
          quantity: discountEligibleQuantity,
          pricePerKg: partnerPricePerKg,
          subtotal: Math.round(discountEligibleQuantity * partnerPricePerKg * 100) / 100,
        },
        fullPrice: {
          quantity: fullPriceQuantity,
          pricePerKg: standardPricePerKg,
          subtotal: Math.round(fullPriceQuantity * standardPricePerKg * 100) / 100,
        },
      },
    };
  }

  /**
   * Get pricing preview (without creating order)
   * 
   * @param farmerId Farmer ID
   * @param quantity Quantity in kg
   * @param seedType Optional seed type
   */
  async getPricingPreview(
    farmerId: string,
    quantity: number,
    seedType?: string,
  ) {
    return this.calculateSeedPrice(farmerId, quantity, seedType);
  }
}
