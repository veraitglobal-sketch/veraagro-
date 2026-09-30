'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { PremiumPageTitle } from '@/components/ui/Premium';
import { seedProducerAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';
import { formatDateEn } from '@/lib/en-locale-dates';
import { formatSeedProductName } from '@/lib/format-seed-product-name';
import { Loader2 } from 'lucide-react';

type RunRow = Awaited<ReturnType<typeof seedProducerAPI.listRuns>>[number];

function statusClass(status: string): string {
  if (status === 'RELEASED') return 'bg-green-100 text-green-800';
  if (status === 'PRODUCED') return 'bg-blue-100 text-blue-800';
  if (status === 'LABELS_ISSUED') return 'bg-amber-100 text-amber-800';
  if (status === 'RECALLED') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

export default function SeedProducerRunsPage() {
  const { t } = useTranslation();
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await seedProducerAPI.listRuns();
      setRuns(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AuthGuard requiredRoles={['SEED_PRODUCER']}>
      <div className="space-y-6">
        <PremiumPageTitle title={t('seedProducer.runs.title')} description={t('seedProducer.runs.subtitle')} />
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#2D5A27]" />
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : runs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-gray-600">
            {t('seedProducer.runs.empty')}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">{t('seedProducer.runs.lot')}</th>
                  <th className="px-4 py-3">{t('seedProducer.runs.product')}</th>
                  <th className="px-4 py-3">{t('seedProducer.runs.year')}</th>
                  <th className="px-4 py-3">{t('seedProducer.runs.bags')}</th>
                  <th className="px-4 py-3">{t('seedProducer.runs.status')}</th>
                  <th className="px-4 py-3">{t('seedProducer.runs.labels')}</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/seed-producer/runs/${run.id}`} className="text-[#2D5A27] hover:underline">
                        {run.lotNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatSeedProductName(run.product, run.variety)}</td>
                    <td className="px-4 py-3">{run.seedCropYear}</td>
                    <td className="px-4 py-3">
                      {run.bagsProduced ?? '—'} / {run.bagsPlanned}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(run.status)}`}>
                        {t(`seedProduction.runStatus.${run.status}`, { defaultValue: run.status })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {run.labelsReady ? t('seedProducer.runs.labelsReady') : '—'}
                      {run.productionDate ? (
                        <span className="block text-xs text-gray-500">{formatDateEn(run.productionDate)}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
