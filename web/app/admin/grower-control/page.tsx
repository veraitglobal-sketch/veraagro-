'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import AdminShell from '@/components/AdminShell';
import {
  growthLogsAPI,
  harvestAnnouncementsAPI,
  missionsAPI,
} from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';
import { formatDateTimeEn } from '@/lib/en-locale-dates';
import {
  CheckCircle,
  Loader2,
  ShieldCheck,
  Truck,
  Camera,
  Sprout,
  CalendarRange,
  XCircle,
  Trash2,
} from 'lucide-react';

type TabId = 'transport' | 'growth' | 'plantings' | 'plans';

function mediaSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (process.env.NEXT_PUBLIC_API_URL || 'https://api.biovera.app').replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

function growerName(u?: { firstName?: string; lastName?: string; partnerCode?: string } | null): string {
  if (!u) return '—';
  const n = `${u.firstName || ''} ${u.lastName || ''}`.trim();
  return n || u.partnerCode || '—';
}

function GrowerControlInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get('tab') || 'transport') as TabId;
  const tab: TabId = ['transport', 'growth', 'plantings', 'plans'].includes(tabParam)
    ? tabParam
    : 'transport';
  const highlightMission = searchParams.get('missionId');
  const highlightLog = searchParams.get('logId');
  const highlightPlan = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<TabId>(tab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const [transport, setTransport] = useState<any[]>([]);
  const [growth, setGrowth] = useState<any[]>([]);
  const [plantings, setPlantings] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const setTab = (next: TabId) => {
    setActiveTab(next);
    const q = new URLSearchParams(searchParams.toString());
    q.set('tab', next);
    router.replace(`/admin/grower-control?${q.toString()}`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [missions, logs, allAnnouncements] = await Promise.all([
        missionsAPI.getAllAdmin({ status: 'AWAITING_APPROVAL' }),
        growthLogsAPI.adminList({ moderationStatus: 'APPROVED', limit: 80 }),
        harvestAnnouncementsAPI.getAll(),
      ]);
      setTransport(Array.isArray(missions) ? missions : []);
      setGrowth(Array.isArray(logs) ? logs : []);
      const rows = Array.isArray(allAnnouncements) ? allAnnouncements : [];
      setPlantings(rows.filter((r: { announcementType?: string }) => r.announcementType === 'PLANTING'));
      setPlans(rows.filter((r: { status?: string }) => r.status === 'PENDING'));
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs = useMemo(
    () =>
      [
        { id: 'transport' as TabId, label: t('adminPages.growerControl.tabTransport'), icon: Truck, count: transport.length },
        { id: 'growth' as TabId, label: t('adminPages.growerControl.tabGrowth'), icon: Camera, count: growth.length },
        { id: 'plantings' as TabId, label: t('adminPages.growerControl.tabPlantings'), icon: Sprout, count: plantings.length },
        { id: 'plans' as TabId, label: t('adminPages.growerControl.tabPlans'), icon: CalendarRange, count: plans.length },
      ] as const,
    [t, transport.length, growth.length, plantings.length, plans.length],
  );

  const approveTransport = async (id: string) => {
    setSaving(id);
    setError(null);
    try {
      await missionsAPI.approveTransportAdmin(id);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(null);
    }
  };

  const rejectTransport = async (id: string) => {
    const reason = reasons[id]?.trim();
    if (!reason) {
      setError(t('adminPages.growerControl.reasonRequired'));
      return;
    }
    if (!window.confirm(t('adminPages.growerControl.confirmRejectTransport'))) return;
    setSaving(id);
    setError(null);
    try {
      await missionsAPI.rejectTransportAdmin(id, reason);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(null);
    }
  };

  const rejectPhoto = async (id: string) => {
    setSaving(id);
    setError(null);
    try {
      await growthLogsAPI.adminReject(id, reasons[id]?.trim() || undefined);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(null);
    }
  };

  const deletePhoto = async (id: string) => {
    if (!window.confirm(t('adminPages.growerControl.confirmDeletePhoto'))) return;
    setSaving(id);
    setError(null);
    try {
      await growthLogsAPI.adminDelete(id);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(null);
    }
  };

  const deletePlanting = async (id: string) => {
    if (!window.confirm(t('adminPages.growerControl.confirmDeletePlanting'))) return;
    setSaving(id);
    setError(null);
    try {
      await harvestAnnouncementsAPI.deletePlanting(id, reasons[id]?.trim() || undefined);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(null);
    }
  };

  const setPlanStatus = async (id: string, status: string) => {
    setSaving(id);
    setError(null);
    try {
      await harvestAnnouncementsAPI.updateAdmin(id, { status });
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start gap-3 mb-2">
        <ShieldCheck className="w-8 h-8 text-[#2D5A27] flex-shrink-0" />
        <div>
          <h1 className="text-2xl font-light text-gray-900">{t('adminPages.growerControl.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('adminPages.growerControl.intro')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        <Link href="/admin/missions?status=AWAITING_APPROVAL" className="text-[#2D5A27] font-medium underline">
          {t('adminPages.growerControl.openMissions')}
        </Link>
        <span className="text-gray-300">·</span>
        <Link href="/admin/harvest-plans" className="text-[#2D5A27] font-medium underline">
          {t('adminPages.growerControl.openHarvestPlans')}
        </Link>
      </div>

      <div
        className="flex flex-wrap gap-1 mb-6 p-1 bg-gray-100 rounded-xl border border-gray-200"
        role="tablist"
      >
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setTab(id)}
            className={`min-h-[48px] flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white text-[#2D5A27] shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 ? (
              <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">{count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
        </div>
      ) : activeTab === 'transport' ? (
        transport.length === 0 ? (
          <Empty msg={t('adminPages.growerControl.emptyTransport')} />
        ) : (
          <ul className="space-y-4">
            <p className="text-xs text-gray-500 mb-2">{t('adminPages.growerControl.transportApprovedHint')}</p>
            {transport.map((m) => {
              const hi = highlightMission === m.id;
              const grower = m.users_missions_growerIdTousers;
              return (
                <li
                  key={m.id}
                  className={`p-5 bg-white border rounded-xl shadow-sm ${hi ? 'ring-2 ring-[#2D5A27]' : 'border-gray-200'}`}
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {t('adminPages.growerControl.mission')}: {m.missionNumber}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('adminPages.growerControl.grower')}: {growerName(grower)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('adminPages.growerControl.destination')}: {m.destinationCity || '—'}
                        {m.destinationAddress ? ` · ${m.destinationAddress}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('adminPages.growerControl.created')}: {m.createdAt ? formatDateTimeEn(m.createdAt) : '—'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[12rem]">
                      <button
                        type="button"
                        disabled={saving === m.id}
                        onClick={() => void approveTransport(m.id)}
                        className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] disabled:opacity-50"
                      >
                        {saving === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {t('adminPages.growerControl.approveTransport')}
                      </button>
                      <input
                        type="text"
                        placeholder={t('adminPages.growerControl.reasonRequired')}
                        value={reasons[m.id] || ''}
                        onChange={(e) => setReasons((p) => ({ ...p, [m.id]: e.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      />
                      <button
                        type="button"
                        disabled={saving === m.id}
                        onClick={() => void rejectTransport(m.id)}
                        className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 text-red-800 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {t('adminPages.growerControl.rejectTransport')}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : activeTab === 'growth' ? (
        growth.length === 0 ? (
          <Empty msg={t('adminPages.growerControl.emptyGrowth')} />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {growth.map((log) => {
              const hi = highlightLog === log.id;
              return (
                <li
                  key={log.id}
                  className={`p-4 bg-white border rounded-xl shadow-sm ${hi ? 'ring-2 ring-[#2D5A27]' : 'border-gray-200'}`}
                >
                  {log.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaSrc(log.imageUrl)}
                      alt=""
                      className="w-full h-40 object-cover rounded-lg border border-gray-100 mb-3"
                    />
                  ) : null}
                  <p className="text-sm font-medium text-gray-900">{growerName(log.users)}</p>
                  <p className="text-xs text-gray-600">
                    {log.parcels?.estates?.name || '—'} · {log.parcels?.cropType || log.growthStage || '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('adminPages.growerControl.gps')}: {log.gpsLatitude?.toFixed?.(5)}, {log.gpsLongitude?.toFixed?.(5)}
                  </p>
                  {log.notes ? (
                    <p className="text-xs text-gray-600 mt-1">
                      {t('adminPages.growerControl.notes')}: {log.notes}
                    </p>
                  ) : null}
                  <p className="text-xs text-gray-400 mt-1">
                    {log.createdAt ? formatDateTimeEn(log.createdAt) : ''}
                  </p>
                  <input
                    type="text"
                    className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder={t('adminPages.growerControl.reasonOptional')}
                    value={reasons[log.id] || ''}
                    onChange={(e) => setReasons((p) => ({ ...p, [log.id]: e.target.value }))}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      disabled={saving === log.id}
                      onClick={() => void rejectPhoto(log.id)}
                      className="flex-1 min-h-[44px] rounded-lg border border-amber-300 text-amber-900 text-sm font-medium hover:bg-amber-50"
                    >
                      {t('adminPages.growerControl.rejectPhoto')}
                    </button>
                    <button
                      type="button"
                      disabled={saving === log.id}
                      onClick={() => void deletePhoto(log.id)}
                      className="min-h-[44px] px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      title={t('adminPages.growerControl.deletePhoto')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : activeTab === 'plantings' ? (
        plantings.length === 0 ? (
          <Empty msg={t('adminPages.growerControl.emptyPlantings')} />
        ) : (
          <ul className="space-y-4">
            {plantings.map((r) => (
              <li key={r.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                <p className="font-medium text-gray-900">{growerName(r.user)}</p>
                <p className="text-sm text-gray-600">
                  {r.parcel?.estates?.name || '—'} — {r.cropType} (PLANTING)
                </p>
                <p className="text-sm text-gray-600">
                  {formatDateTimeEn(r.estimatedDate)}
                  {r.estimatedQuantity != null ? ` · ~${r.estimatedQuantity} kg` : ''}
                </p>
                <p className="text-xs text-gray-500">Status: {r.status}</p>
                <input
                  type="text"
                  className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder={t('adminPages.growerControl.reasonOptional')}
                  value={reasons[r.id] || ''}
                  onChange={(e) => setReasons((p) => ({ ...p, [r.id]: e.target.value }))}
                />
                <button
                  type="button"
                  disabled={saving === r.id}
                  onClick={() => void deletePlanting(r.id)}
                  className="mt-3 min-h-[48px] w-full rounded-lg border border-red-300 text-red-800 text-sm font-medium hover:bg-red-50 inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('adminPages.growerControl.deletePlanting')}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : plans.length === 0 ? (
        <Empty msg={t('adminPages.growerControl.emptyPlans')} />
      ) : (
        <ul className="space-y-4">
          <p className="text-xs text-gray-500">{t('adminPages.growerControl.planPendingHint')}</p>
          {plans.map((r) => {
            const hi = highlightPlan === r.id;
            return (
              <li
                key={r.id}
                className={`p-5 bg-white border rounded-xl shadow-sm ${hi ? 'ring-2 ring-[#2D5A27]' : 'border-gray-200'}`}
              >
                <p className="font-medium text-gray-900">{growerName(r.user)}</p>
                <p className="text-sm text-gray-600">
                  {r.parcel?.estates?.name || '—'} — {r.cropType} ({r.announcementType})
                </p>
                <p className="text-sm text-gray-600">{formatDateTimeEn(r.estimatedDate)}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    type="button"
                    disabled={saving === r.id}
                    onClick={() => void setPlanStatus(r.id, 'CONFIRMED')}
                    className="min-h-[48px] px-4 rounded-lg bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] inline-flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('adminPages.growerControl.confirmPlan')}
                  </button>
                  <button
                    type="button"
                    disabled={saving === r.id}
                    onClick={() => void setPlanStatus(r.id, 'REJECTED')}
                    className="min-h-[48px] px-4 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 inline-flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {t('adminPages.growerControl.rejectPlan')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-600">{msg}</div>
  );
}

export default function GrowerControlPage() {
  const { t } = useTranslation();
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <AdminShell title={t('adminPages.titles.growerControl')}>
        <Suspense
          fallback={
            <div className="p-6 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
            </div>
          }
        >
          <GrowerControlInner />
        </Suspense>
      </AdminShell>
    </AuthGuard>
  );
}
