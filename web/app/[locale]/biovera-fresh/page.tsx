"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Link2, Printer, Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import { siteLocaleFromLanguageTag } from "@/lib/i18n-routing";
import { bioVeraFreshAPI } from "@/lib/api";
import Footer from "@/components/Footer";

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
  "group flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm text-gray-700 transition-colors hover:border-gray-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/25 focus-visible:ring-offset-2";
const TOC_NUM_CLASS =
  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#2D5A27]/[0.08] text-[11px] font-bold tabular-nums text-[#2D5A27]";

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

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-gray-900 biovera-fresh-root print:bg-white">
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
        className="bf-no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#2D5A27] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t("bioVeraFresh.skipToContent")}
      </a>

      <header className="bf-no-print fixed top-0 z-50 w-full border-b border-gray-200/90 bg-[#fafcfa]/92 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-6 sm:h-[3.65rem] sm:px-8 lg:px-10">
          <Link
            href={loc("/")}
            className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/25"
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
              {t("bioVeraFresh.coverEyebrow")}
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-[13px] font-medium text-gray-600 sm:gap-7">
            <Link href={loc("/growers")} className="hidden hover:text-[#2D5A27] sm:inline">
              {t("nav.forGrowers")}
            </Link>
            <Link href={loc("/for-buyers")} className="hidden hover:text-[#2D5A27] md:inline">
              {t("nav.forBuyers")}
            </Link>
            <Link href={loc("/contact")} className="font-semibold text-[#2D5A27] hover:text-[#23471f]">
              {t("nav.contact")}
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="bf-no-print sticky top-14 z-40 border-b border-gray-200/90 bg-[#fafcfa]/96 backdrop-blur print:hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] sm:top-[3.65rem]"
        role="region"
        aria-label={`${t("bioVeraFresh.downloadProspectCta")} · ${t("bioVeraFresh.toolbarCopyLink")} · ${t("bioVeraFresh.toolbarPrintPdf")}`}
      >
        <div className="h-[3px] w-full bg-[#2D5A27]" aria-hidden />
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p className="max-w-xl text-[13px] leading-snug text-gray-600">{t("bioVeraFresh.introNote")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pdfDownloading}
              onClick={() => void downloadProspect()}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#2D5A27] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#2D5A27]/22 transition-colors hover:bg-[#23471f] disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {pdfDownloading ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4 shrink-0" aria-hidden />
              )}
              {t("bioVeraFresh.downloadProspectCta")}
            </button>
            <button
              type="button"
              onClick={copyPublicUrl}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 hover:border-[#2D5A27]/50"
            >
              <Link2 className="size-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {copied ? t("bioVeraFresh.toolbarCopied") : t("bioVeraFresh.toolbarCopyLink")}
            </button>
            <button
              type="button"
              onClick={openPrint}
              aria-label={t("bioVeraFresh.toolbarPrintAria")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-[13px] font-semibold text-gray-800 hover:border-[#2D5A27]/50"
            >
              <Printer className="size-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {t("bioVeraFresh.toolbarPrintPdf")}
            </button>
          </div>
        </div>
        <p className="mx-auto max-w-[1240px] px-6 pb-2.5 text-[11px] leading-snug text-gray-500 sm:px-8 lg:px-10">
          {t("bioVeraFresh.pdfHint")}
        </p>
      </div>

      <main
        id="biovera-fresh-document"
        className="biovera-fresh-doc mx-auto max-w-[900px] px-5 pb-24 pt-[calc(8.25rem)] scroll-mt-24 sm:px-8 sm:pt-[8.85rem] print:mx-0 print:max-w-none print:px-4 print:pb-12 print:pt-8"
        tabIndex={-1}
      >
        <div className="bf-panel rounded-none border border-gray-200/90 bg-white shadow-sm sm:rounded-2xl print:shadow-none">
          <header className="bf-cover px-6 py-10 sm:px-10 sm:py-11 print:border-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2D5A27]/85 print:text-[9pt]">
              {t("bioVeraFresh.coverEyebrow")}
            </p>
            <h1 className="bf-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-900 sm:text-[2.1rem] print:text-[16pt]">
              {t("bioVeraFresh.coverTitle")}
            </h1>
            <p className="bf-body mt-5 max-w-2xl text-[15px] leading-relaxed text-gray-600 sm:text-[1.0625rem] print:text-[11pt]">
              {t("bioVeraFresh.coverSubtitle")}
            </p>
            <div className="bf-no-print mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
              <button
                type="button"
                disabled={pdfDownloading}
                onClick={() => void downloadProspect()}
                className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full bg-[#2D5A27] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#2D5A27]/22 transition-colors hover:bg-[#23471f] disabled:cursor-not-allowed disabled:bg-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
              >
                {pdfDownloading ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4 shrink-0" aria-hidden />
                )}
                {t("bioVeraFresh.downloadProspectCta")}
              </button>
              <p className="text-xs leading-relaxed text-gray-500 sm:pt-2.5">{t("bioVeraFresh.prospectNote")}</p>
            </div>
          </header>

          <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
            <aside className="bf-no-print mb-8 hidden border-t border-gray-100 bg-[#fafcfa]/75 px-5 py-5 sm:px-8 lg:col-span-4 lg:block lg:border-r lg:border-t-0 lg:px-6 lg:py-8">
              <TocNav anchors={sectionAnchors} contentsTitle={contentsTitle} contentsNavAria={contentsNavAria} />
            </aside>

            <div className="lg:col-span-8">
              <nav
                className="bf-no-print border-t border-gray-100 bg-[#fafcfa]/75 px-5 py-4 sm:px-8 lg:hidden"
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

              <div className="divide-y divide-gray-100">
                {webSections.map((s, i) => {
                  const id = sectionAnchors[i]?.slug ?? sectionSlug(s.title, i);
                  return (
                    <section
                      key={id}
                      id={id}
                      className="bf-body scroll-mt-28 px-5 py-8 sm:px-9 sm:py-9 print:scroll-mt-0 print:px-0 print:py-4"
                    >
                      <h2 className="bf-heading text-lg font-semibold text-gray-900 sm:text-xl print:text-[12pt]">
                        {s.title}
                      </h2>
                      <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-gray-600 sm:text-[0.9625rem] print:text-[11pt]">
                        {s.body}
                      </p>
                    </section>
                  );
                })}

                <section className="bf-no-print border-t border-gray-100 bg-[#fafcfa]/60 px-5 py-8 sm:px-9 print:hidden">
                  <h2 className="text-lg font-semibold text-gray-900">{t("bioVeraFresh.ctaTitle")}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{t("bioVeraFresh.ctaBody")}</p>
                  <Link
                    href={loc("/contact")}
                    className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-6 text-base font-semibold text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
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
      </main>

      <div className="bf-no-print">
        <Footer />
      </div>
    </div>
  );
}
