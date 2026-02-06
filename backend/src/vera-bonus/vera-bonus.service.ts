import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Vera Bonus Calculator Service
 * Calculates bonus for farmers based on shipment quality
 * 
 * Logic:
 * - If shipment is marked as 'Washed & Sorted': Add fixed bonus per kg
 * - Bonus is added to base price
 * - Bonus is tracked separately for financial reporting
 */
@Injectable()
export class VeraBonusService {
  private readonly logger = new Logger(VeraBonusService.name);
  private readonly BONUS_PER_KG = 0.50; // Fixed bonus: 0.50 EUR per kg for washed & sorted

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate Vera Bonus for a shipment
   * 
   * @param shipmentId Shipment ID
   * @param isWashedAndSorted Whether product is washed and sorted
   * @returns Bonus calculation result
   */
  async calculateBonus(
    shipmentId: string,
    isWashedAndSorted: boolean,
  ): Promise<{
    shipmentId: string;
    isWashedAndSorted: boolean;
    quantity: number;
    bonusPerKg: number;
    totalBonus: number;
    basePrice: number;
    finalPrice: number;
  }> {
    // Step 1: Get shipment details
    // Note: Using Batch model if Shipment doesn't exist yet
    const shipment = await (this.prisma as any).shipment.findUnique({
      where: { id: shipmentId },
      select: {
        id: true,
        quantity: true,
        basePrice: true,
        veraBonusAmount: true,
        veraBonusEligible: true,
      },
    }).catch(async () => {
      // Fallback to Batch model if Shipment doesn't exist
      const batch = await this.prisma.batches.findUnique({
        where: { id: shipmentId },
        select: {
          id: true,
          quantity: true,
        },
      });
      if (batch) {
        return {
          id: batch.id,
          quantity: batch.quantity,
          basePrice: 0,
          veraBonusAmount: 0,
          veraBonusEligible: false,
        };
      }
      return null;
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }

    // Step 2: Calculate bonus if eligible
    let totalBonus = 0;
    if (isWashedAndSorted) {
      totalBonus = shipment.quantity * this.BONUS_PER_KG;
    }

    // Step 3: Calculate final price
    const basePrice = shipment.basePrice || 0;
    const finalPrice = basePrice + totalBonus;

    // Step 4: Update shipment with bonus information
    // Note: Using Batch model if Shipment doesn't exist yet
    try {
      await (this.prisma as any).shipment.update({
        where: { id: shipmentId },
        data: {
          veraBonusEligible: isWashedAndSorted,
          veraBonusAmount: totalBonus,
          finalPrice: finalPrice,
        },
      });
    } catch (error) {
      // If Shipment model doesn't exist, store in Batch or create a separate record
      this.logger.warn('Shipment model not found. Bonus calculated but not persisted.');
      // TODO: Store bonus in separate table or Batch model when Shipment is added
    }

    this.logger.log(
      `Vera Bonus calculated for shipment ${shipmentId}: ${totalBonus} EUR`,
    );

    // Step 5: Return calculation result
    return {
      shipmentId,
      isWashedAndSorted,
      quantity: shipment.quantity,
      bonusPerKg: isWashedAndSorted ? this.BONUS_PER_KG : 0,
      totalBonus: Math.round(totalBonus * 100) / 100,
      basePrice: Math.round(basePrice * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
    };
  }

  /**
   * Get bonus summary for a farmer
   * 
   * @param farmerId Farmer ID
   * @returns Bonus summary
   */
  async getBonusSummary(farmerId: string): Promise<{
    farmerId: string;
    totalShipments: number;
    eligibleShipments: number;
    totalBonusEarned: number;
    totalBonusPaid: number;
    pendingBonus: number;
  }> {
    // Note: Using Batch model if Shipment doesn't exist yet
    const shipments = await (this.prisma as any).shipment.findMany({
      where: { farmerId },
      select: {
        veraBonusEligible: true,
        veraBonusAmount: true,
        veraBonusPaid: true,
      },
    }).catch(async () => {
      // Fallback: Get batches for farmer
      const estates = await this.prisma.estates.findMany({
        where: { ownerId: farmerId },
        select: { id: true },
      });
      const batches = await this.prisma.batches.findMany({
        where: { estateId: { in: estates.map(e => e.id) } },
      });
      return batches.map(() => ({
        veraBonusEligible: false,
        veraBonusAmount: 0,
        veraBonusPaid: false,
      }));
    });

    const totalShipments = shipments.length;
    const eligibleShipments = shipments.filter((s) => s.veraBonusEligible).length;
    const totalBonusEarned = shipments.reduce(
      (sum, s) => sum + (s.veraBonusAmount || 0),
      0,
    );
    const totalBonusPaid = shipments
      .filter((s) => s.veraBonusPaid)
      .reduce((sum, s) => sum + (s.veraBonusAmount || 0), 0);
    const pendingBonus = totalBonusEarned - totalBonusPaid;

    return {
      farmerId,
      totalShipments,
      eligibleShipments,
      totalBonusEarned: Math.round(totalBonusEarned * 100) / 100,
      totalBonusPaid: Math.round(totalBonusPaid * 100) / 100,
      pendingBonus: Math.round(pendingBonus * 100) / 100,
    };
  }
}
