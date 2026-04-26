'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { missionsAPI } from '@/lib/api';
import { logisticsPartnerNavItems } from '@/lib/logistics-nav';

const LOADING_STATUSES = ['READY_FOR_LOADING', 'ACCEPTED', 'IN_PROGRESS', 'ASSIGNED'];
const ACTIVE_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT', 'READY_FOR_LOADING'];

interface MissionBatch {
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
}

interface HarvestHint {
  marketChannel: string | null;
  loadQuantityKg: number | null;
  notes: string | null;
  cropType: string;
}

interface OptimalRoute {
  distance: string | null;
  duration: string | null;
  waypoints: unknown[];
  estimatedArrival: string | null;
}

interface Mission {
  id: string;
  missionNumber: string;
  status: string;
  pickupAddress: string;
  batchId?: string | null;
  estimatedPickupTime?: string | null;
  optimalRoute?: OptimalRoute | null;
  batches?: MissionBatch | null;
  harvest_announcement?: HarvestHint | null;
}

function formatUnit(u: string) {
  if (!u) return '';
  return u === 'kg' || u === 'KG' ? 'kg' : u;
}

/** Rough EU-pallet equivalent when weight is in kg (≈500 kg / pallet) — for planning only. */
function approxPalletCount(quantity: number, unit: string): number | null {
  const u = unit.toLowerCase();
  if (u !== 'kg' && u !== 'kilogram' && u !== 'kgs') return null;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return Math.max(1, Math.ceil(quantity / 500));
}

function suggestVehicleSize(quantity: number, unit: string): string {
  const u = unit.toLowerCase();
  if (u === 'kg' || u === 'kilogram' || u === 'kgs') {
    if (quantity <= 800) return 'Typical: refrigerated van';
    if (quantity <= 3500) return 'Typical: rigid refrigerated truck (7.5–12 t class)';
    return 'Typical: large truck or curtainsider + trailer — confirm space with the shipper';
  }
  if (u === 'pallet' || u === 'pallets') {
    if (quantity <= 2) return 'Typical: refrigerated van';
    if (quantity <= 8) return 'Typical: rigid truck';
    return 'Typical: articulated or full trailer — confirm dimensions';
  }
  return 'Match vehicle to weight and floor space; temperature-controlled (0–4°C) is required for claims.';
}

function destinationLine(m: Mission): string {
  const ch = m.harvest_announcement?.marketChannel?.trim();
  if (ch) return `Channel / market: ${ch}`;
  const n = m.harvest_announcement?.notes?.trim();
  if (n) return n.length > 120 ? `Notes: ${n.slice(0, 120)}…` : `Notes: ${n}`;
  return 'End delivery is agreed outside this screen (hub / buyer) — use batch and grower contact if needed.';
}

export default function LogisticsMissionsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

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
    let cancelled = false;
    missionsAPI
      .getMyMissions('logistics')
      .then((data: Mission[]) => {
        if (!cancelled) setMissions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load missions');
          setMissions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.roles]);

  const reloadMissions = () => {
    missionsAPI
      .getMyMissions('logistics')
      .then((data: Mission[]) => setMissions(Array.isArray(data) ? data : []))
      .catch(() => setMissions([]));
  };

  const claimMission = async (missionId: string) => {
    setClaiming(missionId);
    setError(null);
    try {
      await missionsAPI.claimMission(missionId);
      await reloadMissions();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.join(' ') : 'Could not claim mission');
    } finally {
      setClaiming(null);
    }
  };

  const acceptedMissions = missions.filter((m) => ACTIVE_STATUSES.includes(m.status));
  const availableMissions = missions.filter((m) => m.status === 'PENDING');

  const isLoadingStatus = (s: string) => LOADING_STATUSES.includes(s);

  const showVehicleCta = error && /refrigerat|vehicle|vozil/i.test(error);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <SidebarLayout title="Missions" navItems={logisticsPartnerNavItems}>
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-800 text-sm rounded-lg border border-red-100">
            <p>{error}</p>
            {showVehicleCta && (
              <p className="mt-2">
                <Link
                  href="/logistics-partner/vehicles"
                  className="font-medium text-[#2D5A27] underline underline-offset-2"
                >
                  Open Vehicles
                </Link>{' '}
                to register at least one <strong>available</strong> refrigerated vehicle, then try again.
              </p>
            )}
          </div>
        )}

        <div className="p-3 bg-amber-50 text-amber-900 text-sm rounded-lg border border-amber-100">
          <strong>Before you claim:</strong> add a refrigerated (0–4°C) vehicle under{' '}
          <Link href="/logistics-partner/vehicles" className="text-[#2D5A27] font-medium underline underline-offset-2">
            Vehicles
          </Link>
          . Claim assigns the next free suitable vehicle in your fleet.
        </div>

        {/* Active missions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active missions</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : acceptedMissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No active missions.</p>
          ) : (
            <div className="space-y-4">
              {acceptedMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#2D5A27]/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900">{mission.missionNumber}</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isLoadingStatus(mission.status) ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isLoadingStatus(mission.status) ? 'Loading' : 'In transit'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        <strong>Pickup:</strong> {mission.pickupAddress}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{destinationLine(mission)}</p>
                      {mission.batches && (
                        <p className="text-sm text-gray-600 mt-2">
                          {mission.batches.productName} · {mission.batches.quantity} {formatUnit(mission.batches.unit)}
                          {approxPalletCount(mission.batches.quantity, mission.batches.unit) != null && (
                            <span className="text-gray-500">
                              {' '}
                              (~{approxPalletCount(mission.batches.quantity, mission.batches.unit)} pallet
                              {approxPalletCount(mission.batches.quantity, mission.batches.unit)! > 1 ? 's' : ''}{' '}
                              est.)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={isLoadingStatus(mission.status) ? '/logistics-partner/handover' : '/logistics-partner/dashboard'}
                        className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f]"
                      >
                        {isLoadingStatus(mission.status) ? 'Handover' : 'Dashboard'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Available pool */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available missions</h2>
          {availableMissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No missions available right now.</p>
          ) : (
            <div className="space-y-4">
              {availableMissions.map((mission) => {
                const batch = mission.batches;
                const pallets = batch ? approxPalletCount(batch.quantity, batch.unit) : null;
                const sizeHint = batch ? suggestVehicleSize(batch.quantity, batch.unit) : null;
                const route = mission.optimalRoute;
                return (
                  <div
                    key={mission.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#2D5A27]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-500">Mission #{mission.missionNumber}</span>
                        </div>
                        <p className="text-sm text-gray-800">
                          <strong>Pickup / collection:</strong> {mission.pickupAddress}
                        </p>
                        <p className="text-sm text-gray-600">{destinationLine(mission)}</p>
                        {mission.harvest_announcement?.cropType && (
                          <p className="text-xs text-gray-500">Crop: {mission.harvest_announcement.cropType}</p>
                        )}
                        {batch && (
                          <ul className="text-sm text-gray-700 list-disc list-inside space-y-0.5">
                            <li>
                              Load: {batch.productName} — {batch.quantity} {formatUnit(batch.unit)}
                            </li>
                            {pallets != null && (
                              <li>
                                Approx. pallets (planning): {pallets} (assuming ~500 kg / EU pallet; confirm with
                                grower)
                              </li>
                            )}
                            {sizeHint && <li>Suggested size class: {sizeHint}</li>}
                            <li>Requires: refrigerated (fridge) 0–4°C vehicle registered under Vehicles</li>
                          </ul>
                        )}
                        {!batch && (
                          <p className="text-sm text-amber-800">
                            No batch linked in this request — check notes or contact the grower for weight and
                            dimensions.
                          </p>
                        )}
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {mission.estimatedPickupTime && (
                            <p>Target pickup window: {new Date(mission.estimatedPickupTime).toLocaleString()}</p>
                          )}
                          {route?.distance && <p>Route assist (est.): {route.distance}{route.duration ? ` · ${route.duration}` : ''}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          disabled={claiming === mission.id}
                          onClick={() => void claimMission(mission.id)}
                          className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-60"
                        >
                          {claiming === mission.id ? 'Claiming…' : 'Claim mission'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
