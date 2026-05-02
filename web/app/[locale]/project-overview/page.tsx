"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Link2, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import Footer from "@/components/Footer";

const ACCENT = "#2D5A27";
const FOUNDER_ANCHOR = "po-founder";
const DEFAULT_FOUNDER_BANNER = "/project-overview-founder.png";

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
    "group flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm text-gray-700 transition-colors hover:border-gray-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/25 focus-visible:ring-offset-2";
  const tocNumClass =
    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#2D5A27]/[0.08] text-[11px] font-bold tabular-nums text-[#2D5A27]";

  return (
    <div className="min-h-screen bg-[#fafcfa] text-gray-900 project-overview-root print:bg-white">
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
            font-size: 10pt;
            line-height: 1.43;
            color: #111827;
          }
          .project-overview-doc h1 {
            font-size: 15pt;
          }
          .project-overview-doc .po-heading {
            font-size: 10.5pt;
          }
          @page {
            size: A4;
            margin: 12mm;
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
        <p className="mx-auto max-w-[1240px] px-6 pb-2.5 text-[11px] leading-snug text-gray-500 sm:px-8 lg:px-10">
          {t("projectOverview.pdfLimitHint")}
        </p>
      </div>

      <main
        id="project-overview-document"
        className="project-overview-doc mx-auto max-w-[1240px] space-y-8 px-5 pb-20 pt-[calc(8.25rem)] scroll-mt-24 sm:space-y-9 sm:px-6 sm:pt-[8.85rem] sm:scroll-mt-28 lg:space-y-10 lg:px-8 lg:pb-28 print:mx-0 print:max-w-none print:space-y-0 print:scroll-mt-0 print:px-4 print:pb-8 print:pt-4"
        tabIndex={-1}
      >
        {/* Cover — aligned with investor-deck cover rhythm */}
        <section className="rounded-none border-b-[10px] border-b-[#2D5A27] bg-white py-10 shadow-[0_1px_0_rgba(0,0,0,0.06)] sm:rounded-2xl sm:border sm:border-gray-200 sm:border-b-[10px] sm:border-b-[#2D5A27] print:rounded-none print:border-0 print:border-b-2 print:border-b-gray-300 print:shadow-none">
          <div className="mx-auto max-w-[800px] px-1 sm:px-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2D5A27]/90 sm:text-xs"
            >
              {t("projectOverview.coverEyebrow")}
            </p>
            <h1 className="po-heading mt-3 text-[1.85rem] font-semibold leading-[1.1] tracking-tight text-gray-900 sm:text-[2.25rem] lg:text-[clamp(2rem,3.5vw,2.65rem)] print:text-[15pt]">
              {t("projectOverview.coverTitle")}
            </h1>
            <p
              className="mt-5 max-w-2xl border-l-4 py-1 pl-5 text-base leading-[1.6] text-gray-600 sm:text-[1.0625rem]"
              style={{ borderColor: ACCENT }}
            >
              {t("projectOverview.coverSubtitle")}
            </p>
          </div>
        </section>

        <nav
          className="po-no-print rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
          aria-label={t("projectOverview.contentsNav")}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            {t("projectOverview.contentsTitle")}
          </p>
          <ul className="mt-4 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {sectionAnchors.map(({ slug, title, index }) => (
              <li key={slug}>
                <a href={`#${slug}`} className={tocLinkClass}>
                  <span className={tocNumClass}>{index + 1}</span>
                  <span className="min-w-0 leading-snug group-hover:text-gray-900">{title}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={`#${FOUNDER_ANCHOR}`} className={tocLinkClass}>
                <span className={tocNumClass}>{sections.length + 1}</span>
                <span className="min-w-0 font-semibold leading-snug text-[#2D5A27] group-hover:text-[#23471f]">
                  {t("projectOverview.founderTitle")}
                </span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="po-stack space-y-7 sm:space-y-8 print:space-y-4">
          {sections.map((s, i) => {
            const id = sectionAnchors[i]?.slug ?? sectionSlug(s.title, i);
            return (
              <section
                key={id}
                id={id}
                className="po-section-inner scroll-mt-28 rounded-none border border-gray-200/70 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6 sm:shadow-sm sm:shadow-gray-950/[0.02] print:scroll-mt-0 print:rounded-none print:border-0 print:border-b print:border-gray-200 print:bg-transparent print:p-0 print:shadow-none"
              >
                <h2
                  id={`${id}-heading`}
                  className="po-heading mb-3 flex flex-wrap items-baseline gap-x-3 text-lg font-semibold tracking-tight text-gray-900 sm:text-[1.125rem]"
                >
                  <span className="text-[12px] font-bold tabular-nums text-[#2D5A27]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{s.title}</span>
                </h2>
                <div
                  className="text-[15px] leading-[1.65] text-gray-600 print:text-[10pt]"
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
            className="po-founder po-section-inner scroll-mt-28 rounded-none border border-gray-200/70 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6 sm:shadow-sm sm:shadow-gray-950/[0.02] print:scroll-mt-0 print:rounded-none print:border-0 print:border-b print:border-gray-200 print:bg-transparent print:p-0 print:shadow-none"
          >
            <h2
              id="po-founder-heading"
              className="po-heading mb-4 flex flex-wrap items-baseline gap-x-3 text-lg font-semibold tracking-tight text-gray-900 sm:text-[1.125rem]"
            >
              <span className="text-[12px] font-bold tabular-nums text-[#2D5A27]">
                {String(sections.length + 1).padStart(2, "0")}
              </span>
              <span>{t("projectOverview.founderTitle")}</span>
            </h2>

            <figure className="po-founder-photo-wrap mb-6">
              <div className="relative aspect-[20/9] max-h-[200px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 min-[480px]:aspect-[22/9] sm:aspect-[18/5] sm:max-h-[260px] print:aspect-[18/5] print:max-h-[200px]">
                <Image
                  src={founderImageSrc}
                  alt={t("projectOverview.founderPhotoAlt")}
                  fill
                  className="object-cover object-[58%_42%] sm:object-[62%_40%]"
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority={false}
                />
              </div>
              <figcaption className="mt-2 text-sm font-medium text-gray-600 print:text-[9pt]">
                {t("projectOverview.founderPhotoCaption")}
              </figcaption>
            </figure>

            <p className="po-no-print mb-6 text-xs leading-relaxed text-gray-500">{t("projectOverview.founderPhotoHint")}</p>

            <div
              className="space-y-3 border-t border-gray-100 pt-6 text-[15px] leading-[1.65] text-gray-600 print:space-y-2.5 print:border-gray-200 print:pt-4 print:text-[10pt]"
              aria-labelledby="po-founder-heading"
            >
              {founderParagraphs.map((paragraph, pi) => (
                <p key={pi}>{paragraph}</p>
              ))}
            </div>
          </section>
        </div>

        <section className="po-no-print rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            {t("projectOverview.seeAlsoEyebrow")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{t("projectOverview.seeAlsoBody")}</p>
          <Link
            href={loc("/investor-deck")}
            className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
          >
            {t("projectOverview.seeAlsoLink")}
          </Link>
        </section>

        <div className="mt-8 hidden border-t border-gray-200 pt-5 text-xs leading-relaxed text-gray-500 print:block sm:text-[11px]">
          <p className="font-semibold text-gray-800">{t("projectOverview.seeAlsoEyebrow")}</p>
          <p className="mt-2">{t("projectOverview.seeAlsoBody")}</p>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
