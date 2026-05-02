"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Link2, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import Footer from "@/components/Footer";

const ACCENT = "#2D5A27";

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
    <div className="min-h-screen bg-[#fafcfa] text-gray-900 project-overview-root">
      <style jsx global>{`
        @media print {
          .project-overview-root .po-no-print {
            display: none !important;
          }
          .project-overview-root {
            background: white !important;
          }
          .project-overview-doc .po-section {
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
          .project-overview-doc h2 {
            font-size: 10.5pt;
          }
          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

      <header className="po-no-print fixed top-0 z-50 w-full border-b border-gray-200/90 bg-[#fafcfa]/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-[3.65rem] max-w-4xl items-center justify-between px-5 sm:px-8">
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
          <nav className="flex gap-5 text-[13px] font-medium text-gray-600 sm:gap-7">
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
        className="po-no-print sticky top-14 z-40 border-b border-gray-200/90 bg-[#fafcfa]/96 backdrop-blur shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] sm:top-[3.65rem]"
        role="region"
        aria-label={`${t("projectOverview.toolbarCopyLink")} · ${t("projectOverview.toolbarPrintPdf")}`}
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:py-3.5">
          <p className="text-[13px] leading-snug text-gray-600 sm:max-w-[55%]">{t("projectOverview.introNote")}</p>
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
        <p className="mx-auto max-w-4xl px-5 pb-2.5 text-[11px] text-gray-500 sm:px-8">{t("projectOverview.pdfLimitHint")}</p>
      </div>

      <main className="project-overview-doc mx-auto max-w-3xl px-5 pb-20 pt-[calc(8.25rem)] sm:pt-[9rem] print:max-w-none print:px-8 print:pb-8 print:pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
          {t("projectOverview.coverEyebrow")}
        </p>
        <h1 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-gray-900 sm:text-[2rem]">
          {t("projectOverview.coverTitle")}
        </h1>
        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-gray-600">{t("projectOverview.coverSubtitle")}</p>

        <div className="po-stack mt-8 space-y-6 sm:mt-10 sm:space-y-7 print:mt-5 print:space-y-3.5">
          {sections.map((s) => (
            <section
              key={s.title}
              className="po-section rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:rounded-none print:border-0 print:border-b print:border-gray-200 print:bg-transparent print:p-0 print:pb-3 print:shadow-none"
            >
              <h2 className="mb-1.5 text-[1.0625rem] font-semibold tracking-tight text-gray-900">{s.title}</h2>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-600 print:text-[10pt]">{s.body}</p>
            </section>
          ))}

          <section className="po-founder po-section rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:rounded-none print:border-0 print:border-b print:border-gray-200 print:bg-transparent print:p-0 print:pb-3 print:shadow-none">
            <h2 className="mb-3 text-[1.0625rem] font-semibold tracking-tight text-gray-900">{t("projectOverview.founderTitle")}</h2>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6 print:flex-row">
              <div className="relative mx-auto shrink-0 sm:mx-0 print:mx-0">
                <div
                  className="relative aspect-[4/5] h-44 w-36 overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 shadow-inner ring-1 ring-gray-200/80 print:h-36 print:w-28"
                  aria-label={t("projectOverview.founderPhotoPlaceholder")}
                >
                  {founderSrc ? (
                    <Image
                      src={founderSrc}
                      alt={t("projectOverview.founderPhotoPlaceholder")}
                      fill
                      className="object-cover"
                      sizes="144px"
                      priority={false}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        {t("projectOverview.founderPhotoPlaceholder")}
                      </span>
                    </div>
                  )}
                </div>
                <p className="po-no-print mt-2 max-w-[9.5rem] text-[10px] leading-snug text-gray-500">{t("projectOverview.founderPhotoHint")}</p>
              </div>
              <ul className="min-w-0 flex-1 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-gray-600 print:text-[10pt]">
                {founderBullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="po-no-print mt-12 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{t("projectOverview.seeAlsoEyebrow")}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{t("projectOverview.seeAlsoBody")}</p>
          <Link
            href={loc("/investor-deck")}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#2D5A27] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#23471f]"
          >
            {t("projectOverview.seeAlsoLink")}
          </Link>
        </div>

        <div className="mt-8 hidden border-t border-gray-200 pt-4 text-[11px] text-gray-500 print:block">
          <p className="font-medium text-gray-700">{t("projectOverview.seeAlsoEyebrow")}</p>
          <p className="mt-1">{t("projectOverview.seeAlsoBody")}</p>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
