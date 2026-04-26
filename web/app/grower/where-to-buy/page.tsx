'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { growerNavItems } from '@/lib/grower-nav';
import { getPublicApiBase } from '@/lib/public-api';
import { usersAPI } from '@/lib/api';
import { Info, List, MapPinned, Navigation, Store, Globe } from 'lucide-react';

type MapItem = {
  id: string;
  name: string;
  city?: string;
  country?: string;
  address?: string;
  latitude: number;
  longitude: number;
  kind: 'retail' | 'supplier';
  description?: string;
};

function countriesLikelyMatch(profileCountry: string, itemCountry: string | undefined) {
  if (!itemCountry?.trim()) return false;
  const p = profileCountry.trim().toLowerCase();
  const i = itemCountry.trim().toLowerCase();
  if (p === i) return true;
  if (p.includes(i) || i.includes(p)) return true;
  const serbia = ['serbia', 'srbija', 'rs'];
  const germany = ['germany', 'deutschland', 'njemač', 'germ'];
  const inSet = (s: string, set: string[]) => set.some((x) => s.includes(x));
  if (inSet(p, serbia) && inSet(i, serbia)) return true;
  if (inSet(p, germany) && inSet(i, germany)) return true;
  return false;
}

function sortItemsByProfileCountry(items: MapItem[], productionCountry: string | null) {
  if (!productionCountry?.trim()) {
    return [...items].sort(
      (a, b) => (a.country || '').localeCompare(b.country || '') || a.name.localeCompare(b.name),
    );
  }
  const pc = productionCountry.trim();
  return [...items].sort((a, b) => {
    const ma = countriesLikelyMatch(pc, a.country) ? 0 : 1;
    const mb = countriesLikelyMatch(pc, b.country) ? 0 : 1;
    if (ma !== mb) return ma - mb;
    return (a.country || '').localeCompare(b.country || '') || a.name.localeCompare(b.name);
  });
}

function formatAddressLine(loc: MapItem) {
  const parts = [loc.address, [loc.city, loc.country].filter(Boolean).join(', ')].filter(Boolean);
  return parts.join(' · ');
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function normalizeCountry(c: string | undefined) {
  return (c || '').trim() || '—';
}

/**
 * No map: country tabs, optional city, “nearest to me” from coordinates on file + browser location.
 */
export default function GrowerWhereToBuyPage() {
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [productionCountry, setProductionCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [nearMe, setNearMe] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const base = getPublicApiBase();
    try {
      const [me, rRetail, rSup] = await Promise.all([
        usersAPI.getMe().catch(() => null),
        fetch(`${base}/distributors/public/map`),
        fetch(`${base}/b2b-suppliers/public/map`),
      ]);
      if (me && typeof me === 'object' && 'productionCountry' in me) {
        const c = (me as { productionCountry?: string | null }).productionCountry;
        setProductionCountry(typeof c === 'string' && c.trim() ? c.trim() : null);
      } else {
        setProductionCountry(null);
      }
      if (!rRetail.ok || !rSup.ok) {
        setErr('Could not load directory. Check that the API is running and NEXT_PUBLIC_API_URL is set on the site.');
        setItems([]);
        return;
      }
      const retail = (await rRetail.json()) as Array<{
        id: string;
        name: string;
        city?: string;
        address?: string;
        latitude: number;
        longitude: number;
        country?: string;
      }>;
      const suppliers = (await rSup.json()) as Array<{
        id: string;
        name: string;
        city?: string;
        country?: string;
        address?: string;
        latitude: number;
        longitude: number;
        description?: string;
      }>;

      const retailM: MapItem[] = (retail || [])
        .filter((x) => x.latitude && x.longitude && x.latitude !== 0 && x.longitude !== 0)
        .map((x) => ({
          id: `retail-${x.id}`,
          name: x.name,
          city: x.city,
          country: x.country,
          address: x.address,
          latitude: x.latitude,
          longitude: x.longitude,
          kind: 'retail' as const,
        }));
      const supM: MapItem[] = (suppliers || [])
        .filter((x) => x.latitude && x.longitude && x.latitude !== 0 && x.longitude !== 0)
        .map((x) => ({
          id: `supplier-${x.id}`,
          name: x.name,
          city: x.city,
          country: x.country,
          address: x.address,
          latitude: x.latitude,
          longitude: x.longitude,
          kind: 'supplier' as const,
          description: x.description,
        }));
      setItems([...retailM, ...supM]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(normalizeCountry(i.country)));
    return ['ALL', ...Array.from(set).filter((c) => c !== '—').sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filteredByCountry = useMemo(() => {
    if (selectedCountry === 'ALL') return items;
    return items.filter((i) => normalizeCountry(i.country) === selectedCountry);
  }, [items, selectedCountry]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    filteredByCountry.forEach((i) => {
      const c = (i.city || '').trim();
      if (c) set.add(c);
    });
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [filteredByCountry]);

  const filtered = useMemo(() => {
    if (selectedCity === 'ALL') return filteredByCountry;
    return filteredByCountry.filter((i) => (i.city || '').trim() === selectedCity);
  }, [filteredByCountry, selectedCity]);

  const sortedForList = useMemo(() => {
    const base = sortItemsByProfileCountry(filtered, productionCountry);
    if (nearMe && userPos) {
      return [...base].sort(
        (a, b) =>
          haversineKm(userPos.lat, userPos.lng, a.latitude, a.longitude) -
          haversineKm(userPos.lat, userPos.lng, b.latitude, b.longitude),
      );
    }
    return base;
  }, [filtered, productionCountry, nearMe, userPos]);

  const requestNearMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMe(true);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert('Could not get your position. Check browser permissions and try again.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const clearNearMe = () => {
    setNearMe(false);
    setUserPos(null);
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title="Where to buy" navItems={growerNavItems}>
        <div className="max-w-4xl">
          <p className="text-sm text-gray-600 font-light mb-4">
            Choose a <strong>country</strong> and, if you want, a <strong>city</strong> (larger places where we have
            listings). Use <strong>Nearest to me</strong> to sort by distance using your current location. Retail pickup
            points and partner input stores (same as before — green vs orange in the list) come from the public directory.
          </p>

          {!loading && productionCountry && (
            <p className="text-xs text-gray-500 font-light mb-3">
              Your profile production country:{' '}
              <span className="font-medium text-gray-700">{productionCountry}</span>
              {items.some((i) => countriesLikelyMatch(productionCountry, i.country)) ? (
                <span> — matching areas are highlighted in the list first when not using “nearest”.</span>
              ) : (
                <span> — no directory entries for this country yet; they can appear after admin approval.</span>
              )}
            </p>
          )}

          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              Partner store visibility
            </p>
            <p className="mt-1.5 text-amber-900/90 font-light leading-relaxed">
              A material supplier is listed <strong>only</strong> after the address is <strong>approved for the public
              directory</strong> (<code className="text-xs bg-amber-100/80 px-1">mapApproved</code>). Retail rows come
              from hub records.
            </p>
          </div>

          {err && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading directory…</p>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-600">
              <Store className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="font-medium text-gray-800 text-center">No locations in the public directory yet</p>
              <p className="mt-3 text-center font-light max-w-md mx-auto">
                Ask a Bio Vera admin to approve partner entries or add retail hub data. When entries exist, use the
                country and city filters here.
              </p>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-4 text-sm text-[#2D5A27] hover:underline"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-3">
                <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Country
                </p>
                <div className="flex flex-wrap gap-2">
                  {countryOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setSelectedCity('ALL');
                      }}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedCountry === c
                          ? 'bg-[#2D5A27] text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {c === 'ALL' ? 'All countries' : c}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCountry !== 'ALL' && cityOptions.length > 1 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-medium text-gray-700">City (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {cityOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCity(c)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                          selectedCity === c
                            ? 'bg-[#2D5A27]/15 text-[#23471f] ring-1 ring-[#2D5A27]/40'
                            : 'bg-white border border-gray-200 text-gray-800 hover:border-gray-300'
                        }`}
                      >
                        {c === 'ALL' ? 'All cities' : c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4 flex flex-wrap items-center gap-2">
                {!nearMe ? (
                  <button
                    type="button"
                    onClick={() => void requestNearMe()}
                    disabled={locating}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-60"
                  >
                    <Navigation className="h-4 w-4" />
                    {locating ? 'Getting location…' : 'Nearest to me'}
                  </button>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">
                      Sorted by distance
                      {userPos
                        ? ` — ${sortedForList.length} result(s)`
                        : ''}
                    </span>
                    <button
                      type="button"
                      onClick={clearNearMe}
                      className="text-sm text-[#2D5A27] underline"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-2">
                  <List className="h-4 w-4 text-[#2D5A27]" />
                  Locations
                </h2>
                <p className="text-xs text-gray-500 font-light mb-3">
                  Names and full addresses (no map). Filter by country and city, or by distance with “Nearest to me”.
                </p>
                <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                  {sortedForList.map((loc) => {
                    const inRegion = productionCountry && countriesLikelyMatch(productionCountry, loc.country);
                    const distKm =
                      nearMe && userPos
                        ? haversineKm(userPos.lat, userPos.lng, loc.latitude, loc.longitude)
                        : null;
                    return (
                      <li
                        key={loc.id}
                        className={`px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 ${
                          inRegion && !nearMe ? 'bg-[#2D5A27]/5' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm flex flex-wrap items-center gap-2">
                            {loc.name}
                            {inRegion && !nearMe && (
                              <span className="text-[10px] font-medium uppercase tracking-wide text-[#2D5A27] bg-[#2D5A27]/10 px-1.5 py-0.5 rounded">
                                Your region
                              </span>
                            )}
                            {distKm != null && (
                              <span className="text-[10px] font-medium text-gray-500">
                                {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600 font-light mt-0.5 flex items-start gap-1.5">
                            <MapPinned className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span>{formatAddressLine(loc)}</span>
                          </p>
                          {loc.description && loc.kind === 'supplier' && (
                            <p className="text-xs text-gray-500 font-light mt-1 line-clamp-2">{loc.description}</p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md w-fit ${
                            loc.kind === 'supplier'
                              ? 'bg-orange-50 text-orange-900 border border-orange-200/80'
                              : 'bg-green-50 text-green-900 border border-green-200/80'
                          }`}
                        >
                          {loc.kind === 'supplier' ? 'Partner store' : 'Retail / pickup'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="mt-3 text-xs text-gray-400 font-light">
                {items.filter((i) => i.kind === 'retail').length} retail ·{' '}
                {items.filter((i) => i.kind === 'supplier').length} partner
                {selectedCountry !== 'ALL' && ` · filtered: ${sortedForList.length} shown`}
              </p>
            </>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
