import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SkuService } from '../sku/sku.service';
import { RoutingService } from '../routing/routing.service';

export interface DistributorInfo {
  id: string;
  name: string;
  country: string;
  city: string;
  importDutyTracker: {
    totalImported: number; // kg
    dutyPaid: number; // EUR
    pendingDuty: number; // EUR
    lastImportDate: Date;
  };
  assignedRetailChains: string[];
  sponsoredFarmers: Array<{
    farmerId: string;
    farmerName: string;
    packagingMaterialsProvided: number; // crates
  }>;
}

export interface GuaranteedSaleLedger {
  distributorId: string;
  distributorName: string;
  demand: {
    totalOrders: number; // kg
    orders: Array<{
      retailerId: string;
      retailerName: string;
      quantity: number; // kg
      sku: string;
      orderDate: Date;
      status: string;
    }>;
  };
  supply: {
    totalConfirmed: number; // kg
    harvests: Array<{
      farmerId: string;
      farmerName: string;
      quantity: number; // kg
      sku: string;
      harvestDate: Date;
      status: string;
    }>;
  };
  balance: {
    surplus: number; // kg (positive = more supply than demand)
    deficit: number; // kg (negative = more demand than supply)
    guaranteed: boolean; // All demand covered by supply
  };
}

export interface FinancialFlow {
  batchId: string;
  steps: Array<{
    step: string;
    actor: string;
    value: number; // EUR
    cost: number; // EUR
    margin: number; // EUR
  }>;
  totalValue: number;
  bioVeraMargin: number;
}

@Injectable()
export class OperationsService {
  constructor(
    private prisma: PrismaService,
    private skuService: SkuService,
    private routingService: RoutingService,
  ) {}

  /**
   * Get distributor import/export information
   */
  async getDistributorInfo(distributorId: string): Promise<DistributorInfo> {
    // In production, fetch from database
    // Mock data for now
    return {
      id: distributorId,
      name: 'Hamburg Distribution Hub',
      country: 'Germany',
      city: 'Hamburg',
      importDutyTracker: {
        totalImported: 15000, // kg
        dutyPaid: 4500, // EUR
        pendingDuty: 1200, // EUR
        lastImportDate: new Date('2024-01-10'),
      },
      assignedRetailChains: ['Rewe', 'Edeka', 'Lidl'],
      sponsoredFarmers: [
        {
          farmerId: 'FARMER-001',
          farmerName: 'Hill Orchards Co-op',
          packagingMaterialsProvided: 500, // crates
        },
        {
          farmerId: 'FARMER-002',
          farmerName: 'Valley Berries',
          packagingMaterialsProvided: 300, // crates
        },
      ],
    };
  }

  /**
   * Get guaranteed sale ledger for distributor
   */
  async getGuaranteedSaleLedger(distributorId: string): Promise<GuaranteedSaleLedger> {
    // In production, calculate from orders and harvests
    // Mock data for now
    return {
      distributorId,
      distributorName: 'Hamburg Distribution Hub',
      demand: {
        totalOrders: 8500, // kg
        orders: [
          {
            retailerId: 'RETAIL-001',
            retailerName: 'Rewe Store A',
            quantity: 2000,
            sku: 'BIO-VERA-RASP-125G-PREM',
            orderDate: new Date('2024-01-08'),
            status: 'CONFIRMED',
          },
          {
            retailerId: 'RETAIL-002',
            retailerName: 'Edeka Store B',
            quantity: 1500,
            sku: 'BIO-VERA-BLACK-250G-PREM',
            orderDate: new Date('2024-01-09'),
            status: 'CONFIRMED',
          },
        ],
      },
      supply: {
        totalConfirmed: 9000, // kg
        harvests: [
          {
            farmerId: 'FARMER-001',
            farmerName: 'Hill Orchards Co-op',
            quantity: 5000,
            sku: 'BIO-VERA-RASP-125G-PREM',
            harvestDate: new Date('2024-01-10'),
            status: 'CONFIRMED',
          },
          {
            farmerId: 'FARMER-002',
            farmerName: 'Valley Berries',
            quantity: 4000,
            sku: 'BIO-VERA-BLACK-250G-PREM',
            harvestDate: new Date('2024-01-11'),
            status: 'CONFIRMED',
          },
        ],
      },
      balance: {
        surplus: 500, // kg
        deficit: 0,
        guaranteed: true, // All demand covered
      },
    };
  }

  /**
   * Calculate financial flow for a batch
   */
  async getFinancialFlow(batchId: string): Promise<FinancialFlow> {
    const batch = await this.prisma.batches.findUnique({
      where: { id: batchId },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
        // order: true, // Not in schema
        missions: {
          include: {
            users_missions_logisticsPartnerIdTousers: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const farmerPrice = (batch as any).order?.pricePerUnit || 8.5; // EUR per kg
    const quantity = batch.quantity;
    const farmerTotal = farmerPrice * quantity;

    const logisticsCost = 0.15 * quantity; // EUR per kg
    const importDuty = 0.30 * quantity; // EUR per kg (for EU import)
    const distributorMargin = 0.20 * quantity; // EUR per kg
    const retailPrice = 12.0; // EUR per kg
    const retailTotal = retailPrice * quantity;

    const bioVeraMargin = retailTotal - farmerTotal - logisticsCost - importDuty - distributorMargin;

    return {
      batchId,
      steps: [
        {
          step: 'Farm',
          actor: ((batch as any).estate?.owner?.firstName || '') + ' ' + ((batch as any).estate?.owner?.lastName || ''),
          value: farmerTotal,
          cost: 0,
          margin: 0,
        },
        {
          step: 'Logistics',
          actor: ((batch as any).missions?.[0]?.logisticsPartner?.firstName) || 'Logistics Partner',
          value: farmerTotal + logisticsCost,
          cost: logisticsCost,
          margin: 0,
        },
        {
          step: 'Import Duty',
          actor: 'EU Customs',
          value: farmerTotal + logisticsCost + importDuty,
          cost: importDuty,
          margin: 0,
        },
        {
          step: 'Distributor',
          actor: 'Distribution Hub',
          value: farmerTotal + logisticsCost + importDuty + distributorMargin,
          cost: distributorMargin,
          margin: distributorMargin,
        },
        {
          step: 'Retail',
          actor: 'Supermarket',
          value: retailTotal,
          cost: 0,
          margin: retailTotal - (farmerTotal + logisticsCost + importDuty + distributorMargin),
        },
      ],
      totalValue: retailTotal,
      bioVeraMargin,
    };
  }
}
