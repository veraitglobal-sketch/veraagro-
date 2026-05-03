/** Matches backend `harvest-announcements.service` parcel gate for plans. */
export function parcelEligibleForHarvestPlan(par: { approvedAt?: string | null; status?: string | null }) {
  if (par.approvedAt) return true;
  const s = String(par.status ?? '').toUpperCase();
  return s === 'ACTIVE' || s === 'CERTIFIED';
}
