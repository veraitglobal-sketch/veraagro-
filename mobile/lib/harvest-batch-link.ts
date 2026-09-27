/** A local queued plan has no server identity yet; never silently drop the selected link. */
export function harvestPlanLink(selectedId: string | null, parcelId: string,
  plans: Array<{ id: string; parcelId: string }>): { harvestAnnouncementId?: string } {
  if (!selectedId) return {};
  if (selectedId.startsWith('local:')) throw new Error('PLAN_NOT_SYNCED');
  const selected = plans.find((row) => row.id === selectedId && row.parcelId === parcelId);
  if (!selected) throw new Error('PLAN_UNAVAILABLE');
  return { harvestAnnouncementId: selected.id };
}
