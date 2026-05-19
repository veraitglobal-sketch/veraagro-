import type { TFunction } from 'i18next';
import { enterpriseColors } from './enterprise-ui';

/**
 * Mission status strings from Prisma `MissionStatus` (backend). Mobile UI must not assume legacy `DELIVERED`.
 */
export type MissionStatusCode =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'READY_FOR_LOADING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DELIVERED';

const EN_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  READY_FOR_LOADING: 'Ready for loading',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DELIVERED: 'Delivered',
};

/** Terminal success: run finished (API uses `COMPLETED`, not `DELIVERED`). */
export function isMissionCompletedSuccess(status: string | undefined | null): boolean {
  if (!status) return false;
  return status === 'COMPLETED' || (status as string) === 'DELIVERED';
}

export function getMissionStatusLabelEn(status: string): string {
  if (EN_LABELS[status]) return EN_LABELS[status];
  return status.replace(/_/g, ' ');
}

/** Prefer `producer.missions.status.<code>`; fallback to EN label / raw code formatting. */
export function getMissionStatusLabelLocalized(status: string, t: TFunction): string {
  const key = `producer.missions.status.${status}`;
  const translated = t(key);
  if (translated === key) return getMissionStatusLabelEn(status);
  return translated;
}

/** Enterprise grower palette only — no amber/blue status rainbows. */
export function getMissionStatusColor(status: string): string {
  switch (status) {
    case 'PICKED_UP':
    case 'IN_TRANSIT':
    case 'COMPLETED':
    case 'DELIVERED':
      return enterpriseColors.primary;
    case 'CANCELLED':
      return enterpriseColors.gray600;
    default:
      return enterpriseColors.gray900;
  }
}

export function missionStatusEnterpriseTone(status: string): { bg: string; text: string } {
  const text = getMissionStatusColor(status);
  if (text === enterpriseColors.primary) {
    return { bg: enterpriseColors.primaryTint, text };
  }
  return { bg: enterpriseColors.gray100, text };
}
