'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { logisticsVehiclesAPI } from '@/lib/api';
import { useLogisticsPartnerNavItems } from '@/lib/logistics-nav';

type Vehicle = {
  id: string;
  vehicleNumber: string;
  type: string;
  make: string | null;
  model: string | null;
  licensePlate: string;
  hasFrigo: boolean;
  tempRangeMin: number;
  tempRangeMax: number;
  status: string;
};

const VEHICLE_TYPE_OPTIONS = [
  { value: 'refrigerated_van', label: 'Refrigerated van' },
  { value: 'rigid_7_5t', label: 'Rigid truck (~7.5 t)' },
  { value: 'rigid_12t', label: 'Rigid truck (~12 t)' },
  { value: 'artic', label: 'Articulated / truck + trailer' },
  { value: 'other', label: 'Other (describe in make/model if needed)' },
];

export default function LogisticsVehiclesPage() {
  const logisticsPartnerNavItems = useLogisticsPartnerNavItems();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [licensePlate, setLicensePlate] = useState('');
  const [type, setType] = useState('refrigerated_van');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');

  const load = useCallback(() => {
    logisticsVehiclesAPI
      .list()
      .then((data: Vehicle[]) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login/producer');
      return;
    }
    const roles = user?.roles && Array.isArray(user.roles) ? user.roles : [];
    if (!roles.includes('LOGISTICS_PARTNER')) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    setLoading(true);
    load();
  }, [isAuthenticated, user?.roles, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await logisticsVehiclesAPI.create({
        licensePlate: licensePlate.trim(),
        type,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        hasFrigo: true,
        tempRangeMin: 0,
        tempRangeMax: 4,
      });
      setLicensePlate('');
      setMake('');
      setModel('');
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setFormError(
        typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join(' ') : 'Could not add vehicle',
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <SidebarLayout title="Vehicles" navItems={logisticsPartnerNavItems}>
      <div className="max-w-3xl space-y-8">
        <p className="text-sm text-gray-600">
          Register refrigerated vehicles for your fleet.{' '}
          <strong>Claiming a mission</strong> requires at least one vehicle marked as available with
          active cooling (0–4°C). You can add more than one.
        </p>

        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add vehicle</h2>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License plate *</label>
              <input
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="e.g. HH-AB 1234"
                maxLength={32}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {VEHICLE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Pick the size class you use for this vehicle; missions can then be matched to your fleet.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make (optional)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="e.g. Mercedes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model (optional)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Sprinter"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Temperature range is stored as 0–4°C (refrigerated) for cold-chain transport. Contact support if
              you need a different profile.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Add vehicle'}
              </button>
              <Link
                href="/logistics-partner/missions"
                className="px-4 py-2 text-sm text-[#2D5A27] font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Back to missions
              </Link>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your fleet</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-gray-500 text-sm">No vehicles yet. Add one above to claim missions.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.map((v) => {
                const label = VEHICLE_TYPE_OPTIONS.find((o) => o.value === v.type)?.label ?? v.type;
                return (
                  <li key={v.id} className="py-4 first:pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{v.licensePlate}</p>
                        <p className="text-sm text-gray-600">{label}</p>
                        {(v.make || v.model) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {[v.make, v.model].filter(Boolean).join(' ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {v.vehicleNumber} · Cooling {v.tempRangeMin}–{v.tempRangeMax}°C ·{' '}
                          <span className="capitalize">{v.status.toLowerCase().replace('_', ' ')}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </SidebarLayout>
  );
}
