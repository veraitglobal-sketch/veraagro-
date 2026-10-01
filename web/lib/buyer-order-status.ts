/**
 * Buyer-friendly labels for `OrderStatus` — sourced from shared glossary.
 */
import type { TFunction } from 'i18next';
import {
  getEffectiveBuyerOrderStatus,
  orderStatusDescription,
  orderStatusLabel,
} from '@biovera/shared/i18n/labels';

export { getEffectiveBuyerOrderStatus };

export function getBuyerOrderStatusLabel(
  t: TFunction,
  status: string | undefined | null,
  order?: { rejectionReason?: string | null } | null,
): string {
  const effective = order
    ? getEffectiveBuyerOrderStatus({ status, rejectionReason: order.rejectionReason })
    : status;
  return orderStatusLabel(t, effective, 'buyer');
}

export function getBuyerOrderStatusDescription(
  t: TFunction,
  status: string | undefined | null,
  order?: { rejectionReason?: string | null } | null,
): string {
  const effective = order
    ? getEffectiveBuyerOrderStatus({ status, rejectionReason: order.rejectionReason })
    : status;
  const base = orderStatusDescription(t, effective);
  if (effective === 'REJECTED' && order?.rejectionReason?.trim()) {
    return `${base} ${t('buyerPortalOrders.rejectionReason', { reason: order.rejectionReason.trim() })}`;
  }
  return base;
}

/** Styling: border and text (Tailwind classes) */
export function getBuyerStatusBadgeClass(status: string | undefined | null): string {
  const s = status || 'PENDING';
  switch (s) {
    case 'COMPLETED':
    case 'DELIVERED':
      return 'border-[#2D5A27]/30 text-[#2D5A27]/80 bg-[#2D5A27]/5';
    case 'IN_TRANSIT':
    case 'PICKED_UP':
      return 'border-amber-200/80 text-amber-800 bg-amber-50/80';
    case 'PAID':
    case 'CONFIRMED':
    case 'APPROVED':
      return 'border-sky-200/80 text-sky-800 bg-sky-50/80';
    case 'PENDING':
      return 'border-gray-200/50 text-gray-600/80 bg-gray-50/80';
    case 'REJECTED':
    case 'CANCELLED':
    case 'REFUNDED':
      return 'border-red-200/50 text-red-700 bg-red-50/60';
    default:
      return 'border-gray-200/50 text-gray-600/80 bg-gray-50/80';
  }
}

/** Plain-word timeline for catalogue (marketplace) orders */
export const CATALOG_ORDER_TIMELINE = [
  { statuses: ['PENDING'], labelKey: 'buyerPortalOrders.catalogTimeline.submitted' },
  { statuses: ['APPROVED'], labelKey: 'buyerPortalOrders.catalogTimeline.accepted' },
  { statuses: ['PAID'], labelKey: 'buyerPortalOrders.catalogTimeline.paid' },
  { statuses: ['CONFIRMED'], labelKey: 'buyerPortalOrders.catalogTimeline.preparing' },
  { statuses: ['PICKED_UP', 'IN_TRANSIT'], labelKey: 'buyerPortalOrders.catalogTimeline.inTransit' },
  { statuses: ['DELIVERED'], labelKey: 'buyerPortalOrders.catalogTimeline.delivered' },
  { statuses: ['COMPLETED'], labelKey: 'buyerPortalOrders.catalogTimeline.receiptConfirmed' },
] as const;

export function isCatalogOrder(order: { catalogProductId?: string | null } | null | undefined): boolean {
  return !!order?.catalogProductId;
}

export function getCatalogTimelineStepIndex(status: string | undefined | null): number {
  if (!status) return 0;
  if (status === 'CANCELLED' || status === 'REFUNDED') return -1;
  const idx = CATALOG_ORDER_TIMELINE.findIndex((step) => step.statuses.includes(status as never));
  return idx >= 0 ? idx : 0;
}

export function formatPackLine(order: {
  packCount?: number | null;
  packLabel?: string | null;
}): string | null {
  if (!order.packCount || !order.packLabel) return null;
  return `${order.packCount} × ${order.packLabel}`;
}

export function getAllOrderStatusFilters(t: TFunction) {
  const codes = [
    'PENDING',
    'APPROVED',
    'PAID',
    'CONFIRMED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
    'REFUNDED',
  ] as const;
  return codes.map((value) => ({
    value,
    label: orderStatusLabel(t, value, 'buyer'),
  }));
}
