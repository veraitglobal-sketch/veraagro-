'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation, Trans } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import { LegalDocumentsCardGrid } from '@/components/legal/LegalDocumentsCardGrid';

export default function LegalPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={loc('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo1.png"
                alt={t('footer.logoAlt')}
                width={56}
                height={20}
                className="h-4 w-auto"
                priority
              />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link href={loc('/')} className="text-sm text-gray-600 hover:text-[#2D5A27] transition-colors">
                {t('nav.home')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-gray-900 mb-8">{t('legalPage.title')}</h1>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-4">{t('legalPage.sectionDocumentsTitle')}</h2>
              <p className="text-gray-600 mb-6 font-light">{t('legalPage.sectionDocumentsLead')}</p>

              <LegalDocumentsCardGrid />
            </div>

            <div>
              <h2 className="text-2xl font-light text-gray-900 mb-4">{t('legalPage.sectionTechTitle')}</h2>
              <p className="text-gray-600 font-light leading-relaxed">
                <Trans
                  i18nKey="legalPage.techImplementation"
                  components={{
                    1: (
                      <a
                        href="https://www.verait.de"
                        className="text-[#2D5A27] hover:underline transition-colors"
                      />
                    ),
                  }}
                />
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
