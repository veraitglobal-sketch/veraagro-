'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { GrowerAppGuideContent } from '@/components/grower/GrowerAppGuideContent';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

export default function GrowerAppGuidePage() {
  const { t } = useTranslation();
  const navItems = useGrowerNavItems();
  const loc = useLocalizedHref();

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.appGuide.pageTitle')} navItems={navItems}>
        <GrowerPageShell className="print:bg-white print:p-0">
          <GrowerPageHeader
            title={t('grower.appGuide.pageTitle')}
            description={t('grower.appGuide.pageDescription')}
            right={
              <div className="flex flex-wrap gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  <Printer className="h-4 w-4" aria-hidden />
                  {t('grower.appGuide.printPdf')}
                </button>
                <Link
                  href={loc('/growers/mobile-app-guide')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-[#2D5A27]/30 bg-white px-4 text-sm font-medium text-[#2D5A27] hover:bg-[#2D5A27]/5"
                >
                  {t('grower.appGuide.openPublicLink')}
                </Link>
              </div>
            }
          />

          <GrowerAppGuideContent
            footerExtra={
              <p className="mt-4 print:hidden">
                <Link href="/grower/education" className="text-sm font-medium text-[#2D5A27] hover:underline">
                  ← {t('grower.nav.education')}
                </Link>
              </p>
            }
          />
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
