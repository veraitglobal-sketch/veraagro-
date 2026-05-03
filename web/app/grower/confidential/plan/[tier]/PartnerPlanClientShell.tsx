'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { PartnerPlanProse } from '@/components/grower/PartnerPlanProse';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';

const TITLE_KEYS: Record<ConfidentialTier, string> = {
  short: 'grower.confidential.shortTitle',
  medium: 'grower.confidential.mediumTitle',
  long: 'grower.confidential.longTitle',
  confidential: 'investorBusinessPlans.confidentialTitle',
};

type Props = {
  tier: ConfidentialTier;
  markdown: string;
};

export default function PartnerPlanClientShell({ tier, markdown }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname() || `/grower/confidential/plan/${tier}`;
  const producerLoginWithReturn = `/login/producer?returnTo=${encodeURIComponent(pathname)}`;
  const navItems = useGrowerNavItems();
  const title = t(TITLE_KEYS[tier]);

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo={producerLoginWithReturn}>
      <SidebarLayout title={title} navItems={navItems}>
        <GrowerPageShell>
          <div className="mb-6">
            <Link
              href="/grower/confidential"
              className="inline-flex min-h-[44px] items-center gap-2 text-base font-medium text-[#2D5A27] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
              {t('grower.confidential.planBack')}
            </Link>
          </div>

          <GrowerPageHeader
            title={title}
            description={t('grower.confidential.planReaderIntro')}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 md:p-10">
            <PartnerPlanProse markdown={markdown} />
          </div>

          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-gray-600">
            {t('grower.confidential.planReaderFooter')}
          </p>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
