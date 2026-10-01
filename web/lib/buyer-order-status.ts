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

export {
  CATALOG_ORDER_TIMELINE,
  isCatalogOrder,
  getCatalogTimelineStepIndex,
  formatPackLine,
  formatCatalogOrderListLine,
  formatCatalogOrderDetailPricing,
  formatAppOrderDate,
} from '@biovera/shared/i18n/buyer-order-format';

import { catalogOrderTimelineLabel } from '@biovera/shared/i18n/labels';

/** Legacy web label keys — prefer catalogOrderTimelineLabel from glossary. */
export function getCatalogTimelineStepLabel(t: TFunction, stepKey: string): string {
  return catalogOrderTimelineLabel(t, stepKey);
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
