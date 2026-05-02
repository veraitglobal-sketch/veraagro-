'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Download, FileText, Mail, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';
import { useMemo, useState } from 'react';

interface PressRelease {
  id: string;
  date: string;
  title: string;
  summary: string;
  link?: string;
  paragraphs?: string[];
}

interface AssetItem {
  name: string;
  description: string;
  format: string;
  /** Public path under /public, e.g. /press/asset.zip */
  file: string;
}

interface AssetGroup {
  category: string;
  items: AssetItem[];
}

function isPressReleaseArray(x: unknown): x is PressRelease[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === 'object' &&
    x[0] !== null &&
    'id' in x[0] &&
    'title' in x[0]
  );
}

function isAssetItem(x: unknown): x is AssetItem {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.description === 'string' &&
    typeof o.format === 'string' &&
    typeof o.file === 'string' &&
    o.file.length > 0
  );
}

function isAssetGroupArray(x: unknown): x is AssetGroup[] {
  if (!Array.isArray(x) || x.length === 0) return false;
  return x.every((grp) => {
    if (typeof grp !== 'object' || grp === null) return false;
    const g = grp as Record<string, unknown>;
    if (typeof g.category !== 'string' || !Array.isArray(g.items)) return false;
    return g.items.every(isAssetItem);
  });
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((i) => typeof i === 'string');
}

/** Prikaz pola pasusa u listi saopštenja; ostatak samo na stranici pojedinačnog teksta. */
function getReleasePreviewParagraphs(paragraphs: string[]): { preview: string[]; hasMore: boolean } {
  if (paragraphs.length === 0) return { preview: [], hasMore: false };
  if (paragraphs.length === 1) {
    const s = paragraphs[0];
    const maxChars = 560;
    if (s.length <= maxChars) return { preview: [s], hasMore: false };
    const slice = s.slice(0, maxChars);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = (lastSpace > 320 ? slice.slice(0, lastSpace) : slice).trim();
    return { preview: [`${cut}…`], hasMore: true };
  }
  const half = Math.max(1, Math.floor(paragraphs.length / 2));
  const preview = paragraphs.slice(0, half);
  return { preview, hasMore: paragraphs.length > half };
}

function PressReleaseCard({
  release,
  loc,
  expandLabel,
  collapseLabel,
  readFullLabel,
  expandPreviewHint,
}: {
  release: PressRelease;
  loc: (href: string) => string;
  expandLabel: string;
  collapseLabel: string;
  readFullLabel: string;
  expandPreviewHint: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = release.paragraphs ?? [];
  const hasFullBody = paragraphs.length > 0;
  const { preview: previewParagraphs, hasMore } = useMemo(
    () => getReleasePreviewParagraphs(paragraphs),
    [paragraphs],
  );

  const fullPageHref = loc(`/press/releases/${release.id}`);

  return (
    <article className="rounded-lg border border-gray-200 bg-white transition-colors hover:border-gray-300">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-600">
            <Calendar className="w-3 h-3 text-[#2D5A27]" aria-hidden />
            {release.date}
          </span>
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-2 leading-snug">{release.title}</h3>
        <p className="text-sm text-gray-600 font-light leading-relaxed">{release.summary}</p>

        {hasFullBody && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`press-release-body-${release.id}`}
                onClick={() => setExpanded((open) => !open)}
                className="inline-flex flex-1 min-w-[9rem] sm:flex-initial justify-center items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:border-[#2D5A27]/50 hover:bg-[#2D5A27]/[0.04] transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 shrink-0 text-gray-600" aria-hidden />
                    {collapseLabel}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-600" aria-hidden />
                    {expandLabel}
                  </>
                )}
              </button>
              <Link
                href={fullPageHref}
                className="inline-flex flex-1 min-w-[10rem] sm:flex-initial justify-center items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-[#23471f] hover:border-[#2D5A27] hover:bg-[#2D5A27]/[0.04] transition-colors"
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-[#2D5A27]" aria-hidden />
                {readFullLabel}
              </Link>
            </div>

            {expanded && previewParagraphs.length > 0 && (
              <div id={`press-release-body-${release.id}`} role="region" aria-label={release.title}>
                <div className="rounded-md border border-gray-100 bg-gray-50/80 px-3 py-4">
                  <div className="space-y-3 text-sm text-gray-700 font-light leading-relaxed">
                    {previewParagraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                  {hasMore && (
                    <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 font-light leading-relaxed">
                      {expandPreviewHint}
                    </p>
                  )}
                  <div className="mt-4">
                    <Link
                      href={fullPageHref}
                      className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-md bg-[#2D5A27] px-3 py-2 text-xs font-medium text-white hover:bg-[#23471f] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      {readFullLabel}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function PressPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [keyFactsOpen, setKeyFactsOpen] = useState(false);

  const pressReleases = useMemo(() => {
    const raw = t('pressPage.releases', { returnObjects: true });
    return isPressReleaseArray(raw) ? raw : [];
  }, [t, i18n.language]);

  const assetGroups = useMemo(() => {
    const raw = t('pressPage.assetGroups', { returnObjects: true });
    return isAssetGroupArray(raw) ? raw : [];
  }, [t, i18n.language]);

  const keyFacts = useMemo(() => {
    const raw = t('pressPage.keyFacts', { returnObjects: true });
    return isStringArray(raw) ? raw : [];
  }, [t, i18n.language]);

  const aboutParagraphs = useMemo(() => {
    const raw = t('pressPage.aboutParagraphs', { returnObjects: true });
    return isStringArray(raw) ? raw : [];
  }, [t, i18n.language]);

  const usageBullets = useMemo(() => {
    const raw = t('pressPage.usageBullets', { returnObjects: true });
    return isStringArray(raw) ? raw : [];
  }, [t, i18n.language]);

  const ctaContactHref = useMemo(
    () => `${loc('/contact')}?subject=${encodeURIComponent(t('pressPage.ctaQuerySubject'))}`,
    [loc, t, i18n.language],
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
                width={180}
                height={51}
                className="h-9 w-auto sm:h-10"
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
            className="text-center mb-12 md:mb-14"
          >
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-gray-900 mb-3">{t('pressPage.title')}</h1>
            <p className="text-sm md:text-base text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">{t('pressPage.subtitle')}</p>
          </motion.div>

          <section className="mb-12 md:mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-lg border border-gray-200 bg-[#fafbfa]/80 p-5 sm:p-6"
            >
              <h2 className="text-lg font-normal text-gray-900 mb-4">{t('pressPage.mediaContact')}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{t('pressPage.pressInquiries')}</h3>
                    <a
                      href="mailto:press@biovera.app"
                      className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors"
                    >
                      press@biovera.app
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <User className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{t('pressPage.mediaRelations')}</h3>
                    <p className="text-sm text-gray-600 font-light">{t('pressPage.mediaRelationsText')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mb-12 md:mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-lg font-normal text-gray-900 mb-5">{t('pressPage.sectionReleases')}</h2>
              <div className="space-y-5">
                {pressReleases.map((release) => (
                  <PressReleaseCard
                    key={release.id}
                    release={release}
                    loc={loc}
                    expandLabel={t('pressPage.expandRelease')}
                    collapseLabel={t('pressPage.collapseRelease')}
                    readFullLabel={t('pressPage.readFullRelease')}
                    expandPreviewHint={t('pressPage.expandPreviewHint')}
                  />
                ))}
              </div>
            </motion.div>
          </section>

          <section className="mb-12 md:mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-lg font-normal text-gray-900 mb-5">{t('pressPage.sectionAssets')}</h2>
              <div className="space-y-6">
                {assetGroups.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-sm font-medium uppercase tracking-wide text-gray-700 mb-3">{group.category}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {group.items.map((item) => (
                        <div
                          key={`${group.category}-${item.name}`}
                          className="border border-gray-200 rounded-md p-3.5 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">{item.name}</h4>
                              <p className="text-xs text-gray-600 font-light">{item.description}</p>
                            </div>
                            <span className="text-xs text-gray-500 font-light bg-gray-100 px-2 py-1 rounded">
                              {item.format}
                            </span>
                          </div>
                          <a
                            href={item.file}
                            download
                            className="mt-3 inline-flex items-center gap-2 text-xs text-[#2D5A27] hover:text-[#23471f] transition-colors"
                          >
                            <Download className="w-3 h-3" aria-hidden />
                            {t('pressPage.download')}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="mb-12 md:mb-14 scroll-mt-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100"
            >
              <div>
                <button
                  type="button"
                  aria-expanded={aboutOpen}
                  aria-controls="press-about-body"
                  onClick={() => setAboutOpen((o) => !o)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50/90 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">{t('pressPage.sectionCompany')}</span>
                    <span className="mt-0.5 block text-xs text-gray-500 font-light leading-snug">{t('pressPage.aboutTitle')}</span>
                  </span>
                  {aboutOpen ? (
                    <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  ) : (
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  )}
                </button>
                {aboutOpen && (
                  <div id="press-about-body" className="border-t border-gray-100 px-4 pb-4 pt-3">
                    <div className="space-y-3 text-sm text-gray-700 font-light leading-relaxed">
                      {aboutParagraphs.map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  aria-expanded={keyFactsOpen}
                  aria-controls="press-keyfacts-body"
                  onClick={() => setKeyFactsOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50/90 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">{t('pressPage.keyFactsAccordionLabel')}</span>
                  {keyFactsOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  )}
                </button>
                {keyFactsOpen && (
                  <div id="press-keyfacts-body" className="border-t border-gray-100 px-4 pb-4 pt-2">
                    <ul className="space-y-2 text-sm text-gray-700 font-light leading-snug">
                      {keyFacts.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="text-[#2D5A27] shrink-0" aria-hidden>
                            —
                          </span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </section>

          <section className="mb-12 md:mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="rounded-lg border border-gray-200 bg-gray-50/80 p-5 sm:p-6"
            >
              <h2 className="text-lg font-normal text-gray-900 mb-3">{t('pressPage.usageTitle')}</h2>
              <div className="space-y-2.5 text-sm text-gray-600 font-light">
                {usageBullets.map((line) => (
                  <p key={line}>• {line}</p>
                ))}
                <p>
                  {t('pressPage.usageCommercialBefore')}{' '}
                  <a href="mailto:press@biovera.app" className="text-[#2D5A27] hover:underline">
                    press@biovera.app
                  </a>
                  {t('pressPage.usageCommercialAfter')}
                </p>
              </div>
            </motion.div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-lg font-normal text-gray-900 mb-3">{t('pressPage.ctaTitle')}</h2>
            <p className="text-sm text-gray-600 font-light leading-relaxed mb-6 max-w-lg mx-auto">{t('pressPage.ctaBody')}</p>
            <Link
              href={ctaContactHref}
              className="inline-block px-5 py-2.5 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-md"
            >
              {t('pressPage.ctaButton')}
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
