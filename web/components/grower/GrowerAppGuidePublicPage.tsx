'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import { GrowerAppGuideContent } from '@/components/grower/GrowerAppGuideContent';
import { GrowerAppGuidePdfToolbar } from '@/components/grower/GrowerAppGuidePdfToolbar';
import { isGrowerAppGuidePdfExport } from '@/lib/grower-app-guide';

/** Public mobile app guide (screenshots) — no login required. */
export default function GrowerAppGuidePublicPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const searchParams = useSearchParams();
  const pdfExport = isGrowerAppGuidePdfExport(searchParams);

  return (
    <div className="min-h-screen bg-[#f3f6f3] text-gray-900">
      <main className="mx-auto max-w-7xl px-6 pt-12 pb-10 lg:px-8 lg:py-14">
        <Link href={loc('/for-growers')} className="mb-6 inline-block text-sm text-[#2D5A27] hover:underline print:hidden">
          ← {t('growersPage.backToGrowers')}
        </Link>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            {t('grower.appGuide.pageTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-600 font-light leading-relaxed">
            {t('grower.appGuide.pageDescription')}
          </p>
        </div>

        <GrowerAppGuideContent
          pdfExport={pdfExport}
          toolbar={pdfExport ? undefined : <GrowerAppGuidePdfToolbar />}
        />
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
