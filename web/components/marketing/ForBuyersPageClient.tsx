'use client';

import { PRE_ORDER_SEASON } from '@biovera/shared/preorder';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import {
  ShoppingCart,
  CalendarCheck,
  LogIn,
  UserPlus,
  Package,
  Shield,
  QrCode,
  Apple,
  Carrot,
  Wheat,
  Box,
  Lock,
  FileCheck,
  ChevronDown,
} from 'lucide-react';
import HarvestCalendar from '@/components/HarvestCalendar';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import {
  marketingHeroLead,
  marketingHeroSubtitle,
  marketingHeroTitle,
} from '@/lib/marketing-classes';

type Step = { title: string; body: string };
type Card = { title: string; desc: string };

export default function ForBuyersPageClient() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const loc = useLocalizedHref();
  const hasBuyerAccess = isAuthenticated && user?.roles?.includes?.('buyer');
  const ordersHref = hasBuyerAccess
    ? '/buyer-portal/trade-panel'
    : `${loc('/login')}?returnTo=${encodeURIComponent('/buyer-portal/trade-panel')}`;
  const preOrderHref = isAuthenticated
    ? '/pre-order'
    : `${loc('/login')}?returnTo=${encodeURIComponent('/pre-order')}`;

  const [interestForm, setInterestForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    consentContact: false,
    consentInformator: false,
  });
  const [interestSubmitted, setInterestSubmitted] = useState(false);
  const [interestSubmitting, setInterestSubmitting] = useState(false);

  const handleInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestForm.consentContact || !interestForm.consentInformator) return;
    setInterestSubmitting(true);
    setTimeout(() => {
      setInterestSubmitted(true);
      setInterestSubmitting(false);
    }, 600);
  };

  const purchasesSteps = useMemo(
    () => t('forBuyersPage.purchasesSteps', { returnObjects: true, year: PRE_ORDER_SEASON }) as Step[],
    [t],
  );
  const securityCards = useMemo(
    () => t('forBuyersPage.securityCards', { returnObjects: true }) as Card[],
    [t],
  );
  const packagingList = useMemo(
    () => t('forBuyersPage.packagingList', { returnObjects: true }) as string[],
    [t],
  );
  const operateList = useMemo(
    () => t('forBuyersPage.operateList', { returnObjects: true }) as string[],
    [t],
  );
  const valueBlocks = useMemo(
    () => t('forBuyersPage.valueBlocks', { returnObjects: true }) as { title: string; body: string }[],
    [t],
  );
  const productCategoryLabels = useMemo(
    () => t('forBuyersPage.productCategoryLabels', { returnObjects: true }) as string[],
    [t],
  );

  const purchasesLead = t('forBuyersPage.purchasesLead');
  const securityLead = t('forBuyersPage.securityLead');
  const operateLead = t('forBuyersPage.operateLead');
  const valueLead = t('forBuyersPage.valueLead');
  const packagingTitle = t('forBuyersPage.packagingTitle');
  const harvestCalendarLead = t('forBuyersPage.harvestCalendarLead');

  const productCategoryIcons = [Apple, Carrot, Wheat, Package];

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <section className="mb-12">
            <h1 className={marketingHeroTitle}>
              {t('forBuyersPage.title')}
            </h1>
            {t('forBuyersPage.heroSubtitle', { defaultValue: '' }) ? (
              <p className={`${marketingHeroSubtitle} max-w-2xl`}>
                {t('forBuyersPage.heroSubtitle')}
              </p>
            ) : null}
            <p className={`${marketingHeroLead} mb-6 max-w-2xl`}>
              {t('forBuyersPage.heroLead')}
            </p>

            <div className="mb-8 p-5 border border-gray-200 rounded-xl bg-gray-50/50">
              <p className="text-gray-700 font-light leading-relaxed">{t('forBuyersPage.notShopBody')}</p>
              <a
                href="#express-interest"
                className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[#2D5A27] hover:text-[#23471f]"
              >
                {t('forBuyersPage.linkExpressInterest')}
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {!isAuthenticated && (
                <>
                  <Link
                    href="/register/buyer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors min-h-[48px]"
                  >
                    <UserPlus className="h-4 w-4" />
                    {t('loginPage.register')}
                  </Link>
                  <Link
                    href={loc('/login')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors min-h-[48px]"
                  >
                    <LogIn className="h-4 w-4" />
                    {t('nav.login')}
                  </Link>
                </>
              )}
              <Link
                href={ordersHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors min-h-[48px]"
              >
                <ShoppingCart className="h-4 w-4" />
                {t('forBuyersPage.placeOrder')}
              </Link>
              <Link
                href={preOrderHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#2D5A27] text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5 transition-colors min-h-[48px]"
              >
                <CalendarCheck className="h-4 w-4" />
                {t('forBuyersPage.preOrder2026', { year: PRE_ORDER_SEASON })}
              </Link>
            </div>
          </section>

          <section className="py-12 border-t border-gray-200">
            <h2 className="text-2xl font-light text-gray-900 mb-2">{t('forBuyersPage.purchasesTitle')}</h2>
            {purchasesLead ? <p className="text-gray-600 mb-8 max-w-2xl">{purchasesLead}</p> : null}
            <div className={`space-y-6 ${purchasesLead ? '' : 'mt-6'}`}>
              {purchasesSteps.map(({ title, body }, i) => (
                <div key={title} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="py-12 border-t border-gray-200">
            <h2 className="text-2xl font-light text-gray-900 mb-2">{t('forBuyersPage.productsTitle')}</h2>
            <p className="text-gray-600 mb-6 max-w-2xl">{t('forBuyersPage.productsLead')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {productCategoryLabels.map((label, i) => {
                const Icon = productCategoryIcons[i] ?? Package;
                return (
                  <div key={label} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                    <Icon className="h-5 w-5 text-[#2D5A27]" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-gray-800">{label}</span>
                  </div>
                );
              })}
            </div>
            {t('forBuyersPage.productsNote', { year: PRE_ORDER_SEASON }) ? (
              <p className="mt-4 text-sm text-gray-500">{t('forBuyersPage.productsNote', { year: PRE_ORDER_SEASON })}</p>
            ) : null}

            <div className="mt-10 pt-10 border-t border-gray-200">
              <h3 className="text-xl font-light text-gray-900 mb-1">{t('forBuyersPage.harvestCalendarTitle')}</h3>
              {harvestCalendarLead && harvestCalendarLead !== 'forBuyersPage.harvestCalendarLead' ? (
                <p className="text-gray-600 mb-6 max-w-2xl">{harvestCalendarLead}</p>
              ) : null}
              <HarvestCalendar />
            </div>
          </section>

          {packagingTitle ? (
          <section className="py-12 border-t border-gray-200">
            <h2 className="text-2xl font-light text-gray-900 mb-2">{packagingTitle}</h2>
            <p className="text-gray-600 max-w-2xl">{t('forBuyersPage.packagingLead')}</p>
            {packagingList.length > 0 ? (
              <ul className="mt-6 space-y-2 text-gray-600">
                {packagingList.map((line) => (
                  <li key={line.slice(0, 48)} className="flex items-start gap-2">
                    <Box className="h-4 w-4 text-[#2D5A27] flex-shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
          ) : null}

          {operateList.length > 0 ? (
            <section id="how-we-operate" className="py-12 border-t border-gray-200 scroll-mt-20">
              <h2 className="text-2xl font-light text-gray-900 mb-2">{t('forBuyersPage.operateTitle')}</h2>
              <p className="text-xs font-light text-gray-500 uppercase tracking-wide mb-2">
                {t('forBuyersPage.operateInformator')}
              </p>
              {operateLead ? <p className="text-gray-600 mb-6 max-w-2xl">{operateLead}</p> : null}
              <ul className="space-y-2 text-gray-600">
                {operateList.map((line) => (
                  <li key={line.slice(0, 48)} className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-[#2D5A27] flex-shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section id="security-safeguards" className="py-12 border-t border-gray-200 scroll-mt-20">
            <h2 className="text-2xl font-light text-gray-900 mb-2">{t('forBuyersPage.securityTitle')}</h2>
            {securityLead ? <p className="text-gray-600 mb-6 max-w-2xl">{securityLead}</p> : null}
            <div className={`grid md:grid-cols-2 gap-6 ${securityLead ? '' : 'mt-6'}`}>
              {securityCards.map((card) => {
                const icons = [Lock, FileCheck, Shield, QrCode] as const;
                const idx = securityCards.indexOf(card);
                const Icon = icons[idx] ?? Lock;
                return (
                  <div key={card.title} className="flex gap-3 p-4 border border-gray-200 rounded-xl">
                    <Icon className="h-5 w-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{card.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {valueBlocks.length > 0 ? (
            <section className="py-12 border-t border-gray-200 bg-[#2D5A27]/5 rounded-xl px-6">
              <h2 className="text-2xl font-light text-gray-900 mb-2">{t('forBuyersPage.valueTitle')}</h2>
              {valueLead ? <p className="text-gray-600 mb-6 max-w-2xl">{valueLead}</p> : null}
              <div className="space-y-4">
                {valueBlocks.map((block) => (
                  <div key={block.title} className="flex gap-3">
                    <Package className="h-5 w-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">{block.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{block.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="py-12 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">{t('forBuyersPage.ctaRepeat')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={ordersHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors min-h-[48px]"
              >
                <ShoppingCart className="h-4 w-4" />
                {t('forBuyersPage.placeOrder')}
              </Link>
              <Link
                href={preOrderHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#2D5A27] text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5 transition-colors min-h-[48px]"
              >
                <CalendarCheck className="h-4 w-4" />
                {t('forBuyersPage.preOrder2026', { year: PRE_ORDER_SEASON })}
              </Link>
            </div>
          </section>

          <section id="express-interest" className="py-12 border-t border-gray-200 scroll-mt-20">
            <h2 className="text-2xl font-light text-gray-900 mb-2">{t('forBuyersPage.interestTitle')}</h2>
            <p className="text-gray-600 mb-6 max-w-2xl">{t('forBuyersPage.interestLead')}</p>
            {interestSubmitted ? (
              <div className="max-w-xl p-6 border border-[#2D5A27]/30 rounded-xl bg-[#2D5A27]/5">
                <p className="text-gray-800 font-medium mb-1">{t('forBuyersPage.interestThanks')}</p>
                <p className="text-sm text-gray-600">{t('forBuyersPage.interestThanksBody')}</p>
                <Link
                  href="/register/buyer"
                  className="inline-block mt-4 text-sm font-medium text-[#2D5A27] hover:text-[#23471f]"
                >
                  {t('forBuyersPage.interestRegisterLink')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleInterestSubmit} className="max-w-xl space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('forBuyersPage.formCompany')}{' '}
                      <span className="text-red-500">{t('forBuyersPage.required')}</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={interestForm.companyName}
                      onChange={(e) => setInterestForm((f) => ({ ...f, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                      placeholder={t('forBuyersPage.formPlaceholderCompany')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('forBuyersPage.formContact')}{' '}
                      <span className="text-red-500">{t('forBuyersPage.required')}</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={interestForm.contactPerson}
                      onChange={(e) => setInterestForm((f) => ({ ...f, contactPerson: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                      placeholder={t('forBuyersPage.formPlaceholderName')}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('forBuyersPage.formEmail')}{' '}
                      <span className="text-red-500">{t('forBuyersPage.required')}</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={interestForm.email}
                      onChange={(e) => setInterestForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                      placeholder={t('forBuyersPage.formPlaceholderEmail')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('forBuyersPage.formPhone')}
                    </label>
                    <input
                      type="tel"
                      value={interestForm.phone}
                      onChange={(e) => setInterestForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                      placeholder={t('forBuyersPage.formPlaceholderPhone')}
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interestForm.consentContact}
                      onChange={(e) => setInterestForm((f) => ({ ...f, consentContact: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-[#2D5A27] focus:ring-[#2D5A27]"
                    />
                    <span className="text-sm text-gray-700">
                      {t('forBuyersPage.formConsentContact')}{' '}
                      <span className="text-red-500">{t('forBuyersPage.required')}</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interestForm.consentInformator}
                      onChange={(e) => setInterestForm((f) => ({ ...f, consentInformator: e.target.checked }))}
                      className="mt-1 rounded border-gray-300 text-[#2D5A27] focus:ring-[#2D5A27]"
                    />
                    <span className="text-sm text-gray-700">
                      {t('forBuyersPage.formConsentInformator')}{' '}
                      <span className="text-red-500">{t('forBuyersPage.required')}</span>{' '}
                      <a href="#security-safeguards" className="text-[#2D5A27] hover:text-[#23471f] underline">
                        {t('forBuyersPage.formReadHowWeOperate')}
                      </a>
                    </span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={interestSubmitting || !interestForm.consentContact || !interestForm.consentInformator}
                  className="px-5 py-2.5 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
                >
                  {interestSubmitting ? t('forBuyersPage.formSending') : t('forBuyersPage.formSubmit')}
                </button>
              </form>
            )}
          </section>
        </div>

        <Footer />
      </div>
    </div>
  );
}
