/** Lot-scoped passport helpers — keep history tied to one planting/harvest chain. */

export const EXCLUDED_HARVEST_STATUSES = ['CANCELLED', 'REJECTED'] as const;

export const FRESHNESS_ESTIMATE_SOURCE = 'freshness_trackers' as const;
export const PLATFORM_STANDARD_SOURCE = 'bio_vera_standards' as const;

export type LinkageStatus = 'confirmed' | 'notRecorded';

export interface PlantingChain {
  plantingId: string | null;
  harvestId: string | null;
  announcementIds: string[];
}

export interface PlatformTemperatureStandard {
  minC: number;
  maxC: number;
  source: typeof PLATFORM_STANDARD_SOURCE;
  label: string;
}

export interface FreshnessEstimate {
  remainingHours: number | null;
  estimatedExpiresAt: Date | null;
  modelShelfLifeHours: number | null;
  source: typeof FRESHNESS_ESTIMATE_SOURCE;
}

export interface LotPackagingFormat {
  label: string | null;
  packSizeKg: number | null;
  /** Informational — recorded on orders packed from this lot, not this physical pack. */
  scope: 'lot_orders';
}

export interface IdentifiedPackaging {
  badgeSerial: string;
  badgeType: string;
  linkage: 'confirmed';
}

export function resolvePlantingChain(
  batchHarvestAnnouncementId: string | null | undefined,
  harvestRow?: {
    id: string;
    sourcePlantingId: string | null;
    status: string;
    announcementType?: string | null;
  } | null,
): PlantingChain {
  const harvestId =
    batchHarvestAnnouncementId &&
    harvestRow &&
    harvestRow.id === batchHarvestAnnouncementId &&
    !EXCLUDED_HARVEST_STATUSES.includes(harvestRow.status as (typeof EXCLUDED_HARVEST_STATUSES)[number])
      ? harvestRow.id
      : batchHarvestAnnouncementId &&
          harvestRow &&
          harvestRow.id === batchHarvestAnnouncementId &&
          EXCLUDED_HARVEST_STATUSES.includes(harvestRow.status as (typeof EXCLUDED_HARVEST_STATUSES)[number])
        ? null
        : batchHarvestAnnouncementId ?? null;

  const plantingId =
    harvestRow && harvestRow.sourcePlantingId && harvestId ? harvestRow.sourcePlantingId : null;

  const announcementIds = [plantingId, harvestId].filter(Boolean) as string[];
  return { plantingId, harvestId, announcementIds };
}

export function isLinkedGrowthLog(
  log: { harvestAnnouncementId?: string | null; moderationStatus?: string | null },
  chain: PlantingChain,
): boolean {
  if (log.moderationStatus === 'REJECTED') return false;
  if (!chain.announcementIds.length) return false;
  if (!log.harvestAnnouncementId) return false;
  return chain.announcementIds.includes(log.harvestAnnouncementId);
}

export function isLinkedFieldEntry(
  entry: { plantingId?: string | null },
  chain: PlantingChain,
): boolean {
  if (!chain.plantingId && !chain.harvestId) return false;
  return Boolean(entry.plantingId && chain.announcementIds.includes(entry.plantingId));
}

export function isLinkedSeed(
  seed: { plantingId?: string | null },
  chain: PlantingChain,
): boolean {
  if (seed.plantingId && chain.announcementIds.includes(seed.plantingId)) return true;
  return Boolean(chain.plantingId && seed.plantingId === chain.plantingId);
}

/** Distinct pack formats recorded on orders for this lot — never summed as lot quantity. */
export function buildLotPackagingFormats(
  orders: Array<{ packLabel: string | null; packSizeKg: number | null }>,
): LotPackagingFormat[] {
  const seen = new Map<string, LotPackagingFormat>();
  for (const o of orders) {
    if (!o.packLabel && o.packSizeKg == null) continue;
    const key = `${o.packLabel ?? ''}|${o.packSizeKg ?? ''}`;
    if (!seen.has(key)) {
      seen.set(key, { label: o.packLabel, packSizeKg: o.packSizeKg, scope: 'lot_orders' });
    }
  }
  return [...seen.values()];
}

export function buildPlatformStandard(minC: number, maxC: number): PlatformTemperatureStandard {
  return {
    minC,
    maxC,
    source: PLATFORM_STANDARD_SOURCE,
    label: `${minC}–${maxC} °C`,
  };
}

export function buildFreshnessEstimate(tracker: {
  remainingShelfLifeHours: number;
  expiresAt: Date;
  shelfLifeHours: number;
} | null): FreshnessEstimate | null {
  if (!tracker) return null;
  return {
    remainingHours: tracker.remainingShelfLifeHours,
    estimatedExpiresAt: tracker.expiresAt,
    modelShelfLifeHours: tracker.shelfLifeHours,
    source: FRESHNESS_ESTIMATE_SOURCE,
  };
}

export interface PassportSummaryInput {
  productName: string;
  variety: string | null;
  varietyLinkage: LinkageStatus;
  productPhotoUrl: string | null;
  photoLinkage: LinkageStatus;
  producerName: string;
  regionLabel: string;
  productionCountry: string | null;
  actualHarvestDate: Date | null;
  harvestDateLinkage: LinkageStatus;
  lotBatchId: string;
  lotQuantity: number;
  lotUnit: string;
  identifiedPackaging: IdentifiedPackaging | null;
  platformStandard: PlatformTemperatureStandard | null;
  productStorageConditions: string | null;
  productStorageLinkage: LinkageStatus;
  declaredShelfLifeHours: number | null;
  declaredExpiresAt: Date | null;
  freshnessEstimate: FreshnessEstimate | null;
}

export function buildPassportSummary(input: PassportSummaryInput) {
  return {
    productName: input.productName,
    variety: input.variety,
    varietyLinkage: input.varietyLinkage,
    productPhotoUrl: input.productPhotoUrl,
    photoLinkage: input.photoLinkage,
    producerName: input.producerName,
    regionLabel: input.regionLabel,
    productionCountry: input.productionCountry,
    actualHarvestDate: input.actualHarvestDate,
    harvestDateLinkage: input.harvestDateLinkage,
    lot: {
      batchId: input.lotBatchId,
      totalQuantity: input.lotQuantity,
      unit: input.lotUnit,
    },
    identifiedPackaging: input.identifiedPackaging,
    storage: {
      productStorageConditions: input.productStorageConditions,
      productStorageLinkage: input.productStorageLinkage,
      platformStandard: input.platformStandard,
      declaredShelfLifeHours: input.declaredShelfLifeHours,
      declaredExpiresAt: input.declaredExpiresAt,
      freshnessEstimate: input.freshnessEstimate,
    },
  };
}

export function readingsWithinRange(temps: number[], minC: number, maxC: number): boolean | null {
  if (temps.length === 0) return null;
  return temps.every((t) => t >= minC && t <= maxC);
}

export function coldChainPresentation(
  readingsCount: number,
  withinCriteria: boolean | null,
  standard: PlatformTemperatureStandard | null,
) {
  return {
    hasReadings: readingsCount > 0,
    /** Spot readings only — never implies uninterrupted cold-chain control. */
    continuousControlConfirmed: false,
    readingsWithinCriteria: readingsCount > 0 ? withinCriteria : null,
    readingsCount,
    evaluationCriteria: standard
      ? `${standard.label} (${standard.source})`
      : null,
    platformStandard: standard,
  };
}

export function buildPassportWarnings(input: {
  isCompromised: boolean;
  seedRecalled: boolean;
}): Array<{ code: string; severity: 'warning' | 'critical'; messageKey: string }> {
  const warnings: Array<{ code: string; severity: 'warning' | 'critical'; messageKey: string }> = [];
  if (input.isCompromised) {
    warnings.push({
      code: 'TEMPERATURE_DEVIATION',
      severity: 'critical',
      messageKey: 'passport.warning.temperatureDeviation',
    });
  }
  if (input.seedRecalled) {
    warnings.push({
      code: 'SEED_RECALLED',
      severity: 'critical',
      messageKey: 'passport.warning.seedRecalled',
    });
  }
  return warnings;
}
