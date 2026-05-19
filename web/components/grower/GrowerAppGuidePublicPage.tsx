'use client';

import Link from 'next/link';
import Image from 'next/image';
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
      <header className="border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link href={loc('/')} className="flex items-center gap-2">
            <Image src="/logo1.png" alt={t('footer.logoAlt')} width={72} height={26} className="h-5 w-auto" priority />
          </Link>
          <Link href={loc('/growers')} className="text-sm text-gray-600 hover:text-[#2D5A27]">
            ← {t('growersPage.backToGrowers')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
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
