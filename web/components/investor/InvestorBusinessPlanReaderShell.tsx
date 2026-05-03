'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PartnerPlanProse } from '@/components/grower/PartnerPlanProse';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';

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
  const docTitle = t(TITLE_KEYS[tier]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#2D5A27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2"
            aria-label={t('investorBusinessPlans.planBack')}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <span className="sr-only">{docTitle}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 pb-16">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 md:p-10">
          <PartnerPlanProse markdown={markdown} />
        </div>
      </main>
    </div>
  );
}
