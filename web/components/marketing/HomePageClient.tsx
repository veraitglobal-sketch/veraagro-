'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  QrCode,
  PackageSearch,
  Wallet,
  Shield,
  FileCheck,
  Eye,
  Lock,
  Globe,
  Apple,
  Carrot,
  Wheat,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { partners } from '@/lib/partners';
import dynamic from 'next/dynamic';

const VeraAIChatbotInline = dynamic(() => import('@/components/VeraAIChatbotInline'), { ssr: false });
import Footer from '@/components/Footer';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

type VisionCard = { title: string; description: string };
type FeatureItem = { title: string; description: string };
type RoadmapPhase = { phase: string; title: string; status: string; items: string[] };

const STAT_NUMBERS = ['100%', 'EU', '24/7', '0', 'Polygon'] as const;

const VISION_ICONS: LucideIcon[] = [Eye, Lock, Globe];
const FEATURE_ICONS: LucideIcon[] = [QrCode, PackageSearch, Wallet, Shield, FileCheck, Lock];

const PRODUCT_CATS: { id: 'fruits' | 'vegetables' | 'grains'; icon: LucideIcon }[] = [
  { id: 'fruits', icon: Apple },
  { id: 'vegetables', icon: Carrot },
  { id: 'grains', icon: Wheat },
];

export default function HomePageClient() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const [showPreOrderInfo, setShowPreOrderInfo] = useState(false);
  const preOrderRef = useRef<HTMLDivElement>(null);

  const statLabels = t('home.statLabels', { returnObjects: true }) as string[];
  const statRows = useMemo(
    () => STAT_NUMBERS.map((number, i) => ({ number, label: statLabels[i] ?? '' })),
    [i18n.language, statLabels],
  );

  const visionCards = t('home.vision.cards', { returnObjects: true }) as VisionCard[];
  const featureList = t('home.features.list', { returnObjects: true }) as FeatureItem[];
  const roadmapPhases = t('home.roadmap.phases', { returnObjects: true }) as RoadmapPhase[];
  const blockchainBullets = t('home.blockchain.bullets', { returnObjects: true }) as string[];
  const heroTitle = t('home.hero.title');
  const featuresIntro = t('home.features.intro');

  useEffect(() => {
    if (!showPreOrderInfo) return;
    const close = (e: MouseEvent) => {
      if (preOrderRef.current && !preOrderRef.current.contains(e.target as Node)) setShowPreOrderInfo(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showPreOrderInfo]);

  return (
    <div className="min-h-screen bg-white">
      <section className="min-h-[50vh] sm:min-h-[55vh] pt-20 sm:pt-28 md:pt-40 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-4 md:mb-6 leading-tight">
              {heroTitle}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={loc('/login')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {t('home.hero.browseProducts')}
              </Link>
              <Link
                href={loc('/growers')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#2D5A27] text-[#2D5A27] text-sm font-medium hover:bg-[#2D5A27]/5 transition-colors rounded-lg"
              >
                {t('home.hero.becomeProducer')}
              </Link>
            </div>
            <div ref={preOrderRef} className="relative mt-10 flex items-center justify-center gap-2">
              <Link
                href={`${loc('/login')}?returnTo=${encodeURIComponent('/pre-order-2026')}`}
                className="text-sm font-light text-gray-500 hover:text-[#2D5A27] transition-colors"
              >
                {t('home.hero.preOrder')}
              </Link>
              <button
                type="button"
                onClick={() => setShowPreOrderInfo((v) => !v)}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#2D5A27]/30 bg-transparent text-[#2D5A27] transition hover:border-[#2D5A27]/50 hover:bg-[#2D5A27]/5 focus:outline-none focus:ring-1 focus:ring-[#2D5A27]/20"
                aria-label={t('home.hero.preOrderAria')}
              >
                <HelpCircle className="h-3 w-3" strokeWidth={2} />
              </button>
              {showPreOrderInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 top-full z-10 mt-2 w-72 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm font-light text-gray-600 shadow-sm"
                >
                  <p className="leading-relaxed">{t('home.hero.preOrderTip1')}</p>
                  <p className="mt-2 pt-2 border-t border-gray-100 text-gray-500 text-xs leading-relaxed">
                    {t('home.hero.preOrderTip2')}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pt-16 pb-12 border-t border-gray-200 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {statRows.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-light text-gray-900 mb-2">{stat.number}</div>
                <div className="h-0.5 w-8 mx-auto mb-2 rounded-full bg-[#2D5A27]/40" aria-hidden />
                <div className="text-sm text-gray-500 uppercase tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-16 pb-20 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-sm text-gray-500 mb-12">{t('home.partnersLine')}</p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {partners.length > 0 ? (
                partners.map((partner, index) => (
                  <motion.div
                    key={partner.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="w-[170px] h-[84px] rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-100 transition-all p-2"
                  >
                    {partner.url ? (
                      <a
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full h-full"
                      >
                        <Image
                          src={partner.logo}
                          alt={partner.alt || `${partner.name} Logo`}
                          width={100}
                          height={50}
                          className="max-w-[100px] max-h-[50px] object-contain opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                          style={{ width: 'auto', height: 'auto' }}
                        />
                      </a>
                    ) : (
                      <Image
                        src={partner.logo}
                        alt={partner.alt || `${partner.name} Logo`}
                        width={100}
                        height={50}
                        className="max-w-[100px] max-h-[50px] object-contain opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    )}
                  </motion.div>
                ))
              ) : (
                Array.from({ length: 5 }).map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="w-[170px] h-[84px] rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-100 transition-all p-2"
                  >
                    <Image
                      src="/logo1.png"
                      alt={`${t('brand.name')} — ${t('metadata.siteName')}`}
                      width={100}
                      height={50}
                      className="max-w-[100px] max-h-[50px] object-contain opacity-60 grayscale"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="vision" className="py-24 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/5 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">{t('home.vision.title')}</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto font-light">{t('home.vision.intro')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {visionCards.map((item, index) => {
              const IconComponent = VISION_ICONS[index];
              if (!IconComponent) return null;
              return (
                <div key={index} className="border-b border-[#2D5A27]/15 pb-8">
                  <div className="mb-4">
                    <IconComponent className="w-6 h-6 text-[#2D5A27]/60" strokeWidth={1} />
                  </div>
                  <h3 className="text-lg font-light text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-3">{t('home.features.title')}</h2>
            {featuresIntro ? (
              <p className="text-base text-gray-600 font-light">{featuresIntro}</p>
            ) : null}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureList.map((feature, index) => {
              const IconComponent = FEATURE_ICONS[index];
              if (!IconComponent) return null;
              return (
                <div key={index} className="border-b border-[#2D5A27]/15 pb-8">
                  <div className="mb-4">
                    <IconComponent className="w-6 h-6 text-[#2D5A27]/60" strokeWidth={1} />
                  </div>
                  <h3 className="text-lg font-light text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2D5A27]/10 mb-6">
              <Lock className="w-6 h-6 text-[#2D5A27]" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-light text-gray-900 mb-4">{t('home.blockchain.title')}</h2>
            <p className="text-base text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
              {t('home.blockchain.body')}
            </p>
          </motion.div>
          {blockchainBullets.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-6 text-sm"
          >
            {blockchainBullets.map((line, i) => (
              <span key={i} className="flex items-center gap-2 text-gray-600 font-light">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A27]/60" />
                {line}
              </span>
            ))}
          </motion.div>
          ) : null}
        </div>
      </section>

      <section id="roadmap" className="py-24 px-6 lg:px-8 border-t border-gray-200 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-light text-gray-900 mb-4">{t('home.roadmap.title')}</h2>
            <p className="text-lg text-gray-600">{t('home.roadmap.subtitle')}</p>
          </motion.div>

          <div className="space-y-8">
            {roadmapPhases.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border-l-2 border-gray-200 pl-8 pb-8 last:pb-0 hover:border-vera transition-colors"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        plan.status === 'completed'
                          ? 'bg-[#2D5A27]'
                          : plan.status === 'in-progress'
                            ? 'bg-[#2D5A27]/80'
                            : 'bg-gray-300'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{plan.phase}</span>
                      <span
                        className={`text-xs px-2 py-1 border ${
                          plan.status === 'completed'
                            ? 'border-[#2D5A27] text-[#2D5A27]'
                            : plan.status === 'in-progress'
                              ? 'border-[#2D5A27]/70 text-[#2D5A27]'
                              : 'border-gray-300 text-gray-400'
                        }`}
                      >
                        {plan.status === 'completed'
                          ? t('home.roadmap.statusCompleted')
                          : plan.status === 'in-progress'
                            ? t('home.roadmap.statusInProgress')
                            : t('home.roadmap.statusPlanned')}
                      </span>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-4">{plan.title}</h3>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {plan.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-1 h-1 bg-gray-400 rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-light text-gray-900 mb-4">{t('home.products.title')}</h2>
            <p className="text-lg text-gray-600">{t('home.products.subtitle')}</p>
          </motion.div>

          <div className="flex gap-4 justify-center overflow-x-auto">
            {PRODUCT_CATS.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  href={loc('/login')}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg transition-all group hover:border-[#2D5A27] hover:text-[#2D5A27]"
                >
                  <Icon
                    className="w-5 h-5 text-gray-600 group-hover:text-[#2D5A27] group-hover:scale-110 transition-transform"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm font-medium transition-colors">
                    {t(`home.products.${category.id}`)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-light text-gray-900 mb-6">{t('home.cta.title')}</h2>
            <p className="text-lg text-gray-600 mb-8">{t('home.cta.body')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={loc('/growers')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
              >
                {t('home.cta.becomeProducer')}
              </Link>
              <Link
                href={loc('/login')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#2D5A27] text-[#2D5A27] text-sm font-medium hover:bg-[#2D5A27]/5 transition-colors rounded-lg"
              >
                {t('home.cta.startShopping')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50/50 py-6 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-light text-gray-600">{t('home.help')}</p>
          <VeraAIChatbotInline />
        </div>
      </section>

      <Footer />
    </div>
  );
}
