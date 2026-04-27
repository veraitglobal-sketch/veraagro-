/**
 * Tailwind classes for `MissionStatus` (Prisma) — keep grower/ops UIs consistent.
 */
export function missionStatusBadgeClass(status: string | undefined | null): string {
  const s = (status || 'PENDING').toUpperCase();
  if (s === 'COMPLETED') return 'bg-green-100 text-green-800';
  if (s === 'CANCELLED') return 'bg-gray-200 text-gray-800';
  if (s === 'IN_TRANSIT' || s === 'PICKED_UP') return 'bg-blue-100 text-blue-800';
  if (s === 'PENDING') return 'bg-gray-50 text-gray-700';
  if (
    s === 'ASSIGNED' ||
    s === 'ACCEPTED' ||
    s === 'IN_PROGRESS' ||
    s === 'READY_FOR_LOADING'
  ) {
    return 'bg-amber-100 text-amber-800';
  }
  return 'bg-yellow-100 text-yellow-800';
}
