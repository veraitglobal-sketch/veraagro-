'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

interface PressRelease {
  id: string;
  date: string;
  title: string;
  summary: string;
  paragraphs?: string[];
}

function findRelease(raw: unknown, releaseId: string): PressRelease | null {
  if (!Array.isArray(raw)) return null;
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, unknown>;
    if (o.id !== releaseId || typeof o.title !== 'string' || typeof o.date !== 'string') continue;
    const paragraphs = o.paragraphs;
    if (!Array.isArray(paragraphs) || paragraphs.length === 0 || !paragraphs.every((p) => typeof p === 'string')) continue;
    return {
      id: String(o.id),
      date: o.date,
      title: o.title,
      summary: typeof o.summary === 'string' ? o.summary : '',
      paragraphs,
    };
  }
  return null;
}

export default function PressReleaseFullPage() {
  const params = useParams<{ releaseId: string }>();
  const releaseId = params.releaseId;
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();

  const release = useMemo(() => {
    const raw = t('pressPage.releases', { returnObjects: true });
    return releaseId ? findRelease(raw, releaseId) : null;
  }, [t, releaseId, i18n.language]);

  if (!releaseId || !release) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-12 pb-24 px-6 lg:px-8">
        <Link
          href={loc('/press')}
          className="max-w-3xl mx-auto mb-8 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#2D5A27] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {t('pressPage.releaseBackToKit')}
        </Link>
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[#2D5A27] mb-2">{t('pressPage.releaseEyebrow')}</p>
          <div className="flex items-center gap-2 mb-6 text-xs text-gray-500 font-light">{release.date}</div>
          <h1 className="text-2xl md:text-3xl font-light text-gray-900 mb-8 leading-snug">{release.title}</h1>

          <div className="font-light text-gray-700 leading-relaxed space-y-4 text-sm md:text-[15px]">
            {release.paragraphs!.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <p className="mt-12 text-sm text-gray-500 font-light border-t border-gray-200 pt-8">
            {t('pressPage.mediaRelationsText')}
          </p>
          <a
            href="mailto:press@biovera.app"
            className="inline-flex mt-3 text-sm text-[#2D5A27] hover:text-[#23471f] transition-colors"
          >
            press@biovera.app
          </a>
        </motion.article>
      </main>

      <Footer />
    </div>
  );
}
