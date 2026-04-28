'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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

export default function AboutPage() {
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">{t('aboutPage.heroTitle')}</h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">{t('aboutPage.heroSubtitle')}</p>
          </motion.div>

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg p-8 mb-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <Target className="w-8 h-8 text-[#2D5A27] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-light text-gray-900 mb-4">{t('aboutPage.missionTitle')}</h2>
                  <p className="text-gray-600 font-light leading-relaxed mb-4">{t('aboutPage.missionP1')}</p>
                  <p className="text-gray-600 font-light leading-relaxed">{t('aboutPage.missionP2')}</p>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-start gap-4 mb-6">
                <Globe className="w-8 h-8 text-[#2D5A27] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-light text-gray-900 mb-4">{t('aboutPage.visionTitle')}</h2>
                  <p className="text-gray-600 font-light leading-relaxed mb-4">{t('aboutPage.visionP1')}</p>
                  <p className="text-gray-600 font-light leading-relaxed">{t('aboutPage.visionP2')}</p>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-8">{t('aboutPage.valuesTitle')}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {valueCards.map((value, index) => {
                  const IconComponent = VALUE_ICONS[index] ?? Shield;
                  return (
                    <motion.div
                      key={value.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27] transition-colors"
                    >
                      <IconComponent className="w-6 h-6 text-[#2D5A27] mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-sm text-gray-600 font-light leading-relaxed">{value.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </section>

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">{t('aboutPage.whatWeDoTitle')}</h2>
              <div className="space-y-4">
                {whatWeDoItems.map((item) => (
                  <div key={item.title} className="border-l-2 border-[#2D5A27] pl-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 font-light leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
          >
            <h2 className="text-2xl font-light text-gray-900 mb-4">{t('aboutPage.ctaTitle')}</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6">{t('aboutPage.ctaBody')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={loc('/growers')}
                className="px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
              >
                {t('aboutPage.ctaProducer')}
              </Link>
              <Link
                href={loc('/contact')}
                className="px-6 py-3 border border-[#2D5A27] text-[#2D5A27] text-sm font-medium hover:bg-[#2D5A27]/10 transition-colors rounded-lg"
              >
                {t('aboutPage.ctaContact')}
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
