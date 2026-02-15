/**
 * Farmer Payout Calculation Service
 * Shared logic for payment splits – used by backend, web admin
 */

export interface PayoutInput {
  /** Base price per unit (EUR) */
  basePricePerUnit: number;
  /** Quantity sold */
  quantity: number;
  /** Transport cost (EUR) */
  transportCost: number;
  /** Seed margin (partner vs standard price diff) */
  seedMargin: number;
  /** Insurance commission */
  insuranceCommission: number;
  /** Vera bonus for compliance */
  veraBonus: number;
  /** Transport margin (platform) */
  transportMargin?: number;
}

export interface PayoutResult {
  /** Total buyer payment */
  total: number;
  /** Farmer receives (base + vera bonus) */
  farmerShare: number;
  /** Driver receives */
  driverShare: number;
  /** Platform receives (seed margin + insurance + transport margin) */
  platformShare: number;
  /** Breakdown for audit */
  breakdown: {
    farmerBase: number;
    farmerVeraBonus: number;
    driverTransport: number;
    platformSeedMargin: number;
    platformInsurance: number;
    platformTransport: number;
  };
}

/**
 * Calculate payment split per BioVera flow
 * Buyer Payment → Escrow → Split: Farmer, Driver, Platform
 */
export function calculatePayout(input: PayoutInput): PayoutResult {
  const {
    basePricePerUnit,
    quantity,
    transportCost,
    seedMargin,
    insuranceCommission,
    veraBonus,
    transportMargin = 0,
  } = input;

  const farmerBase = basePricePerUnit * quantity;
  const total = farmerBase + transportCost + seedMargin + insuranceCommission + transportMargin;

  const farmerShare = farmerBase + veraBonus;
  const driverShare = transportCost;
  const platformShare = seedMargin + insuranceCommission + transportMargin;

  return {
    total,
    farmerShare,
    driverShare,
    platformShare,
    breakdown: {
      farmerBase,
      farmerVeraBonus: veraBonus,
      driverTransport: transportCost,
      platformSeedMargin: seedMargin,
      platformInsurance: insuranceCommission,
      platformTransport: transportMargin,
    },
  };
}
