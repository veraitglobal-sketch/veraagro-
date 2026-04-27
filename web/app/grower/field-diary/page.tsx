'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { estatesAPI, growthLogsAPI, parcelsAPI } from '@/lib/api';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { Loader2, NotebookPen } from 'lucide-react';

type EstateRow = { id: string; name: string };
type ParcelMini = { id: string; cropType?: string | null };

type GrowthLogRow = {
  id: string;
  createdAt: string;
  notes?: string | null;
  growthStage?: string | null;
  parcelId?: string | null;
  harvestAnnouncementId?: string | null;
  parcels?: { id: string; cropType?: string | null } | null;
  harvest_announcements?: {
    id: string;
    cropType: string;
    announcementType: string;
    estimatedDate: string;
    status: string;
  } | null;
};

export default function GrowerFieldDiaryPage() {
  const { t } = useTranslation();
  const nav = useGrowerNavItems();
  const [estates, setEstates] = useState<EstateRow[]>([]);
  const [parcels, setParcels] = useState<ParcelMini[]>([]);
  const [estateId, setEstateId] = useState('');
  const [parcelId, setParcelId] = useState<string>('ALL');
  const [logs, setLogs] = useState<GrowthLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = (await estatesAPI.getAll()) as EstateRow[];
        if (cancelled) return;
        setEstates(list || []);
        if (list?.length) {
          setEstateId((prev) => prev || list[0].id);
        }
      } catch {
        if (!cancelled) setErr(t('growerPages.loadFieldsFailed'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!estateId) return;
    let cancelled = false;
    (async () => {
      const p = (await parcelsAPI.getByEstate(estateId).catch(() => [])) as ParcelMini[];
      if (cancelled) return;
      setParcels(p || []);
      setParcelId('ALL');
    })();
    return () => {
      cancelled = true;
    };
  }, [estateId]);

  const loadLogs = useCallback(async () => {
    if (!estateId) {
      setLogs([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      if (parcelId && parcelId !== 'ALL') {
        const data = (await growthLogsAPI.listByParcel(parcelId)) as GrowthLogRow[];
        setLogs(Array.isArray(data) ? data : []);
      } else {
        const data = (await growthLogsAPI.listByEstate(estateId)) as GrowthLogRow[];
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('growerPages.loadFailed'));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [estateId, parcelId, t]);

  useEffect(() => {
    if (estateId) void loadLogs();
  }, [estateId, parcelId, loadLogs]);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [logs],
  );

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.nav.fieldDiary')} navItems={nav}>
        <GrowerPageShell className="space-y-5">
          <GrowerPageHeader
            title={t('grower.nav.fieldDiary')}
            description={t('growerPages.fieldDiaryPageLead')}
          />

          <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            {t('growerPages.fieldDiaryMobileOnly')}
          </div>

          <p className="text-sm text-gray-600">
            <Link href="/grower/fields" className="text-[#2D5A27] font-medium underline">
              {t('grower.placeholders.openParcels')}
            </Link>
          </p>

          {estates.length === 0 && !loading ? (
            <p className="text-sm text-gray-600">{t('growerPages.noFieldsYet')}</p>
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('growerPages.fieldDiarySelectEstate')}</label>
                <select
                  value={estateId}
                  onChange={(e) => {
                    setEstateId(e.target.value);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm min-w-[12rem] focus:ring-2 focus:ring-[#2D5A27]/30"
                >
                  {estates.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('growerPages.fieldDiarySelectParcel')}</label>
                <select
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm min-w-[12rem] focus:ring-2 focus:ring-[#2D5A27]/30"
                >
                  <option value="ALL">{t('growerPages.fieldDiaryAllParcels')}</option>
                  {parcels.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.cropType || p.id.slice(0, 8)}…
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
          )}

          {loading && estateId ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-[#2D5A27]" />
              {t('growerPages.loadingBatches')}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {sortedLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                  <NotebookPen className="h-10 w-10 text-gray-300" />
                  {t('growerPages.fieldDiaryNoLogs')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-4 py-2 font-medium">{t('growerPages.fieldDiaryColWhen')}</th>
                        <th className="px-4 py-2 font-medium">{t('growerPages.fieldDiaryColParcel')}</th>
                        <th className="px-4 py-2 font-medium">{t('growerPages.fieldDiaryColPlan')}</th>
                        <th className="px-4 py-2 font-medium">{t('growerPages.fieldDiaryColStage')}</th>
                        <th className="px-4 py-2 font-medium">{t('growerPages.fieldDiaryColNotes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLogs.map((row) => (
                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                            {new Date(row.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-gray-800">
                            {row.parcels?.cropType || row.parcelId?.slice(0, 8) || '—'}…
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {row.harvest_announcements
                              ? `${row.harvest_announcements.cropType} (${row.harvest_announcements.announcementType})`
                              : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{row.growthStage || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-700 max-w-md font-light">{row.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
