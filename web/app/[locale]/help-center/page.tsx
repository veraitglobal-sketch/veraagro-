'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

type Category = 'buyers' | 'growers' | 'drivers' | 'general';

type Article = {
  title: string;
  content: string;
  link?: string;
  highlight?: boolean;
};

const CATEGORY_LABEL_KEY: Record<Category, 'helpCenterPage.categoryBuyers' | 'helpCenterPage.categoryGrowers' | 'helpCenterPage.categoryDrivers' | 'helpCenterPage.categoryGeneral'> = {
  buyers: 'helpCenterPage.categoryBuyers',
  growers: 'helpCenterPage.categoryGrowers',
  drivers: 'helpCenterPage.categoryDrivers',
  general: 'helpCenterPage.categoryGeneral',
};

function isArticleList(x: unknown): x is Article[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'title' in x[0] &&
    'content' in x[0]
  );
}

export default function HelpCenterPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const [category, setCategory] = useState<Category>('buyers');
  const [searchQuery, setSearchQuery] = useState('');

  const articlesByCategory = useMemo(() => {
    const raw = t('helpCenterPage.articles', { returnObjects: true });
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as Record<Category, unknown>;
    }
    return {} as Record<Category, unknown>;
  }, [t]);

  const articles = useMemo(() => {
    const list = articlesByCategory[category];
    return isArticleList(list) ? list : [];
  }, [articlesByCategory, category]);

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">{t('helpCenterPage.title')}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('helpCenterPage.searchPlaceholder')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('helpCenterPage.categoriesLabel')}</h2>
              <div className="space-y-2">
                {(['buyers', 'growers', 'drivers', 'general'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === cat
                        ? 'bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/30'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t(CATEGORY_LABEL_KEY[cat])}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredArticles.map((article, index) => {
                const isHighlighted = article.highlight;
                const inner = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all ${
                      isHighlighted
                        ? 'border-2 border-[#2D5A27]/40 bg-gradient-to-br from-[#2D5A27]/10 to-white'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isHighlighted && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#2D5A27] to-[#23471f] rounded-lg flex items-center justify-center shadow-md">
                            <Shield className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3
                          className={`text-lg font-semibold mb-2 ${isHighlighted ? 'text-[#23471f]' : 'text-gray-900'}`}
                        >
                          {article.title}
                        </h3>
                        <p className={isHighlighted ? 'text-gray-700' : 'text-gray-600'}>{article.content}</p>
                        {article.link && (
                          <div className="mt-4 flex items-center gap-2 text-[#2D5A27] font-medium text-sm">
                            <span>{t('helpCenterPage.learnMore')}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );

                const href = article.link
                  ? article.link.startsWith('http')
                    ? article.link
                    : loc(article.link.replace(/^\//, ''))
                  : undefined;

                return href ? (
                  <Link key={`${category}-${article.title}`} href={href} className="block">
                    {inner}
                  </Link>
                ) : (
                  <div key={`${category}-${article.title}`} className="cursor-pointer">
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
