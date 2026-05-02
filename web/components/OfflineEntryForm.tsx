'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOfflineEntry, EntryType } from '@/hooks/useOfflineEntry';
import { getGPSLocation, getDeviceFingerprint } from '@/lib/image-compression';

interface OfflineEntryFormProps {
  farmId: string;
  onSuccess?: () => void;
}

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 shadow-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25';

const labelClassName = 'mb-1.5 block text-sm font-medium text-gray-700';

export default function OfflineEntryForm({ farmId, onSuccess }: OfflineEntryFormProps) {
  const { t } = useTranslation();
  const {
    addEntry,
    scanCode,
    latestScannedCode,
    hasValidScan,
    isOnline,
    pendingSync,
    error: hookError,
    syncNow,
  } = useOfflineEntry({ farmId, autoSync: true });

  const [entryType, setEntryType] = useState<EntryType>('SETVA');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [scanType, setScanType] = useState<'SEED' | 'PACKAGING' | 'FERTILIZER'>('SEED');
  const [fertilizerBarcode, setFertilizerBarcode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const scanTypeLabel = (type: 'SEED' | 'PACKAGING' | 'FERTILIZER') => {
    if (type === 'SEED') return t('growerPages.fieldEntryScanTypeSEED');
    if (type === 'PACKAGING') return t('growerPages.fieldEntryScanTypePACKAGING');
    return t('growerPages.fieldEntryScanTypeFERTILIZER');
  };

  const lastScannedTypeLabel = (type: 'SEED' | 'PACKAGING') =>
    type === 'SEED' ? t('growerPages.fieldEntryScanTypeSEED') : t('growerPages.fieldEntryScanTypePACKAGING');

  const handleScan = async () => {
    if (!scanInput.trim()) {
      window.alert(t('growerPages.fieldEntryAlertBarcodeRequired'));
      return;
    }

    try {
      if (scanType === 'FERTILIZER') {
        setFertilizerBarcode(scanInput.trim());
        setScanInput('');
        window.alert(t('growerPages.fieldEntryAlertFertilizerNote'));
      } else {
        await scanCode(scanInput.trim(), scanType);
        setScanInput('');
        window.alert(t('growerPages.fieldEntryAlertScanDone'));
      }
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const gpsLocation = await getGPSLocation();
      const deviceId = getDeviceFingerprint();

      const result = await addEntry(
        entryType,
        {
          date,
          notes: notes || undefined,
          location: gpsLocation ? { lat: gpsLocation.lat, lng: gpsLocation.lng } : undefined,
          deviceId,
          deviceTimestamp: new Date().toISOString(),
        },
        fertilizerBarcode
          ? { fertilizerBarcode }
          : undefined,
      );

      if (result.success) {
        setSuccess(true);
        setNotes('');
        onSuccess?.();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        window.alert(result.error || t('growerPages.fieldEntryLoadFailed'));
      }
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-gray-900">{t('growerPages.fieldEntryFormCardTitle')}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-600">{t('growerPages.fieldEntryFormCardLead')}</p>

      <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50/90 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('growerPages.fieldEntryBarcodeSection')}</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <select
            value={scanType}
            onChange={(e) => setScanType(e.target.value as 'SEED' | 'PACKAGING' | 'FERTILIZER')}
            className={`${inputClassName} sm:max-w-[200px] shrink-0`}
          >
            <option value="SEED">{t('growerPages.fieldEntryScanTypeSEED')}</option>
            <option value="PACKAGING">{t('growerPages.fieldEntryScanTypePACKAGING')}</option>
            <option value="FERTILIZER">{t('growerPages.fieldEntryScanTypeFERTILIZER')}</option>
          </select>
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder={t('growerPages.fieldEntryBarcodePlaceholder')}
            className={`${inputClassName} min-w-0 flex-1`}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void handleScan())}
          />
          <button
            type="button"
            onClick={() => void handleScan()}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-lg bg-[#2D5A27] px-5 text-base font-medium text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2 sm:px-6"
          >
            {t('growerPages.fieldEntryScanCta')}
          </button>
        </div>
        {latestScannedCode ? (
          <p className="mt-3 text-sm text-gray-600">
            {t('growerPages.fieldEntryLastScanned', {
              code: latestScannedCode.code,
              type: lastScannedTypeLabel(latestScannedCode.type),
            })}
          </p>
        ) : null}
        {fertilizerBarcode ? (
          <p className="mt-2 text-sm font-medium text-[#23471f]">
            {t('growerPages.fieldEntryFertilizerQueued', { code: fertilizerBarcode })}
          </p>
        ) : null}
        {!hasValidScan ? (
          <p className="mt-3 text-sm text-amber-800">{t('growerPages.fieldEntryScanRequiredWarn')}</p>
        ) : null}
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5">
        <div>
          <label htmlFor="field-entry-type" className={labelClassName}>
            {t('growerPages.fieldEntryEntryTypeLabel')}
          </label>
          <select
            id="field-entry-type"
            value={entryType}
            onChange={(e) => setEntryType(e.target.value as EntryType)}
            className={inputClassName}
            required
          >
            <option value="SETVA">{t('growerPages.fieldEntrySowing')}</option>
            <option value="PRSKANJE">{t('growerPages.fieldEntrySpraying')}</option>
            <option value="BERBA">{t('growerPages.fieldEntryHarvest')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="field-entry-date" className={labelClassName}>
            {t('growerPages.fieldEntryDateLabel')}
          </label>
          <input
            id="field-entry-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="field-entry-notes" className={labelClassName}>
            {t('growerPages.fieldEntryNotesLabel')}
          </label>
          <textarea
            id="field-entry-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClassName}
            placeholder={t('growerPages.fieldEntryNotesPlaceholder')}
          />
        </div>

        {hookError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{hookError}</div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/10 px-4 py-3 text-sm font-medium text-[#23471f]">
            {isOnline ? t('growerPages.fieldEntrySavedSynced') : t('growerPages.fieldEntrySavedQueued')}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <button
            type="submit"
            disabled={!hasValidScan || submitting}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-lg bg-[#2D5A27] px-6 text-base font-medium text-white transition-colors hover:bg-[#23471f] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/45 focus-visible:ring-offset-2"
          >
            {submitting ? t('growerPages.fieldEntrySaving') : t('growerPages.fieldEntrySave')}
          </button>
          {pendingSync > 0 && isOnline ? (
            <button
              type="button"
              onClick={() => void syncNow()}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-gray-300 bg-white px-6 text-base font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/30 focus-visible:ring-offset-2"
            >
              {t('growerPages.fieldEntrySyncPending', { count: pendingSync })}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
