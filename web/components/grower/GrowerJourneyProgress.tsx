'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  estatesAPI,
  harvestAnnouncementsAPI,
  batchesAPI,
  missionsAPI,
  parcelsAPI,
} from '@/lib/api';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { growerApiErrorOrT } from '@/lib/grower-api-error';
import { CheckCircle2, Circle, CircleDot, Loader2, RefreshCw } from 'lucide-react';

type StepUi = {
  key: string;
  titleKey: string;
  hintKey: string;
  href: string;
  done: boolean;
};

function normalizedMissionStatus(status: string): string {
  return (status || '').toUpperCase().replace(/\s+/g, '_');
}

export default function GrowerJourneyProgress() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [approvedParcels, setApprovedParcels] = useState(0);
  const [planCount, setPlanCount] = useState(0);
  const [batchCount, setBatchCount] = useState(0);
  const [readyBatchCount, setReadyBatchCount] = useState(0);
  /** Any mission that was not cancelled (includes COMPLETED — stay "done" after delivery). */
  const [hasMissionRecord, setHasMissionRecord] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [estates, plans, batches, missions] = await Promise.all([
        estatesAPI.getAll() as Promise<{ id: string }[]>,
        harvestAnnouncementsAPI.getMine() as Promise<unknown[]>,
        batchesAPI.getMyBatches() as Promise<{ status?: string }[]>,
        missionsAPI.getMyMissions().catch(() => [] as { status?: string }[]),
      ]);

      let approved = 0;
      for (const e of estates || []) {
        const parcels = (await parcelsAPI.getByEstate(e.id).catch(() => [])) as {
          approvedAt?: string | null;
        }[];
        for (const p of parcels || []) {
          if (p.approvedAt) approved++;
        }
      }

      const ready =
        (batches || []).filter((b) => {
          const s = (b.status || '').toUpperCase();
          return s === 'PACKED' || s === 'QUALITY_VERIFIED';
        }).length;

      const list = Array.isArray(missions) ? missions : [];
      const recorded = list.some((m) => normalizedMissionStatus(String(m.status || '')) !== 'CANCELLED');

      setApprovedParcels(approved);
      setPlanCount(Array.isArray(plans) ? plans.length : 0);
      setBatchCount(Array.isArray(batches) ? batches.length : 0);
      setReadyBatchCount(ready);
      setHasMissionRecord(recorded);
    } catch (e: unknown) {
      setErr(growerApiErrorOrT(e, t, 'grower.dashboard.journey.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const steps: StepUi[] = useMemo(
    () => [
      {
        key: 'parcels',
        titleKey: 'grower.dashboard.journey.stepParcelsTitle',
        hintKey: 'grower.dashboard.journey.stepParcelsHint',
        href: loc('/grower/fields'),
        done: approvedParcels > 0,
      },
      {
        key: 'plan',
        titleKey: 'grower.dashboard.journey.stepPlanTitle',
        hintKey: 'grower.dashboard.journey.stepPlanHint',
        href: loc('/grower/plantings'),
        done: planCount > 0,
      },
      {
        key: 'batch',
        titleKey: 'grower.dashboard.journey.stepBatchTitle',
        hintKey: 'grower.dashboard.journey.stepBatchHint',
        href: loc('/grower/batches'),
        done: batchCount > 0,
      },
      {
        key: 'ready',
        titleKey: 'grower.dashboard.journey.stepReadyTitle',
        hintKey: 'grower.dashboard.journey.stepReadyHint',
        href: loc('/grower/quality-entry'),
        done: readyBatchCount > 0,
      },
      {
        key: 'transport',
        titleKey: 'grower.dashboard.journey.stepTransportTitle',
        hintKey: 'grower.dashboard.journey.stepTransportHint',
        href: loc('/grower/missions/create'),
        done: hasMissionRecord,
      },
      {
        key: 'track',
        titleKey: 'grower.dashboard.journey.stepTrackTitle',
        hintKey: 'grower.dashboard.journey.stepTrackHint',
        href: loc('/grower/portal'),
        done: hasMissionRecord,
      },
    ],
    [
      approvedParcels,
      planCount,
      batchCount,
      readyBatchCount,
      hasMissionRecord,
      loc,
    ],
  );

  const firstOpenIndex = steps.findIndex((s) => !s.done);

  if (loading) {
    return (
      <div className="flex min-h-[7rem] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-6 shadow-sm">
        <Loader2 className="h-7 w-7 animate-spin text-[#2D5A27]" aria-hidden />
        <span className="sr-only">{t('grower.dashboard.journey.loading')}</span>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-4 shadow-sm">
        <p className="text-base text-amber-950">{err}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#2D5A27]/30 bg-white px-4 py-2 text-sm font-medium text-[#23471f] hover:bg-[#f7faf6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t('grower.dashboard.journey.retry')}
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">{t('grower.dashboard.journey.blockTitle')}</h2>
      <p className="mt-1.5 max-w-3xl text-base font-light leading-relaxed text-gray-700">
        {t('grower.dashboard.journey.blockHint')}
      </p>
      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => {
          const isDone = step.done;
          const isCurrent = !isDone && index === firstOpenIndex;
          const Icon = isDone ? CheckCircle2 : isCurrent ? CircleDot : Circle;
          const iconClass = isDone
            ? 'text-[#2D5A27]'
            : isCurrent
              ? 'text-amber-600'
              : 'text-gray-300';
          return (
            <li key={step.key}>
              <Link
                href={step.href}
                className={`flex gap-3 rounded-lg border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 sm:px-4 ${
                  isCurrent
                    ? 'border-amber-200 bg-amber-50/60 hover:border-amber-300'
                    : 'border-gray-100 bg-gray-50/40 hover:border-[#2D5A27]/25 hover:bg-[#f7faf6]'
                }`}
              >
                <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${iconClass}`} strokeWidth={1.75} aria-hidden />
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-900">{t(step.titleKey)}</p>
                  <p className="mt-0.5 text-base font-light leading-snug text-gray-700">{t(step.hintKey)}</p>
                  {isDone ? (
                    <p className="mt-1 text-xs font-medium text-[#23471f]">{t('grower.dashboard.journey.statusDone')}</p>
                  ) : isCurrent ? (
                    <p className="mt-1 text-xs font-medium text-amber-800">{t('grower.dashboard.journey.statusCurrent')}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">{t('grower.dashboard.journey.statusPending')}</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 border-t border-gray-100 pt-4 text-sm font-light leading-relaxed text-gray-600">
        {t('grower.dashboard.journey.footerNote')}
      </p>
    </section>
  );
}
