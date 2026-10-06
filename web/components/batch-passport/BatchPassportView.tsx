'use client';
import { historyFactLabel } from '@biovera/shared/passport/history-labels';
import { passportDocumentUrl } from '@biovera/shared/passport/document-url';
import { WEB_API_BASE } from '@/lib/api-base';
import { productNameLabel } from '@biovera/shared/i18n/labels';
import { intlLocaleFor } from '@biovera/shared/i18n/format';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  MapPin,
  Thermometer,
  Truck,
  AlertTriangle,
  Sprout,
  FlaskConical,
  ClipboardList,
} from 'lucide-react';
import type { BatchPassportApi } from '@/lib/passport-batch-types';
import { passportEstimateSourceKey } from '@biovera/shared/passport/estimate-source';
import ReportProblemForm from './ReportProblemForm';
import ProductionHistory from './ProductionHistory';
import { seedOriginDetails } from '@biovera/shared/passport/seed-origin';

const VERA = '#2D5A27';

function fmtDate(iso: string | Date | null | undefined, locale: string) {
  if (iso == null) return null;
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string | Date | null | undefined, locale: string) {
  if (iso == null) return null;
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
      >
        <span className="text-base font-medium text-gray-900">{title}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-700">{children}</div> : null}
    </section>
  );
}

function WarningBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export default function BatchPassportView({
  data,
  batchId,
  badgeSerial,
}: {
  data: BatchPassportApi;
  batchId?: string;
  badgeSerial?: string | null;
}) {
  const { t, i18n } = useTranslation();
  const locale = intlLocaleFor(i18n.language);
  const s = data.summary;
  const dash = '—';
  const notRecorded = t('passportPublic.batchPage.notRecorded');

  const harvestDisplay = useMemo(
    () => fmtDate(s?.actualHarvestDate ?? data.batch.harvestDate, locale),
    [s, data.batch.harvestDate, locale],
  );

  const photo = s?.productPhotoUrl ?? data.photos?.[0]?.url ?? null;

  const warningMessages = useMemo(() => {
    const msgs: string[] = [];
    if (data.batch.isCompromised || data.warnings?.some((w) => w.code === 'TEMPERATURE_DEVIATION')) {
      msgs.push(t('passportPublic.batchPage.compromisedHint'));
    }
    if (data.warnings?.some((w) => w.code === 'SEED_RECALLED') || data.seedOrigin?.some((r) => r.recalled)) {
      msgs.push(t('passportPublic.batchPage.warningSeedRecalled'));
    }
    return msgs;
  }, [data, t]);

  const fieldWorkNonTreatment = useMemo(() => {
    const treatmentTypes = /^(PRSKANJE|PRIHRANA|SPRAYING|SPRAY|TREATMENT|FERTILIZING|FERTILIZER|PESTICIDE)/i;
    return (data.fieldWork ?? []).filter((e) => !treatmentTypes.test(e.type));
  }, [data.fieldWork]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {warningMessages.length > 0 ? (
          <div className="mb-4 space-y-2">
            {warningMessages.map((msg) => (
              <WarningBanner key={msg} message={msg} />
            ))}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4">
          {photo ? (
            <div className="relative h-36 w-full sm:w-36 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              <Image src={photo} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
              {t('passportPublic.batchPage.productEyebrow')}
            </p>
            <h1 className="text-2xl font-medium text-gray-900 mb-1">{productNameLabel(t, s?.productName ?? data.batch.productName)}</h1>
            <p className="text-sm text-gray-600">{s?.variety ?? <span className="italic text-gray-400">{notRecorded}</span>}</p>
            {(s as { productDescription?: string | null })?.productDescription ? (
              <p className="mt-2 text-sm text-gray-700">{(s as { productDescription?: string }).productDescription}</p>
            ) : null}
            <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <dt className="text-gray-500">{t('passportPublic.batchPage.batchId')}</dt>
                <dd className="font-mono text-gray-900">{s?.lot.batchId ?? data.batch.batchId}</dd>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <dt className="text-gray-500">{t('passportPublic.batchPage.lotQuantity')}</dt>
                <dd>
                  {s?.lot.totalQuantity ?? data.batch.quantity} {s?.lot.unit ?? data.batch.unit}
                </dd>
              </div>
              {s?.identifiedPackaging ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <dt className="text-gray-500">{t('passportPublic.batchPage.thisPackage')}</dt>
                  <dd>
                    {s.identifiedPackaging.badgeSerial} · {s.identifiedPackaging.badgeType}
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <dt className="text-gray-500">{t('passportPublic.batchPage.whenHarvested')}</dt>
                <dd>{harvestDisplay ?? notRecorded}</dd>
              </div>
              {(s as { actualPackDate?: string | Date | null })?.actualPackDate ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <dt className="text-gray-500">{t('passportPublic.batchPage.whenPacked')}</dt>
                  <dd>{fmtDate((s as { actualPackDate?: string | Date }).actualPackDate!, locale) ?? notRecorded}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: VERA }} />
            <div>
              <p className="font-medium text-gray-900">{s?.producerName ?? data.origin.farmName}</p>
              <p className="text-gray-600">{s?.regionLabel ?? data.origin.regionLabel ?? dash}</p>
              {s?.productionCountry ? (
                <p className="text-gray-500">{t('passportPublic.batchPage.countryValue', { name: s.productionCountry })}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600 space-y-1">
          {s?.storage.platformStandard ? (
            <p>
              {t('passportPublic.batchPage.platformStandard')}: {s.storage.platformStandard.label}{' '}
              <span className="text-gray-400 text-xs">({s.storage.platformStandard.source})</span>
            </p>
          ) : null}
          {s?.storage.productStorageConditions ? (
            <p>
              {t('passportPublic.batchPage.productStorage')}: {s.storage.productStorageConditions}
            </p>
          ) : null}
          {s?.storage.declaredShelfLifeHours != null ? (
            <p>
              {t('passportPublic.batchPage.declaredShelfLife')}: {s.storage.declaredShelfLifeHours} h
            </p>
          ) : null}
          {s?.storage.freshnessEstimate ? (
            <p className="text-gray-500">
              {t('passportPublic.batchPage.freshnessEstimate')}: ~
              {s.storage.freshnessEstimate.remainingHours != null
                ? Math.round(s.storage.freshnessEstimate.remainingHours)
                : dash}{' '}
              h · {t('passportPublic.batchPage.estimateSource', {
                source: t(
                  `passportPublic.batchPage.estimateSource.${passportEstimateSourceKey(s.storage.freshnessEstimate.source)}`,
                  { defaultValue: s.storage.freshnessEstimate.source },
                ),
              })}
            </p>
          ) : null}
          {s?.storage.freshnessEstimate?.estimatedExpiresAt ? (
            <p className="text-gray-500">
              {t('passportPublic.batchPage.estimateUseBy')}:{' '}
              {fmtDate(s.storage.freshnessEstimate.estimatedExpiresAt, locale) ?? dash}
            </p>
          ) : null}
        </div>
      </header>

      {data.originCandidate?.status === 'PENDING_DOCUMENTATION' && data.originCandidate.verified === false ? (
        <section className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-medium">{t('glossary.productionHistory.candidateSupplier')}</h2>
          <p className="mt-1">{data.originCandidate.supplierName}</p>
          <p className="mt-2 text-sm font-medium text-amber-900">{t('glossary.productionHistory.pendingOrigin')}</p>
          <p className="mt-1 text-sm text-gray-600">{t('glossary.productionHistory.pendingOriginHelp')}</p>
        </section>
      ) : null}
      <ProductionHistory events={data.productionHistory} gaps={data.historyGaps} />
      <CollapsibleSection title={t('passportPublic.batchPage.sectionOrigin')}>
        {data.parcelInfo ? (
          <ul className="space-y-2 mb-4">
            <li>
              <span className="text-gray-500">{t('passportPublic.batchPage.crop')}:</span>{' '}
              {productNameLabel(t, data.parcelInfo.cropType) || notRecorded}
            </li>
            <li>
              <span className="text-gray-500">{t('passportPublic.batchPage.plantingDate')}:</span>{' '}
              {data.parcelInfo.plantingDate ? fmtDate(data.parcelInfo.plantingDate, locale) : notRecorded}
            </li>
            <li>
              <span className="text-gray-500">{t('passportPublic.batchPage.plannedHarvest')}:</span>{' '}
              {data.parcelInfo.expectedHarvestDate ? fmtDate(data.parcelInfo.expectedHarvestDate, locale) : notRecorded}
              <span className="text-gray-400 text-xs ml-1">({t('passportPublic.batchPage.plannedNotActual')})</span>
            </li>
          </ul>
        ) : (
          <p className="italic text-gray-500 mb-4">{notRecorded}</p>
        )}

        {data.seedOrigin && data.seedOrigin.length > 0 ? (
          <div className="mb-4">
            <p className="font-medium flex items-center gap-2 mb-2">
              <Sprout className="h-4 w-4" style={{ color: VERA }} />
              {t('passportPublic.batchPage.seedEyebrow')}
            </p>
            <ul className="space-y-3">
              {data.seedOrigin.map((row, i) => (
                <li key={i} className={`rounded-lg p-3 ${row.recalled ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                  {row.recalled ? (
                    <p className="text-amber-900 text-sm font-medium mb-1">{t('passportPublic.batchPage.warningSeedRecalled')}</p>
                  ) : null}
                  <p className="font-medium">{productNameLabel(t, row.product)}</p>
                  <dl className="mt-2 space-y-1 text-sm">
                    {seedOriginDetails(row, t, value => fmtDate(value, locale)).map(detail => (
                      <div key={detail.label}>
                        <dt className="inline text-gray-500">{detail.label}: </dt>
                        <dd className="inline">{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {fieldWorkNonTreatment.length > 0 ? (
          <div className="mb-4">
            <p className="font-medium flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4" style={{ color: VERA }} />
              {t('passportPublic.batchPage.fieldWorkTitle')}
            </p>
            <ul className="space-y-2">
              {fieldWorkNonTreatment.map((e, i) => (
                <li key={i} className="border-b border-gray-100 pb-2">
                  {historyFactLabel(t, { label: 'activity', value: e.type })}
                  {e.materialName ? ` · ${e.materialName}` : ''}
                  {e.materialQuantity != null ? ` · ${e.materialQuantity} ${e.materialUnit ?? ''}` : ''}
                  <br />
                  <span className="text-gray-500">{fmtDateTime(e.occurredAt, locale)}</span>
                  {e.notes ? <p className="text-gray-500 text-xs mt-1">{e.notes}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {(data.treatments?.length ?? 0) > 0 ? (
          <div className="mb-4">
            <p className="font-medium mb-2">{t('passportPublic.batchPage.treatmentsEyebrow')}</p>
            <ul className="space-y-2">
              {data.treatments!.map((tr, i) => (
                <li key={i} className="border-b border-gray-100 pb-2">
                  {tr.productName} · {tr.dosage}
                  <br />
                  <span className="text-gray-500">{fmtDateTime(tr.appliedAt, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : fieldWorkNonTreatment.length === 0 ? (
          <p className="text-gray-500 italic mb-4">{t('passportPublic.batchPage.noLinkedTreatments')}</p>
        ) : null}

        {(data.growthLogs?.length ?? 0) > 0 ? (
          <div className="mb-4">
            <p className="font-medium mb-2">{t('passportPublic.batchPage.growthDiaryTitle')}</p>
            <ul className="space-y-3">
              {data.growthLogs!.map((g, i) => (
                <li key={i} className="flex gap-3">
                  {g.imageUrl ? (
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={g.imageUrl} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ) : null}
                  <div>
                    <p>{g.growthStage ?? t('passportPublic.batchPage.activityGrowthLog')}</p>
                    <p className="text-gray-500 text-xs">{fmtDateTime(g.networkTimestamp, locale)}</p>
                    {g.notes ? <p className="text-xs text-gray-500">{g.notes}</p> : null}
                    {g.labResultUrl ? (
                      <Link href={g.labResultUrl} className="text-xs text-[#2D5A27] underline" target="_blank">
                        {t('passportPublic.batchPage.labDocument')}
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {(data.materialScans?.length ?? 0) > 0 ? (
          <div>
            <p className="font-medium mb-2">{t('passportPublic.batchPage.materialsEyebrow')}</p>
            <ul className="text-xs space-y-1 font-mono">
              {data.materialScans!.slice(0, 15).map((m, i) => (
                <li key={i}>
                  {fmtDateTime(m.networkTimestamp, locale)} · {m.scannedBarcode}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection title={t('passportPublic.batchPage.sectionHarvestPack')}>
        <ul className="space-y-2">
          <li>
            {t('passportPublic.batchPage.whenHarvested')}: {harvestDisplay ?? notRecorded}
          </li>
          {(data.lotPackagingFormats?.length ?? 0) > 0 ? (
            <li>
              <p className="text-gray-500 mb-1">{t('passportPublic.batchPage.lotPackFormats')}</p>
              <ul className="list-disc pl-5">
                {data.lotPackagingFormats!.map((p, i) => (
                  <li key={i}>
                    {[p.label, p.packSizeKg != null ? `${p.packSizeKg} kg` : null].filter(Boolean).join(' · ')}
                    <span className="text-gray-400 text-xs ml-1">({t('passportPublic.batchPage.lotOrdersScope')})</span>
                  </li>
                ))}
              </ul>
            </li>
          ) : null}
          {(data.packageBadges?.length ?? 0) > 0 ? (
            <li>
              {t('passportPublic.batchPage.packageLabels')}: {data.packageBadges!.map((b) => b.serial).join(', ')}
            </li>
          ) : null}
          {(data.photos?.length ?? 0) > 0 ? (
            <li className="flex flex-wrap gap-2 mt-2">
              {data.photos!.slice(0, 4).map((p, i) => (
                <div key={i} className="relative h-20 w-20 rounded-md overflow-hidden bg-gray-100">
                  <Image src={p.url} alt="" fill className="object-cover" unoptimized />
                </div>
              ))}
            </li>
          ) : null}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection title={t('passportPublic.batchPage.sectionQuality')}>
        {data.qualityEntry ? (
          <ul className="space-y-2">
            {data.qualityEntry.weatherAtHarvestSummary ? <li>{data.qualityEntry.weatherAtHarvestSummary}</li> : null}
            {data.qualityEntry.preCoolingStartTime ? (
              <li>
                {t('passportPublic.batchPage.preCoolingTitle')}: {fmtDateTime(data.qualityEntry.preCoolingStartTime, locale)}
              </li>
            ) : null}
            {data.qualityEntry.notes ? <li>{data.qualityEntry.notes}</li> : null}
            {data.qualityEntry.status ? (
              <li>
                {t('passportPublic.batchPage.qualityStatus')}: {data.qualityEntry.status}
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="italic text-gray-500">{notRecorded}</p>
        )}
        {data.protocol360?.levels?.length ? (
          <div className="mt-3">
            <p className="font-medium flex items-center gap-2">
              <FlaskConical className="h-4 w-4" style={{ color: VERA }} />
              Protocol 360
            </p>
            <ul className="mt-2 space-y-1">
              {data.protocol360.levels.map((lv) => (
                <li key={lv.level}>
                  {lv.name}: {lv.badgeText || lv.status}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection title={t('passportPublic.batchPage.sectionJourney')}>
        <ul className="space-y-2 mb-4">
          {data.timeline.harvested ? (
            <li>{t('passportPublic.batchPage.whenHarvested')}: {fmtDateTime(data.timeline.harvested, locale)}</li>
          ) : null}
          {data.timeline.loaded ? (
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" />
              {t('passportPublic.batchPage.pickedUp')}: {fmtDateTime(data.timeline.loaded, locale)}
            </li>
          ) : null}
          {data.timeline.arrived ? (
            <li>{t('passportPublic.batchPage.arrived')}: {fmtDateTime(data.timeline.arrived, locale)}</li>
          ) : null}
          {(data.missions ?? []).map((m, i) => (
            <li key={i} className="text-gray-600">
              {m.missionNumber ?? `Mission ${i + 1}`} · {m.status}
              {m.logisticsHandover?.insideTruckTemperature != null
                ? ` · ${m.logisticsHandover.insideTruckTemperature} °C`
                : ''}
            </li>
          ))}
        </ul>

        {data.coldChainProof?.hasReadings ? (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="font-medium flex items-center gap-2 mb-2">
              <Thermometer className="h-4 w-4" style={{ color: VERA }} />
              {t('passportPublic.batchPage.coldChainEyebrow')}
            </p>
            {data.coldChainProof.evaluationCriteria ? (
              <p className="text-xs text-gray-500 mb-2">
                {t('passportPublic.batchPage.evaluationCriteria')}: {data.coldChainProof.evaluationCriteria}
              </p>
            ) : null}
            <p className="text-sm">
              {t('passportPublic.batchPage.tempMin')} {data.coldChainProof.minTemp ?? dash}°C ·{' '}
              {t('passportPublic.batchPage.tempMax')} {data.coldChainProof.maxTemp ?? dash}°C
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('passportPublic.batchPage.readingsCount', { count: data.coldChainProof.readingsCount ?? 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t('passportPublic.batchPage.spotReadingsDisclaimer')}</p>
            {data.coldChainProof.readingsWithinCriteria === true ? (
              <p className="text-xs text-green-800 mt-1">{t('passportPublic.batchPage.withinRangeYes')}</p>
            ) : data.coldChainProof.readingsWithinCriteria === false ? (
              <p className="text-xs text-amber-800 mt-1">{t('passportPublic.batchPage.withinRangeNo')}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">{t('passportPublic.batchPage.noTempReadings')}</p>
        )}
      </CollapsibleSection>

      {(data.passportDocuments?.length ?? 0) > 0 ? (
        <CollapsibleSection title={t('passportPublic.batchPage.sectionDocuments')}>
          <ul className="space-y-2 text-sm">
            {(data.passportDocuments ?? []).map((doc) => (
              <li key={doc.id}>
                <a href={passportDocumentUrl(doc.url, WEB_API_BASE)} target="_blank" rel="noopener noreferrer" className="text-[#2D5A27] hover:underline">
                  {doc.title}
                </a>
                <span className="text-gray-500">
                  {' '}
                  · {doc.docType}
                  {doc.verificationStatus === 'CONFIRMED' ? ` · ${t('passportPublic.batchPage.docConfirmed')}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      ) : null}

      {batchId ? (
        <div className="mt-6">
          <ReportProblemForm batchId={batchId} badgeSerial={badgeSerial} />
        </div>
      ) : null}

      <footer className="text-center text-xs text-gray-400 py-6">
        {t('passportPublic.producerProfile.footerTagline')}
      </footer>
    </div>
  );
}
