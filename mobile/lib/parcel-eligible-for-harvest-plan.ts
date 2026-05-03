/**
 * Parcels that may register a **HARVEST** plan only (backend still requires approval for HARVEST).
 * **PLANTING** may be registered on pending parcels — do not use this filter for planting pickers.
 */
export function parcelEligibleForHarvestPlan(par: { approvedAt?: string | null; status?: string | null }) {
  if (par.approvedAt) return true;
  const s = String(par.status ?? '').toUpperCase();
  return s === 'ACTIVE' || s === 'CERTIFIED';
}
