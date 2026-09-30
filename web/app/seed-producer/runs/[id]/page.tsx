'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { PremiumButton, PremiumCard, PremiumPageTitle } from '@/components/ui/Premium';
import { seedProducerAPI, type SeedProductionRun } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function SeedProducerRunDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const runId = typeof params.id === 'string' ? params.id : '';
  const [run, setRun] = useState<SeedProductionRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [bagsProduced, setBagsProduced] = useState('');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [germinationPct, setGerminationPct] = useState('');
  const [purityPct, setPurityPct] = useState('');
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [certUrls, setCertUrls] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!runId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await seedProducerAPI.getRun(runId);
      setRun(data);
      setBagsProduced(String(data.bagsProduced ?? data.bagsPlanned ?? ''));
      setCertUrls(data.certificateUrls ?? []);
      if (data.productionDate) setProductionDate(data.productionDate.slice(0, 10));
      if (data.germinationPct != null) setGerminationPct(String(data.germinationPct));
      if (data.purityPct != null) setPurityPct(String(data.purityPct));
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [runId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const canConfirm = run?.status === 'LABELS_ISSUED';
  const labelsReady = run && ['LABELS_ISSUED', 'PRODUCED', 'RELEASED'].includes(run.status);

  const confirm = async () => {
    if (!run) return;
    setBusy('confirm');
    setError(null);
    try {
      const urls = [...certUrls];
      for (const f of certFiles) {
        const res = await seedProducerAPI.uploadCertificate(run.id, f);
        urls.push(...(res.certificateUrls ?? []));
      }
      await seedProducerAPI.confirmProduction(run.id, {
        bagsProduced: parseInt(bagsProduced, 10),
        productionDate,
        germinationPct: germinationPct ? parseFloat(germinationPct) : undefined,
        purityPct: purityPct ? parseFloat(purityPct) : undefined,
        certificateUrls: urls,
      });
      setCertFiles([]);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthGuard requiredRoles={['SEED_PRODUCER']}>
      <div className="space-y-6">
        <Link href="/seed-producer" className="inline-flex items-center gap-1 text-sm text-[#2D5A27] hover:underline">
          <ArrowLeft size={16} /> {t('seedProducer.run.back')}
        </Link>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#2D5A27]" />
          </div>
        ) : !run ? (
          <p className="text-red-600">{error ?? t('common.notFound')}</p>
        ) : (
          <>
            <PremiumPageTitle
              title={`${run.lotNumber} · ${run.approvedProduct?.name ?? ''}`}
              description={t('seedProducer.run.subtitle', { year: run.seedCropYear, status: run.status })}
            />
            {error ? <p className="text-red-600 text-sm">{error}</p> : null}

            {labelsReady ? (
              <PremiumCard>
                <h2 className="text-lg font-medium text-gray-900 mb-2">{t('seedProducer.run.labelsTitle')}</h2>
                <p className="text-sm text-gray-600 mb-4">{t('seedProducer.run.printGuide')}</p>
                <div className="flex flex-wrap gap-2">
                  <PremiumButton
                    variant="secondary"
                    disabled={busy === 'sheet'}
                    onClick={async () => {
                      setBusy('sheet');
                      try {
                        const blob = await seedProducerAPI.downloadLabelsPdf(run.id, 'sheet');
                        downloadBlob(blob, `labels-${run.lotNumber}-sheet.pdf`);
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === 'sheet' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} className="mr-2 inline" />}
                    {t('seedProducer.run.downloadSheet')}
                  </PremiumButton>
                  <PremiumButton
                    variant="secondary"
                    disabled={busy === 'roll'}
                    onClick={async () => {
                      setBusy('roll');
                      try {
                        const blob = await seedProducerAPI.downloadLabelsPdf(run.id, 'roll');
                        downloadBlob(blob, `labels-${run.lotNumber}-roll.pdf`);
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === 'roll' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} className="mr-2 inline" />}
                    {t('seedProducer.run.downloadRoll')}
                  </PremiumButton>
                  <PremiumButton
                    variant="secondary"
                    disabled={busy === 'csv'}
                    onClick={async () => {
                      setBusy('csv');
                      try {
                        const blob = await seedProducerAPI.downloadLabelsCsv(run.id);
                        downloadBlob(blob, `labels-${run.lotNumber}.csv`);
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} className="mr-2 inline" />}
                    {t('seedProducer.run.downloadCsv')}
                  </PremiumButton>
                </div>
              </PremiumCard>
            ) : null}

            {canConfirm ? (
              <PremiumCard>
                <h2 className="text-lg font-medium text-gray-900 mb-4">{t('seedProducer.run.confirmTitle')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-gray-700">{t('seedProducer.run.bagsProduced')}</span>
                    <input
                      type="number"
                      value={bagsProduced}
                      onChange={(e) => setBagsProduced(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-700">{t('seedProducer.run.productionDate')}</span>
                    <input
                      type="date"
                      value={productionDate}
                      onChange={(e) => setProductionDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-700">{t('seedProducer.run.germination')}</span>
                    <input
                      type="number"
                      step="0.1"
                      value={germinationPct}
                      onChange={(e) => setGerminationPct(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-gray-700">{t('seedProducer.run.purity')}</span>
                    <input
                      type="number"
                      step="0.1"
                      value={purityPct}
                      onChange={(e) => setPurityPct(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-gray-700">{t('seedProducer.run.certificates')}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => setCertFiles(Array.from(e.target.files ?? []))}
                      className="mt-1 block w-full text-sm"
                    />
                  </label>
                </div>
                <div className="mt-4">
                  <PremiumButton disabled={busy === 'confirm'} onClick={() => void confirm()}>
                    {busy === 'confirm' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProducer.run.confirmCta')}
                  </PremiumButton>
                </div>
              </PremiumCard>
            ) : run.status === 'PRODUCED' || run.status === 'RELEASED' ? (
              <PremiumCard>
                <h2 className="text-lg font-medium text-gray-900 mb-2">{t('seedProducer.run.waitingTitle')}</h2>
                <p className="text-sm text-gray-600">{t('seedProducer.run.waitingBody')}</p>
              </PremiumCard>
            ) : null}
          </>
        )}
      </div>
    </AuthGuard>
  );
}
