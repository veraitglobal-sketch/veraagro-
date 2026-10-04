import type { TranslateFn } from '../i18n/labels';

/** Registered origin fields returned by the lot-scoped passport API. */
export type SeedOrigin = {
  product: string;
  variety?: string | null;
  lotNumber: string;
  producer?: { name: string; city?: string | null; country: string } | null;
  seedCropYear?: number | null;
  productionDate?: string | null;
  plantedFrom?: string | null;
  plantedTo?: string | null;
  germinationPct?: number | null;
  purityPct?: number | null;
  recalled?: boolean;
  recallNotice?: string | null;
};

export function seedOriginDetails(
  origin: SeedOrigin,
  t: TranslateFn,
  formatDate: (value: string) => string | null,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  const add = (key: string, value: string | number | null | undefined) => {
    if (value !== null && value !== undefined && value !== '') {
      rows.push({ label: t(`glossary.productionHistory.${key}`), value: String(value) });
    }
  };
  add('variety', origin.variety);
  add('materialLot', origin.lotNumber);
  add('producer', origin.producer?.name);
  add('country', [origin.producer?.city, origin.producer?.country].filter(Boolean).join(', '));
  add('cropYear', origin.seedCropYear);
  if (origin.productionDate) add('productionDate', formatDate(origin.productionDate));
  const from = origin.plantedFrom ? formatDate(origin.plantedFrom) : null;
  const to = origin.plantedTo ? formatDate(origin.plantedTo) : null;
  add('plantingPeriod', from && to && from !== to ? `${from} – ${to}` : from ?? to);
  add('germination', origin.germinationPct);
  add('purity', origin.purityPct);
  return rows;
}
