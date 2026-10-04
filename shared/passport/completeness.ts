/** Passport data completeness — distinguishes required, recommended, and N/A items. */

export type PassportCompletenessLevel = 'required' | 'recommended' | 'not_applicable';

export interface PassportCompletenessItem {
  id: string;
  level: PassportCompletenessLevel;
  labelKey: string;
  /** Grower/admin route to fix the gap */
  actionHref?: string;
  satisfied: boolean;
}

export interface PassportCompletenessInput {
  catalogProduct?: {
    name?: string | null;
    variety?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    storageConditions?: string | null;
    sourcePlantingId?: string | null;
  } | null;
  batch?: {
    harvestDate?: string | Date | null;
    actualPackDate?: string | Date | null;
    catalogProductId?: string | null;
    harvestAnnouncementId?: string | null;
  } | null;
  hasPackedOrders?: boolean;
  hasActiveBadge?: boolean;
  publicDocumentsCount?: number;
  hasQualityEntry?: boolean;
}

export function buildPassportCompleteness(input: PassportCompletenessInput): PassportCompletenessItem[] {
  const cp = input.catalogProduct;
  const batch = input.batch;
  const items: PassportCompletenessItem[] = [];

  items.push({
    id: 'product_name',
    level: 'required',
    labelKey: 'passportCompleteness.productName',
    actionHref: '/grower/catalog',
    satisfied: Boolean(cp?.name?.trim() || batch?.catalogProductId),
  });

  items.push({
    id: 'planting_link',
    level: 'required',
    labelKey: 'passportCompleteness.plantingLink',
    actionHref: '/grower/plantings',
    satisfied: Boolean(cp?.sourcePlantingId || batch?.harvestAnnouncementId),
  });

  items.push({
    id: 'harvest_date',
    level: 'required',
    labelKey: 'passportCompleteness.harvestDate',
    actionHref: '/grower/batches',
    satisfied: Boolean(batch?.harvestDate),
  });

  items.push({
    id: 'pack_date',
    level: 'recommended',
    labelKey: 'passportCompleteness.packDate',
    actionHref: '/grower/orders',
    satisfied: Boolean(batch?.actualPackDate || input.hasPackedOrders),
  });

  items.push({
    id: 'variety',
    level: 'recommended',
    labelKey: 'passportCompleteness.variety',
    actionHref: '/grower/catalog',
    satisfied: Boolean(cp?.variety?.trim()),
  });

  items.push({
    id: 'description',
    level: 'recommended',
    labelKey: 'passportCompleteness.description',
    actionHref: '/grower/catalog',
    satisfied: Boolean(cp?.description?.trim()),
  });

  items.push({
    id: 'photo',
    level: 'recommended',
    labelKey: 'passportCompleteness.photo',
    actionHref: '/grower/catalog',
    satisfied: Boolean(cp?.imageUrl),
  });

  items.push({
    id: 'storage',
    level: 'recommended',
    labelKey: 'passportCompleteness.storage',
    actionHref: '/grower/catalog',
    satisfied: Boolean(cp?.storageConditions?.trim()),
  });

  items.push({
    id: 'quality_entry',
    level: 'recommended',
    labelKey: 'passportCompleteness.qualityEntry',
    actionHref: '/grower/quality-entry',
    satisfied: Boolean(input.hasQualityEntry),
  });

  items.push({
    id: 'public_document',
    level: 'recommended',
    labelKey: 'passportCompleteness.publicDocument',
    actionHref: '/grower/catalog',
    satisfied: (input.publicDocumentsCount ?? 0) > 0,
  });

  items.push({
    id: 'badge',
    level: 'not_applicable',
    labelKey: 'passportCompleteness.badge',
    actionHref: '/grower/package-badges',
    satisfied: Boolean(input.hasActiveBadge),
  });

  return items;
}

export function passportCompletenessMissing(items: PassportCompletenessItem[]): PassportCompletenessItem[] {
  return items.filter((i) => i.level !== 'not_applicable' && !i.satisfied);
}
