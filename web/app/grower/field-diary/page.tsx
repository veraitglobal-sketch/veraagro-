'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { estatesAPI, growthLogsAPI, parcelsAPI } from '@/lib/api';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { Loader2, NotebookPen } from 'lucide-react';
import { growerApiErrorOrT } from '@/lib/grower-api-error';

type EstateRow = { id: string; name: string };
type ParcelMini = { id: string; cropType?: string | null };

type GrowthLogRow = {
  id: string;
  createdAt: string;
  imageUrl?: string | null;
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
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
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
      } catch (e: unknown) {
        if (!cancelled) setErr(growerApiErrorOrT(e, t, 'growerPages.loadFieldsFailed'));
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
    } catch (e: unknown) {
      setErr(growerApiErrorOrT(e, t, 'growerPages.loadFailed'));
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

  const formatWhen = useCallback(
    (iso: string) => {
      try {
        const tag = dateIntlLocaleFromLanguageTag(i18n.language);
        return new Date(iso).toLocaleString(tag, { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        return iso;
      }
    },
    [i18n.language],
  );

  const planTypeLabel = useCallback(
    (announcementType: string) => {
      const u = (announcementType || '').toUpperCase();
      if (u === 'PLANTING') return t('growerPages.annTypePLANTING');
      if (u === 'HARVEST') return t('growerPages.annTypeHARVEST');
      return announcementType;
    },
    [t],
  );

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.nav.fieldDiary')} navItems={nav}>
        <GrowerPageShell className="space-y-5">
          <GrowerPageHeader
            title={t('grower.nav.fieldDiary')}
            description={t('growerPages.fieldDiaryPageLead')}
          />

          <div className="rounded-lg border border-[#2D5A27]/25 bg-[#2D5A27]/[0.07] px-4 py-3 text-base text-gray-900">
            <p className="font-semibold text-[#1a3817]">{t('growerPages.fieldDiarySyncedTitle')}</p>
            <p className="mt-1 text-gray-700 font-light leading-snug">
              {t('growerPages.fieldDiarySyncedBody')} {t('growerPages.fieldDiaryMobileEntryHint')}
            </p>
          </div>

          <p className="text-base text-gray-600">
            <Link
              href={loc('/grower/fields')}
              className="text-[#2D5A27] font-medium underline underline-offset-2 inline-flex min-h-[44px] items-center"
            >
              {t('grower.placeholders.openParcels')}
            </Link>
          </p>

          {estates.length === 0 && !loading ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-4 text-base text-gray-700 space-y-3">
              <p>{t('growerPages.noFieldsYet')}</p>
              <Link
                href={loc('/grower/fields')}
                className="inline-flex min-h-[44px] items-center font-semibold text-[#2D5A27] underline underline-offset-2"
              >
                {t('grower.placeholders.openParcels')}
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">{t('growerPages.fieldDiarySelectEstate')}</label>
                <select
                  value={estateId}
                  onChange={(e) => {
                    setEstateId(e.target.value);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-3 text-base min-w-[12rem] focus:ring-2 focus:ring-[#2D5A27]/30"
                >
                  {estates.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">{t('growerPages.fieldDiarySelectParcel')}</label>
                <select
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-3 text-base min-w-[12rem] focus:ring-2 focus:ring-[#2D5A27]/30"
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
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800">{err}</div>
          )}

          {loading && estateId ? (
            <div className="flex items-center gap-2 text-base text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-[#2D5A27]" />
              {t('growerPages.loadingFieldDiary')}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {sortedLogs.length === 0 ? (
                <div className="p-8 text-center text-base text-gray-500 flex flex-col items-center gap-4">
                  <NotebookPen className="h-12 w-12 text-gray-300" />
                  <p>{t('growerPages.fieldDiaryNoLogs')}</p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href={loc('/producer/field-entry')}
                      className="inline-flex min-h-[44px] items-center rounded-md bg-[#2D5A27] px-4 py-2 text-base font-medium text-white hover:bg-[#23471f]"
                    >
                      {t('growerPages.fieldDiaryEmptyCtaCapture')}
                    </Link>
                    <Link
                      href={loc('/grower/plantings')}
                      className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-800 hover:bg-gray-50"
                    >
                      {t('growerPages.fieldDiaryEmptyCtaPlans')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-base">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-sm text-gray-600 tracking-wide">
                        <th className="px-4 py-3 font-medium w-14">{t('growerPages.fieldDiaryColPhoto')}</th>
                        <th className="px-4 py-3 font-medium">{t('growerPages.fieldDiaryColWhen')}</th>
                        <th className="px-4 py-3 font-medium">{t('growerPages.fieldDiaryColParcel')}</th>
                        <th className="px-4 py-3 font-medium">{t('growerPages.fieldDiaryColPlan')}</th>
                        <th className="px-4 py-3 font-medium">{t('growerPages.fieldDiaryColStage')}</th>
                        <th className="px-4 py-3 font-medium">{t('growerPages.fieldDiaryColNotes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLogs.map((row) => (
                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3 align-middle">
                            {row.imageUrl ? (
                              <img
                                src={row.imageUrl}
                                alt=""
                                className="w-10 h-10 rounded-md object-cover border border-gray-200 bg-gray-50"
                              />
                            ) : (
                              <span
                                className="inline-flex w-10 h-10 rounded-md bg-gray-100 border border-gray-100"
                                aria-hidden
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {formatWhen(row.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            {row.parcels?.cropType || row.parcelId?.slice(0, 8) || '—'}…
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {row.harvest_announcements
                              ? `${row.harvest_announcements.cropType} (${planTypeLabel(row.harvest_announcements.announcementType)})`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{row.growthStage || '—'}</td>
                          <td className="px-4 py-3 text-gray-700 max-w-md font-light leading-relaxed">{row.notes || '—'}</td>
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
