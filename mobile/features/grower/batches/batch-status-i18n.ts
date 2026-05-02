import type { TFunction } from 'i18next';

/** i18n key per API batch status (detail + list reuse producer.batches.*). */
export const BATCH_DETAIL_STATUS_KEYS: Record<string, string> = {
  PACKED: 'producer.batches.statusPacked',
  IN_HUB: 'producer.batches.statusInHub',
  IN_TRANSIT: 'producer.batches.statusInTransit',
  DELIVERED: 'producer.batches.statusDelivered',
  RETURNED: 'producer.batches.statusReturned',
  EXPIRED: 'producer.batches.statusExpired',
  QUALITY_VERIFIED: 'producer.batches.statusQualityVerified',
};

export function getBatchStatusLabel(t: TFunction, status: string | null | undefined): string {
  if (status == null || status === '') return '';
  const key = BATCH_DETAIL_STATUS_KEYS[status];
  return key ? t(key) : status;
}
