'use client';

import { useCallback, useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { growerNavItems } from '@/lib/grower-nav';
import { getPublicApiBase } from '@/lib/public-api';
import { Info, Store } from 'lucide-react';

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

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const base = getPublicApiBase();
    try {
      const [rRetail, rSup] = await Promise.all([
        fetch(`${base}/distributors/public/map`),
        fetch(`${base}/b2b-suppliers/public/map`),
      ]);
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
          Retail pickup points (green) and partner input stores (orange) from the public map. This view matches the
          mobile &quot;Where to Buy&quot; screen.
        </p>

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
          <p className="text-sm text-gray-500">Loading map…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
            <Store className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-gray-800">No approved locations in the public API yet</p>
            <p className="mt-2 font-light max-w-md mx-auto">
              Ask a Bio Vera admin to approve the partner store on the map, or add retail hub data. If the mobile map is
              also empty, the production API may not be reachable from the app (check API base URL / env).
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 text-sm text-[#2D5A27] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="h-[420px] w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <MapContainer
              center={center}
              zoom={zoom}
              className="h-full w-full z-0"
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
        )}

        {!loading && items.length > 0 && (
          <p className="mt-3 text-xs text-gray-400 font-light">
            {items.filter((i) => i.kind === 'retail').length} retail ·{' '}
            {items.filter((i) => i.kind === 'supplier').length} supplier
          </p>
        )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
