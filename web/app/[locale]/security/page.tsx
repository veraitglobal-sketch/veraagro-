'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle, Server, Key, FileCheck, AlertTriangle } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

type Measure = { title: string; body: string };
const MEASURE_ICONS = [Lock, Key, Server, Eye, FileCheck, AlertTriangle];

function isMeasureList(x: unknown): x is Measure[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'title' in x[0] &&
    'body' in x[0]
  );
}

function isComplianceList(x: unknown): x is Measure[] {
  return isMeasureList(x);
}

export default function SecurityPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const measureItems = useMemo(() => {
    const raw = t('securityPage.measureItems', { returnObjects: true });
    return isMeasureList(raw) ? raw : [];
  }, [t]);

  const complianceItems = useMemo(() => {
    const raw = t('securityPage.complianceItems', { returnObjects: true });
    return isComplianceList(raw) ? raw : [];
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
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#2D5A27]/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#2D5A27]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">{t('securityPage.heroTitle')}</h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">{t('securityPage.heroLead')}</p>
          </motion.div>

          <section className="mb-16">
            <h2 className="text-2xl font-light text-gray-900 mb-8">{t('securityPage.measuresTitle')}</h2>
            <div className="space-y-6">
              {measureItems.map((item, index) => {
                const IconComponent = MEASURE_ICONS[index] ?? Lock;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-[#2D5A27]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 font-light leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg p-8"
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">{t('securityPage.complianceTitle')}</h2>
              <div className="space-y-4">
                {complianceItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 font-light leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-light text-gray-900 mb-6">{t('securityPage.dataProtectionTitle')}</h2>
            <div className="space-y-4">
              <div className="border-l-2 border-[#2D5A27] pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('securityPage.dataWhatTitle')}</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">{t('securityPage.dataWhatBody')}</p>
              </div>
              <div className="border-l-2 border-[#2D5A27] pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('securityPage.dataHowTitle')}</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed mb-4">{t('securityPage.dataHowBody')}</p>
              </div>
              <div className="border-l-2 border-[#2D5A27] pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('securityPage.yourRightsTitle')}</h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  <Trans
                    i18nKey="securityPage.yourRightsRich"
                    components={{
                      privacy: <Link href={loc('/privacy')} className="text-[#2D5A27] hover:underline" />,
                    }}
                  />
                </p>
              </div>
            </div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-8"
          >
            <h2 className="text-xl font-light text-gray-900 mb-4">{t('securityPage.reportTitle')}</h2>
            <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">{t('securityPage.reportBody')}</p>
            <Link
              href={loc('/contact')}
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
            >
              {t('securityPage.reportCta')}
            </Link>
          </motion.div>
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
                  <Link href={loc('/about')} className="hover:text-[#2D5A27] transition-colors">
                    {t('footer.about')}
                  </Link>
                </li>
                <li>
                  <Link href={loc('/careers')} className="hover:text-[#2D5A27] transition-colors">
                    {t('footer.careers')}
                  </Link>
                </li>
                <li>
                  <Link href={loc('/press')} className="hover:text-[#2D5A27] transition-colors">
                    {t('footer.pressKit')}
                  </Link>
                </li>
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
                <li>
                  <Link href={loc('/contact')} className="hover:text-[#2D5A27] transition-colors">
                    {t('nav.contact')}
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
