"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  Link2,
  Printer,
  Download,
  Loader2,
  Store,
  LayoutGrid,
  Thermometer,
  QrCode,
  ClipboardCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import { siteLocaleFromLanguageTag } from "@/lib/i18n-routing";
import { bioVeraFreshAPI } from "@/lib/api";
import Footer from "@/components/Footer";

function isFranchiseBlueprintList(x: unknown): x is { title: string; body: string }[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === "object" &&
    x[0] !== null &&
    "title" in x[0] &&
    "body" in x[0] &&
    typeof (x[0] as { title: string }).title === "string" &&
    typeof (x[0] as { body: string }).body === "string"
  );
}

function isFreshResourceItems(
  x: unknown,
): x is { id: string; title: string; description: string; type: string; size: string }[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === "object" &&
    x[0] !== null &&
    "id" in x[0] &&
    "title" in x[0] &&
    "description" in x[0]
  );
}

const FRANCHISE_ICONS = [
  Store,
  LayoutGrid,
  Thermometer,
  QrCode,
  ClipboardCheck,
] as const;

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

function sectionSlug(title: string, index: number): string {
  const ascii = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const base = ascii.length ? ascii.slice(0, 48).replace(/-$/, "") : `section-${index}`;
  return `bf-${base}`;
}

type AnchorRow = { slug: string; title: string; index: number };

const TOC_LINK_CLASS =
  "group flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm font-light text-gray-700 transition-colors hover:border-gray-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/25 focus-visible:ring-offset-2";
const TOC_NUM_CLASS =
  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#2D5A27]/10 text-[11px] font-semibold tabular-nums text-[#2D5A27]";

function TocNav({
  anchors,
  contentsTitle,
  contentsNavAria,
}: {
  anchors: AnchorRow[];
  contentsTitle: string;
  contentsNavAria: string;
}) {
  return (
    <nav aria-label={contentsNavAria}>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">{contentsTitle}</p>
      <ul className="space-y-0.5">
        {anchors.map(({ slug, title, index }) => (
          <li key={slug}>
            <a href={`#${slug}`} className={TOC_LINK_CLASS}>
              <span className={TOC_NUM_CLASS}>{index + 1}</span>
              <span className="min-w-0 leading-snug group-hover:text-gray-900">{title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function BioVeraFreshPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const [copied, setCopied] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const pdfLocale = useMemo((): "en" | "sr" => {
    return siteLocaleFromLanguageTag(i18n.language) === "sr" ? "sr" : "en";
  }, [i18n.language]);

  const downloadProspect = useCallback(async () => {
    setPdfDownloading(true);
    try {
      await bioVeraFreshAPI.downloadProspect(pdfLocale);
    } catch (error) {
      console.error("BioVera Fresh prospect download:", error);
      alert(t("bioVeraFresh.downloadProspectError"));
    } finally {
      setPdfDownloading(false);
    }
  }, [pdfLocale, t]);

  const rawWeb = t("bioVeraFresh.webSections", { returnObjects: true });
  const webSections = Array.isArray(rawWeb) ? rawWeb.filter(isSection) : [];

  const rawPdf = t("bioVeraFresh.pdfSections", { returnObjects: true });
  const pdfSections = Array.isArray(rawPdf) ? rawPdf.filter(isSection) : [];

  const rawFranchise = t("bioVeraFresh.franchiseBlueprintItems", { returnObjects: true });
  const franchiseBlueprintItems = isFranchiseBlueprintList(rawFranchise) ? rawFranchise : [];

  const rawResources = t("bioVeraFresh.resourceItems", { returnObjects: true });
  const resourceItems = isFreshResourceItems(rawResources) ? rawResources : [];

  const sectionAnchors = useMemo(
    () => webSections.map((s, i) => ({ slug: sectionSlug(s.title, i), title: s.title, index: i })),
    [webSections],
  );

  const copyPublicUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    });
  }, []);

  const openPrint = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  const contentsTitle = t("bioVeraFresh.contentsTitle");
  const contentsNavAria = t("bioVeraFresh.contentsNav");
  const pdfDocTitle = t("bioVeraFresh.pdfDocumentTitle");

  const primaryBtnClass =
    "inline-flex min-h-[48px] items-center gap-2 px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none";
  const secondaryBtnClass =
    "inline-flex min-h-[44px] items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-sm font-medium text-gray-800 rounded-lg hover:border-[#2D5A27]/40 transition-colors";

  return (
    <div className="min-h-screen bg-white text-gray-900 biovera-fresh-root print:bg-white">
      <style jsx global>{`
        @media print {
          .biovera-fresh-root .bf-no-print {
            display: none !important;
          }
          .biovera-fresh-root {
            background: white !important;
          }
          .biovera-fresh-doc svg.lucide {
            display: none !important;
          }
          .biovera-fresh-doc {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 11pt;
            line-height: 1.55;
            color: #1a1a1a;
          }
          .biovera-fresh-doc h1,
          .biovera-fresh-doc .bf-heading {
            font-size: 16pt;
            font-weight: 600;
            break-after: avoid;
            page-break-after: avoid;
          }
          .biovera-fresh-doc .bf-heading {
            font-size: 12pt;
            margin-top: 0.85rem !important;
          }
          .biovera-fresh-doc .bf-body p {
            orphans: 3;
            widows: 3;
          }
          .biovera-fresh-doc .bf-cover {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 0.85rem !important;
            padding-bottom: 0.85rem !important;
            border-bottom: 1pt solid #9ca3af !important;
          }
          .biovera-fresh-doc .bf-panel {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .biovera-fresh-doc .bf-pdf-block {
            break-before: page;
            page-break-before: always;
            padding-top: 0.5rem !important;
          }
          @page {
            size: A4;
            margin: 16mm 18mm;
          }
        }
      `}</style>

      <a
        href="#biovera-fresh-document"
        className="bf-no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-[100] focus:rounded-lg focus:bg-[#2D5A27] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t("bioVeraFresh.skipToContent")}
      </a>

      {/* Hero — aligned with growers / for-buyers landing pages */}
      <section className="bf-no-print border-b border-gray-200 pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2D5A27]/90 mb-4">
            {t("bioVeraFresh.coverEyebrow")}
          </p>
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight">
            {t("bioVeraFresh.coverTitle")}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            {t("bioVeraFresh.coverSubtitle")}
          </p>
          <div className="mb-8 p-5 border border-gray-200 rounded-xl bg-gray-50/50 text-left max-w-2xl mx-auto">
            <p className="text-gray-700 font-light leading-relaxed text-sm sm:text-[15px]">{t("bioVeraFresh.introNote")}</p>
          </div>
          <div
            className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3"
            role="region"
            aria-label={`${t("bioVeraFresh.downloadProspectCta")} · ${t("bioVeraFresh.toolbarCopyLink")} · ${t("bioVeraFresh.toolbarPrintPdf")}`}
          >
            <button type="button" disabled={pdfDownloading} onClick={() => void downloadProspect()} className={primaryBtnClass}>
              {pdfDownloading ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4 shrink-0" aria-hidden />
              )}
              {t("bioVeraFresh.downloadProspectCta")}
            </button>
            <button type="button" onClick={copyPublicUrl} className={secondaryBtnClass}>
              <Link2 className="size-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {copied ? t("bioVeraFresh.toolbarCopied") : t("bioVeraFresh.toolbarCopyLink")}
            </button>
            <button type="button" onClick={openPrint} aria-label={t("bioVeraFresh.toolbarPrintAria")} className={secondaryBtnClass}>
              <Printer className="size-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {t("bioVeraFresh.toolbarPrintPdf")}
            </button>
          </div>
          <p className="mt-6 text-xs text-gray-500 font-light max-w-xl mx-auto leading-snug">{t("bioVeraFresh.pdfHint")}</p>
          <p className="mt-4 text-xs text-gray-500 font-light max-w-xl mx-auto leading-relaxed">{t("bioVeraFresh.prospectNote")}</p>
        </div>
      </section>

      <main
        id="biovera-fresh-document"
        className="biovera-fresh-doc scroll-mt-28 print:scroll-mt-0"
        tabIndex={-1}
      >
        <section className="py-12 px-6 lg:px-8 border-t border-gray-200 print:border-0 print:py-0 print:px-4">
          <div className="max-w-6xl mx-auto print:max-w-none">
            <div className="bf-panel border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none">
              {/* Print cover — hidden on screen (hero above duplicates messaging) */}
              <header className="bf-cover hidden print:block px-6 py-10 sm:px-10 sm:py-11 print:border-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2D5A27]/85 print:text-[9pt]">
                  {t("bioVeraFresh.coverEyebrow")}
                </p>
                <h1 className="bf-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-900 print:text-[16pt]">
                  {t("bioVeraFresh.coverTitle")}
                </h1>
                <p className="bf-body mt-5 max-w-2xl text-[15px] leading-relaxed text-gray-600 print:text-[11pt]">
                  {t("bioVeraFresh.coverSubtitle")}
                </p>
              </header>

              <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-0 print:block">
                <aside className="bf-no-print mb-0 hidden border-t border-gray-200 bg-gray-50/40 px-5 py-8 sm:px-8 lg:col-span-4 lg:block lg:border-r lg:border-t-0 lg:px-6 lg:py-10">
                  <TocNav anchors={sectionAnchors} contentsTitle={contentsTitle} contentsNavAria={contentsNavAria} />
                </aside>

                <div className="lg:col-span-8 print:w-full">
                  <nav
                    className="bf-no-print border-t border-gray-200 bg-gray-50/40 px-5 py-4 sm:px-8 lg:hidden"
                    aria-label={contentsNavAria}
                  >
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  {contentsTitle}
                </p>
                <ul className="grid max-h-[min(40vh,18rem)] grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
                  {sectionAnchors.map(({ slug, title, index }) => (
                    <li key={slug}>
                      <a href={`#${slug}`} className={TOC_LINK_CLASS}>
                        <span className={TOC_NUM_CLASS}>{index + 1}</span>
                        <span className="min-w-0 leading-snug">{title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

                  <div className="divide-y divide-gray-200">
                    {webSections.map((s, i) => {
                      const id = sectionAnchors[i]?.slug ?? sectionSlug(s.title, i);
                      return (
                        <section
                          key={id}
                          id={id}
                          className="bf-body scroll-mt-28 px-5 py-8 sm:px-9 sm:py-10 print:scroll-mt-0 print:px-0 print:py-4"
                        >
                          <h2 className="bf-heading text-lg font-light text-gray-900 sm:text-xl print:text-[12pt]">
                            {s.title}
                          </h2>
                          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600 font-light sm:text-[15px] print:text-[11pt]">
                            {s.body}
                          </p>
                        </section>
                      );
                    })}

                    <section className="bf-no-print border-t border-gray-200 bg-white px-5 py-8 sm:px-9 print:hidden">
                      <h2 className="text-lg font-light text-gray-900">{t("bioVeraFresh.ctaTitle")}</h2>
                      <p className="mt-3 text-[15px] leading-relaxed text-gray-600 font-light">{t("bioVeraFresh.ctaBody")}</p>
                      <Link
                        href={loc("/contact")}
                        className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-8 py-4 text-base font-medium text-white hover:bg-[#23471f] transition-colors shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
                      >
                        {t("bioVeraFresh.ctaButton")}
                      </Link>
                    </section>
                  </div>
                </div>
              </div>

              {/* Full brochure text — hidden on screen, included when user prints / saves as PDF */}
              <div className="bf-pdf-block hidden print:block border-t border-gray-200 px-5 py-8 sm:px-10 print:px-0">
                <h2 className="bf-heading text-lg font-semibold text-gray-900 print:text-[13pt]">{pdfDocTitle}</h2>
                <p className="mt-2 text-[12px] leading-snug text-gray-500 print:text-[9pt]">{t("bioVeraFresh.pdfDocumentSubtitle")}</p>
                <div className="mt-8 space-y-8 print:space-y-6">
                  {pdfSections.map((s) => (
                    <section key={s.title} className="bf-body">
                      <h3 className="bf-heading text-base font-semibold text-gray-900 print:text-[11pt]">{s.title}</h3>
                      <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-gray-700 print:text-[10.5pt]">
                        {s.body}
                      </p>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="bf-no-print bg-white">
        <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10/20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-light text-gray-900 mb-3">{t("bioVeraFresh.franchiseBlueprintTitle")}</h2>
              <p className="mx-auto max-w-2xl text-base text-gray-600 font-light leading-relaxed">
                {t("bioVeraFresh.franchiseBlueprintLead")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {franchiseBlueprintItems.map((item, index) => {
                const Icon = FRANCHISE_ICONS[index % FRANCHISE_ICONS.length];
                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27]/40 transition-colors bg-white"
                  >
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 text-[#2D5A27]" aria-hidden>
                        <Icon className="h-6 w-6" strokeWidth={2} />
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <h3 className="text-base font-light text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed font-light">{item.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-light text-gray-900 mb-3">{t("bioVeraFresh.resourcesTitle")}</h2>
              <p className="mx-auto max-w-2xl text-base text-gray-600 font-light leading-relaxed">
                {t("bioVeraFresh.resourcesLead")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resourceItems.map((resource) => (
                <div
                  key={resource.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-[#2D5A27]/40 transition-colors bg-white"
                >
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 text-[#2D5A27]" aria-hidden>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="mb-2 text-base font-light text-gray-900">{resource.title}</h3>
                      <p className="mb-4 text-sm font-light leading-relaxed text-gray-600">{resource.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded">{resource.type}</span>
                          <span>{resource.size}</span>
                        </div>
                        {resource.id === "freshProspect" ? (
                          <button
                            type="button"
                            className="text-sm text-[#2D5A27] hover:text-[#23471f] font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={pdfDownloading}
                            onClick={() => void downloadProspect()}
                          >
                            {pdfDownloading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                {t("bioVeraFresh.resourceDownloading")}
                              </>
                            ) : (
                              <>
                                {t("bioVeraFresh.resourceDownload")}
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-sm font-medium text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="bf-no-print">
        <Footer />
      </div>
    </div>
  );
}
