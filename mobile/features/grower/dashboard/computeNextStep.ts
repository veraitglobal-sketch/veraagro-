/**
 * Single “what to do now” for the home screen — one priority, keep rules obvious.
 */
export type NextStepKind =
  | 'add_field'
  | 'add_parcel'
  | 'missions'
  | 'pending_approval'
  | 'offline_sync'
  | 'log_work'
  | 'default_steps';

export interface NextStep {
  kind: NextStepKind;
  pendingCount?: number;
  syncPending?: number;
}

export function computeNextStep(p: {
  estateCount: number;
  totalParcels: number;
  pendingApproval: number;
  approved: number;
  activeMissions: number;
  offlinePending: number;
}): NextStep | null {
  if (p.estateCount === 0) {
    return { kind: 'add_field' };
  }
  if (p.totalParcels === 0) {
    return { kind: 'add_parcel' };
  }
  if (p.activeMissions > 0) {
    return { kind: 'missions' };
  }
  if (p.pendingApproval > 0) {
    return { kind: 'pending_approval', pendingCount: p.pendingApproval };
  }
  if (p.offlinePending > 0) {
    return { kind: 'offline_sync', syncPending: p.offlinePending };
  }
  if (p.approved > 0) {
    return { kind: 'log_work' };
  }
  return { kind: 'default_steps' };
}
