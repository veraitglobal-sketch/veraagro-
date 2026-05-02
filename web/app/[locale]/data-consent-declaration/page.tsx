"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Link2, Printer } from "lucide-react";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import Footer from "@/components/Footer";
import { DATA_CONSENT_DECLARATION_CHAPTERS } from "@/content/data-consent-declaration";
import { DATA_CONSENT_UI_EN as UI } from "@/content/data-consent-declaration.ui.en";

export default function DataConsentDeclarationPage() {
  const loc = useLocalizedHref();
  const [copied, setCopied] = useState(false);

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

  const chapters = DATA_CONSENT_DECLARATION_CHAPTERS;

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-gray-900 dcd-root print:bg-white">
      <style jsx global>{`
        @media print {
          .dcd-root .dcd-no-print {
            display: none !important;
          }
          .dcd-root {
            background: white !important;
          }
          .dcd-doc svg.lucide {
            display: none !important;
          }
          .dcd-doc {
            font-family: Georgia, "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.55;
            color: #1a1a1a;
          }
          .dcd-doc h1,
          .dcd-doc .dcd-heading,
          .dcd-doc .dcd-sans {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
              Roboto, sans-serif;
          }
          .dcd-doc h1 {
            font-size: 16pt;
            font-weight: 600;
          }
          .dcd-doc .dcd-body p {
            orphans: 3;
            widows: 3;
            margin-bottom: 0.75rem;
          }
          .dcd-doc .dcd-cover {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 1rem !important;
            padding-bottom: 1rem !important;
            border-bottom: 1pt solid #9ca3af !important;
          }
          .dcd-doc .dcd-panel {
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4;
            margin: 18mm 20mm;
          }
        }
      `}</style>

      <a
        href={`#${UI.documentId}`}
        className="dcd-no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#2D5A27] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {UI.skipToContent}
      </a>

      <header className="dcd-no-print fixed top-0 z-50 w-full border-b border-gray-200/90 bg-[#fafcfa]/92 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-[900px] items-center justify-between px-6 sm:h-[3.65rem] sm:px-8">
          <Link href={loc("/")} className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90">
            <Image src="/logo1.png" alt={UI.logoAlt} width={64} height={24} className="h-6 w-auto" priority />
          </Link>
          <nav className="flex items-center gap-4 text-[13px] font-medium text-gray-600">
            <Link href={loc("/technical-proposal")} className="hidden hover:text-[#2D5A27] sm:inline">
              {UI.navTechnicalProposal}
            </Link>
            <Link href={loc("/privacy")} className="hover:text-[#2D5A27]">
              {UI.navPrivacy}
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="dcd-no-print sticky top-14 z-40 border-b border-gray-200/90 bg-[#fafcfa]/96 backdrop-blur print:hidden shadow-[0_2px_12px_-6px_rgba(0,0,0,0.06)] sm:top-[3.65rem]"
        role="region"
        aria-label={UI.toolbarRegion}
      >
        <div className="h-[3px] w-full bg-[#2D5A27]" aria-hidden />
        <div className="mx-auto flex max-w-[900px] flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="max-w-xl text-[13px] leading-snug text-gray-600">{UI.introNote}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyPublicUrl}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800"
            >
              <Link2 className="size-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {copied ? UI.copied : UI.copyLink}
            </button>
            <button
              type="button"
              onClick={openPrint}
              aria-label={UI.savePdfAria}
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#2D5A27] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#23471f]"
            >
              <Printer className="mr-2 size-4 shrink-0" aria-hidden />
              {UI.savePdf}
            </button>
          </div>
        </div>
      </div>

      <main id={UI.documentId} tabIndex={-1} className="dcd-doc mx-auto max-w-[720px] px-5 pb-24 pt-[7.25rem] sm:px-8 sm:pt-[7.85rem] print:max-w-none print:px-0 print:pb-12 print:pt-8">
        <div className="dcd-panel rounded-xl border border-gray-200 bg-white px-6 py-10 shadow-sm sm:px-10 print:border-0 print:shadow-none">
          <header className="dcd-cover border-b border-gray-100 pb-8">
            <p className="dcd-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2D5A27]/85">
              {UI.coverEyebrow}
            </p>
            <h1 className="dcd-sans mt-3 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.85rem] print:text-[16pt]">
              {UI.coverTitle}
            </h1>
            <p className="dcd-sans mt-4 text-[15px] text-gray-600">{UI.coverSubtitle}</p>
          </header>

          {chapters.map((chapter, idx) => (
            <section
              key={chapter.id}
              id={chapter.id}
              className="scroll-mt-28 border-gray-100 py-8 first:pt-0 print:scroll-mt-0 [&:not(:first-child)]:border-t"
            >
              <h2
                className={`dcd-heading dcd-sans mb-5 text-base font-semibold text-gray-900 ${idx === 0 ? "sr-only" : ""}`}
              >
                {chapter.title}
              </h2>
              <div className="dcd-body space-y-5 text-[16px] leading-[1.65] text-gray-800">
                {chapter.paragraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="border-t border-gray-100 pt-8 print:break-inside-avoid">
            <p className="dcd-sans text-sm font-semibold text-gray-700">{UI.signatureLineWetInk}</p>
            <div className="mt-3 border-b border-gray-400 pb-8" aria-hidden />
          </section>

          <p className="dcd-sans mt-10 rounded-lg bg-gray-50 px-4 py-3 text-[13px] leading-snug text-gray-600 print:border print:border-gray-200 print:bg-white">
            {UI.footerNote}
          </p>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
