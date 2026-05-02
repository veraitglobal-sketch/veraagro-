"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Link2, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import Footer from "@/components/Footer";

const DEFAULT_FOUNDER_BANNER = "/project-overview-founder.jpg";
const FOUNDER_ANCHOR = "po-founder";
const STICKY_SIDEBAR_TOP = "top-[8.85rem]";

function sectionSlug(title: string, index: number): string {
  const ascii = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const base = ascii.length ? ascii.slice(0, 48).replace(/-$/, "") : `section-${index}`;
  return `po-${base}`;
}

function isSection(x: unknown): x is { title: string; body: string } {
  return (
    typeof x === "object" &&
    x !== null &&
    "title" in x &&
    "body" in x &&
    typeof (x as { title: string }).title === "string" &&
    typeof (x as { body: string }).body === "string"
  );
}

function isStringList(x: unknown): x is string[] {
  return Array.isArray(x) && x.length > 0 && x.every((i) => typeof i === "string");
}

type AnchorRow = { slug: string; title: string; index: number };

function TocNav({
  anchors,
  founderLabel,
  sectionsLength,
  contentsTitle,
  contentsNavAria,
  tocLinkClass,
  tocNumClass,
}: {
  anchors: AnchorRow[];
  founderLabel: string;
  sectionsLength: number;
  contentsTitle: string;
  contentsNavAria: string;
  tocLinkClass: string;
  tocNumClass: string;
}) {
  return (
    <nav aria-label={contentsNavAria}>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">{contentsTitle}</p>
      <ul className="space-y-0.5">
        {anchors.map(({ slug, title, index }) => (
          <li key={slug}>
            <a href={`#${slug}`} className={tocLinkClass}>
              <span className={tocNumClass}>{index + 1}</span>
              <span className="min-w-0 leading-snug group-hover:text-gray-900">{title}</span>
            </a>
          </li>
        ))}
        <li>
          <a href={`#${FOUNDER_ANCHOR}`} className={tocLinkClass}>
            <span className={tocNumClass}>{sectionsLength + 1}</span>
            <span className="min-w-0 font-semibold leading-snug text-[#2D5A27] group-hover:text-[#23471f]">
              {founderLabel}
            </span>
          </a>
        </li>
      </ul>
    </nav>
  );
}

export default function ProjectOverviewPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const [copied, setCopied] = useState(false);

  const raw = t("projectOverview.sections", { returnObjects: true });
  const sections = Array.isArray(raw) ? raw.filter(isSection) : [];

  const sectionAnchors = useMemo(
    () => sections.map((s, i) => ({ slug: sectionSlug(s.title, i), title: s.title, index: i })),
    [sections],
  );

  const founderParagraphsRaw = t("projectOverview.founderParagraphs", { returnObjects: true });
  const founderParagraphs = isStringList(founderParagraphsRaw) ? founderParagraphsRaw : [];

  const founderImageSrc = useMemo(() => {
    const fromEnv = process.env.NEXT_PUBLIC_PROJECT_OVERVIEW_FOUNDER_SRC?.trim();
    return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_FOUNDER_BANNER;
  }, []);

  /** Paths under `/public` are authored assets; `unoptimized` skips Next’s second encode (JPEG/WebP), closer to brochure sites using `<img>`. */
  const founderBannerUnoptimized = founderImageSrc.startsWith("/");

  const copyPublicUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const openPrint = useCallback(() => {
    window.print();
  }, []);

  const tocLinkClass =
    "group flex items-start gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left text-sm text-gray-700 transition-colors hover:border-gray-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/25 focus-visible:ring-offset-2";

  const tocLinkClassCompact =
    "group flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 text-left text-sm text-gray-800 shadow-sm shadow-gray-950/[0.02] transition-colors hover:border-[#2D5A27]/20 hover:bg-[#fafcfa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/25 focus-visible:ring-offset-2";

  const tocNumClass =
    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#2D5A27]/[0.08] text-[11px] font-bold tabular-nums text-[#2D5A27]";

  const contentsTitle = t("projectOverview.contentsTitle");
  const contentsNavAria = t("projectOverview.contentsNav");
  const founderTitle = t("projectOverview.founderTitle");

  return (
    <div className="min-h-screen bg-[#f3f6f3] text-gray-900 project-overview-root print:bg-white">
      <style jsx global>{`
        @media print {
          .project-overview-root .po-no-print {
            display: none !important;
          }
          .project-overview-root {
            background: white !important;
          }
          .project-overview-doc .po-section-inner {
            break-inside: auto;
            page-break-inside: auto;
          }
          .project-overview-doc .po-founder {
            break-inside: auto;
            page-break-inside: auto;
          }
          .project-overview-doc .po-founder-photo-wrap {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .project-overview-doc svg.lucide {
            display: none !important;
          }
          .project-overview-doc {
            font-family: Georgia, "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1a1a1a;
            hyphens: auto;
            -webkit-hyphens: auto;
          }
          .project-overview-doc h1,
          .project-overview-doc .po-heading,
          .project-overview-doc .po-print-sans {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .project-overview-doc h1 {
            font-size: 16pt;
            font-weight: 600;
            letter-spacing: -0.01em;
          }
          .project-overview-doc .po-heading {
            font-size: 11pt;
            font-weight: 600;
            break-after: avoid;
            page-break-after: avoid;
          }
          .project-overview-doc .po-body-text p {
            orphans: 3;
            widows: 3;
          }
          .project-overview-doc .po-cover-print {
            padding-bottom: 1rem;
            margin-bottom: 0.75rem;
            border-bottom: 1pt solid #9ca3af;
          }
          .project-overview-doc .po-doc-panel {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .project-overview-doc .po-print-reference {
            margin-top: 1.25rem;
            padding-top: 0.75rem;
            border-top: 0.5pt solid #d1d5db;
            font-size: 9.5pt;
            line-height: 1.45;
            color: #374151;
          }
          @page {
            size: A4;
            margin: 16mm 18mm;
          }
        }
      `}</style>

      <a
        href="#project-overview-document"
        className="po-no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#2D5A27] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:ring-offset-2"
      >
        {t("projectOverview.skipToContent")}
      </a>

      <header className="po-no-print fixed top-0 z-50 w-full border-b border-gray-200/90 bg-[#fafcfa]/92 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-6 sm:h-[3.65rem] sm:px-8 lg:px-10">
          <Link
            href={loc("/")}
            className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/30 focus-visible:ring-offset-2"
          >
            <Image
              src="/logo1.png"
              alt={t("footer.logoAlt")}
              width={64}
              height={24}
              className="h-6 w-auto"
              priority
            />
            <span className="hidden border-l border-gray-200 pl-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 sm:inline">
              {t("footer.projectOverview")}
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-[13px] font-medium text-gray-600 sm:gap-7">
            <Link href={loc("/")} className="hidden hover:text-[#2D5A27] transition-colors sm:inline">
              {t("nav.home")}
            </Link>
            <Link href={loc("/about")} className="hidden hover:text-[#2D5A27] transition-colors md:inline">
              {t("footer.about")}
            </Link>
            <Link href={loc("/investor-deck")} className="hidden hover:text-[#2D5A27] lg:inline">
              {t("footer.investorDeck")}
            </Link>
            <Link
              href={loc("/contact")}
              className="font-semibold text-[#2D5A27] transition-colors hover:text-[#23471f]"
            >
              {t("nav.contact")}
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="po-no-print sticky top-14 z-40 border-b border-gray-200/90 bg-[#fafcfa]/96 backdrop-blur print:hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] sm:top-[3.65rem]"
        role="region"
        aria-label={`${t("projectOverview.toolbarCopyLink")} · ${t("projectOverview.toolbarPrintPdf")}`}
      >
        <div className="h-[3px] w-full shrink-0 bg-[#2D5A27]" aria-hidden />
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3.5 sm:px-8 lg:px-10">
          <p className="text-[13px] leading-snug text-gray-600 sm:max-w-[52%]">{t("projectOverview.introNote")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyPublicUrl}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 hover:border-[#2D5A27]/50"
            >
              <Link2 className="size-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {copied ? t("projectOverview.toolbarCopied") : t("projectOverview.toolbarCopyLink")}
            </button>
            <button
              type="button"
              onClick={openPrint}
              aria-label={t("projectOverview.toolbarPrintAria")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#2D5A27] px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-[#2D5A27]/25 hover:bg-[#23471f]"
            >
              <Printer className="size-4 shrink-0" aria-hidden />
              {t("projectOverview.toolbarPrintPdf")}
            </button>
          </div>
        </div>
        <p className="mx-auto max-w-[1240px] px-6 pb-2.5 text-[11px] leading-snug text-gray-500 sm:px-8 lg:hidden lg:px-10">
          {t("projectOverview.pdfLimitHint")}
        </p>
      </div>

      <main
        id="project-overview-document"
        className="project-overview-doc mx-auto max-w-[1240px] px-5 pb-20 pt-[calc(8.25rem)] scroll-mt-24 sm:px-6 sm:pt-[8.85rem] sm:scroll-mt-28 lg:px-8 lg:pb-28 print:mx-0 print:max-w-none print:scroll-mt-0 print:px-4 print:pb-8 print:pt-4"
        tabIndex={-1}
      >
        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-12">
          <aside className="po-no-print mb-10 hidden lg:col-span-4 lg:mb-0 lg:block xl:col-span-3">
            <div
              className={`sticky ${STICKY_SIDEBAR_TOP} space-y-5 rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.25)] backdrop-blur-sm`}
            >
              <TocNav
                anchors={sectionAnchors}
                founderLabel={founderTitle}
                sectionsLength={sections.length}
                contentsTitle={contentsTitle}
                contentsNavAria={contentsNavAria}
                tocLinkClass={tocLinkClass}
                tocNumClass={tocNumClass}
              />
              <p className="border-t border-gray-100 pt-4 text-[11px] leading-relaxed text-gray-500">
                {t("projectOverview.pdfLimitHint")}
              </p>
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9">
            <div className="po-doc-panel overflow-hidden rounded-none border border-gray-200/90 bg-white shadow-[0_20px_50px_-38px_rgba(0,0,0,0.35)] sm:rounded-2xl print:shadow-none">
              <header className="po-cover-print border-b-[10px] border-b-[#2D5A27] bg-gradient-to-b from-[#fafcfa] to-white px-6 py-10 sm:px-10 sm:py-12 print:border-b-0 print:bg-white print:px-0 print:py-0">
                <div className="mx-auto max-w-[720px] print:max-w-none">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2D5A27]/90 sm:text-xs print:text-[9pt] print:tracking-[0.12em] print:text-gray-600">
                    {t("projectOverview.coverEyebrow")}
                  </p>
                  <h1 className="po-heading po-print-sans mt-3 text-[1.85rem] font-semibold leading-[1.1] tracking-tight text-gray-900 sm:text-[2.2rem] lg:text-[clamp(2rem,2.8vw,2.55rem)] print:mt-2 print:text-gray-900">
                    {t("projectOverview.coverTitle")}
                  </h1>
                  <p
                    className="po-print-sans mt-5 max-w-2xl border-l-4 border-[#2D5A27] py-1 pl-5 text-[0.9625rem] leading-[1.62] text-gray-600 sm:text-[1.05rem] print:mt-4 print:max-w-none print:border-gray-400 print:pl-4 print:text-gray-700"
                  >
                    {t("projectOverview.coverSubtitle")}
                  </p>
                </div>
              </header>

              <nav
                className="po-no-print border-b border-gray-100 bg-[#fafcfa]/80 px-5 py-4 sm:px-8 lg:hidden"
                aria-label={contentsNavAria}
              >
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  {contentsTitle}
                </p>
                <ul className="grid max-h-[min(44vh,22rem)] grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {sectionAnchors.map(({ slug, title, index }) => (
                    <li key={slug}>
                      <a href={`#${slug}`} className={tocLinkClassCompact}>
                        <span className={tocNumClass}>{index + 1}</span>
                        <span className="min-w-0 leading-snug">{title}</span>
                      </a>
                    </li>
                  ))}
                  <li className="sm:col-span-2">
                    <a href={`#${FOUNDER_ANCHOR}`} className={tocLinkClassCompact}>
                      <span className={tocNumClass}>{sections.length + 1}</span>
                      <span className="min-w-0 font-semibold leading-snug text-[#2D5A27]">{founderTitle}</span>
                    </a>
                  </li>
                </ul>
              </nav>

              <div className="divide-y divide-gray-100">
                {sections.map((s, i) => {
                  const id = sectionAnchors[i]?.slug ?? sectionSlug(s.title, i);
                  return (
                    <section
                      key={id}
                      id={id}
                      className="po-section-inner scroll-mt-28 px-5 py-8 sm:px-9 sm:py-9 print:scroll-mt-0 print:px-0 print:py-4"
                    >
                      <h2
                        id={`${id}-heading`}
                        className="po-heading mb-3 flex flex-wrap items-baseline gap-x-3 text-lg font-semibold tracking-tight text-gray-900 sm:text-[1.125rem]"
                      >
                        <span className="text-[12px] font-bold tabular-nums text-[#2D5A27] print:text-gray-600">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{s.title}</span>
                      </h2>
                      <div
                        className="po-body-text max-w-[58rem] text-[15px] leading-[1.65] text-gray-600 print:text-[inherit] print:leading-[inherit]"
                        aria-labelledby={`${id}-heading`}
                      >
                        {s.body
                          .split(/\n\n+/)
                          .map((para: string) => para.trim())
                          .filter(Boolean)
                          .map((para: string, pi: number) => (
                            <p key={pi} className={pi ? "mt-3" : ""}>
                              {para}
                            </p>
                          ))}
                      </div>
                    </section>
                  );
                })}

                <section
                  id={FOUNDER_ANCHOR}
                  className="po-founder po-section-inner scroll-mt-28 pb-10 pt-0 print:scroll-mt-0 print:pb-6"
                >
                  <figure className="po-founder-photo-wrap overflow-hidden border-b border-gray-200 bg-gray-100 print:border print:border-gray-400 print:bg-white">
                    <div className="relative aspect-[21/9] w-full sm:aspect-[18/7] lg:aspect-[21/9] print:aspect-[18/7]">
                      <Image
                        src={founderImageSrc}
                        alt={t("projectOverview.founderPhotoAlt")}
                        fill
                        className="object-cover object-[56%_40%]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 92vw, 1100px"
                        quality={92}
                        unoptimized={founderBannerUnoptimized}
                        priority={false}
                      />
                    </div>
                    <figcaption className="po-print-sans border-t border-gray-100 bg-gray-50/80 px-5 py-2.5 text-left text-sm font-medium text-gray-800 sm:px-9 print:border-gray-400 print:bg-white print:text-[10pt] print:text-gray-900">
                      {t("projectOverview.founderPhotoCaption")}
                    </figcaption>
                  </figure>
                  <div className="px-5 pt-6 sm:px-9 sm:pt-8 print:px-0 print:pt-5">
                    <h2
                      id="po-founder-heading"
                      className="po-heading mb-4 flex flex-wrap items-baseline gap-x-3 text-lg font-semibold tracking-tight text-gray-900 sm:text-[1.125rem]"
                    >
                      <span className="text-[12px] font-bold tabular-nums text-[#2D5A27] print:text-gray-600">
                        {String(sections.length + 1).padStart(2, "0")}
                      </span>
                      <span>{founderTitle}</span>
                    </h2>

                    <p className="po-no-print mb-6 text-xs leading-relaxed text-gray-500">{t("projectOverview.founderPhotoHint")}</p>

                    <div
                      className="po-body-text max-w-[58rem] space-y-3 border-t border-gray-100 pt-6 text-[15px] leading-[1.65] text-gray-600 print:space-y-2.5 print:border-gray-200 print:pt-4 print:text-[inherit] print:leading-[inherit]"
                      aria-labelledby="po-founder-heading"
                    >
                      {founderParagraphs.map((paragraph, pi) => (
                        <p key={pi}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <section className="po-no-print mt-8 rounded-2xl border border-[#e2ebe2] bg-[#F4F8F4] p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2D5A27]/70">
                {t("projectOverview.seeAlsoEyebrow")}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-700 sm:text-base">
                {t("projectOverview.seeAlsoBody")}
              </p>
              <Link
                href={loc("/investor-deck")}
                className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
              >
                {t("projectOverview.seeAlsoLink")}
              </Link>
            </section>

            <div className="po-print-reference po-print-sans mt-6 hidden print:block">
              <p className="font-semibold text-gray-800">{t("projectOverview.seeAlsoPrintEyebrow")}</p>
              <p className="mt-1.5">{t("projectOverview.seeAlsoPrintBody")}</p>
            </div>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
