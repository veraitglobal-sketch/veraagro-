import { colors } from './colors';

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
  | 'CANCELLED';

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

export function getMissionStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return colors.warning;
    case 'ASSIGNED':
    case 'ACCEPTED':
    case 'IN_PROGRESS':
    case 'READY_FOR_LOADING':
      return colors.accent;
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return colors.primary;
    case 'COMPLETED':
      return colors.success || colors.primary;
    case 'CANCELLED':
      return colors.text.secondary;
    default:
      return colors.text.secondary;
  }
}
