'use client';

import { useTranslation } from 'react-i18next';
import { CircleHelp } from 'lucide-react';

type FaqItem = { title: string; body: string };

function parseFaqItems(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (row): row is FaqItem =>
      row !== null &&
      typeof row === 'object' &&
      typeof (row as FaqItem).title === 'string' &&
      typeof (row as FaqItem).body === 'string',
  );
}

/** Practical troubleshooting — complements screenshot steps (permissions, map, test vs production app). */
export function GrowerAppGuideFaqSection({ pdfExport = false }: { pdfExport?: boolean }) {
  const { t } = useTranslation();
  const items = parseFaqItems(t('grower.appGuide.faqItems', { returnObjects: true }));

  if (items.length === 0) return null;

  return (
    <section
      className={`mt-10 rounded-xl border border-gray-200 bg-white shadow-sm ${pdfExport ? 'break-inside-avoid' : ''}`}
      aria-labelledby="grower-app-guide-faq"
    >
      <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
        <CircleHelp className="h-5 w-5 text-[#2D5A27] shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 id="grower-app-guide-faq" className="text-lg font-semibold text-gray-900">
            {t('grower.appGuide.faqTitle')}
          </h2>
          <p className="mt-1 text-sm text-gray-600 font-light leading-relaxed">{t('grower.appGuide.faqLead')}</p>
        </div>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.title} className="px-5 py-4 sm:px-6">
            <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
