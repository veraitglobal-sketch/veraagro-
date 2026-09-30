/** Never render a route object as React children — always coerce to string. */
export function formatRouteDisplay(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const s = value.trim();
    return s || null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) return null;

  const r = value as Record<string, unknown>;
  const dest = r.destination as { address?: string; city?: string } | undefined;
  const destParts = [dest?.address, dest?.city].filter((x) => typeof x === 'string' && x.trim());
  const destLabel = destParts.length ? destParts.join(', ') : 'Destination';
  const distance = typeof r.distance === 'string' ? r.distance : null;
  return distance ? `Origin → ${destLabel}, ${distance}` : `Origin → ${destLabel}`;
}
