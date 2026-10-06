'use client';

import Footer from '@/components/Footer';
import MarketingHero from '@/components/marketing/MarketingHero';
import { marketingSectionTitle } from '@/lib/marketing-classes';
import { useTranslation } from 'react-i18next';

export default function ResidueControlledPageClient() {
  const { t } = useTranslation();
  const flowSteps = t('residueControlledPage.flowSteps', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-white">
      <MarketingHero
        title={t('residueControlledPage.title')}
        subtitle={t('residueControlledPage.heroLead')}
      />

      <section className="py-16 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className={marketingSectionTitle}>{t('residueControlledPage.flowTitle')}</h2>
          <ol className="mt-8 space-y-4">
            {Array.isArray(flowSteps) &&
              flowSteps.map((step, i) => (
                <li key={step} className="flex gap-4 text-gray-700">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2D5A27]/10 text-sm font-medium text-[#2D5A27]">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-base leading-relaxed">{step}</span>
                </li>
              ))}
          </ol>
          <p className="mt-10 text-base text-gray-600 leading-relaxed">
            {t('residueControlledPage.labNote')}
          </p>
          <p className="mt-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-6">
            {t('residueControlledPage.disclaimer')}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
