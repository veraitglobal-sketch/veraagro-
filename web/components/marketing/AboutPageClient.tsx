'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Target, Users, Award, Globe, Shield, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';

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

      <main className="pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 leading-tight">{t('aboutPage.heroTitle')}</h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">{t('aboutPage.heroSubtitle')}</p>
          </div>

          <section className="mb-14">
            <div className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-xl p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <Target className="w-8 h-8 text-[#2D5A27] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-light text-gray-900 mb-4">{t('aboutPage.missionTitle')}</h2>
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
                <h2 className="text-2xl font-light text-gray-900 mb-4">{t('aboutPage.visionTitle')}</h2>
                <p className="text-gray-600 font-light leading-relaxed">{t('aboutPage.visionP1')}</p>
                {visionP2 ? (
                  <p className="text-gray-600 font-light leading-relaxed mt-4">{visionP2}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-light text-gray-900 mb-8">{t('aboutPage.valuesTitle')}</h2>
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

          <section className="mb-14">
            <h2 className="text-2xl font-light text-gray-900 mb-6">{t('aboutPage.whatWeDoTitle')}</h2>
            <div className="space-y-6">
              {whatWeDoItems.map((item) => (
                <div key={item.title} className="border-l-2 border-[#2D5A27] pl-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 font-light leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8 text-center shadow-sm">
            <h2 className="text-2xl font-light text-gray-900 mb-4">{t('aboutPage.ctaTitle')}</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6 max-w-2xl mx-auto">{t('aboutPage.ctaBody')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={loc('/growers')}
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
