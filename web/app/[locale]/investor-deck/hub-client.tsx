'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import { InvestorDeckHub } from '@/components/investor/InvestorDeckHub';

export default function InvestorDeckHubClient() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={loc('/')} className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <Image
                src="/logo1.png"
                alt={t('footer.logoAlt')}
                width={56}
                height={20}
                className="h-4 w-auto"
                priority
              />
            </Link>
            <nav className="flex items-center gap-8">
              <Link href={loc('/')} className="text-sm text-gray-600 transition-colors hover:text-[#2D5A27]">
                {t('nav.home')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="pb-24 pl-6 pr-6 pt-32 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-light text-gray-900">{t('investorDeckPage.pageTitle')}</h1>
          <InvestorDeckHub />
        </div>
      </main>

      <Footer />
    </div>
  );
}
