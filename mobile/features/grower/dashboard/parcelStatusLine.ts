import type { TFunction } from 'i18next';

export type ParcelStats = {
  loaded: boolean;
  total: number;
  pending: number;
  approved: number;
};

export function parcelStatusLine(
  t: TFunction,
  estateCount: number,
  ps: ParcelStats,
  fallbackKey = 'producer.dashboard.homeLeadShort',
): string {
  if (!ps.loaded) return t(fallbackKey);
  if (estateCount === 0) return t('producer.dashboard.homeStatusNoParcels');
  if (ps.total === 0) return t('producer.dashboard.homeStatusNoParcels');
  if (ps.pending > 0) {
    return t('producer.dashboard.homeStatusPending', {
      approved: ps.approved,
      total: ps.total,
      pending: ps.pending,
    });
  }
  return t('producer.dashboard.homeStatus', { approved: ps.approved, total: ps.total });
}
