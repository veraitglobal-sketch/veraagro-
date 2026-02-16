'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Award, CheckCircle } from 'lucide-react';

type Category = 'buyers' | 'growers' | 'drivers' | 'general';

const content = {
    title: 'Help Center',
    searchPlaceholder: 'Search for help...',
    categories: {
      buyers: 'For Buyers',
      growers: 'For Growers',
      drivers: 'For Drivers',
      general: 'General',
    },
    articles: {
      buyers: [
        { 
          title: 'Protocol 360: Quality Assurance System', 
          content: 'Discover Bio Vera\'s three-tier quality control system ensuring product safety, quality, and standardization. Learn about our rigorous verification process from field to shelf.',
          link: '/protocol-360',
          highlight: true,
        },
        { 
          title: 'Product Safety & Quality Standards', 
          content: 'Every product undergoes strict quality checks including soil analysis, biometric scanning, and cold chain monitoring. Our standards exceed industry expectations.',
        },
        { 
          title: 'Standardization & Compliance', 
          content: 'All products meet EU certification standards with complete traceability. Every unit is verified through our Protocol 360 system for guaranteed quality.',
        },
        { 
          title: 'Buyer Benefits & Advantages', 
          content: 'Enjoy competitive pricing, guaranteed freshness, complete transparency, and direct access to producers worldwide. Build trust with your customers through verified quality.',
        },
        { 
          title: 'Terms & Conditions', 
          content: 'Understand our purchase terms, delivery conditions, quality guarantees, and return policies. We ensure fair and transparent transactions.',
        },
        { 
          title: 'How to Place Orders', 
          content: 'Step-by-step guide on browsing products, placing orders, tracking deliveries, and managing your account on the Bio Vera platform.',
        },
      ],
      growers: [
        { title: 'How to Create a Batch', content: 'Step-by-step guide on creating and managing batches in the Bio Vera system.' },
        { title: 'Digital Scheduling', content: 'Learn how to announce harvests 24 hours in advance and report start/stop times.' },
        { title: 'Quality Standards', content: 'Understanding Bio Vera quality requirements and visual standards.' },
        { title: 'Payment Process', content: 'How payments are processed and when you receive funds.' },
      ],
      drivers: [
        { title: 'Mission Management', content: 'How to accept, start, and complete missions in the app.' },
        { title: 'Temperature Monitoring', content: 'Using the temperature sensors and maintaining cold chain compliance.' },
        { title: 'Route Optimization', content: 'Understanding the optimized routes provided by Bio Vera.' },
        { title: 'Digital Seals', content: 'How to use and verify digital seals for cargo security.' },
      ],
      general: [
        { title: 'Getting Started', content: 'Welcome to Bio Vera! Learn the basics of the platform.' },
        { title: 'Account Setup', content: 'How to create and manage your Bio Vera account.' },
        { title: 'Mobile App Guide', content: 'Download and use the Bio Vera mobile application.' },
        { title: 'Contact Support', content: 'Get in touch with our support team for assistance.' },
      ],
    },
};

export default function HelpCenterPage() {
  const [category, setCategory] = useState<Category>('buyers');
  const [searchQuery, setSearchQuery] = useState('');

  const t = content;
  const articles = t.articles[category];

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">{t.title}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Categories</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setCategory('buyers')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === 'buyers'
                      ? 'bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/30'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.categories.buyers}
                </button>
                <button
                  onClick={() => setCategory('growers')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === 'growers'
                      ? 'bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/30'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.categories.growers}
                </button>
                <button
                  onClick={() => setCategory('drivers')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === 'drivers'
                      ? 'bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/30'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.categories.drivers}
                </button>
                <button
                  onClick={() => setCategory('general')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === 'general'
                      ? 'bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/30'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.categories.general}
                </button>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredArticles.map((article: any, index) => {
                const isHighlighted = article.highlight;
                const content = (
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
                          <h3 className={`text-lg font-semibold mb-2 ${isHighlighted ? 'text-[#23471f]' : 'text-gray-900'}`}>
                            {article.title}
                          </h3>
                          <p className={`${isHighlighted ? 'text-gray-700' : 'text-gray-600'}`}>
                            {article.content}
                          </p>
                          {article.link && (
                            <div className="mt-4 flex items-center gap-2 text-[#2D5A27] font-medium text-sm">
                              <span>Learn more</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                );

                return article.link ? (
                  <Link key={article.title} href={article.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={article.title} className="cursor-pointer">
                    {content}
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
