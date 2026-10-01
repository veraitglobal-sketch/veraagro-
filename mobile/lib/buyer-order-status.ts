import type { TFunction } from 'i18next';
import {
  getEffectiveBuyerOrderStatus,
  orderStatusLabel,
} from '../../shared/i18n/labels';

export { getEffectiveBuyerOrderStatus };

export function tBuyerOrderStatus(
  t: TFunction,
  status: string | undefined | null,
  order?: { rejectionReason?: string | null } | null,
): string {
  const effective = order
    ? getEffectiveBuyerOrderStatus({ status, rejectionReason: order.rejectionReason })
    : status;
  return orderStatusLabel(t, effective, 'buyer');
}

/** 4 steps: placed → confirmed & preparing → on the way → delivered */
export function getOrderTimelineIndex(status: string | undefined | null): number {
  if (!status) return 0;
  if (status === 'CANCELLED' || status === 'REFUNDED') return -1;
  if (status === 'PENDING' || status === 'APPROVED') return 0;
  if (status === 'PAID' || status === 'CONFIRMED') return 1;
  if (status === 'PICKED_UP' || status === 'IN_TRANSIT') return 2;
  if (status === 'DELIVERED' || status === 'COMPLETED') return 3;
  return 0;
}

export function getOrderTimelineSteps(t: TFunction) {
  return [
    { key: 'placed', label: t('buyer.orders.timelinePlaced', 'Order placed') },
    { key: 'confirmed', label: t('buyer.orders.timelineConfirmed', 'Confirmed & preparing') },
    { key: 'shipped', label: t('buyer.orders.timelineShipped', 'On the way') },
    { key: 'done', label: t('buyer.orders.timelineDone', 'Delivered') },
  ];
}

export function isTimelineStepCompleted(status: string | undefined | null, stepIndex: number): boolean {
  if (!status) return false;
  if (status === 'CANCELLED' || status === 'REFUNDED') return false;
  const cur = getOrderTimelineIndex(status);
  if (cur < 0) return false;
  if (cur > stepIndex) return true;
  if (cur === 3 && stepIndex === 3 && (status === 'DELIVERED' || status === 'COMPLETED')) {
    return true;
  }
  return false;
}

export function isTimelineStepCurrent(status: string | undefined | null, stepIndex: number): boolean {
  if (!status) return false;
  if (status === 'CANCELLED' || status === 'REFUNDED') return false;
  return getOrderTimelineIndex(status) === stepIndex;
}
