'use client';

import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { missionsAPI, logisticsDriversAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useLogisticsPartnerNavItems } from '@/lib/logistics-nav';

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
  destination?: { address: string | null; city: string | null };
}

interface Mission {
  id: string;
  missionNumber: string;
  status: string;
  pickupAddress: string;
  destinationAddress?: string | null;
  destinationCity?: string | null;
  loadInstructions?: string | null;
  batchId?: string | null;
  estimatedPickupTime?: string | null;
  optimalRoute?: OptimalRoute | null;
  batches?: MissionBatch | null;
  harvest_announcement?: HarvestHint | null;
  assigned_logistics_driver?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}

type LogisticsDriverRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
};

function formatUnit(u: string) {
  if (!u) return '';
  return u === 'kg' || u === 'KG' ? 'kg' : u;
}

/** Planning helper: kg → ~EU pallets; explicit pallet unit → count as entered. */
function approxPalletCount(quantity: number, unit: string): number | null {
  const u = unit.toLowerCase();
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (u === 'pallet' || u === 'pallets') return Math.max(1, Math.ceil(quantity));
  if (u === 'kg' || u === 'kilogram' || u === 'kgs') return Math.max(1, Math.ceil(quantity / 500));
  return null;
}

function suggestVehicleSize(quantity: number, unit: string, t: TFunction): string {
  const u = unit.toLowerCase();
  if (u === 'kg' || u === 'kilogram' || u === 'kgs') {
    if (quantity <= 800) return t('logisticsPages.missionsSuggest_kg_van');
    if (quantity <= 3500) return t('logisticsPages.missionsSuggest_kg_rigid');
    return t('logisticsPages.missionsSuggest_kg_large');
  }
  if (u === 'pallet' || u === 'pallets') {
    if (quantity <= 2) return t('logisticsPages.missionsSuggest_plt_van');
    if (quantity <= 8) return t('logisticsPages.missionsSuggest_plt_rigid');
    return t('logisticsPages.missionsSuggest_plt_artic');
  }
  return t('logisticsPages.missionsSuggest_default');
}

function destinationLine(m: Mission, t: TFunction): string {
  const addr = m.destinationAddress?.trim();
  // Legacy runs stored an empty address object as the literal "{}".
  if (addr && !/^\{\s*\}$/.test(addr) && addr !== '—') {
    return addr;
  }
  const ch = m.harvest_announcement?.marketChannel?.trim();
  if (ch) return t('logisticsPages.missionsDestChannel', { value: ch });
  const n = m.harvest_announcement?.notes?.trim();
  if (n) {
    return n.length > 120
      ? t('logisticsPages.missionsDestNotesTrunc', { value: n.slice(0, 120) })
      : t('logisticsPages.missionsDestNotes', { value: n });
  }
  const routeAddr = m.optimalRoute?.destination?.address?.trim();
  if (routeAddr && !/^\{\s*\}$/.test(routeAddr) && routeAddr !== '—') return routeAddr;
  return t('logisticsPages.missionsDestFallback');
}

function siblingsByCity(all: Mission[], m: Mission): Mission[] {
  const c = m.destinationCity?.trim().toLowerCase();
  if (!c) return [];
  return all.filter(
    (x) => x.id !== m.id && (x.destinationCity?.trim().toLowerCase() ?? '') === c,
  );
}

function logisticsStatusBadgeClass(status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-900';
  if (status === 'IN_TRANSIT') return 'bg-sky-100 text-sky-900';
  if (status === 'PICKED_UP') return 'bg-indigo-100 text-indigo-900';
  if (['READY_FOR_LOADING', 'ACCEPTED', 'IN_PROGRESS', 'ASSIGNED'].includes(status)) {
    return 'bg-amber-100 text-amber-800';
  }
  return 'bg-slate-100 text-slate-800';
}

export default function LogisticsMissionsPage() {
  const { t } = useTranslation();
  const logisticsPartnerNavItems = useLogisticsPartnerNavItems();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<LogisticsDriverRow[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [claimDriverForMission, setClaimDriverForMission] = useState<Record<string, string>>({});
  const [activeDriverDraft, setActiveDriverDraft] = useState<Record<string, string>>({});
  const [savingDriverForMission, setSavingDriverForMission] = useState<string | null>(null);
  const [driverFeedback, setDriverFeedback] = useState<string | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState<string | null>(null);

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
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(apiErrorOrT(err, t, 'logisticsPages.missionsPageLoadError'));
          setMissions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.roles, t]);

  useEffect(() => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    let cancelled = false;
    setDriversLoading(true);
    logisticsDriversAPI
      .list()
      .then((data: LogisticsDriverRow[]) => {
        if (!cancelled) setDrivers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setDrivers([]);
      })
      .finally(() => {
        if (!cancelled) setDriversLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      const logisticsDriverId = claimDriverForMission[missionId]?.trim();
      await missionsAPI.claimMission(
        missionId,
        logisticsDriverId ? { logisticsDriverId } : undefined,
      );
      await reloadMissions();
    } catch (e: unknown) {
      setError(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setClaiming(null);
    }
  };

  const saveMissionDriver = async (mission: Mission) => {
    const fromDraft = activeDriverDraft[mission.id];
    const currentId = mission.assigned_logistics_driver?.id ?? '';
    const nextId = (fromDraft !== undefined ? fromDraft : currentId).trim();
    setSavingDriverForMission(mission.id);
    setDriverFeedback(null);
    setError(null);
    try {
      await missionsAPI.setMissionLogisticsDriver(mission.id, nextId || null);
      setDriverFeedback(t('logisticsPages.missionsAssignDriverUpdated'));
      await reloadMissions();
    } catch (e: unknown) {
      setError(apiErrorOrT(e, t, 'logisticsPages.missionsAssignDriverErr'));
    } finally {
      setSavingDriverForMission(null);
    }
  };

  const runLifecycle = async (
    missionId: string,
    step: 'DEPART_FARM' | 'START_TRANSIT' | 'COMPLETE_DELIVERY',
  ) => {
    const busyKey = `${missionId}:${step}`;
    setLifecycleBusy(busyKey);
    setDriverFeedback(null);
    setError(null);
    try {
      await missionsAPI.advanceMissionLifecycle(missionId, step);
      setDriverFeedback(t('logisticsPages.missionsLifecycleOk'));
      await reloadMissions();
    } catch (e: unknown) {
      setError(apiErrorOrT(e, t, 'logisticsPages.missionsLifecycleErr'));
    } finally {
      setLifecycleBusy(null);
    }
  };

  const acceptedMissions = missions.filter((m) => ACTIVE_STATUSES.includes(m.status));
  const availableMissions = missions.filter((m) => m.status === 'PENDING');

  const isLoadingStatus = (s: string) => LOADING_STATUSES.includes(s);

  const activeDrivers = drivers.filter((d) => d.isActive);

  const showVehicleCta = error && /refrigerat|vehicle|vozil/i.test(error);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">{t('logisticsPages.missionsShellLoading')}</div>
      </div>
    );
  }

  return (
    <SidebarLayout title={t('logisticsPartnerNav.missions')} navItems={logisticsPartnerNavItems}>
      <div className="space-y-6">
        {driverFeedback && (
          <div className="p-3 bg-[#f7faf6] text-[#23471f] text-sm rounded-lg border border-[#2D5A27]/25">
            {driverFeedback}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 text-red-800 text-sm rounded-lg border border-red-100">
            <p>{error}</p>
            {showVehicleCta && (
              <p className="mt-2">
                <Trans
                  i18nKey="logisticsPages.missionsErrorVehicleCta"
                  components={{
                    vehiclesLink: (
                      <Link
                        href="/logistics-partner/vehicles"
                        className="font-medium text-[#2D5A27] underline underline-offset-2"
                      />
                    ),
                    strong: <strong />,
                  }}
                />
              </p>
            )}
          </div>
        )}

        <div className="p-3 bg-amber-50 text-amber-900 text-sm rounded-lg border border-amber-100">
          <Trans
            i18nKey="logisticsPages.missionsClaimBanner"
            components={{
              strong: <strong />,
              vehiclesLink: (
                <Link href="/logistics-partner/vehicles" className="text-[#2D5A27] font-medium underline underline-offset-2" />
              ),
            }}
          />
        </div>

        {/* Active missions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('logisticsPages.missionsPageActiveTitle')}</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">{t('logisticsPages.missionsPageActiveLoading')}</p>
          ) : acceptedMissions.length === 0 ? (
            <div className="text-sm text-gray-600 space-y-3">
              <p>{t('logisticsPages.missionsPageActiveEmpty')}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <Link
                  href="#logistics-available-missions"
                  className="font-medium text-[#2D5A27] underline underline-offset-2"
                >
                  {t('logisticsPages.missionsPageActiveEmptyCtaPool')}
                </Link>
                <Link
                  href="/logistics-partner/vehicles"
                  className="font-medium text-[#2D5A27] underline underline-offset-2"
                >
                  {t('logisticsPages.missionsPageActiveEmptyCtaVehicles')}
                </Link>
              </div>
            </div>
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
                          className={`px-2 py-1 text-xs font-medium rounded-full ${logisticsStatusBadgeClass(mission.status)}`}
                        >
                          {mission.status === 'COMPLETED'
                            ? t('logisticsPages.missionBadgeDone')
                            : mission.status === 'IN_TRANSIT'
                              ? t('logisticsPages.missionBadgeInTransit')
                              : mission.status === 'PICKED_UP'
                                ? t('logisticsPages.missionBadgePickedUp')
                                : isLoadingStatus(mission.status)
                                  ? t('logisticsPages.missionBadgeLoading')
                                  : mission.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        <span className="text-gray-500">{t('logisticsPages.missionsLabelFrom')} </span>
                        {mission.pickupAddress}
                      </p>
                      <p className="text-sm text-gray-900 mt-2">
                        <span className="text-gray-500">{t('logisticsPages.missionsLabelTo')} </span>
                        <strong>{destinationLine(mission, t)}</strong>
                        {mission.destinationCity && mission.destinationCity.trim() !== '—' && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 text-slate-800 px-2 py-0.5 text-xs font-medium">
                            {mission.destinationCity}
                          </span>
                        )}
                      </p>
                      {mission.loadInstructions && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">{t('logisticsPages.missionsLoadDockLabel')}</span>{' '}
                          {mission.loadInstructions}
                        </p>
                      )}
                      {mission.batches && (
                        <p className="text-sm text-gray-600 mt-2">
                          {t('logisticsPages.missionsActiveLoad', {
                            product: mission.batches.productName,
                            quantity: mission.batches.quantity,
                            unit: formatUnit(mission.batches.unit),
                          })}
                          {approxPalletCount(mission.batches.quantity, mission.batches.unit) != null && (
                            <span className="text-gray-500">
                              {' '}
                              {['pallet', 'pallets'].includes(mission.batches.unit.toLowerCase())
                                ? t('logisticsPages.missionsActivePalletBatch', {
                                    count: approxPalletCount(mission.batches.quantity, mission.batches.unit),
                                  })
                                : t('logisticsPages.missionsActivePalletWeight', {
                                    count: approxPalletCount(mission.batches.quantity, mission.batches.unit),
                                  })}
                            </span>
                          )}
                        </p>
                      )}
                      {isLoadingStatus(mission.status) && (
                        <div className="mt-3 rounded-lg border border-[#2D5A27]/15 bg-[#f7faf6]/60 p-3">
                          <label className="block text-xs font-medium text-gray-800">
                            {t('logisticsPages.missionsAssignDriverLabel')}
                          </label>
                          <p className="text-xs text-gray-600 mt-0.5 mb-2">
                            <Link
                              href="/logistics-partner/drivers"
                              className="text-[#2D5A27] font-medium underline underline-offset-2"
                            >
                              {t('logisticsPages.missionsManageDriversLink')}
                            </Link>
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                            <select
                              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                              disabled={driversLoading}
                              value={
                                activeDriverDraft[mission.id] ??
                                mission.assigned_logistics_driver?.id ??
                                ''
                              }
                              onChange={(e) =>
                                setActiveDriverDraft((d) => ({ ...d, [mission.id]: e.target.value }))
                              }
                            >
                              <option value="">—</option>
                              {activeDrivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {[d.firstName, d.lastName].filter(Boolean).join(' ')}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={savingDriverForMission === mission.id}
                              onClick={() => void saveMissionDriver(mission)}
                              className="rounded-lg bg-[#2D5A27] px-3 py-2 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-60"
                            >
                              {savingDriverForMission === mission.id
                                ? t('logisticsPages.missionsAssignDriverSaving')
                                : t('logisticsPages.missionsAssignDriverSave')}
                            </button>
                          </div>
                        </div>
                      )}
                      {(mission.status === 'READY_FOR_LOADING' ||
                        mission.status === 'PICKED_UP' ||
                        mission.status === 'IN_TRANSIT') && (
                        <div className="mt-3 rounded-lg border border-sky-200/80 bg-sky-50/50 p-3">
                          <p className="text-xs font-semibold text-slate-900">
                            {t('logisticsPages.missionsJourneyTitle')}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">{t('logisticsPages.missionsJourneyHint')}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {mission.status === 'READY_FOR_LOADING' && (
                              <button
                                type="button"
                                disabled={lifecycleBusy !== null}
                                onClick={() => void runLifecycle(mission.id, 'DEPART_FARM')}
                                className="rounded-lg bg-[#2D5A27] px-3 py-2 text-xs font-medium text-white hover:bg-[#23471f] disabled:opacity-60"
                              >
                                {lifecycleBusy === `${mission.id}:DEPART_FARM`
                                  ? t('logisticsPages.missionsLifecycleWorking')
                                  : t('logisticsPages.missionsLifecycleDepart')}
                              </button>
                            )}
                            {mission.status === 'PICKED_UP' && (
                              <button
                                type="button"
                                disabled={lifecycleBusy !== null}
                                onClick={() => void runLifecycle(mission.id, 'START_TRANSIT')}
                                className="rounded-lg bg-[#2D5A27] px-3 py-2 text-xs font-medium text-white hover:bg-[#23471f] disabled:opacity-60"
                              >
                                {lifecycleBusy === `${mission.id}:START_TRANSIT`
                                  ? t('logisticsPages.missionsLifecycleWorking')
                                  : t('logisticsPages.missionsLifecycleTransit')}
                              </button>
                            )}
                            {mission.status === 'IN_TRANSIT' && (
                              <button
                                type="button"
                                disabled={lifecycleBusy !== null}
                                onClick={() => void runLifecycle(mission.id, 'COMPLETE_DELIVERY')}
                                className="rounded-lg bg-[#2D5A27] px-3 py-2 text-xs font-medium text-white hover:bg-[#23471f] disabled:opacity-60"
                              >
                                {lifecycleBusy === `${mission.id}:COMPLETE_DELIVERY`
                                  ? t('logisticsPages.missionsLifecycleWorking')
                                  : t('logisticsPages.missionsLifecycleDelivered')}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {siblingsByCity(missions, mission).length > 0 && (
                        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 text-xs text-gray-600">
                          <p className="font-medium text-gray-800">{t('logisticsPages.missionsSameCityActive')}</p>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {siblingsByCity(missions, mission).map((o) => (
                              <li key={o.id}>
                                {o.missionNumber}
                                {o.batches
                                  ? ` · ${o.batches.productName} ${o.batches.quantity} ${o.batches.unit}`
                                  : ''}{' '}
                                <span className="text-gray-400">({o.status})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={isLoadingStatus(mission.status) ? '/logistics-partner/handover' : '/logistics-partner/dashboard'}
                        className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f]"
                      >
                        {isLoadingStatus(mission.status)
                          ? t('logisticsPages.missionsCardHandover')
                          : t('logisticsPages.missionsCardDashboard')}
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
          id="logistics-available-missions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="scroll-mt-24 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('logisticsPages.missionsPageAvailableTitle')}</h2>
          {availableMissions.length === 0 ? (
            <div className="text-sm text-gray-600 space-y-3">
              <p>{t('logisticsPages.missionsPageAvailableEmpty')}</p>
              <p className="text-gray-500">{t('logisticsPages.missionsPageAvailableEmptyHint')}</p>
              <Link
                href="/logistics-partner/vehicles"
                className="inline-flex font-medium text-[#2D5A27] underline underline-offset-2"
              >
                {t('logisticsPages.missionsPageAvailableEmptyCtaVehicles')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {availableMissions.map((mission) => {
                const batch = mission.batches;
                const pallets = batch ? approxPalletCount(batch.quantity, batch.unit) : null;
                const sizeHint = batch ? suggestVehicleSize(batch.quantity, batch.unit, t) : null;
                const route = mission.optimalRoute;
                return (
                  <div
                    key={mission.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#2D5A27]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            {t('logisticsPages.missionsMissionLabel', { num: mission.missionNumber })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">
                          <span className="text-gray-500">{t('logisticsPages.missionsLabelFrom')} </span>
                          {mission.pickupAddress}
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          <span className="text-gray-500">{t('logisticsPages.missionsLabelTo')} </span>
                          <strong>{destinationLine(mission, t)}</strong>
                          {mission.destinationCity && mission.destinationCity.trim() !== '—' && (
                            <span className="ml-2 inline-flex rounded-full bg-slate-100 text-slate-800 px-2 py-0.5 text-xs font-medium">
                              {mission.destinationCity}
                            </span>
                          )}
                        </p>
                        {mission.loadInstructions && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{t('logisticsPages.missionsLoadDockLabel')}</span>{' '}
                            {mission.loadInstructions}
                          </p>
                        )}
                        {mission.harvest_announcement?.cropType && (
                          <p className="text-xs text-gray-500">
                            {t('logisticsPages.missionsCrop', { crop: mission.harvest_announcement.cropType })}
                          </p>
                        )}
                        {batch && (
                          <ul className="text-sm text-gray-700 list-disc list-inside space-y-0.5">
                            <li>
                              {t('logisticsPages.missionsLoadSummary', {
                                product: batch.productName,
                                quantity: batch.quantity,
                                unit: formatUnit(batch.unit),
                              })}
                            </li>
                            {pallets != null && (
                              <li>
                                {batch && ['pallet', 'pallets'].includes(batch.unit.toLowerCase())
                                  ? t('logisticsPages.missionsPalletCountAsBatch', { count: pallets })
                                  : t('logisticsPages.missionsPalletCountApprox', { count: pallets })}
                              </li>
                            )}
                            {sizeHint && (
                              <li>{t('logisticsPages.missionsSizeClass', { hint: sizeHint })}</li>
                            )}
                            <li>{t('logisticsPages.missionsRequiresFrigo')}</li>
                          </ul>
                        )}
                        {!batch && (
                          <p className="text-sm text-amber-800">{t('logisticsPages.missionsAvailableNoBatch')}</p>
                        )}
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {mission.estimatedPickupTime && (
                            <p>
                              {t('logisticsPages.missionsTargetPickup', {
                                when: new Date(mission.estimatedPickupTime).toLocaleString(),
                              })}
                            </p>
                          )}
                          {route?.distance && (
                            <p>
                              {t('logisticsPages.missionsRouteAssist', {
                                distance: route.distance,
                                durationPart: route.duration ? ` · ${route.duration}` : '',
                              })}
                            </p>
                          )}
                        </div>
                        {siblingsByCity(missions, mission).length > 0 && (
                          <div className="pt-2 border-t border-dashed text-xs text-gray-600">
                            <p className="font-medium text-gray-800">{t('logisticsPages.missionsSameCityPool')}</p>
                            <ul className="list-disc list-inside mt-1">
                              {siblingsByCity(missions, mission).map((o) => (
                                <li key={o.id}>
                                  {o.missionNumber}
                                  {o.batches
                                    ? ` · ${o.batches.productName} ${o.batches.quantity} ${o.batches.unit}`
                                    : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 w-full lg:w-auto lg:min-w-[220px]">
                        <label className="text-xs font-medium text-gray-700">
                          {t('logisticsPages.missionsClaimDriverLabel')}
                        </label>
                        <select
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm w-full"
                          value={claimDriverForMission[mission.id] ?? ''}
                          onChange={(e) =>
                            setClaimDriverForMission((d) => ({ ...d, [mission.id]: e.target.value }))
                          }
                          disabled={driversLoading || claiming === mission.id}
                        >
                          <option value="">{t('logisticsPages.missionsClaimDriverPlaceholder')}</option>
                          {activeDrivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {[d.firstName, d.lastName].filter(Boolean).join(' ')}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 leading-snug">
                          {t('logisticsPages.missionsClaimDriverHint')}
                        </p>
                        <button
                          type="button"
                          disabled={claiming === mission.id}
                          onClick={() => void claimMission(mission.id)}
                          className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-60 w-full sm:w-auto"
                        >
                          {claiming === mission.id
                            ? t('logisticsPages.missionsClaimMissionWorking')
                            : t('logisticsPages.missionsClaimMission')}
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
