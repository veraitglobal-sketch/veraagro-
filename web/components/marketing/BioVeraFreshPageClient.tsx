"use client";

import { useCallback, useLayoutEffect, useMemo, useState } from "react";
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
import type { SiteLocale } from "@/i18n/config";
import { useLocalizedHref, useLocaleFromPath } from "@/hooks/useLocalizedHref";
import { bioVeraFreshAPI } from "@/lib/api";
import Footer from "@/components/Footer";
import MarketingHero from "@/components/marketing/MarketingHero";
import { marketingSectionTitle } from "@/lib/marketing-classes";

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

interface FreshResourceItem {
  id: string;
  title: string;
  description: string;
  type: string;
  size: string;
  /** Static path under web/public (direct browser download). */
  publicPath?: string;
}

function isFreshResourceItems(x: unknown): x is FreshResourceItem[] {
  if (!Array.isArray(x) || x.length === 0) return false;
  return x.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const o = item as Record<string, unknown>;
    if (
      typeof o.id !== "string" ||
      typeof o.title !== "string" ||
      typeof o.description !== "string" ||
      typeof o.type !== "string" ||
      typeof o.size !== "string"
    )
      return false;
    if (o.publicPath !== undefined && typeof o.publicPath !== "string") return false;
    return true;
  });
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

export default function BioVeraFreshPageClient({
  initialLocale,
}: Readonly<{ initialLocale?: SiteLocale }> = {}) {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const localeFromPath = useLocaleFromPath();
  const activeLocale = initialLocale ?? localeFromPath;
  const [copied, setCopied] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useLayoutEffect(() => {
    if ((i18n.resolvedLanguage || i18n.language) !== activeLocale) {
      void i18n.changeLanguage(activeLocale);
    }
  }, [activeLocale, i18n]);

  const localeSynced = (i18n.resolvedLanguage || i18n.language) === activeLocale;

  const downloadProspect = useCallback(async () => {
    setPdfDownloading(true);
    try {
      await bioVeraFreshAPI.downloadProspect();
    } catch (error) {
      console.error("BioVera Fresh prospect download:", error);
      alert(t("bioVeraFresh.downloadProspectError"));
    } finally {
      setPdfDownloading(false);
    }
  }, [t]);

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
  const pdfDocTitle = t("bioVeraFresh.pdfDocumentTitle");
  const coverSubtitle = t("bioVeraFresh.coverSubtitle");
  const toolbarCopyLink = t("bioVeraFresh.toolbarCopyLink");
  const toolbarPrintPdf = t("bioVeraFresh.toolbarPrintPdf");
  const pdfHint = t("bioVeraFresh.pdfHint");
  const prospectNote = t("bioVeraFresh.prospectNote");
  const franchiseBlueprintTitle = t("bioVeraFresh.franchiseBlueprintTitle");
  const resourcesTitle = t("bioVeraFresh.resourcesTitle");
  const showToolbar = Boolean(toolbarCopyLink || toolbarPrintPdf);

  if (!localeSynced) {
    return <div className="min-h-screen bg-white" aria-busy="true" />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 biovera-fresh-root print:bg-white">
      <style jsx global>{`
        /* Print-only regions: avoid Tailwind "hidden" beating "print:block" in Save as PDF */
        .biovera-fresh-root header.bf-cover {
          display: none;
        }
        /* Full programme (14 chapters): PDF / print only — not shown on screen */
        .biovera-fresh-root .bf-pdf-block {
          display: none;
        }
        @media print {
          .biovera-fresh-root header.bf-cover {
            display: block !important;
          }
          .biovera-fresh-root .bf-pdf-block {
            display: block !important;
          }
        }
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

      {/* Hero — same rhythm as growers (`growers/page.tsx`) */}
      <MarketingHero
        eyebrow={t("bioVeraFresh.coverEyebrow")}
        title={t("bioVeraFresh.coverTitle")}
        subtitle={t("bioVeraFresh.heroSubtitle", { defaultValue: "" }) || undefined}
        lead={t("bioVeraFresh.introNote")}
        sectionClassName="bf-no-print pb-16"
      >
          <button
            type="button"
            disabled={pdfDownloading}
            onClick={() => void downloadProspect()}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {pdfDownloading ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4 shrink-0" aria-hidden />
            )}
            {t("bioVeraFresh.downloadProspectCta")}
          </button>
        {showToolbar ? (
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium"
            role="region"
            aria-label={`${toolbarCopyLink || ''} · ${toolbarPrintPdf || ''}`}
          >
            {toolbarCopyLink ? (
            <button type="button" onClick={copyPublicUrl} className="text-[#2D5A27] hover:text-[#23471f] transition-colors inline-flex items-center gap-1.5">
              <Link2 className="size-4 shrink-0 opacity-80" aria-hidden />
              {copied ? t("bioVeraFresh.toolbarCopied") : toolbarCopyLink}
            </button>
            ) : null}
            {toolbarCopyLink && toolbarPrintPdf ? (
            <span className="hidden sm:inline text-gray-300" aria-hidden>
              |
            </span>
            ) : null}
            {toolbarPrintPdf ? (
            <button
              type="button"
              onClick={openPrint}
              aria-label={t("bioVeraFresh.toolbarPrintAria")}
              className="text-[#2D5A27] hover:text-[#23471f] transition-colors inline-flex items-center gap-1.5"
            >
              <Printer className="size-4 shrink-0 opacity-80" aria-hidden />
              {toolbarPrintPdf}
            </button>
            ) : null}
          </div>
        ) : null}
        {pdfHint ? (
          <p className="mt-6 text-xs text-gray-500 font-light max-w-xl mx-auto leading-snug">{pdfHint}</p>
        ) : null}
        {prospectNote ? (
          <p className="mt-3 text-xs text-gray-500 font-light max-w-xl mx-auto leading-relaxed">{prospectNote}</p>
        ) : null}
      </MarketingHero>

      <main
        id="biovera-fresh-document"
        className="biovera-fresh-doc bf-panel border-0 shadow-none bg-transparent rounded-none scroll-mt-28 print:scroll-mt-0 print:bg-white"
        tabIndex={-1}
      >
        {/* Print cover — Save as PDF from browser (no hero image; visuals in downloadable PDF / press kit) */}
        <header className="bf-cover px-6 pt-2 pb-8 sm:px-10 max-w-6xl mx-auto print:max-w-none">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2D5A27]/85 print:text-[9pt]">
            {t("bioVeraFresh.coverEyebrow")}
          </p>
          <h1 className="bf-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-900 print:text-[16pt]">
            {t("bioVeraFresh.coverTitle")}
          </h1>
          <p className="bf-body mt-5 max-w-2xl text-[15px] leading-relaxed text-gray-600 print:text-[11pt]">
            {coverSubtitle || t("bioVeraFresh.introNote")}
          </p>
          <p className="mt-6 text-center text-[10pt] leading-snug text-gray-700">
            <span className="font-semibold text-[#2D5A27]">{t("bioVeraFresh.ctaButton")}</span>
            <span className="text-gray-500"> · {loc("/contact")}</span>
          </p>
        </header>

        {/* Short overview for the web — not included in print/PDF brochure */}
        <section className="bf-no-print py-16 px-6 lg:px-8 border-t border-gray-200">
          <div className="max-w-6xl mx-auto print:max-w-none">
            {contentsTitle ? (
            <div className="text-center mb-12 bf-no-print">
              <h2 className={marketingSectionTitle}>{contentsTitle}</h2>
            </div>
            ) : null}
            <div className="grid md:grid-cols-2 gap-8 print:grid-cols-1 print:gap-6">
              {webSections.map((s, i) => {
                const id = sectionAnchors[i]?.slug ?? sectionSlug(s.title, i);
                return (
                  <div key={id} id={id} className="border-b border-[#2D5A27]/20 pb-8 bf-body scroll-mt-28 print:scroll-mt-0">
                    <h2 className="bf-heading text-lg font-light text-gray-900 mb-3">{s.title}</h2>
                    <p className="text-sm text-gray-600 leading-relaxed font-light whitespace-pre-line">{s.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Partner CTA — growers-style centered block */}
        <section className="bf-no-print py-16 px-6 lg:px-8 border-t border-gray-200">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className={marketingSectionTitle}>{t("bioVeraFresh.ctaTitle")}</h2>
            <p className="text-base text-gray-600 font-light mb-8">{t("bioVeraFresh.ctaBody")}</p>
            <Link
              href={loc("/contact")}
              className="inline-flex items-center justify-center min-h-[48px] px-8 py-4 bg-[#2D5A27] text-white text-base font-medium hover:bg-[#23471f] transition-colors rounded-lg shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
            >
              {t("bioVeraFresh.ctaButton")}
            </Link>
          </div>
        </section>

        {/* Full brochure — print / Save as PDF / server PDF only (hidden on screen) */}
        <div className="bf-pdf-block border-t border-gray-200 px-6 py-8 sm:px-10 max-w-6xl mx-auto print:max-w-none">
          <h2 className="bf-heading text-lg font-semibold text-gray-900 print:text-[13pt]">{pdfDocTitle}</h2>
          <p className="mt-2 text-[12px] leading-snug text-gray-500 print:text-[9pt]">{t("bioVeraFresh.pdfDocumentSubtitle")}</p>
          <div className="mt-8 space-y-8 print:space-y-6">
            {pdfSections.map((s) => (
              <section key={s.title} className="bf-body">
                <h3 className="bf-heading text-base font-semibold text-gray-900 print:text-[11pt]">{s.title}</h3>
                <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-gray-700 print:text-[10.5pt]">{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <div className="bf-no-print bg-white">
        {franchiseBlueprintTitle && franchiseBlueprintItems.length > 0 ? (
        <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-[#2D5A27]/10/20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className={marketingSectionTitle}>{t("bioVeraFresh.franchiseBlueprintTitle")}</h2>
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
        ) : null}

        {resourcesTitle && resourceItems.length > 0 ? (
        <section className="py-20 px-6 lg:px-8 border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className={marketingSectionTitle}>{t("bioVeraFresh.resourcesTitle")}</h2>
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
                        ) : resource.publicPath ? (
                          <a
                            href={resource.publicPath}
                            download={resource.publicPath.split("/").pop() ?? undefined}
                            className="text-sm text-[#2D5A27] hover:text-[#23471f] font-medium transition-colors inline-flex items-center gap-1"
                          >
                            {t("bioVeraFresh.resourceDownload")}
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </a>
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
        ) : null}
      </div>

      <div className="bf-no-print">
        <Footer />
      </div>
    </div>
  );
}
