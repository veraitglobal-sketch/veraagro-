'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

type FAQCategory = 'general' | 'growers' | 'buyers' | 'logistics' | 'technical';

interface FAQItem {
  q: string;
  a: string;
  category: FAQCategory;
}

function parseFaqItems(raw: unknown): FAQItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = row as { q?: string; a?: string; category?: string };
      const cat = o.category;
      if (
        cat === 'general' ||
        cat === 'growers' ||
        cat === 'buyers' ||
        cat === 'logistics' ||
        cat === 'technical'
      ) {
        return { q: o.q ?? '', a: o.a ?? '', category: cat };
      }
      return null;
    })
    .filter((x): x is FAQItem => x != null);
}

export default function FAQPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = useMemo(
    () => parseFaqItems(t('faqPage.items', { returnObjects: true })),
    [t, i18n.language],
  );

  const categories = useMemo(
    () => [
      { id: 'all', label: t('faqPage.catAll') },
      { id: 'general', label: t('faqPage.catGeneral') },
      { id: 'growers', label: t('faqPage.catGrowers') },
      { id: 'buyers', label: t('faqPage.catBuyers') },
      { id: 'logistics', label: t('faqPage.catLogistics') },
      { id: 'technical', label: t('faqPage.catTechnical') },
    ],
    [t, i18n.language],
  );

  useEffect(() => {
    setOpenIndex(null);
  }, [selectedCategory, searchQuery]);

  const filteredFAQs = useMemo(
    () =>
      faqs.filter((faq) => {
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          q === '' ||
          faq.q.toLowerCase().includes(q) ||
          faq.a.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      }),
    [faqs, selectedCategory, searchQuery],
  );

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
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">{t('faqPage.title')}</h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">{t('faqPage.subtitle')}</p>
          </motion.div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder={t('faqPage.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none font-light"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-[#2D5A27] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={`${faq.category}-${faq.q}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base font-medium text-gray-900 pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-light leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-light">{t('faqPage.empty')}</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
          >
            <h2 className="text-xl font-light text-gray-900 mb-4">{t('faqPage.ctaTitle')}</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6">{t('faqPage.ctaBody')}</p>
            <Link
              href={loc('/contact')}
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
            >
              {t('faqPage.ctaButton')}
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
                  <Link href={loc('/logistics-partner')} className="hover:text-[#2D5A27] transition-colors">
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
