// Field Entry Page - Offline-first entry form
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import OfflineEntryForm from '@/components/OfflineEntryForm';
import { useOfflineEntry } from '@/hooks/useOfflineEntry';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { estatesAPI } from '@/lib/api';

type EstateRow = { id: string; name: string };

function FieldEntryWorkspace({
  selectedFarmId,
  onEstateChange,
  estates,
}: {
  selectedFarmId: string;
  onEstateChange: (id: string) => void;
  estates: EstateRow[];
}) {
  const { t, i18n } = useTranslation();
  const { entries, pendingSync, isOnline, syncNow, refresh } = useOfflineEntry({
    farmId: selectedFarmId,
    autoSync: true,
  });

  const activityLabel = (type: string) => {
    if (type === 'SETVA') return t('growerPages.fieldEntrySowing');
    if (type === 'PRSKANJE') return t('growerPages.fieldEntrySpraying');
    return t('growerPages.fieldEntryHarvest');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <label className="block text-base font-medium text-gray-800 mb-2">
            {t('growerPages.fieldEntryEstateLabel')}
          </label>
          <select
            value={selectedFarmId}
            onChange={(e) => onEstateChange(e.target.value)}
            className="w-full max-w-md px-3 py-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27]"
          >
            {estates.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{t('growerPages.fieldEntryEstateHint')}</p>
        </div>
        <OfflineEntryForm
          farmId={selectedFarmId}
          onSuccess={() => {
            refresh();
          }}
        />
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-lg text-gray-800 mb-3">{t('growerPages.fieldEntryStatusTitle')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-base text-gray-700">{t('growerPages.fieldEntryConnection')}</span>
              <span
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  isOnline ? 'bg-[#2D5A27]/20 text-[#23471f]' : 'bg-red-100 text-red-800'
                }`}
              >
                {isOnline ? t('growerPages.fieldEntryOnline') : t('growerPages.fieldEntryOffline')}
              </span>
            </div>
            {pendingSync > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-base text-gray-700">{t('growerPages.fieldEntryPending')}</span>
                <span className="px-3 py-1.5 rounded-md text-sm font-medium bg-amber-100 text-amber-900">
                  {t('growerPages.fieldEntryPendingCount', { count: pendingSync })}
                </span>
              </div>
            )}
            {pendingSync > 0 && isOnline && (
              <button
                type="button"
                onClick={syncNow}
                className="w-full mt-1 min-h-[48px] px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {t('growerPages.fieldEntrySyncNow')}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-lg text-gray-800 mb-3">{t('growerPages.fieldEntryRecentTitle')}</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-base text-gray-600">{t('growerPages.fieldEntryNoEntriesYet')}</p>
            ) : (
              entries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-base">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-semibold text-gray-900">{activityLabel(entry.type)}</span>
                    <span className={`text-sm font-medium shrink-0 ${entry.synced ? 'text-[#2D5A27]' : 'text-amber-700'}`}>
                      {entry.synced ? '✓' : '⏳'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(entry.data.date).toLocaleDateString(i18n.language)}
                  </div>
                  {entry.data.notes && (
                    <div className="text-sm text-gray-600 mt-1 truncate">{entry.data.notes}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FieldEntryPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const [estates, setEstates] = useState<EstateRow[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      try {
        const list = await estatesAPI.getAll();
        if (cancelled) return;
        const rows: EstateRow[] = Array.isArray(list)
          ? list.map((e: { id: string; name: string }) => ({ id: e.id, name: e.name || t('growerPages.batchDetailEstate') }))
          : [];
        setEstates(rows);
        if (rows.length > 0) {
          setSelectedFarmId((prev) => (prev && rows.some((r) => r.id === prev) ? prev : rows[0].id));
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : t('growerPages.fieldEntryLoadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('growerPages.fieldEntryTitle')}</h1>
          <p className="text-base text-gray-700 max-w-3xl leading-relaxed">{t('growerPages.fieldEntryLead')}</p>
        </div>

        {loading && (
          <div className="text-center py-16 text-base text-gray-600">{t('growerPages.fieldEntryLoadingEstates')}</div>
        )}

        {!loading && loadError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-base">{loadError}</div>
        )}

        {!loading && !loadError && estates.length === 0 && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 text-base max-w-xl">
            <p className="font-semibold mb-2 text-lg">{t('growerPages.fieldEntryNoEstateTitle')}</p>
            <p className="mb-4 leading-relaxed">{t('growerPages.fieldEntryNoEstateBody')}</p>
            <Link
              href={loc('/grower/fields')}
              className="inline-flex min-h-[48px] items-center text-[#2D5A27] font-semibold underline underline-offset-2"
            >
              {t('grower.placeholders.openParcels')}
            </Link>
          </div>
        )}

        {!loading && !loadError && estates.length > 0 && selectedFarmId && (
          <FieldEntryWorkspace
            selectedFarmId={selectedFarmId}
            onEstateChange={setSelectedFarmId}
            estates={estates}
          />
        )}
      </div>
    </div>
  );
}
