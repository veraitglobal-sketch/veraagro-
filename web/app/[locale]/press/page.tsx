'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Download, FileText, Mail, Calendar, User, ChevronDown, ChevronUp, Building2, ListChecks } from 'lucide-react';
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
    <article className="rounded-2xl border border-gray-200/90 bg-white shadow-sm hover:shadow-md hover:border-[#2D5A27]/35 transition-all overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#2D5A27]/30 via-[#2D5A27]/15 to-transparent" aria-hidden />
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-[#2D5A27]" aria-hidden />
            {release.date}
          </span>
        </div>
        <h3 className="text-xl sm:text-[1.35rem] font-medium text-gray-900 mb-3 leading-snug">{release.title}</h3>
        <p className="text-[15px] text-gray-600 font-light leading-relaxed border-l-[3px] border-[#2D5A27]/40 pl-4 py-0.5">{release.summary}</p>

        {hasFullBody && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`press-release-body-${release.id}`}
                onClick={() => setExpanded((open) => !open)}
                className="inline-flex flex-1 min-w-[10rem] sm:flex-initial justify-center items-center gap-2 rounded-xl border border-[#2D5A27]/35 bg-[#f7faf6] px-4 py-3 text-sm font-medium text-[#2D5A27] hover:bg-[#eaf0e9] transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 shrink-0" aria-hidden />
                    {collapseLabel}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 shrink-0" aria-hidden />
                    {expandLabel}
                  </>
                )}
              </button>
              <Link
                href={fullPageHref}
                className="inline-flex flex-1 min-w-[11rem] sm:flex-initial justify-center items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:border-[#2D5A27] hover:text-[#23471f] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
              >
                <FileText className="w-4 h-4 shrink-0" aria-hidden />
                {readFullLabel}
              </Link>
            </div>

            {expanded && previewParagraphs.length > 0 && (
              <div id={`press-release-body-${release.id}`} role="region" aria-label={release.title}>
                <div className="rounded-xl border border-[#2D5A27]/12 bg-gradient-to-b from-[#fafcf9] to-white px-4 py-5 sm:px-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2D5A27]/80 mb-3">
                    {expandLabel}
                  </p>
                  <div className="space-y-4 text-sm text-gray-800 font-light leading-relaxed">
                    {previewParagraphs.map((p, idx) => (
                      <p key={idx} className="first:font-normal first:text-gray-900">
                        {p}
                      </p>
                    ))}
                  </div>
                  {hasMore && (
                    <p className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 font-light italic leading-relaxed">
                      {expandPreviewHint}
                    </p>
                  )}
                  <div className="mt-6">
                    <Link
                      href={fullPageHref}
                      className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-[#2D5A27] px-5 py-3 text-sm font-medium text-white hover:bg-[#23471f] transition-colors"
                    >
                      <FileText className="w-4 h-4 shrink-0" aria-hidden />
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
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const pressReleases = useMemo(() => {
    const raw = t('pressPage.releases', { returnObjects: true });
    return isPressReleaseArray(raw) ? raw : [];
  }, [t]);

  const assetGroups = useMemo(() => {
    const raw = t('pressPage.assetGroups', { returnObjects: true });
    return isAssetGroupArray(raw) ? raw : [];
  }, [t]);

  const keyFacts = useMemo(() => {
    const raw = t('pressPage.keyFacts', { returnObjects: true });
    return isStringArray(raw) ? raw : [];
  }, [t]);

  const aboutParagraphs = useMemo(() => {
    const raw = t('pressPage.aboutParagraphs', { returnObjects: true });
    return isStringArray(raw) ? raw : [];
  }, [t]);

  const usageBullets = useMemo(() => {
    const raw = t('pressPage.usageBullets', { returnObjects: true });
    return isStringArray(raw) ? raw : [];
  }, [t]);

  const ctaContactHref = useMemo(
    () => `${loc('/contact')}?subject=${encodeURIComponent(t('pressPage.ctaQuerySubject'))}`,
    [loc, t],
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
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">{t('pressPage.title')}</h1>
            <p className="text-lg text-gray-600 font-light leading-relaxed">{t('pressPage.subtitle')}</p>
          </motion.div>

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg p-8"
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">{t('pressPage.mediaContact')}</h2>
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

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">{t('pressPage.sectionReleases')}</h2>
              <div className="space-y-8">
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

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D5A27]/12 text-[#2D5A27]">
                  <Building2 className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#2D5A27]/90">{t('pressPage.sectionCompany')}</p>
                  <h2 className="text-2xl font-light text-gray-900">{t('pressPage.aboutTitle')}</h2>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/90 bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="border-b border-gray-100 bg-gradient-to-br from-[#f8faf7] via-white to-white px-6 py-8 sm:px-10 sm:py-10">
                  <div className="mx-auto max-w-3xl space-y-5">
                    {aboutParagraphs.map((para, idx) => (
                      <div
                        key={idx}
                        className={`text-[15px] leading-relaxed text-gray-800 font-light ${idx === 0 ? 'text-[16px] sm:text-[17px] text-gray-900 font-normal border-l-[3px] border-[#2D5A27] pl-5 -ml-1' : idx % 2 === 1 ? 'pl-4 border-l border-gray-200/80' : ''}`}
                      >
                        <p>{para}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#fafbfa] px-6 py-8 sm:px-10 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-5">
                    <ListChecks className="h-5 w-5 text-[#2D5A27]" aria-hidden />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">{t('pressPage.keyFactsTitle')}</h3>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {keyFacts.map((line) => (
                      <li
                        key={line}
                        className="flex gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 text-[13px] text-gray-700 font-light leading-snug shadow-sm"
                      >
                        <span className="mt-0.5 h-5 w-1 shrink-0 rounded-full bg-[#2D5A27]/70" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl font-light text-gray-900 mb-6">{t('pressPage.sectionAssets')}</h2>
              <div className="space-y-8">
                {assetGroups.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{group.category}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {group.items.map((item) => (
                        <div
                          key={`${group.category}-${item.name}`}
                          className="border border-gray-200 rounded-lg p-4 hover:border-[#2D5A27] transition-colors"
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

          <section className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-8"
            >
              <h2 className="text-xl font-light text-gray-900 mb-4">{t('pressPage.usageTitle')}</h2>
              <div className="space-y-3 text-sm text-gray-600 font-light">
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
            <h2 className="text-xl font-light text-gray-900 mb-4">{t('pressPage.ctaTitle')}</h2>
            <p className="text-gray-600 font-light leading-relaxed mb-6">{t('pressPage.ctaBody')}</p>
            <Link
              href={ctaContactHref}
              className="inline-block px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
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
