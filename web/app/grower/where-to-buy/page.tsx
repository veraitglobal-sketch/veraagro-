'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { getPublicApiBase } from '@/lib/public-api';
import { usersAPI } from '@/lib/api';
import Link from 'next/link';
import { List, MapPinned, Navigation, Store, Globe, ShoppingBag } from 'lucide-react';
import PartnerB2BPanel from '@/components/grower/PartnerB2BPanel';
import GrowerSupplyFlowCard from '@/components/grower/GrowerSupplyFlowCard';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

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
  /** B2B partner user id — link to /grower/where-to-buy/store/[id] */
  supplierUserId?: string;
};

function countriesLikelyMatch(profileCountry: string, itemCountry: string | undefined) {
  if (!itemCountry?.trim()) return false;
  const p = profileCountry.trim().toLowerCase();
  const i = itemCountry.trim().toLowerCase();
  if (p === i) return true;
  if (p.includes(i) || i.includes(p)) return true;
  const serbia = ['serbia', 'srbija', 'rs'];
  const germany = ['germany', 'deutschland', 'germ', 'german', 'de'];
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
  const { t } = useTranslation();
  const growerNavItems = useGrowerNavItems();
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [productionCountry, setProductionCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [nearMe, setNearMe] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  /** On small screens: one primary pane at a time; desktop shows both columns. */
  const [mobilePanel, setMobilePanel] = useState<'directory' | 'orders'>('directory');

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
          supplierUserId: x.id,
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
      setGeoHint('Location is not available in this browser. Enter your city with the country filter, or type coordinates in another tool and pick the nearest result.');
      return;
    }
    setGeoHint(null);
    setLocating(true);
    const ok = (pos: GeolocationPosition) => {
      setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setNearMe(true);
      setLocating(false);
      setGeoHint(null);
    };
    const fail = (msg: string) => {
      setLocating(false);
      setGeoHint(msg);
    };
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 40_000, maximumAge: 2 * 60_000 };
    navigator.geolocation.getCurrentPosition(ok, (err) => {
      if (err && typeof err === 'object' && 'code' in err && (err as GeolocationPositionError).code === 1) {
        fail('Location permission was denied. Allow location for this site in the browser, or use country / city filters instead of “Nearest to me”.');
        return;
      }
      // Retry once with looser settings (faster on weak GPS / Wi‑Fi)
      navigator.geolocation.getCurrentPosition(
        ok,
        () =>
          fail(
            'Could not get GPS in time. Try again outdoors or with Wi‑Fi on, or sort by country / city; you can still use the list without “Nearest to me”.',
          ),
        { enableHighAccuracy: false, timeout: 25_000, maximumAge: 10 * 60_000 },
      );
    }, opts);
  };

  const clearNearMe = () => {
    setNearMe(false);
    setUserPos(null);
    setGeoHint(null);
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title={t('grower.nav.suppliersAndOrders')} navItems={growerNavItems}>
        <GrowerPageShell className="space-y-5">
          <GrowerPageHeader
            title={t('grower.nav.suppliersAndOrders')}
            description={
              <>
                Find a partner on the <strong>left</strong> (on desktop) or the <strong>Directory</strong> tab; track
                B2B lines on the <strong>right</strong> or <strong>My orders</strong> tab.
              </>
            }
            right={
              !loading && productionCountry ? (
                <p className="max-w-sm shrink-0 text-xs text-gray-500 sm:text-right">
                  Profile: <span className="font-medium text-gray-700">{productionCountry}</span>
                  {items.some((i) => countriesLikelyMatch(productionCountry, i.country)) ? (
                    <span> — similar regions first (unless you use “Nearest to me”).</span>
                  ) : (
                    <span> — no directory rows for that country yet.</span>
                  )}
                </p>
              ) : undefined
            }
          />

            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
            )}

            {/* Mobile / tablet: switch between the two main jobs without endless scrolling */}
            <div
              className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm lg:hidden"
              role="tablist"
              aria-label="Section"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mobilePanel === 'directory'}
                onClick={() => setMobilePanel('directory')}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  mobilePanel === 'directory'
                    ? 'bg-[#2D5A27] text-white shadow'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Directory
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobilePanel === 'orders'}
                onClick={() => {
                  setMobilePanel('orders');
                  if (typeof document !== 'undefined') {
                    const el = document.getElementById('my-orders');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  mobilePanel === 'orders'
                    ? 'bg-[#2D5A27] text-white shadow'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                My orders &amp; messages
              </button>
            </div>

            <p className="text-xs text-gray-500 -mt-1 lg:hidden">
              Tip: on a large screen both columns are visible; here pick the tab you need.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            <div
              className={`${
                mobilePanel === 'directory' ? 'block' : 'hidden'
              } lg:block flex min-h-0 min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6`}
            >
              {loading ? (
                <p className="text-sm text-gray-500">Loading directory…</p>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-8 text-sm text-gray-600 text-center">
                  <Store className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="font-medium text-gray-800">No locations in the public directory yet</p>
                  <p className="mt-3 font-light max-w-md mx-auto">
                    Ask a Bio Vera admin to approve partner entries or add retail hub data. When entries exist, use the
                    country and city filters here.
                  </p>
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="mt-4 text-sm text-[#2D5A27] font-medium hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Supplier directory</h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Filter by country, optionally city; open a <strong>Partner store</strong> to order or message.
                    </p>
                    <p className="text-xs text-amber-900/80 mt-2 rounded-md bg-amber-50 border border-amber-100/80 px-2.5 py-1.5">
                      Listings use <strong>approved</strong> partner addresses and retail hub data — if someone is
                      missing, it is not yet on the public map.
                    </p>
                  </div>
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

              <div className="mb-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
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
                        Sorted by distance{userPos ? ` — ${sortedForList.length} result(s)` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={clearNearMe}
                        className="text-sm text-[#2D5A27] font-medium hover:underline"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
                {geoHint && (
                  <p className="text-xs text-amber-900/90 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {geoHint}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-2">
                  <List className="h-4 w-4 text-[#2D5A27]" />
                  Locations
                </h3>
                <p className="text-xs text-gray-500 font-light mb-3">
                  <strong>Partner store</strong> = catalog and direct order; retail = hub pickup.
                </p>
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {sortedForList.map((loc) => {
                    const inRegion = productionCountry && countriesLikelyMatch(productionCountry, loc.country);
                    const distKm =
                      nearMe && userPos
                        ? haversineKm(userPos.lat, userPos.lng, loc.latitude, loc.longitude)
                        : null;
                    return (
                      <li
                        key={loc.id}
                        className={`px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${
                          inRegion && !nearMe ? 'bg-[#2D5A27]/5' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
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
                        <div className="shrink-0 flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-md w-fit ${
                              loc.kind === 'supplier'
                                ? 'bg-orange-50 text-orange-900 border border-orange-200/80'
                                : 'bg-green-50 text-green-900 border border-green-200/80'
                            }`}
                          >
                            {loc.kind === 'supplier' ? 'Partner store' : 'Retail / pickup'}
                          </span>
                          {loc.kind === 'supplier' && loc.supplierUserId && (
                            <Link
                              href={`/grower/where-to-buy/store/${encodeURIComponent(loc.supplierUserId)}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2D5A27] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#23471f] w-full sm:w-auto"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              Catalog &amp; order
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                {items.filter((i) => i.kind === 'retail').length} retail ·{' '}
                {items.filter((i) => i.kind === 'supplier').length} partner
                {selectedCountry !== 'ALL' && ` · ${sortedForList.length} shown`}
              </p>
            </>
              )}
            </div>

            <div
              className={`${
                mobilePanel === 'orders' ? 'block' : 'hidden'
              } lg:block min-w-0`}
            >
              <PartnerB2BPanel />
            </div>
          </div>

            <GrowerSupplyFlowCard context="suppliers" variant="compact" />
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
