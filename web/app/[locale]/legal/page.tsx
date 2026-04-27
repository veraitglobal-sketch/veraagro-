'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { LegalLanguageCard } from '@/components/LegalLanguageCard';

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

              <div className="grid md:grid-cols-2 gap-6">
                <Link
                  href={loc('/terms')}
                  className="block p-6 border border-gray-200 rounded-lg hover:border-[#2D5A27] hover:bg-[#2D5A27]/10 transition-colors"
                >
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{t('legalPage.cardTermsTitle')}</h3>
                  <p className="text-sm text-gray-600 font-light">{t('legalPage.cardTermsDesc')}</p>
                </Link>

                <Link
                  href={loc('/privacy')}
                  className="block p-6 border border-gray-200 rounded-lg hover:border-[#2D5A27] hover:bg-[#2D5A27]/10 transition-colors"
                >
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{t('legalPage.cardPrivacyTitle')}</h3>
                  <p className="text-sm text-gray-600 font-light">{t('legalPage.cardPrivacyDesc')}</p>
                </Link>

                <Link
                  href={loc('/cookies')}
                  className="block p-6 border border-gray-200 rounded-lg hover:border-[#2D5A27] hover:bg-[#2D5A27]/10 transition-colors"
                >
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{t('legalPage.cardCookiesTitle')}</h3>
                  <p className="text-sm text-gray-600 font-light">{t('legalPage.cardCookiesDesc')}</p>
                </Link>

                <LegalLanguageCard />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12 items-start">
            <div className="flex flex-col">
              <Link href={loc('/')} className="inline-block mb-4 -mt-1">
                <Image src="/logo1.png" alt={t('footer.logoAlt')} width={56} height={20} className="h-4 w-auto" />
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed">{t('footer.tagline')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">{t('footer.columnProduct')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href={loc('/growers')} className="hover:text-[#2D5A27] transition-colors">
                    {t('nav.forGrowers')}
                  </Link>
                </li>
                <li>
                  <Link href={loc('/suppliers')} className="hover:text-[#2D5A27] transition-colors">
                    {t('nav.forSuppliers')}
                  </Link>
                </li>
                <li>
                  <Link href="/logistics-partner" className="hover:text-[#2D5A27] transition-colors">
                    {t('nav.forLogistics')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">{t('footer.columnCompany')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href={loc('/#vision')} className="hover:text-[#2D5A27] transition-colors">
                    {t('footer.vision')}
                  </Link>
                </li>
                <li>
                  <Link href={loc('/#roadmap')} className="hover:text-[#2D5A27] transition-colors">
                    {t('footer.roadmap')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">{t('footer.columnLegal')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href={loc('/legal')} className="hover:text-[#2D5A27] transition-colors">
                    {t('footer.legalHub')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>{t('footer.copyright', { year: 2026 })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
