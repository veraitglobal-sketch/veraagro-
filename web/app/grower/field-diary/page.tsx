'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { estatesAPI, fieldEntriesAPI, growthLogsAPI, parcelsAPI } from '@/lib/api';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { Loader2, NotebookPen } from 'lucide-react';
import { growerApiErrorOrT } from '@/lib/grower-api-error';
import WeatherObservationForm from '@/components/grower/WeatherObservationForm';
import {
  formatFieldEntryPreview,
  fieldEntryDetailData,
  fieldEntryActivityLabel,
  type FieldEntryRow,
} from '@biovera/shared/i18n/field-entry-format';

type EstateRow = { id: string; name: string };
type ParcelMini = { id: string; cropType?: string | null };

type GrowthLogRow = {
  id: string;
  createdAt: string;
  imageUrl?: string | null;
  notes?: string | null;
  growthStage?: string | null;
  parcelId?: string | null;
  parcels?: { id: string; cropType?: string | null } | null;
};

type DiaryTab = 'entries' | 'growth';

export default function GrowerFieldDiaryPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const nav = useGrowerNavItems();
  const [estates, setEstates] = useState<EstateRow[]>([]);
  const [parcels, setParcels] = useState<ParcelMini[]>([]);
  const [estateId, setEstateId] = useState('');
  const [parcelId, setParcelId] = useState<string>('ALL');
  const [tab, setTab] = useState<DiaryTab>('entries');
  const [entries, setEntries] = useState<FieldEntryRow[]>([]);
  const [growthLogs, setGrowthLogs] = useState<GrowthLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const estateName = estates.find((e) => e.id === estateId)?.name;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = (await estatesAPI.getAll()) as EstateRow[];
        if (cancelled) return;
        setEstates(list || []);
        if (list?.length) setEstateId((prev) => prev || list[0].id);
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

  const loadData = useCallback(async () => {
    if (!estateId) {
      setEntries([]);
      setGrowthLogs([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const parcelFilter = parcelId && parcelId !== 'ALL' ? parcelId : undefined;
      const [entryRows, logRows] = await Promise.all([
        fieldEntriesAPI.list({ farmId: estateId, parcelId: parcelFilter, limit: 100 }),
        tab === 'growth'
          ? parcelFilter
            ? growthLogsAPI.listByParcel(parcelFilter)
            : growthLogsAPI.listByEstate(estateId)
          : Promise.resolve([]),
      ]);
      setEntries(Array.isArray(entryRows) ? entryRows : []);
      setGrowthLogs(Array.isArray(logRows) ? logRows : []);
    } catch (e: unknown) {
      setErr(growerApiErrorOrT(e, t, 'growerPages.loadFailed'));
      setEntries([]);
      setGrowthLogs([]);
    } finally {
      setLoading(false);
    }
  }, [estateId, parcelId, tab, t]);

  useEffect(() => {
    if (estateId) void loadData();
  }, [estateId, parcelId, tab, loadData]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(b.occurredAt ?? b.createdAt).getTime() -
          new Date(a.occurredAt ?? a.createdAt).getTime(),
      ),
    [entries],
  );

  const sortedLogs = useMemo(
    () => [...growthLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [growthLogs],
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

  const parcelLabel = useCallback(
    (id?: string | null) => {
      if (!id) return '—';
      const p = parcels.find((x) => x.id === id);
      return p?.cropType || `${id.slice(0, 8)}…`;
    },
    [parcels],
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

          <div className="flex flex-wrap gap-2">
            {(['entries', 'growth'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium border ${
                  tab === key
                    ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {key === 'entries'
                  ? t('growerPages.fieldDiaryTabEntries', { defaultValue: 'Field entries' })
                  : t('growerPages.fieldDiaryTabGrowth', { defaultValue: 'Growth photos' })}
              </button>
            ))}
          </div>

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
                <label className="block text-base font-medium text-gray-700 mb-1.5">
                  {t('growerPages.fieldDiarySelectEstate')}
                </label>
                <select
                  value={estateId}
                  onChange={(e) => setEstateId(e.target.value)}
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
                <label className="block text-base font-medium text-gray-700 mb-1.5">
                  {t('growerPages.fieldDiarySelectParcel')}
                </label>
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

          {estateId && parcelId !== 'ALL' ? <WeatherObservationForm key={`${estateId}:${parcelId}`} farmId={estateId} parcelId={parcelId} onSaved={loadData} /> : null}
          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800">{err}</div>
          )}

          {loading && estateId ? (
            <div className="flex items-center gap-2 text-base text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-[#2D5A27]" />
              {t('growerPages.loadingFieldDiary')}
            </div>
          ) : tab === 'entries' ? (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {sortedEntries.length === 0 ? (
                <div className="p-8 text-center text-base text-gray-500 flex flex-col items-center gap-4">
                  <NotebookPen className="h-12 w-12 text-gray-300" />
                  <p>{t('growerPages.fieldDiaryNoLogs')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {sortedEntries.map((row) => {
                    const detail = fieldEntryDetailData(row);
                    const open = expandedId === row.id;
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-4 hover:bg-gray-50/80"
                          onClick={() => setExpandedId(open ? null : row.id)}
                        >
                          <p className="text-base font-medium text-gray-900">
                            {formatFieldEntryPreview(row, estateName)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatWhen(row.occurredAt ?? row.createdAt)} ·{' '}
                            {fieldEntryActivityLabel(row.type)} · {parcelLabel(detail.parcelId)}
                          </p>
                        </button>
                        {open && (
                          <div className="px-4 pb-4 text-sm text-gray-700 space-y-1 border-t border-gray-50 bg-gray-50/50">
                            {detail.bags.length > 0 && (
                              <p>
                                {t('growerPages.fieldDiaryBags', { defaultValue: 'Bags / serials' })}:{' '}
                                {detail.bags.map((b) => b.serial).filter(Boolean).join(', ') || '—'}
                              </p>
                            )}
                            {detail.areaHa != null && (
                              <p>
                                {t('growerPages.fieldDiaryArea', { defaultValue: 'Area' })}: {detail.areaHa} ha
                              </p>
                            )}
                            {detail.lat != null && detail.lng != null && (
                              <p>GPS: {detail.lat.toFixed(5)}, {detail.lng.toFixed(5)}</p>
                            )}
                            {detail.notes && <p>{detail.notes}</p>}
                            {detail.photos.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {detail.photos.map((url) => (
                                  <img
                                    key={url}
                                    src={url}
                                    alt=""
                                    className="w-16 h-16 rounded-md object-cover border border-gray-200"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {sortedLogs.length === 0 ? (
                <div className="p-8 text-center text-base text-gray-500">{t('growerPages.fieldDiaryNoGrowthLogs', { defaultValue: 'No growth stage photos yet.' })}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-base">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-sm text-gray-600">
                        <th className="px-4 py-3 font-medium">{t('growerPages.fieldDiaryColWhen')}</th>
                        <th className="px-4 py-3 font-medium">{t('growerPages.fieldDiaryColParcel')}</th>
                        <th className="px-4 py-3 font-medium">{t('growerPages.fieldDiaryColStage')}</th>
                        <th className="px-4 py-3 font-medium">{t('growerPages.fieldDiaryColNotes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLogs.map((row) => (
                        <tr key={row.id} className="border-b border-gray-50">
                          <td className="px-4 py-3">{formatWhen(row.createdAt)}</td>
                          <td className="px-4 py-3">{row.parcels?.cropType || row.parcelId?.slice(0, 8) || '—'}</td>
                          <td className="px-4 py-3">{row.growthStage || '—'}</td>
                          <td className="px-4 py-3">{row.notes || '—'}</td>
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
