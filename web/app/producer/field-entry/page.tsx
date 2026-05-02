// Field Entry Page - Offline-first entry form
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import OfflineEntryForm from '@/components/OfflineEntryForm';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { useOfflineEntry } from '@/hooks/useOfflineEntry';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { estatesAPI } from '@/lib/api';
import { growerApiErrorOrT } from '@/lib/grower-api-error';

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <label className="mb-2 block text-sm font-medium text-gray-800">{t('growerPages.fieldEntryEstateLabel')}</label>
          <select
            value={selectedFarmId}
            onChange={(e) => onEstateChange(e.target.value)}
            className="w-full max-w-xl rounded-lg border border-gray-300 bg-white px-3 py-3 text-base shadow-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
          >
            {estates.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('growerPages.fieldEntryEstateHint')}</p>
        </div>
        <OfflineEntryForm
          farmId={selectedFarmId}
          onSuccess={() => {
            refresh();
          }}
        />
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-3 text-base font-semibold text-gray-900">{t('growerPages.fieldEntryStatusTitle')}</h3>
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
                className="mt-1 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#1d4ed8] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#1e40af] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {t('growerPages.fieldEntrySyncNow')}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-3 text-base font-semibold text-gray-900">{t('growerPages.fieldEntryRecentTitle')}</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-base text-gray-600">{t('growerPages.fieldEntryNoEntriesYet')}</p>
            ) : (
              entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-100 bg-gray-50/90 p-3 text-base"
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-semibold text-gray-900">{activityLabel(entry.type)}</span>
                    <span
                      className={`text-sm font-medium shrink-0 ${entry.synced ? 'text-[#2D5A27]' : 'text-amber-700'}`}
                      title={entry.synced ? t('growerPages.fieldEntryStatusSynced') : t('growerPages.fieldEntryStatusPending')}
                    >
                      {entry.synced ? t('growerPages.fieldEntryStatusSynced') : t('growerPages.fieldEntryStatusPending')}
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
  const navItems = useGrowerNavItems();
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
          setLoadError(growerApiErrorOrT(e, t, 'growerPages.fieldEntryLoadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) {
    return (
      <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
        <SidebarLayout title={t('grower.nav.fieldCapture')} navItems={navItems}>
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#2D5A27]" />
              <p className="mt-4 text-base text-gray-600">{t('growerPages.fieldEntryLoadingEstates')}</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title={t('grower.nav.fieldCapture')} navItems={navItems}>
        <GrowerPageShell>
          <GrowerPageHeader title={t('growerPages.fieldEntryTitle')} description={t('growerPages.fieldEntryLead')} />

          {loadError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-800">{loadError}</div>
          )}

          {!loadError && estates.length === 0 && (
            <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-6 text-base text-amber-950">
              <p className="mb-2 text-lg font-semibold">{t('growerPages.fieldEntryNoEstateTitle')}</p>
              <p className="mb-4 leading-relaxed">{t('growerPages.fieldEntryNoEstateBody')}</p>
              <Link
                href={loc('/grower/fields')}
                className="inline-flex min-h-[48px] items-center font-semibold text-[#2D5A27] underline underline-offset-2"
              >
                {t('grower.placeholders.openParcels')}
              </Link>
            </div>
          )}

          {!loadError && estates.length > 0 && selectedFarmId && (
            <FieldEntryWorkspace
              selectedFarmId={selectedFarmId}
              onEstateChange={setSelectedFarmId}
              estates={estates}
            />
          )}
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
