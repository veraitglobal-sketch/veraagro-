"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Link2, Printer, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import Footer from "@/components/Footer";

const ACCENT = "#2D5A27";
const FOUNDER_ANCHOR = "po-founder";

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

  const founderBulletsRaw = t("projectOverview.founderBullets", { returnObjects: true });
  const founderBullets = isStringList(founderBulletsRaw) ? founderBulletsRaw : [];

  const founderSrc = useMemo(
    () => process.env.NEXT_PUBLIC_PROJECT_OVERVIEW_FOUNDER_SRC?.trim() || "",
    [],
  );

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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fafcfa_0%,#f4f7f5_52%,#fafcfa_100%)] text-gray-900 project-overview-root print:bg-white">
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
            break-inside: avoid;
            page-break-inside: avoid;
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
        className="po-no-print focus:bg-[#2D5A27] focus:text-white sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        {t("projectOverview.skipToContent")}
      </a>

      <header className="po-no-print fixed top-0 z-50 w-full border-b border-gray-200/90 bg-[#fafcfa]/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5 sm:h-[3.65rem] sm:px-8">
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
          <nav className="flex items-center gap-4 text-[13px] font-medium text-gray-600 sm:gap-7">
            <Link
              href={loc("/investor-deck")}
              className="hidden hover:text-[#2D5A27] lg:inline-flex"
            >
              {t("footer.investorDeck")}
            </Link>
            <Link href={loc("/")} className="hidden hover:text-[#2D5A27] transition-colors sm:inline">
              {t("nav.home")}
            </Link>
            <Link href={loc("/contact")} className="font-semibold text-[#2D5A27] hover:text-[#23471f]">
              {t("nav.contact")}
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="po-no-print sticky top-14 z-40 border-b border-gray-200/90 bg-[#fafcfa]/96 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] backdrop-blur sm:top-[3.65rem]"
        role="region"
        aria-label={`${t("projectOverview.toolbarCopyLink")} · ${t("projectOverview.toolbarPrintPdf")}`}
      >
        <div className="h-[3px] w-full shrink-0 bg-[#2D5A27]" aria-hidden />
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:py-3.5">
          <p className="text-[13px] leading-snug text-gray-600 sm:max-w-[52%]">{t("projectOverview.introNote")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyPublicUrl}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 shadow-sm hover:border-[#2D5A27]/45 hover:bg-white"
            >
              <Link2 className="size-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {copied ? t("projectOverview.toolbarCopied") : t("projectOverview.toolbarCopyLink")}
            </button>
            <button
              type="button"
              onClick={openPrint}
              aria-label={t("projectOverview.toolbarPrintAria")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#2D5A27] px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-[#2D5A27]/22 hover:bg-[#23471f]"
            >
              <Printer className="size-4 shrink-0" aria-hidden />
              {t("projectOverview.toolbarPrintPdf")}
            </button>
          </div>
        </div>
        <p className="mx-auto max-w-4xl px-5 pb-2.5 text-[11px] leading-snug text-gray-500 sm:px-8">
          {t("projectOverview.pdfLimitHint")}
        </p>
      </div>

      <main
        id="project-overview-document"
        className="project-overview-doc mx-auto max-w-3xl scroll-mt-24 px-5 pb-20 pt-[calc(8.25rem)] sm:scroll-mt-28 sm:pt-[9rem] print:max-w-none print:scroll-mt-0 print:px-8 print:pb-8 print:pt-6"
        tabIndex={-1}
      >
        <div className="relative border-b border-[#2D5A27]/20 pb-8 sm:pb-9 print:border-gray-200 print:pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            {t("projectOverview.coverEyebrow")}
          </p>
          <h1 className="po-heading mt-2 text-[1.65rem] font-semibold tracking-tight text-gray-900 sm:text-[2.05rem] print:text-[15pt]">
            {t("projectOverview.coverTitle")}
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15px] leading-[1.65] text-gray-600">{t("projectOverview.coverSubtitle")}</p>
        </div>

        <nav
          className="po-no-print mt-8 rounded-xl border border-gray-200/90 bg-white/90 p-4 shadow-sm ring-1 ring-gray-900/[0.04] backdrop-blur sm:p-5"
          aria-label={t("projectOverview.contentsNav")}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">{t("projectOverview.contentsTitle")}</p>
            <ChevronDown className="size-4 text-gray-300 sm:hidden" aria-hidden />
          </div>
          <ul className="flex snap-x snap-mandatory flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
            {sectionAnchors.map(({ slug, title, index }) => (
              <li key={slug} className="snap-start shrink-0">
                <a
                  href={`#${slug}`}
                  className="inline-flex max-w-[14rem] items-center gap-2 rounded-full border border-gray-200 bg-gray-50/90 px-3 py-2 text-[12px] font-medium text-gray-700 shadow-sm transition-colors hover:border-[#2D5A27]/40 hover:bg-[#f6faf6] hover:text-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/35"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#2D5A27]/09 text-[11px] tabular-nums font-bold text-[#2D5A27]">
                    {index + 1}
                  </span>
                  <span className="line-clamp-2 leading-snug">{title}</span>
                </a>
              </li>
            ))}
            <li className="snap-start shrink-0">
              <a
                href={`#${FOUNDER_ANCHOR}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#2D5A27]/35 bg-[#2D5A27]/06 px-3 py-2 text-[12px] font-semibold text-[#2D5A27] shadow-sm transition-colors hover:bg-[#2D5A27]/11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/35"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#2D5A27]">
                  <Sparkles className="size-4 text-white" aria-hidden />
                </span>
                {t("projectOverview.founderTitle")}
              </a>
            </li>
          </ul>
        </nav>

        <div className="po-stack mt-8 space-y-5 sm:mt-10 sm:space-y-6 print:mt-5 print:space-y-3.5">
          {sections.map((s, i) => {
            const id = sectionAnchors[i]?.slug ?? sectionSlug(s.title, i);
            return (
              <section
                key={id}
                id={id}
                className="po-section-inner scroll-mt-28 rounded-2xl border border-gray-200/95 bg-white p-1 shadow-sm ring-1 ring-black/[0.03] print:scroll-mt-0 print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none print:ring-0"
              >
                <div className="rounded-[calc(1rem-2px)] border-l-[4px] border-[#2D5A27] px-4 py-4 sm:px-5 sm:py-[1.125rem] print:border-l-2 print:px-0 print:py-2">
                  <h2 id={`${id}-heading`} className="po-heading mb-2 flex flex-wrap items-baseline gap-x-2 text-[1.0725rem] font-semibold tracking-tight text-gray-900">
                    <span className="text-[12px] font-bold tabular-nums text-[#2D5A27]/85">{String(i + 1).padStart(2, "0")}</span>
                    <span>{s.title}</span>
                  </h2>
                  <div className="text-[14px] leading-[1.65] text-gray-600 print:text-[10pt]" aria-labelledby={`${id}-heading`}>
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
                </div>
              </section>
            );
          })}

          <section
            id={FOUNDER_ANCHOR}
            className="po-founder po-section-inner scroll-mt-28 rounded-2xl border border-[#2D5A27]/25 bg-[linear-gradient(145deg,#fff_0%,#f8fbf9_46%,#fff_100%)] p-1 shadow-md shadow-[#2D5A27]/06 ring-1 ring-[#2D5A27]/08 print:scroll-mt-0 print:rounded-none print:border-gray-300 print:bg-transparent print:p-0 print:shadow-none print:ring-0"
          >
            <div className="rounded-[calc(1rem-2px)] px-4 py-4 sm:px-5 sm:py-5 print:border-t print:border-gray-200 print:px-0 print:pb-4 print:pt-4">
              <h2
                id="po-founder-heading"
                className="po-heading mb-4 flex flex-wrap items-center gap-2 text-[1.0725rem] font-semibold tracking-tight text-gray-900"
              >
                <Sparkles className="size-4 shrink-0 text-[#2D5A27]" aria-hidden />
                <span>{t("projectOverview.founderTitle")}</span>
              </h2>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start print:flex-row">
                <div className="relative mx-auto shrink-0 sm:mx-0 print:mx-0">
                  <div
                    className={`relative aspect-[4/5] h-48 w-40 overflow-hidden rounded-2xl shadow-md print:h-40 print:w-32 ${
                      founderSrc
                        ? "border-2 border-white ring-2 ring-[#2D5A27]/25"
                        : "border-2 border-dashed border-gray-300/95 bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,#f4f7f5_6px,#f4f7f5_12px)]"
                    }`}
                    aria-label={t("projectOverview.founderPhotoPlaceholder")}
                  >
                    {founderSrc ? (
                      <Image
                        src={founderSrc}
                        alt={t("projectOverview.founderPhotoPlaceholder")}
                        fill
                        className="object-cover"
                        sizes="160px"
                        priority={false}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          {t("projectOverview.founderPhotoPlaceholder")}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="po-no-print mt-2 max-w-[10rem] text-[10px] leading-snug text-gray-500">
                    {t("projectOverview.founderPhotoHint")}
                  </p>
                </div>
                <ul
                  className="min-w-0 flex-1 space-y-2.5 text-[14px] leading-relaxed text-gray-600 print:text-[10pt]"
                  aria-labelledby="po-founder-heading"
                >
                  {founderBullets.map((line) => (
                    <li key={line} className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:size-1.5 before:rounded-full before:bg-[#2D5A27]/55">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="po-no-print mt-12 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{t("projectOverview.seeAlsoEyebrow")}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{t("projectOverview.seeAlsoBody")}</p>
          <Link
            href={loc("/investor-deck")}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#2D5A27] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/35 focus-visible:ring-offset-2"
          >
            {t("projectOverview.seeAlsoLink")}
          </Link>
        </div>

        <div className="mt-10 hidden border-t border-gray-200 pt-5 text-[11px] leading-relaxed text-gray-500 print:block">
          <p className="font-semibold text-gray-700">{t("projectOverview.seeAlsoEyebrow")}</p>
          <p className="mt-2">{t("projectOverview.seeAlsoBody")}</p>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
