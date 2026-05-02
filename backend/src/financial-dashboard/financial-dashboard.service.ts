import { Injectable } from '@nestjs/common';
import { bio_vera_standards, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getFarmerOwnerUserId } from '../orders/order-fulfillment.util';

type PlatformStandardsSlice = Pick<
  bio_vera_standards,
  'qualityPremiumAmount' | 'crateCostPerUnit' | 'labelCostPerUnit'
>;

type BatchForPlatformMetrics = Prisma.batchesGetPayload<{
  include: {
    estates: true;
    inventory: true;
    order_items: {
      include: {
        orders: { include: { payments: true } };
      };
    };
  };
}>;

/**
 * Financial Dashboard Service
 *
 * Shows:
 * - Cumulative margin profit (seed margin, transport margin)
 * - Group certification savings
 * - Packaging commissions
 * - Where the schema supports it, lines use DB-backed values (Bio Vera standards,
 *   inventory vs order lines, payments.platformFee, orders.totalAmount).
 */
@Injectable()
export class FinancialDashboardService {
  constructor(private prisma: PrismaService) {}

  private async loadDeliveredBatchesForPlatform() {
    return this.prisma.batches.findMany({
      where: {
        status: { in: ['DELIVERED'] },
      },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
        inventory: true,
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
  }

  /**
   * Get comprehensive financial dashboard data
   */
  async getFinancialDashboard(userId?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    if (userId) {
      return this.getGrowerFinancialDashboard(userId, startOfMonth, startOfYear);
    }

    const [batches, standardsRow] = await Promise.all([
      this.loadDeliveredBatchesForPlatform(),
      this.prisma.bio_vera_standards.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);
    const standards = standardsRow ?? this.defaultStandardsFallback();

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
      const seedMargin = this.calculateSeedMargin(batch);
      metrics.seedMargin += seedMargin;

      const transportMargin = this.calculateTransportMargin(batch);
      metrics.transportMargin += transportMargin;

      const packagingCommission = this.calculatePackagingCommission(
        batch,
        standards,
      );
      metrics.packagingCommissions += packagingCommission;

      const certificationSavings = this.calculateCertificationSavings(batch);
      metrics.groupCertificationSavings += certificationSavings;

      const insuranceCommission = this.calculateInsuranceCommission(batch);
      metrics.insuranceCommissions += insuranceCommission;

      const veraBonus = this.calculateVeraBonus(batch, standards);
      metrics.veraBonus += veraBonus;
    }

    const platformFeeBookedTotal =
      this.sumBookedPlatformFeesFromBatches(batches);

    // Total profit = model margins (incl. packaging/Vera from standards) - vera bonus.
    // `platformFeeBookedTotal` is reported separately — booked escrow share, not double-counted here.
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
      undefined,
    );
    const yearlyBreakdown = await this.getYearlyBreakdown(
      startOfYear,
      undefined,
    );

    return {
      dashboardRole: 'PLATFORM' as const,
      summary: {
        totalProfit: metrics.totalProfit,
        seedMargin: metrics.seedMargin,
        transportMargin: metrics.transportMargin,
        packagingCommissions: metrics.packagingCommissions,
        groupCertificationSavings: metrics.groupCertificationSavings,
        insuranceCommissions: metrics.insuranceCommissions,
        veraBonusPaid: metrics.veraBonus,
        netProfit: metrics.totalProfit,
        platformFeeBookedTotal,
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
          platformFeeBookedTotal,
        },
        byPeriod: {
          thisMonth: monthlyBreakdown,
          thisYear: yearlyBreakdown,
        },
      },
    };
  }

  /**
   * Grower-facing dashboard: sums `payments.farmerAmount` for orders where this user is the credited farmer
   * (see `getFarmerOwnerUserId`). Does not show platform seed/insurance margins — those are admin/platform metrics.
   */
  private async getGrowerFinancialDashboard(
    userId: string,
    startOfMonth: Date,
    startOfYear: Date,
  ) {
    const paymentRollup = await this.aggregateGrowerOrderPayments(userId);
    const batches = await this.prisma.batches.findMany({
      where: {
        status: { in: ['DELIVERED'] },
        estates: { ownerId: userId },
      },
    });
    const standardsRow = await this.prisma.bio_vera_standards.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    const standards = standardsRow ?? this.defaultStandardsFallback();

    let veraBonusEstimate = 0;
    for (const batch of batches) {
      veraBonusEstimate += this.calculateVeraBonus(batch, standards);
    }
    const monthlyBreakdown = await this.getMonthlyBreakdown(
      startOfMonth,
      userId,
    );
    const yearlyBreakdown = await this.getYearlyBreakdown(startOfYear, userId);

    return {
      dashboardRole: 'GROWER' as const,
      summary: {
        farmerOrderShareTotal: paymentRollup.totalFarmerAmount,
        farmerShareReleased: paymentRollup.released,
        farmerShareInEscrow: paymentRollup.inEscrow,
        farmerSharePending: paymentRollup.pendingOrOther,
        estimatedVeraBonusDeliveredLots: veraBonusEstimate,
        veraBonusPaid: veraBonusEstimate,
        totalProfit: paymentRollup.released,
        seedMargin: 0,
        transportMargin: 0,
        packagingCommissions: 0,
        groupCertificationSavings: 0,
        insuranceCommissions: 0,
        netProfit: paymentRollup.released,
      },
      monthly: monthlyBreakdown,
      yearly: yearlyBreakdown,
      breakdown: {
        bySource: {
          farmerOrderShareTotal: paymentRollup.totalFarmerAmount,
          farmerShareReleased: paymentRollup.released,
          farmerShareInEscrow: paymentRollup.inEscrow,
          farmerSharePending: paymentRollup.pendingOrOther,
          estimatedVeraBonusDeliveredLots: veraBonusEstimate,
        },
        byPeriod: {
          thisMonth: monthlyBreakdown,
          thisYear: yearlyBreakdown,
        },
      },
    };
  }

  private async aggregateGrowerOrderPayments(userId: string) {
    const orders = await this.prisma.orders.findMany({
      where: {
        payments: { isNot: null },
        OR: [
          { fulfilling_estate: { ownerId: userId } },
          { estates: { ownerId: userId } },
        ],
      },
      include: {
        payments: true,
        fulfilling_estate: true,
        estates: true,
      },
    });

    let totalFarmerAmount = 0;
    let released = 0;
    let inEscrow = 0;
    let pendingOrOther = 0;

    for (const order of orders) {
      if (getFarmerOwnerUserId(order) !== userId) {
        continue;
      }
      const p = order.payments;
      if (!p) {
        continue;
      }
      totalFarmerAmount += p.farmerAmount;
      if (p.status === 'RELEASED') {
        released += p.farmerAmount;
      } else if (p.status === 'IN_ESCROW') {
        inEscrow += p.farmerAmount;
      } else {
        pendingOrOther += p.farmerAmount;
      }
    }

    return { totalFarmerAmount, released, inEscrow, pendingOrOther };
  }

  private sumBookedPlatformFeesFromBatches(
    batches: BatchForPlatformMetrics[],
  ): number {
    const seen = new Set<string>();
    let sum = 0;
    for (const batch of batches) {
      for (const oi of batch.order_items ?? []) {
        const o = oi.orders;
        const p = o?.payments;
        if (!o?.id || !p || seen.has(o.id)) {
          continue;
        }
        seen.add(o.id);
        sum += p.platformFee;
      }
    }
    return sum;
  }

  private defaultStandardsFallback(): PlatformStandardsSlice {
    return {
      qualityPremiumAmount: 0.05,
      crateCostPerUnit: 0.5,
      labelCostPerUnit: 0.1,
    };
  }

  /**
   * Calculate seed margin (difference between partner and standard price)
   */
  private calculateSeedMargin(batch: BatchForPlatformMetrics): number {
    const inv = batch.inventory;
    const items = batch.order_items ?? [];
    if (inv && items.length > 0) {
      let lineRevenue = 0;
      for (const oi of items) {
        lineRevenue += oi.unitPrice * oi.quantity;
      }
      const costBasis = inv.unitPrice * batch.quantity;
      return Math.max(0, lineRevenue - costBasis);
    }
    const estimatedMarginPerKg = 0.15;
    return batch.quantity * estimatedMarginPerKg;
  }

  /**
   * Calculate transport margin
   */
  private calculateTransportMargin(batch: BatchForPlatformMetrics): number {
    const estimatedMarginPerKg = 0.05;
    return batch.quantity * estimatedMarginPerKg;
  }

  /**
   * Packaging commissions — from active Bio Vera standards (crate/label list).
   */
  private calculatePackagingCommission(
    batch: BatchForPlatformMetrics,
    standards: PlatformStandardsSlice,
  ): number {
    const cratesUsed = Math.ceil(batch.quantity / 10);
    const materialSpend =
      cratesUsed * standards.crateCostPerUnit +
      cratesUsed * standards.labelCostPerUnit;
    return materialSpend * 0.15;
  }

  /**
   * Calculate group certification savings
   */
  private calculateCertificationSavings(
    batch: BatchForPlatformMetrics,
  ): number {
    const estate = batch.estates;
    if (estate?.status === 'CERTIFIED') {
      return 400;
    }
    return 0;
  }

  /**
   * Insurance commission proxy — 2% of linked order totals when present.
   */
  private calculateInsuranceCommission(batch: BatchForPlatformMetrics): number {
    const RATE = 0.02;
    const seen = new Set<string>();
    let fromOrders = 0;
    for (const oi of batch.order_items ?? []) {
      const o = oi.orders;
      if (!o?.id || seen.has(o.id)) {
        continue;
      }
      seen.add(o.id);
      fromOrders += o.totalAmount * RATE;
    }
    if (fromOrders > 0) {
      return fromOrders;
    }
    return batch.quantity * 8.5 * RATE;
  }

  /**
   * Calculate Vera bonus (cost to platform) from standards quality premium × kg.
   */
  private calculateVeraBonus(
    batch: { quantity: number },
    standards: PlatformStandardsSlice,
  ): number {
    return batch.quantity * standards.qualityPremiumAmount;
  }

  /**
   * Get monthly breakdown
   */
  private async getMonthlyBreakdown(startDate: Date, userId?: string) {
    const batches = await this.prisma.batches.findMany({
      where: {
        status: { in: ['DELIVERED'] },
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
        status: { in: ['DELIVERED'] },
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
