'use client';

import Link from 'next/link';
import { useTranslation, Trans } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import { LegalDocumentsCardGrid } from '@/components/legal/LegalDocumentsCardGrid';

export default function LegalPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-12 pb-24 px-6 lg:px-8">
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
