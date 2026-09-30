import type { TFunction } from 'i18next';

const STATUS_KEYS: Record<string, string> = {
  PENDING: 'buyer.orders.statuses.PENDING',
  APPROVED: 'buyer.orders.statuses.APPROVED',
  PAID: 'buyer.orders.statuses.PAID',
  CONFIRMED: 'buyer.orders.statuses.CONFIRMED',
  PICKED_UP: 'buyer.orders.statuses.PICKED_UP',
  IN_TRANSIT: 'buyer.orders.statuses.IN_TRANSIT',
  DELIVERED: 'buyer.orders.statuses.DELIVERED',
  COMPLETED: 'buyer.orders.statuses.COMPLETED',
  CANCELLED: 'buyer.orders.statuses.CANCELLED',
  REJECTED: 'buyer.orders.statuses.REJECTED',
  REFUNDED: 'buyer.orders.statuses.REFUNDED',
};

export function getEffectiveBuyerOrderStatus(order: {
  status?: string | null;
  rejectionReason?: string | null;
} | null | undefined): string {
  if (!order?.status) return 'PENDING';
  if (order.status === 'CANCELLED' && order.rejectionReason?.trim()) return 'REJECTED';
  return order.status;
}

export function tBuyerOrderStatus(
  t: TFunction,
  status: string | undefined | null,
  order?: { rejectionReason?: string | null } | null,
): string {
  const effective = order ? getEffectiveBuyerOrderStatus({ status, rejectionReason: order.rejectionReason }) : status;
  if (!effective) {
    return t('buyer.orders.statuses.UNKNOWN', 'Update pending');
  }
  const key = STATUS_KEYS[effective] ?? 'buyer.orders.statuses.UNKNOWN';
  return t(key, { defaultValue: effective.replace(/_/g, ' ') });
}

/** 4 steps: placed → confirmed & preparing → on the way → delivered */
export function getOrderTimelineIndex(
  status: string | undefined | null,
): number {
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
    {
      key: 'confirmed',
      label: t('buyer.orders.timelineConfirmed', 'Confirmed & preparing'),
    },
    { key: 'shipped', label: t('buyer.orders.timelineShipped', 'On the way') },
    { key: 'done', label: t('buyer.orders.timelineDone', 'Delivered') },
  ];
}

export function isTimelineStepCompleted(
  status: string | undefined | null,
  stepIndex: number,
): boolean {
  if (!status) return false;
  if (status === 'CANCELLED' || status === 'REFUNDED') return false;
  const cur = getOrderTimelineIndex(status);
  if (cur < 0) return false;
  if (cur > stepIndex) return true;
  if (
    cur === 3 &&
    stepIndex === 3 &&
    (status === 'DELIVERED' || status === 'COMPLETED')
  ) {
    return true;
  }
  return false;
}

export function isTimelineStepCurrent(
  status: string | undefined | null,
  stepIndex: number,
): boolean {
  if (!status) return false;
  if (status === 'CANCELLED' || status === 'REFUNDED') return false;
  return getOrderTimelineIndex(status) === stepIndex;
}
