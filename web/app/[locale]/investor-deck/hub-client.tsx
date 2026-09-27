'use client';

import { useTranslation } from 'react-i18next';
import Footer from '@/components/Footer';
import { InvestorDeckHub } from '@/components/investor/InvestorDeckHub';

export default function InvestorDeckHubClient() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <main className="pb-24 pl-6 pr-6 pt-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-light text-gray-900">{t('investorDeckPage.pageTitle')}</h1>
          <InvestorDeckHub />
        </div>
      </main>

      <Footer />
    </div>
  );
}
