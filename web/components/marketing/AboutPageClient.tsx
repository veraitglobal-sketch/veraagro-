'use client';

import BookCallButton from '@/components/BookCallButton';
import { useMemo } from 'react';
import Link from 'next/link';
import { Target, Users, Award, Globe, Shield, Leaf } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import MarketingHero from '@/components/marketing/MarketingHero';
import { marketingSectionTitle } from '@/lib/marketing-classes';

type Card = { title: string; description: string };
type Block = { title: string; body: string };

function isCardList(x: unknown): x is Card[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'title' in x[0] &&
    'description' in x[0]
  );
}

function isBlockList(x: unknown): x is Block[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'title' in x[0] &&
    'body' in x[0]
  );
}

const VALUE_ICONS = [Shield, Award, Users, Leaf];

export default function AboutPageClient() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const valueCards = useMemo(() => {
    const raw = t('aboutPage.valueCards', { returnObjects: true });
    return isCardList(raw) ? raw : [];
  }, [t]);

  const whatWeDoItems = useMemo(() => {
    const raw = t('aboutPage.whatWeDoItems', { returnObjects: true });
    return isBlockList(raw) ? raw : [];
  }, [t]);

  const missionP2 = t('aboutPage.missionP2');
  const visionP2 = t('aboutPage.visionP2');
  const valuesTitle = t('aboutPage.valuesTitle');
  const whatWeDoTitle = t('aboutPage.whatWeDoTitle');
  const protocol360Title = t('aboutPage.protocol360Title');
  const protocol360Body = t('aboutPage.protocol360Body');

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-12 pb-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <MarketingHero
            title={t('aboutPage.heroTitle')}
            lead={t('aboutPage.heroSubtitle')}
            sectionClassName="!pt-0 pb-14 !px-0"
          />

          <p className="text-sm text-gray-500 font-light leading-relaxed mb-14 -mt-8">
            <Trans
              i18nKey="aboutPage.techPartnerLine"
              components={{
                1: (
                  <a
                    href="https://www.verait.de"
                    className="text-gray-600 hover:text-[#2D5A27] transition-colors"
                  />
                ),
              }}
            />
          </p>

          <section className="mb-14">
            <div className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-xl p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <Target className="w-8 h-8 text-[#2D5A27] flex-shrink-0 mt-1" />
                <div>
                  <h2 className={`${marketingSectionTitle} mb-4`}>{t('aboutPage.missionTitle')}</h2>
                  <p className="text-gray-600 font-light leading-relaxed">{t('aboutPage.missionP1')}</p>
                  {missionP2 ? (
                    <p className="text-gray-600 font-light leading-relaxed mt-4">{missionP2}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="mb-14">
            <div className="flex items-start gap-4">
              <Globe className="w-8 h-8 text-[#2D5A27] flex-shrink-0 mt-1" />
              <div>
                <h2 className={`${marketingSectionTitle} mb-4`}>{t('aboutPage.visionTitle')}</h2>
                <p className="text-gray-600 font-light leading-relaxed">{t('aboutPage.visionP1')}</p>
                {visionP2 ? (
                  <p className="text-gray-600 font-light leading-relaxed mt-4">{visionP2}</p>
                ) : null}
              </div>
            </div>
          </section>

          {protocol360Body ? (
          <section className="mb-14">
            <div className="flex items-start gap-4">
              <Award className="w-8 h-8 text-[#2D5A27] flex-shrink-0 mt-1" />
              <div>
                {protocol360Title ? (
                  <h2 className={`${marketingSectionTitle} mb-4`}>{protocol360Title}</h2>
                ) : null}
                <p className="text-gray-600 font-light leading-relaxed">{protocol360Body}</p>
              </div>
            </div>
          </section>
          ) : null}

          {valueCards.length > 0 ? (
          <section className="mb-14">
            {valuesTitle ? (
              <h2 className={`${marketingSectionTitle} mb-8`}>{valuesTitle}</h2>
            ) : null}
            <div className="grid md:grid-cols-2 gap-6">
              {valueCards.map((value, index) => {
                const IconComponent = VALUE_ICONS[index] ?? Shield;
                return (
                  <div
                    key={value.title}
                    className="rounded-xl border border-gray-200 p-6 hover:border-[#2D5A27]/40 transition-colors shadow-sm"
                  >
                    <IconComponent className="w-6 h-6 text-[#2D5A27] mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </section>
          ) : null}

          {whatWeDoItems.length > 0 ? (
          <section className="mb-14">
            {whatWeDoTitle ? (
              <h2 className={`${marketingSectionTitle} mb-6`}>{whatWeDoTitle}</h2>
            ) : null}
            <div className="space-y-6">
              {whatWeDoItems.map((item) => (
                <div key={item.title} className="border-l-2 border-[#2D5A27] pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 font-light leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8 text-center shadow-sm">
            <h2 className="text-2xl font-light text-gray-900 mb-4">{t('aboutPage.ctaTitle')}</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6 max-w-2xl mx-auto">{t('aboutPage.ctaBody')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={loc('/for-growers')}
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
              >
                {t('aboutPage.ctaProducer')}
              </Link>
              <Link
                href={loc('/contact')}
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 border border-[#2D5A27] text-[#2D5A27] text-sm font-medium hover:bg-[#2D5A27]/10 transition-colors rounded-lg"
              >
                {t('aboutPage.ctaContact')}
              </Link>
              <BookCallButton from="/about" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
