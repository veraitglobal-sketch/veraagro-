/**
 * Free geocoding via OpenStreetMap Nominatim (1 req/s policy — use for admin on-demand only).
 * https://operations.osmfoundation.org/policies/nominatim/
 */
export async function geocodeAddressNominatim(input: {
  addressLine1: string;
  postalCode: string;
  city: string;
  country: string;
}): Promise<{ lat: number; lng: number } | null> {
  const parts = [input.addressLine1, input.postalCode, input.city, input.country].map((p) => p?.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const q = parts.join(', ');
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', q);
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'BioVera-Backend/1.0 (https://biovera.app)',
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = data?.[0];
  if (!first) return null;
  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

export function buildStreetAddressLine(street: string, houseNumber?: string): string {
  return [street?.trim(), houseNumber?.trim()].filter(Boolean).join(' ').trim();
}
