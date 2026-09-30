/** Human-readable route from mission optimalRoute JSON (stored in DB). */
export function formatOptimalRoute(
  optimalRoute: unknown,
  pickupLabel?: string | null,
): { route: string | null; routeDetail: Record<string, unknown> | null } {
  if (optimalRoute == null) {
    return { route: null, routeDetail: null };
  }
  if (typeof optimalRoute === 'string') {
    return { route: optimalRoute.trim() || null, routeDetail: null };
  }
  if (typeof optimalRoute !== 'object' || Array.isArray(optimalRoute)) {
    return { route: null, routeDetail: null };
  }

  const r = optimalRoute as Record<string, unknown>;
  const routeDetail = { ...r };

  const dest = r.destination as { address?: string; city?: string } | undefined;
  const destParts = [dest?.address, dest?.city].filter((x) => typeof x === 'string' && x.trim());
  const destLabel = destParts.length ? destParts.join(', ') : 'Destination';

  const origin =
    typeof pickupLabel === 'string' && pickupLabel.trim()
      ? pickupLabel.trim()
      : Array.isArray(r.waypoints) && r.waypoints.length
        ? 'Origin'
        : 'Origin';

  const distance =
    typeof r.distance === 'string'
      ? r.distance
      : typeof r.distance === 'number' && Number.isFinite(r.distance)
        ? `${r.distance.toFixed(0)} km`
        : null;

  const route = distance ? `${origin} → ${destLabel}, ${distance}` : `${origin} → ${destLabel}`;
  return { route, routeDetail };
}
