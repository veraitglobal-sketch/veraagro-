import type { TFunction } from 'i18next';
import {
  getEffectiveBuyerOrderStatus,
  orderStatusLabel,
  catalogOrderTimelineLabel,
} from '../../shared/i18n/labels';
import {
  CATALOG_ORDER_TIMELINE,
  getCatalogTimelineStepIndex,
  isCatalogTimelineStepCompleted,
  isCatalogTimelineStepCurrent,
} from '../../shared/i18n/buyer-order-format';

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

/** Seven-step buyer timeline — same as web catalogue orders. */
export function getOrderTimelineSteps(t: TFunction) {
  return CATALOG_ORDER_TIMELINE.map((step) => ({
    key: step.stepKey,
    label: catalogOrderTimelineLabel(t, step.stepKey),
  }));
}

export function getOrderTimelineIndex(status: string | undefined | null): number {
  return getCatalogTimelineStepIndex(status);
}

export function isTimelineStepCompleted(status: string | undefined | null, stepIndex: number): boolean {
  return isCatalogTimelineStepCompleted(status, stepIndex);
}

export function isTimelineStepCurrent(status: string | undefined | null, stepIndex: number): boolean {
  return isCatalogTimelineStepCurrent(status, stepIndex);
}
