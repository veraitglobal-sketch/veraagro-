import { formatDate, formatEur } from './format';

/** Catalogue order line input — web + mobile buyer orders. */
export type CatalogOrderLineInput = {
  packCount?: number | null;
  packLabel?: string | null;
  packSizeKg?: number | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
  quantity?: number;
  unit?: string;
  productName?: string;
};

export const CATALOG_ORDER_TIMELINE = [
  { statuses: ['PENDING'], stepKey: 'submitted' },
  { statuses: ['APPROVED'], stepKey: 'accepted' },
  { statuses: ['PAID'], stepKey: 'paid' },
  { statuses: ['CONFIRMED'], stepKey: 'preparing' },
  { statuses: ['PICKED_UP', 'IN_TRANSIT'], stepKey: 'inTransit' },
  { statuses: ['DELIVERED'], stepKey: 'delivered' },
  { statuses: ['COMPLETED'], stepKey: 'receiptConfirmed' },
] as const;

export function isCatalogOrder(order: { catalogProductId?: string | null } | null | undefined): boolean {
  return !!order?.catalogProductId;
}

export function getCatalogTimelineStepIndex(status: string | undefined | null): number {
  if (!status) return 0;
  if (status === 'CANCELLED' || status === 'REFUNDED') return -1;
  const idx = CATALOG_ORDER_TIMELINE.findIndex((step) =>
    (step.statuses as readonly string[]).includes(status),
  );
  return idx >= 0 ? idx : 0;
}

export function isCatalogTimelineStepCompleted(status: string | undefined | null, stepIndex: number): boolean {
  const cur = getCatalogTimelineStepIndex(status);
  if (cur < 0) return false;
  return cur > stepIndex;
}

export function isCatalogTimelineStepCurrent(status: string | undefined | null, stepIndex: number): boolean {
  const cur = getCatalogTimelineStepIndex(status);
  if (cur < 0) return false;
  return cur === stepIndex;
}

export function formatPackLine(order: Pick<CatalogOrderLineInput, 'packCount' | 'packLabel'>): string | null {
  if (!order.packCount || !order.packLabel) return null;
  return `${order.packCount} × ${order.packLabel}`;
}

export function computePackPrice(order: CatalogOrderLineInput): number | null {
  if (order.totalAmount != null && order.packCount && order.packCount > 0) {
    return order.totalAmount / order.packCount;
  }
  if (order.unitPrice != null && order.packSizeKg != null) {
    return order.unitPrice * order.packSizeKg;
  }
  return null;
}

/** Price per kg from catalogue unit price or derived from pack total. */
export function computePricePerKg(order: CatalogOrderLineInput): number | null {
  if (order.unitPrice != null) return order.unitPrice;
  if (
    order.totalAmount != null &&
    order.packCount &&
    order.packSizeKg &&
    order.packCount > 0 &&
    order.packSizeKg > 0
  ) {
    return order.totalAmount / (order.packCount * order.packSizeKg);
  }
  return null;
}

export function formatTotalKgLabel(order: CatalogOrderLineInput): string | null {
  if (order.packCount && order.packSizeKg) {
    const kg = order.packCount * order.packSizeKg;
    return `${kg} kg`;
  }
  if (order.quantity != null && order.unit) {
    return `${order.quantity} ${order.unit}`;
  }
  return null;
}

/** List row: "2 × 10 kg (20 kg) · €70.00" */
export function formatCatalogOrderListLine(order: CatalogOrderLineInput, lang: string): string {
  const packPart = formatPackLine(order);
  if (packPart) {
    const kgLabel = formatTotalKgLabel(order);
    const total =
      order.totalAmount != null ? formatEur(order.totalAmount, lang) : null;
    const parts = [packPart];
    if (kgLabel) parts.push(`(${kgLabel})`);
    if (total) parts.push(total);
    return parts.join(' · ');
  }
  const qty = order.quantity ?? 0;
  const unit = order.unit ?? 'kg';
  const total =
    order.totalAmount != null
      ? formatEur(order.totalAmount, lang)
      : order.unitPrice != null
        ? formatEur(order.unitPrice * qty, lang)
        : null;
  return [ `${qty} ${unit}`, total ].filter(Boolean).join(' · ');
}

/** Detail: "2 × 10 kg · €35.00 / pack (€3.50 / kg)" */
export function formatCatalogOrderDetailPricing(
  order: CatalogOrderLineInput,
  lang: string,
  labels: { perPack: string; perKg: string },
): string {
  const packPart = formatPackLine(order);
  if (!packPart) {
    const perKg = computePricePerKg(order);
    if (perKg != null) return `${formatEur(perKg, lang)} ${labels.perKg}`;
    return '';
  }
  const packPrice = computePackPrice(order);
  const perKg = computePricePerKg(order);
  const packSegment =
    packPrice != null ? `${packPart} · ${formatEur(packPrice, lang)} ${labels.perPack}` : packPart;
  if (perKg != null) {
    return `${packSegment} (${formatEur(perKg, lang)} ${labels.perKg})`;
  }
  return packSegment;
}

export function formatAppOrderDate(
  value: Date | string | number,
  lang: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
  return formatDate(value, lang, options);
}
