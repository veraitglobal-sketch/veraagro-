/** Grower lot list helpers — one DB row = one lot; show public + system batch identifiers. */

export interface LotListItem {
  id: string;
  batchId?: string | null;
  estateId?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
  status?: string;
  harvestDate?: string;
  estates?: { id?: string; name?: string } | null;
  parcels?: { name?: string; cropType?: string | null } | null;
}

export function getLotIdLines(b: LotListItem): { publicId: string; systemId: string | null } {
  const publicId = String(b.batchId ?? '').trim();
  const systemId = String(b.id ?? '').trim();
  if (publicId && systemId) {
    return { publicId, systemId };
  }
  if (publicId) return { publicId, systemId: null };
  return { publicId: systemId.slice(0, 12), systemId: systemId.length > 12 ? systemId : null };
}

export function groupLotsByEstate<T extends LotListItem>(lots: T[]): { title: string; items: T[] }[] {
  const by = new Map<string, T[]>();
  for (const lot of lots) {
    const title = lot.estates?.name?.trim() || '—';
    const arr = by.get(title) ?? [];
    arr.push(lot);
    by.set(title, arr);
  }
  return [...by.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'sr'))
    .map(([title, items]) => ({
      title,
      items: [...items].sort((x, y) => {
        const dx = x.harvestDate ? new Date(x.harvestDate).getTime() : 0;
        const dy = y.harvestDate ? new Date(y.harvestDate).getTime() : 0;
        return dy - dx;
      }),
    }));
}
