/**
 * PHI (Pre-Harvest Interval) Validation Service
 * Shared logic for PHI checks – used by backend, mobile, web
 */

export interface TreatmentEntry {
  appliedAt: Date | string;
  productId: string;
  phiDays: number;
  productName?: string;
}

export interface PhiValidationResult {
  allowed: boolean;
  earliestHarvestDate: Date | null;
  reason?: string;
  blockingTreatments?: Array<{
    productName: string;
    appliedAt: Date;
    phiDays: number;
    harvestOkFrom: Date;
  }>;
}

/**
 * Calculate earliest harvest date from treatments (last application + PHI days)
 */
export function calculateEarliestHarvestDate(
  treatments: TreatmentEntry[]
): Date | null {
  if (!treatments?.length) return null;
  let latestBlocking = new Date(0);
  for (const t of treatments) {
    const phi = t.phiDays ?? 0;
    if (phi > 0) {
      const applied = new Date(t.appliedAt);
      const harvestOk = new Date(applied);
      harvestOk.setDate(harvestOk.getDate() + phi);
      if (harvestOk > latestBlocking) latestBlocking = harvestOk;
    }
  }
  if (latestBlocking.getTime() === new Date(0).getTime()) return null;
  return latestBlocking;
}

/**
 * Validate if harvest is allowed on given date
 */
export function validatePhi(
  treatments: TreatmentEntry[],
  harvestDate: Date | string
): PhiValidationResult {
  const earliestHarvest = calculateEarliestHarvestDate(treatments);
  const harvest = new Date(harvestDate);

  if (!earliestHarvest) {
    return {
      allowed: true,
      earliestHarvestDate: null,
    };
  }

  const allowed = harvest >= earliestHarvest;
  const blockingTreatments: PhiValidationResult['blockingTreatments'] = [];
  for (const t of treatments) {
    const phi = t.phiDays ?? 0;
    if (phi > 0) {
      const applied = new Date(t.appliedAt);
      const harvestOk = new Date(applied);
      harvestOk.setDate(harvestOk.getDate() + phi);
      if (harvestOk > harvest) {
        blockingTreatments.push({
          productName: t.productName || t.productId,
          appliedAt: applied,
          phiDays: phi,
          harvestOkFrom: harvestOk,
        });
      }
    }
  }

  return {
    allowed,
    earliestHarvestDate: earliestHarvest,
    reason: allowed
      ? undefined
      : `Pre-harvest interval (PHI) from last treatment. Earliest harvest: ${earliestHarvest.toISOString().split('T')[0]}`,
    blockingTreatments: blockingTreatments.length ? blockingTreatments : undefined,
  };
}
