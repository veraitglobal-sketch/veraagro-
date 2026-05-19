import type { TFunction } from 'i18next';

const BATCH_STATUS_KEYS: Record<string, string> = {
  PACKED: 'growerPages.batchStatusPacked',
  IN_HUB: 'growerPages.batchStatusInHub',
  IN_TRANSIT: 'growerPages.batchStatusInTransit',
  DELIVERED: 'growerPages.batchStatusDelivered',
  RETURNED: 'growerPages.batchStatusReturned',
  EXPIRED: 'growerPages.batchStatusExpired',
  QUALITY_VERIFIED: 'growerPages.batchStatusQualityVerified',
  HARVESTED: 'growerPages.batchStatusHarvested',
};

export type LotFilter = 'all' | 'here' | 'moving' | 'done';

export function lotStatusBucket(status: string | null | undefined): LotFilter {
  const s = String(status ?? '').toUpperCase();
  if (s === 'DELIVERED') return 'done';
  if (s === 'IN_HUB' || s === 'IN_TRANSIT') return 'moving';
  if (s === 'PACKED' || s === 'QUALITY_VERIFIED' || s === 'HARVESTED') return 'here';
  return 'here';
}

export function getBatchStatusLabel(t: TFunction, status: string | null | undefined): string {
  if (status == null || status === '') return '—';
  const key = BATCH_STATUS_KEYS[status.toUpperCase()];
  return key ? t(key) : String(status).replace(/_/g, ' ');
}

export function lotStatusPillClass(status: string | null | undefined): string {
  const bucket = lotStatusBucket(status);
  if (bucket === 'done') return 'bg-gray-100 text-gray-700 border-gray-200';
  if (bucket === 'moving') return 'bg-blue-50 text-blue-800 border-blue-200';
  return 'bg-[#e8f0e6] text-[#1a3d17] border-[#2D5A27]/25';
}
