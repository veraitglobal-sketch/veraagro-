/**
 * GlobalG.A.P. Conditions Validation Service
 * Shared logic for compliance checks
 */

export interface GlobalGapInput {
  /** Has GPS boundaries for parcels */
  hasGpsBoundaries: boolean;
  /** Has treatment logs (spray records) */
  hasTreatmentLogs: boolean;
  /** All treatments use whitelist products */
  treatmentsOnWhitelist: boolean;
  /** PHI respected (no harvest before PHI elapsed) */
  phiRespected: boolean;
  /** Has KYC documents */
  hasKyc: boolean;
  /** Has compliance photos (packing, etc.) */
  hasCompliancePhotos: boolean;
  /** Has lab results (if required) */
  hasLabResults?: boolean;
  /** Sedex / audit status (if applicable) */
  sedexStatus?: 'PASS' | 'PENDING' | 'FAIL' | 'NOT_APPLICABLE';
}

export interface GlobalGapResult {
  compliant: boolean;
  score: number; // 0–100
  checklist: Array<{
    item: string;
    pass: boolean;
    note?: string;
  }>;
  blockingItems: string[];
}

const WEIGHTS: Record<string, number> = {
  hasGpsBoundaries: 15,
  hasTreatmentLogs: 20,
  treatmentsOnWhitelist: 25,
  phiRespected: 20,
  hasKyc: 10,
  hasCompliancePhotos: 10,
  hasLabResults: 5,
  sedexStatus: 5,
};

/**
 * Validate GlobalG.A.P. conditions
 */
export function validateGlobalGap(input: GlobalGapInput): GlobalGapResult {
  const checklist: GlobalGapResult['checklist'] = [];
  const blockingItems: string[] = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  const add = (
    key: string,
    pass: boolean,
    item: string,
    note?: string
  ) => {
    const w = WEIGHTS[key] ?? 0;
    totalWeight += w;
    if (pass) earnedWeight += w;
    else if (w >= 15) blockingItems.push(item);
    checklist.push({ item, pass, note });
  };

  add('hasGpsBoundaries', input.hasGpsBoundaries, 'GPS parcel boundaries defined');
  add('hasTreatmentLogs', input.hasTreatmentLogs, 'Treatment logs present');
  add('treatmentsOnWhitelist', input.treatmentsOnWhitelist, 'All treatments use whitelist products');
  add('phiRespected', input.phiRespected, 'Pre-harvest interval (PHI) respected');
  add('hasKyc', input.hasKyc, 'KYC documents provided');
  add('hasCompliancePhotos', input.hasCompliancePhotos, 'Compliance photos uploaded');

  const labOk = input.hasLabResults !== false;
  add('hasLabResults', labOk, 'Lab results available', labOk ? undefined : 'Required for some crops');

  const sedexOk =
    !input.sedexStatus ||
    input.sedexStatus === 'PASS' ||
    input.sedexStatus === 'NOT_APPLICABLE';
  add(
    'sedexStatus',
    sedexOk,
    'Sedex / audit status',
    input.sedexStatus === 'FAIL' ? 'Audit failed' : undefined
  );

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const compliant = blockingItems.length === 0 && score >= 80;

  return {
    compliant,
    score,
    checklist,
    blockingItems,
  };
}
