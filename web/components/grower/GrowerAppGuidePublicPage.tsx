'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import { GrowerAppGuideContent } from '@/components/grower/GrowerAppGuideContent';

/** Public mobile app guide (screenshots) — no login required. */
export default function GrowerAppGuidePublicPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  return (
    <div className="min-h-screen bg-[#f3f6f3] text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link href={loc('/')} className="flex items-center gap-2">
            <Image src="/logo1.png" alt={t('footer.logoAlt')} width={72} height={26} className="h-5 w-auto" priority />
          </Link>
          <Link href={loc('/growers')} className="text-sm text-gray-600 hover:text-[#2D5A27]">
            ← {t('growersPage.backToGrowers')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            {t('grower.appGuide.pageTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-600 font-light leading-relaxed">
            {t('grower.appGuide.pageDescription')}
          </p>
        </div>

        <GrowerAppGuideContent
          toolbar={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#2D5A27] px-5 text-sm font-medium text-white hover:bg-[#23471f]"
              >
                <Printer className="h-4 w-4" aria-hidden />
                {t('grower.appGuide.printPdf')}
              </button>
              <p className="self-center text-sm text-gray-600">{t('grower.appGuide.pdfHowTo')}</p>
            </div>
          }
        />
      </main>

      <Footer />
    </div>
  );
}
