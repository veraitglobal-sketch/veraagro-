/**
 * Single “what to do now” for the home screen — one priority, no duplicate cards.
 * @see mobile/docs/MOBILE_SCROLL_BUDGET.md
 */
export type NextStepKind =
  | 'add_field'
  | 'add_parcel'
  | 'sync_queue'
  | 'pending_approval'
  | 'request_transport'
  | 'missions'
  | 'notifications'
  | 'log_work'
  | 'default_steps';

export interface NextStep {
  kind: NextStepKind;
  pendingCount?: number;
}

export function computeNextStep(p: {
  estateCount: number;
  totalParcels: number;
  pendingApproval: number;
  approved: number;
  activeMissions: number;
  offlinePending: number;
  legacyFieldLogPending?: number;
  unreadNotifications?: number;
  batchesReadyForTransport: number;
}): NextStep | null {
  if (p.estateCount === 0) {
    return { kind: 'add_field' };
  }
  if (p.totalParcels === 0) {
    return { kind: 'add_parcel' };
  }
  if (p.offlinePending > 0 || (p.legacyFieldLogPending ?? 0) > 0) {
    return {
      kind: 'sync_queue',
      pendingCount: p.offlinePending + (p.legacyFieldLogPending ?? 0),
    };
  }
  if (p.pendingApproval > 0) {
    return { kind: 'pending_approval', pendingCount: p.pendingApproval };
  }
  if (p.batchesReadyForTransport > 0) {
    return { kind: 'request_transport' };
  }
  if (p.activeMissions > 0) {
    return { kind: 'missions' };
  }
  if ((p.unreadNotifications ?? 0) > 0) {
    return { kind: 'notifications', pendingCount: p.unreadNotifications };
  }
  if (p.approved > 0) {
    return { kind: 'log_work' };
  }
  return { kind: 'default_steps' };
}
