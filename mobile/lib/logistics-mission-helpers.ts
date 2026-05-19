import type { Mission } from './api';

/** Open pool: grower requested transport, no carrier yet. */
export function canClaimLogisticsMission(mission: Mission): boolean {
  return mission.status === 'PENDING' && (mission.logisticsPartnerId == null || mission.logisticsPartnerId === '');
}
