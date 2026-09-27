'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PartnerPlanProse } from '@/components/grower/PartnerPlanProse';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

const TITLE_KEYS: Record<ConfidentialTier, string> = {
  short: 'investorBusinessPlans.shortTitle',
  medium: 'investorBusinessPlans.mediumTitle',
  long: 'investorBusinessPlans.longTitle',
};

type Props = {
  tier: ConfidentialTier;
  markdown: string;
  backHref: string;
};

export default function InvestorBusinessPlanReaderShell({ tier, markdown, backHref }: Props) {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const docTitle = t(TITLE_KEYS[tier]);

  return (
    <div className="relative min-h-screen bg-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_50%_at_50%_-10%,rgba(45,90,39,0.08),transparent_45%),linear-gradient(180deg,#fafbf9_0%,#ffffff_50%,#f6f8f4_100%)]"
        aria-hidden
      />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="mb-8 inline-flex min-h-[44px] items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#2D5A27]"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
          {t('investorBusinessPlans.planBack')}
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2D5A27]">{t('investorBusinessPlans.docSeriesEyebrow')}</p>
        <h1 className="mt-3 text-2xl font-light text-gray-900 sm:text-3xl">{docTitle}</h1>
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-lg shadow-gray-900/[0.04] ring-1 ring-black/[0.03]">
          <div className="h-1.5 bg-gradient-to-r from-[#2D5A27] via-[#3d6b32] to-[#5a9048]" aria-hidden />
          <div className="p-5 sm:p-8 md:p-10">
            <PartnerPlanProse markdown={markdown} />
          </div>
        </div>
        <p className="mt-8 text-center text-xs font-light leading-relaxed text-gray-500">
          {t('investorBusinessPlans.planReaderFooter')}
        </p>
        <p className="mt-4 text-center">
          <Link href={loc('/investor-deck')} className="text-sm text-[#2D5A27] hover:underline">
            {t('investorDeckPage.backToHub')}
          </Link>
        </p>
      </main>
    </div>
  );
}
