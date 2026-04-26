import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Financial Dashboard Service
 *
 * Shows:
 * - Cumulative margin profit (seed margin, transport margin)
 * - Group certification savings
 * - Packaging commissions
 */
@Injectable()
export class FinancialDashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive financial dashboard data
   */
  async getFinancialDashboard(userId?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get all completed orders/batches
    const batches = await this.prisma.batches.findMany({
      where: {
        status: { in: ['DELIVERED', 'QUALITY_VERIFIED'] },
        ...(userId && {
          estates: {
            ownerId: userId,
          },
        }),
      },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
        order_items: {
          include: {
            orders: {
              include: {
                payments: true,
              },
            },
          },
        },
      },
    });

    // Calculate metrics
    const metrics = {
      totalProfit: 0,
      seedMargin: 0,
      transportMargin: 0,
      packagingCommissions: 0,
      groupCertificationSavings: 0,
      insuranceCommissions: 0,
      veraBonus: 0,
    };

    // Process each batch
    for (const batch of batches) {
      // Seed margin calculation
      const seedMargin = await this.calculateSeedMargin(batch);
      metrics.seedMargin += seedMargin;

      // Transport margin
      const transportMargin = await this.calculateTransportMargin(batch);
      metrics.transportMargin += transportMargin;

      // Packaging commissions
      const packagingCommission = await this.calculatePackagingCommission(
        batch,
      );
      metrics.packagingCommissions += packagingCommission;

      // Group certification savings
      const certificationSavings = await this.calculateCertificationSavings(
        batch,
      );
      metrics.groupCertificationSavings += certificationSavings;

      // Insurance commissions
      const insuranceCommission = await this.calculateInsuranceCommission(
        batch,
      );
      metrics.insuranceCommissions += insuranceCommission;

      // Vera bonus (paid to farmers, cost to platform)
      const veraBonus = await this.calculateVeraBonus(batch);
      metrics.veraBonus += veraBonus;
    }

    // Total profit = all margins - vera bonus
    metrics.totalProfit =
      metrics.seedMargin +
      metrics.transportMargin +
      metrics.packagingCommissions +
      metrics.groupCertificationSavings +
      metrics.insuranceCommissions -
      metrics.veraBonus;

    // Get monthly and yearly breakdowns
    const monthlyBreakdown = await this.getMonthlyBreakdown(
      startOfMonth,
      userId,
    );
    const yearlyBreakdown = await this.getYearlyBreakdown(
      startOfYear,
      userId,
    );

    return {
      summary: {
        totalProfit: metrics.totalProfit,
        seedMargin: metrics.seedMargin,
        transportMargin: metrics.transportMargin,
        packagingCommissions: metrics.packagingCommissions,
        groupCertificationSavings: metrics.groupCertificationSavings,
        insuranceCommissions: metrics.insuranceCommissions,
        veraBonusPaid: metrics.veraBonus,
        netProfit: metrics.totalProfit,
      },
      monthly: monthlyBreakdown,
      yearly: yearlyBreakdown,
      breakdown: {
        bySource: {
          seedMargin: metrics.seedMargin,
          transportMargin: metrics.transportMargin,
          packagingCommissions: metrics.packagingCommissions,
          certificationSavings: metrics.groupCertificationSavings,
          insuranceCommissions: metrics.insuranceCommissions,
        },
        byPeriod: {
          thisMonth: monthlyBreakdown,
          thisYear: yearlyBreakdown,
        },
      },
    };
  }

  /**
   * Calculate seed margin (difference between partner and standard price)
   */
  private async calculateSeedMargin(batch: any): Promise<number> {
    // In production, this would check seed_batches table
    // For now, estimate based on typical margin
    const estimatedMarginPerKg = 0.15; // €0.15 per kg
    return batch.quantity * estimatedMarginPerKg;
  }

  /**
   * Calculate transport margin
   */
  private async calculateTransportMargin(batch: any): Promise<number> {
    // Transport margin is difference between what buyer pays and actual cost
    const estimatedMarginPerKg = 0.05; // €0.05 per kg
    return batch.quantity * estimatedMarginPerKg;
  }

  /**
   * Calculate packaging commissions
   */
  private async calculatePackagingCommission(batch: any): Promise<number> {
    // Commission from selling Bio Vera packaging materials
    const cratesUsed = Math.ceil(batch.quantity / 10); // 10kg per crate
    const commissionPerCrate = 0.10; // €0.10 commission per crate
    return cratesUsed * commissionPerCrate;
  }

  /**
   * Calculate group certification savings
   */
  private async calculateCertificationSavings(batch: any): Promise<number> {
      // Savings from group certification vs individual certification
      const estate = batch.estates;
      if (estate?.status === 'CERTIFIED') {
      // Individual certification would cost ~€500 per estate
      // Group certification costs ~€100 per estate (shared cost)
      // Savings = €400 per certified estate
      return 400;
    }
    return 0;
  }

  /**
   * Calculate insurance commissions
   */
  private async calculateInsuranceCommission(batch: any): Promise<number> {
    // Commission from insurance policies
    const estimatedCommission = 0.02; // 2% of batch value
    const estimatedBatchValue = batch.quantity * 8.5; // €8.50 per kg
    return estimatedBatchValue * estimatedCommission;
  }

  /**
   * Calculate Vera bonus (cost to platform, benefit to farmer)
   */
  private async calculateVeraBonus(batch: any): Promise<number> {
    // Vera bonus is paid to farmers for compliance
    // This is a cost to the platform
    const estimatedBonus = 0.05; // €0.05 per kg
    return batch.quantity * estimatedBonus;
  }

  /**
   * Get monthly breakdown
   */
  private async getMonthlyBreakdown(startDate: Date, userId?: string) {
    const batches = await this.prisma.batches.findMany({
      where: {
        status: { in: ['DELIVERED', 'QUALITY_VERIFIED'] },
        createdAt: { gte: startDate },
        ...(userId && {
          estates: {
            ownerId: userId,
          },
        }),
      },
    });

    return {
      totalBatches: batches.length,
      totalQuantity: batches.reduce((sum, b) => sum + b.quantity, 0),
      period: 'This Month',
    };
  }

  /**
   * Get yearly breakdown
   */
  private async getYearlyBreakdown(startDate: Date, userId?: string) {
    const batches = await this.prisma.batches.findMany({
      where: {
        status: { in: ['DELIVERED', 'QUALITY_VERIFIED'] },
        createdAt: { gte: startDate },
        ...(userId && {
          estates: {
            ownerId: userId,
          },
        }),
      },
    });

    return {
      totalBatches: batches.length,
      totalQuantity: batches.reduce((sum, b) => sum + b.quantity, 0),
      period: 'This Year',
    };
  }
}
