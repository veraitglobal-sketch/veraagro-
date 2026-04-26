'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { growerNavItems } from '@/lib/grower-nav';
import { getPublicApiBase } from '@/lib/public-api';
import { usersAPI } from '@/lib/api';
import { Info, List, MapPinned, Store } from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((m) => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

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

const HAMBURG: [number, number] = [53.5511, 9.9937];

/** Loose match for Serbia / Germany / etc. (profile text vs API country) */
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
    return [...items].sort((a, b) => (a.country || '').localeCompare(b.country || '') || a.name.localeCompare(b.name));
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

/**
 * Public pickup + partner supplier pins — same data as the mobile “Where to Buy” map.
 * Retail = green, material suppliers = orange (only if approved for the public map).
 */
export default function GrowerWhereToBuyPage() {
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>(HAMBURG);
  const [zoom, setZoom] = useState(10);
  const [productionCountry, setProductionCountry] = useState<string | null>(null);

  const sortedItems = useMemo(
    () => sortItemsByProfileCountry(items, productionCountry),
    [items, productionCountry],
  );

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
        setErr('Could not load map data. Check that the API is running and NEXT_PUBLIC_API_URL is set on the site.');
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
        .filter(
          (x) =>
            x.latitude && x.longitude && x.latitude !== 0 && x.longitude !== 0,
        )
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
        .filter(
          (x) =>
            x.latitude && x.longitude && x.latitude !== 0 && x.longitude !== 0,
        )
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
      const merged = [...retailM, ...supM];
      setItems(merged);
      if (merged.length > 0) {
        const al = merged.reduce((s, i) => s + i.latitude, 0) / merged.length;
        const aLng = merged.reduce((s, i) => s + i.longitude, 0) / merged.length;
        setCenter([al, aLng]);
        setZoom(merged.length === 1 ? 12 : 9);
      }
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

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title="Where to buy" navItems={growerNavItems}>
        <div className="max-w-4xl">
        <p className="text-sm text-gray-600 font-light mb-4">
          When locations exist, you get a map plus an address list below. The list is ordered with your profile
          production country first (from your account), then other countries. Retail pickup points (green on the map)
          and partner input stores (orange) both come from the public directory.
        </p>

        {!loading && productionCountry && (
          <p className="text-xs text-gray-500 font-light mb-3">
            Your profile production country:{' '}
            <span className="font-medium text-gray-700">{productionCountry}</span>
            {sortedItems.some((i) => countriesLikelyMatch(productionCountry, i.country)) ? (
              <span> — showing matching locations first in the list.</span>
            ) : (
              <span> — no directory entries match this country yet; they may appear after admin approval.</span>
            )}
          </p>
        )}

        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            Why you might see no orange pin for a new store
          </p>
          <p className="mt-1.5 text-amber-900/90 font-light leading-relaxed">
            A material supplier (partner store) is shown <strong>only</strong> after the location is <strong>approved
            for the public map</strong> (<code className="text-xs bg-amber-100/80 px-1">mapApproved</code>). If the
            address was changed in Settings, approval is cleared until an admin re-verifies. Green pins are separate:
            they come from <strong>retail hub</strong> records, not from typing an address in the supplier form alone.
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
            {productionCountry ? (
              <p className="mt-3 text-center font-light max-w-lg mx-auto leading-relaxed">
                Your account is registered for production in <strong className="text-gray-800">{productionCountry}</strong>.
                There are still no approved retail hubs or partner stores in the shared list for this region. A map will
                appear here automatically once Bio Vera adds or approves entries.
              </p>
            ) : (
              <p className="mt-3 text-center font-light max-w-md mx-auto">
                Ask a Bio Vera admin to approve partner stores for the map or add retail hub data. If the mobile app map
                is also empty, check that the app points to the production API.
              </p>
            )}
            <div className="mt-6 rounded-md bg-gray-50 border border-gray-100 px-4 py-3 text-left text-xs text-gray-600 font-light">
              <p className="font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <List className="h-3.5 w-3.5" />
                Without pins, you still have the address list (empty): it uses the same data as the map. As soon as
                entries exist, both the map and the list will show them, with your country prioritized in the list.
              </p>
            </div>
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
            <div className="h-[min(420px,50vh)] w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <MapContainer
                center={center}
                zoom={zoom}
                className="h-full w-full z-0 min-h-[280px]"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {items.map((loc) => (
                  <CircleMarker
                    key={loc.id}
                    center={[loc.latitude, loc.longitude]}
                    radius={9}
                    pathOptions={{
                      color: loc.kind === 'supplier' ? '#C2410C' : '#2D5A27',
                      fillColor: loc.kind === 'supplier' ? '#FDBA74' : '#86efac',
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <p className="font-medium text-sm">{loc.name}</p>
                      {loc.address && <p className="text-xs text-gray-600 mt-0.5">{loc.address}</p>}
                      <p className="text-xs text-gray-500">
                        {loc.kind === 'supplier' ? 'Material supplier' : 'Retail / pickup'}
                        {loc.city && ` · ${loc.city}`}
                      </p>
                      {loc.description && (
                        <p className="text-xs text-gray-600 mt-1">{loc.description}</p>
                      )}
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-2">
                <List className="h-4 w-4 text-[#2D5A27]" />
                Address list
                {productionCountry && (
                  <span className="font-light text-gray-500 normal-case">({productionCountry} first)</span>
                )}
              </h2>
              <p className="text-xs text-gray-500 font-light mb-3">
                Same locations as on the map — useful if the map does not load in your browser; you can copy names and
                addresses from here.
              </p>
              <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                {sortedItems.map((loc) => {
                  const inRegion = productionCountry && countriesLikelyMatch(productionCountry, loc.country);
                  return (
                    <li
                      key={loc.id}
                      className={`px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 ${
                        inRegion ? 'bg-[#2D5A27]/5' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm flex flex-wrap items-center gap-2">
                          {loc.name}
                          {inRegion && (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-[#2D5A27] bg-[#2D5A27]/10 px-1.5 py-0.5 rounded">
                              Your region
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
              {items.filter((i) => i.kind === 'supplier').length} supplier
            </p>
          </>
        )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
