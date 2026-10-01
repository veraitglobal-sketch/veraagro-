import { formatEur } from './format';

export type CatalogPackOption = {
  id?: string;
  label: string;
  packSizeKg?: number | null;
  pricePerPack: number;
  pricePerKg?: number | null;
};

/** Pack chip: "500 g · €2.40" or "10 kg · €35.00" */
export function formatPackChip(opt: CatalogPackOption, lang: string): string {
  return `${opt.label} · ${formatEur(opt.pricePerPack, lang)}`;
}

/** Card line: pack list + optional "from €X.XX / kg" */
export function formatCatalogProductCardPricing(
  packOptions: CatalogPackOption[],
  lang: string,
  labels: { fromPerKg: string; perKg: string },
): { packChips: string[]; fromPerKg: string | null } {
  const active = packOptions.filter((p) => p.label && Number.isFinite(p.pricePerPack));
  const packChips = active.slice(0, 4).map((p) => formatPackChip(p, lang));
  const perKgValues = active
    .map((p) => {
      if (p.pricePerKg != null && p.pricePerKg > 0) return p.pricePerKg;
      if (p.packSizeKg && p.packSizeKg > 0) return p.pricePerPack / p.packSizeKg;
      return null;
    })
    .filter((v): v is number => v != null && v > 0);
  const minPerKg = perKgValues.length ? Math.min(...perKgValues) : null;
  const fromPerKg =
    minPerKg != null
      ? labels.fromPerKg.replace('{{price}}', formatEur(minPerKg, lang))
      : null;
  return { packChips, fromPerKg };
}
