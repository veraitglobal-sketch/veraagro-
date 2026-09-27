'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { SiteLocale } from '@/i18n/config';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import type { FaqItem } from '@/lib/locale-bundles';

export type FaqPageInitial = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  catAll: string;
  catGeneral: string;
  catGrowers: string;
  catBuyers: string;
  catLogistics: string;
  catTechnical: string;
  empty: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  items: FaqItem[];
};

export default function FaqPageClient({
  initialLocale: _initialLocale,
  initial,
}: Readonly<{ initialLocale: SiteLocale; initial: FaqPageInitial }>) {
  const loc = useLocalizedHref();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(
    () => [
      { id: 'all', label: initial.catAll },
      { id: 'general', label: initial.catGeneral },
      { id: 'growers', label: initial.catGrowers },
      { id: 'buyers', label: initial.catBuyers },
      { id: 'logistics', label: initial.catLogistics },
      { id: 'technical', label: initial.catTechnical },
    ],
    [initial],
  );

  const faqs = initial.items;

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
      <main className="pt-12 pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">{initial.title}</h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">{initial.subtitle}</p>
          </motion.div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder={initial.searchPlaceholder}
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

          <div className="space-y-3">
            {filteredFAQs.map((faq) => (
              <details
                key={`${faq.category}-${faq.q}`}
                className="group border border-gray-200 rounded-lg overflow-hidden bg-white"
              >
                <summary className="cursor-pointer list-none px-6 py-4 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors [&::-webkit-details-marker]:hidden">
                  {faq.q}
                </summary>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600 font-light leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-light">{initial.empty}</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
          >
            <h2 className="text-xl font-light text-gray-900 mb-4">{initial.ctaTitle}</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6">{initial.ctaBody}</p>
            <Link
              href={loc('/contact')}
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
            >
              {initial.ctaButton}
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
