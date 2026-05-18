'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Download, Printer, Smartphone } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { GrowerAppGuideStepCard } from '@/components/grower/GrowerAppGuideStepCard';
import { GROWER_APP_GUIDE_PDF_PATH, GROWER_APP_GUIDE_STEPS } from '@/lib/grower-app-guide';

export default function GrowerAppGuidePage() {
  const { t } = useTranslation();
  const navItems = useGrowerNavItems();

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
                  <Printer className="h-4 w-4" />
                  {t('grower.appGuide.printPdf')}
                </button>
                <a
                  href={GROWER_APP_GUIDE_PDF_PATH}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#2D5A27] px-4 text-sm font-medium text-white hover:bg-[#23471f]"
                >
                  <Download className="h-4 w-4" />
                  {t('grower.appGuide.downloadPdf')}
                </a>
              </div>
            }
          />

          <div className="mb-6 rounded-xl border border-[#2D5A27]/20 bg-[#2D5A27]/5 px-4 py-3 flex gap-3 print:hidden">
            <Smartphone className="h-5 w-5 text-[#2D5A27] shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 leading-relaxed">{t('grower.appGuide.hint')}</p>
          </div>

          <nav className="mb-8 print:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              {t('grower.appGuide.tocTitle')}
            </p>
            <ol className="flex flex-wrap gap-2">
              {GROWER_APP_GUIDE_STEPS.map((step, i) => (
                <li key={step.id}>
                  <a
                    href={`#guide-${step.id}`}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 hover:border-[#2D5A27]/40"
                  >
                    {i + 1}. {t(step.titleKey)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-6 max-w-4xl">
            {GROWER_APP_GUIDE_STEPS.map((step, index) => (
              <GrowerAppGuideStepCard key={step.id} step={step} index={index} />
            ))}
          </div>

          <p className="mt-8 text-xs text-gray-500 print:mt-4">
            {t('grower.appGuide.footer')}
          </p>

          <p className="mt-4 print:hidden">
            <Link href="/grower/education" className="text-sm font-medium text-[#2D5A27] hover:underline">
              ← {t('grower.nav.education')}
            </Link>
          </p>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
