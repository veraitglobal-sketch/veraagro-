export function formatOrderLines(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((row) => {
    if (row && typeof row === 'object' && 'label' in row) {
      const o = row as { label: string; quantity?: number; unit?: string };
      const u = o.unit && o.unit !== 'order' && o.unit !== 'inquiry' ? ` ${o.unit}` : '';
      return `${o.label} — ${o.quantity ?? 1}${u}`.trim();
    }
    return String(row);
  });
}

export type PartnerOrder = {
  id: string;
  supplierUserId: string;
  status: string;
  items: unknown;
  noteFromFarmer: string | null;
  noteFromSupplier?: string | null;
  farmerReceivedAt?: string | null;
  threadId?: string | null;
  createdAt: string;
  supplier: { firstName: string | null; lastName: string | null; partnerCode: string | null } | null;
};

export type PartnerThread = {
  id: string;
  supplierUserId: string;
  lastMessageAt: string;
  supplier: {
    firstName: string | null;
    lastName: string | null;
    partnerCode: string | null;
    material_supplier_profile: { businessName: string; city: string | null; country: string | null } | null;
  };
};

export function orderStatusSortKey(status: string): number {
  const s = status.toUpperCase();
  if (s === 'PENDING') return 0;
  if (s === 'CONFIRMED') return 1;
  if (s === 'FULFILLED') return 2;
  return 3;
}
