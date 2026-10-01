/** Shared order packing rules — used by web, mobile, and mirrored in backend `recordGrowerPacking`. */

/** Order statuses in which the grower may record packing (same as the "orders to prepare" queue). */
export const PACKABLE_ORDER_STATUSES = ['PAID', 'CONFIRMED'] as const;

/** Allowed deviation of the packed net weight from packs × pack size. */
export const PACKED_WEIGHT_TOLERANCE = 0.05;

export type PackingOrder = {
  status: string;
  packCount?: number | null;
  packSizeKg?: number | null;
  packedPackCount?: number | null;
};

export type PackingError = 'notPaid' | 'packsMin' | 'packsMax' | 'weightRange';

export function canRecordPacking(order: Pick<PackingOrder, 'status'>): boolean {
  return (PACKABLE_ORDER_STATUSES as readonly string[]).includes(order.status);
}

export function expectedPackedKg(order: PackingOrder, packs: number): number | null {
  if (order.packSizeKg == null || !Number.isFinite(packs)) return null;
  return Math.round(packs * order.packSizeKg * 1000) / 1000;
}

export function packedWeightRange(order: PackingOrder, packs: number): { min: number; max: number } | null {
  const expected = expectedPackedKg(order, packs);
  if (expected == null) return null;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    min: round(expected * (1 - PACKED_WEIGHT_TOLERANCE)),
    max: round(expected * (1 + PACKED_WEIGHT_TOLERANCE)),
  };
}

/** Returns the first problem with a packing entry, or null when it can be saved. */
export function validatePacking(order: PackingOrder, packs: number, packedKg?: number | null): PackingError | null {
  if (!canRecordPacking(order)) return 'notPaid';
  if (!Number.isInteger(packs) || packs < 1) return 'packsMin';
  if (order.packCount != null && packs > order.packCount) return 'packsMax';
  if (packedKg != null) {
    const range = packedWeightRange(order, packs);
    if (range && (packedKg < range.min - 1e-9 || packedKg > range.max + 1e-9)) return 'weightRange';
  }
  return null;
}

export function isFullyPacked(order: PackingOrder): boolean {
  if (order.packCount == null) return (order.packedPackCount ?? 0) > 0;
  return (order.packedPackCount ?? 0) >= order.packCount;
}
