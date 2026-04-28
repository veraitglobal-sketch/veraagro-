'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, Users, Heart, Zap, Target, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';

const VALUE_ICONS = [Target, Users, Zap, Heart, Globe] as const;

const JOB_KEYS = ['dev', 'agritech', 'bizdev'] as const;

type ValueCard = { title: string; description: string };

function isValueCardList(x: unknown): x is ValueCard[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    x.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'title' in item &&
        'description' in item &&
        typeof (item as ValueCard).title === 'string' &&
        typeof (item as ValueCard).description === 'string',
    )
  );
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((item) => typeof item === 'string');
}

export default function CareersPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const values = useMemo(() => {
    const raw = t('careersPage.values', { returnObjects: true });
    return isValueCardList(raw) ? raw : [];
  }, [t]);

  const jobs = useMemo(() => {
    return JOB_KEYS.map((key) => {
      const requirementsRaw = t(`careersPage.jobs.${key}.requirements`, { returnObjects: true });
      const benefitsRaw = t(`careersPage.jobs.${key}.benefits`, { returnObjects: true });
      return {
        key,
        title: t(`careersPage.jobs.${key}.title`),
        department: t(`careersPage.jobs.${key}.department`),
        location: t(`careersPage.jobs.${key}.location`),
        description: t(`careersPage.jobs.${key}.description`),
        requirements: isStringArray(requirementsRaw) ? requirementsRaw : [],
        benefits: isStringArray(benefitsRaw) ? benefitsRaw : [],
      };
    });
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
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#2D5A27]/10 rounded-full flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-[#2D5A27]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">{t('careersPage.heroTitle')}</h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
              {t('careersPage.heroSubtitle')}
            </p>
          </motion.div>

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-8 text-center">{t('careersPage.whyTitle')}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {values.map((value, index) => {
                  const IconComponent = VALUE_ICONS[index] ?? Target;
                  return (
                    <motion.div
                      key={`${value.title}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27] transition-colors text-center"
                    >
                      <IconComponent className="w-8 h-8 text-[#2D5A27] mx-auto mb-4" />
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
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-8">{t('careersPage.openPositions')}</h2>
              <div className="space-y-6">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-8 hover:border-[#2D5A27] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {t('careersPage.employmentFullTime')}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`${loc('/contact')}?subject=${encodeURIComponent(
                          t('careersPage.applySubject', { role: job.title }),
                        )}`}
                        className="px-6 py-2 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg whitespace-nowrap"
                      >
                        {t('careersPage.applyNow')}
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">{job.description}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">{t('careersPage.requirements')}</h4>
                        <ul className="space-y-2">
                          {job.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 bg-[#2D5A27] rounded-full mt-2 flex-shrink-0" />
                              <span className="font-light">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">{t('careersPage.benefits')}</h4>
                        <ul className="space-y-2">
                          {job.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 bg-[#2D5A27] rounded-full mt-2 flex-shrink-0" />
                              <span className="font-light">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
          >
            <h2 className="text-xl font-light text-gray-900 mb-4">{t('careersPage.ctaTitle')}</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6">{t('careersPage.ctaBody')}</p>
            <Link
              href={`${loc('/contact')}?subject=${encodeURIComponent(t('careersPage.generalApplicationSubject'))}`}
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
            >
              {t('careersPage.ctaButton')}
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
