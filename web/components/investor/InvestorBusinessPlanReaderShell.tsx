'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import Footer from '@/components/Footer';
import { PartnerPlanProse } from '@/components/grower/PartnerPlanProse';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

const TITLE_KEYS: Record<ConfidentialTier, string> = {
  short: 'grower.confidential.shortTitle',
  medium: 'grower.confidential.mediumTitle',
  long: 'grower.confidential.longTitle',
};

type Props = {
  tier: ConfidentialTier;
  markdown: string;
  backHref: string;
};

export default function InvestorBusinessPlanReaderShell({ tier, markdown, backHref }: Props) {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const title = t(TITLE_KEYS[tier]);

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={loc('/')} className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <Image
                src="/logo1.png"
                alt={t('footer.logoAlt')}
                width={56}
                height={20}
                className="h-4 w-auto"
                priority
              />
            </Link>
            <nav className="flex items-center gap-6">
              <Link href={backHref} className="text-sm text-[#2D5A27] transition-colors hover:underline">
                {t('investorBusinessPlans.planBack')}
              </Link>
              <Link href={loc('/investor-deck')} className="text-sm text-gray-600 transition-colors hover:text-[#2D5A27]">
                {t('investorDeckPage.backToHub')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-28 lg:px-8">
        <h1 className="mb-3 text-3xl font-light text-gray-900">{title}</h1>
        <p className="mb-8 max-w-3xl text-base font-light leading-relaxed text-gray-600">
          {t('investorBusinessPlans.planReaderIntro')}
        </p>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 md:p-10">
          <PartnerPlanProse markdown={markdown} />
        </div>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-gray-600">
          {t('investorBusinessPlans.planReaderFooter')}
        </p>
      </main>

      <Footer />
    </div>
  );
}
