"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Link2, Printer } from "lucide-react";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import Footer from "@/components/Footer";
import { TECHNICAL_PROPOSAL_CHAPTERS } from "@/content/technical-proposal";
import { TP_UI_EN as UI } from "@/content/technical-proposal.ui.en";

const TOC_LINK_CLASS =
  "group flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm text-gray-700 transition-colors hover:border-gray-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/25 focus-visible:ring-offset-2";
const TOC_NUM_CLASS =
  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#2D5A27]/[0.08] text-[11px] font-bold tabular-nums text-[#2D5A27]";

export default function TechnicalProposalPage() {
  const loc = useLocalizedHref();
  const [copied, setCopied] = useState(false);

  const anchors = useMemo(
    () => TECHNICAL_PROPOSAL_CHAPTERS.map((c, index) => ({ id: c.id, title: c.title, index })),
    [],
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

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-gray-900 technical-proposal-root print:bg-white">
      <style jsx global>{`
        @media print {
          .technical-proposal-root .tp-no-print {
            display: none !important;
          }
          .technical-proposal-root {
            background: white !important;
          }
          .technical-proposal-doc svg.lucide {
            display: none !important;
          }
          .technical-proposal-doc {
            font-family: Georgia, "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1a1a1a;
            hyphens: auto;
            -webkit-hyphens: auto;
          }
          .technical-proposal-doc h1,
          .technical-proposal-doc .tp-heading,
          .technical-proposal-doc .tp-sans {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
              Roboto, sans-serif;
          }
          .technical-proposal-doc h1 {
            font-size: 16pt;
            font-weight: 600;
          }
          .technical-proposal-doc .tp-heading {
            font-size: 12pt;
            font-weight: 600;
            break-after: avoid;
            page-break-after: avoid;
            margin-top: 0.9rem !important;
          }
          .technical-proposal-doc .tp-body-text p {
            orphans: 3;
            widows: 3;
          }
          .technical-proposal-doc .tp-cover {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 0.85rem !important;
            padding-bottom: 0.85rem !important;
            border-bottom: 1pt solid #9ca3af !important;
          }
          .technical-proposal-doc .tp-panel {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          @page {
            size: A4;
            margin: 16mm 18mm;
          }
        }
      `}</style>

      <a
        href="#technical-proposal-document"
        className="tp-no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#2D5A27] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {UI.skipToContent}
      </a>

      <header className="tp-no-print fixed top-0 z-50 w-full border-b border-gray-200/90 bg-[#fafcfa]/92 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-6 sm:h-[3.65rem] sm:px-8 lg:px-10">
          <Link
            href={loc("/")}
            className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/25"
          >
            <Image
              src="/logo1.png"
              alt={UI.logoAlt}
              width={64}
              height={24}
              className="h-6 w-auto"
              priority
            />
            <span className="hidden border-l border-gray-200 pl-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 sm:inline">
              {UI.coverEyebrow}
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-[13px] font-medium text-gray-600 sm:gap-7">
            <Link href={loc("/project-overview")} className="hidden hover:text-[#2D5A27] md:inline">
              {UI.navProjectOverview}
            </Link>
            <Link href={loc("/investor-deck")} className="hidden hover:text-[#2D5A27] lg:inline">
              {UI.navInvestorDeck}
            </Link>
            <Link href={loc("/contact")} className="font-semibold text-[#2D5A27] hover:text-[#23471f]">
              {UI.navContact}
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="tp-no-print sticky top-14 z-40 border-b border-gray-200/90 bg-[#fafcfa]/96 backdrop-blur print:hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] sm:top-[3.65rem]"
        role="region"
        aria-label={UI.toolbarRegion}
      >
        <div className="h-[3px] w-full bg-[#2D5A27]" aria-hidden />
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#2D5A27] px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-[#2D5A27]/22 hover:bg-[#23471f]"
            >
              <Printer className="size-4 shrink-0" aria-hidden />
              {UI.savePdf}
            </button>
          </div>
        </div>
        <p className="mx-auto max-w-[1240px] px-6 pb-2.5 text-[11px] text-gray-500 sm:px-8 lg:px-10">
          {UI.pdfHint}
        </p>
      </div>

      <main
        id="technical-proposal-document"
        className="technical-proposal-doc mx-auto max-w-[900px] px-5 pb-24 pt-[calc(8.25rem)] scroll-mt-24 sm:px-8 sm:pt-[8.85rem] print:mx-0 print:max-w-none print:px-4 print:pb-12 print:pt-8"
        tabIndex={-1}
      >
        <div className="tp-panel rounded-none border border-gray-200/90 bg-white shadow-sm sm:rounded-2xl print:shadow-none">
          <header className="tp-cover px-6 py-10 sm:px-10 sm:py-11 print:border-0">
            <p className="tp-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2D5A27]/85 print:text-[9pt]">
              {UI.coverEyebrow}
            </p>
            <h1 className="tp-sans mt-3 text-[1.75rem] font-semibold tracking-tight text-gray-900 sm:text-[2.1rem] print:text-[16pt]">
              {UI.coverTitle}
            </h1>
            <p className="tp-sans mt-5 max-w-2xl text-[15px] leading-relaxed text-gray-600 sm:text-[1.0625rem]">
              {UI.coverSubtitle}
            </p>
            <p className="tp-sans mt-4 rounded-lg border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-[13px] leading-snug text-amber-950 print:border-gray-300 print:bg-gray-50 print:text-gray-800">
              {UI.shellLanguageNote}
            </p>
          </header>

          <nav
            className="tp-no-print border-t border-gray-100 bg-[#fafcfa]/75 px-5 py-4 sm:px-9"
            aria-label={UI.contentsNav}
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              {UI.contentsTitle}
            </p>
            <ul className="columns-1 gap-x-10 sm:columns-2">
              {anchors.map(({ id, title, index }) => (
                <li key={id} className="break-inside-avoid pb-2">
                  <a href={`#${id}`} className={TOC_LINK_CLASS}>
                    <span className={TOC_NUM_CLASS}>{index + 1}</span>
                    <span className="leading-snug">{title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="divide-y divide-gray-100 px-6 py-2 sm:px-9">
            {TECHNICAL_PROPOSAL_CHAPTERS.map((chapter) => (
              <section key={chapter.id} id={chapter.id} className="scroll-mt-28 py-8 print:scroll-mt-0 print:py-5">
                <h2 className="tp-heading tp-sans mb-4 text-lg font-semibold text-gray-900 sm:text-xl print:text-[12pt]">
                  {chapter.title}
                </h2>
                <div className="tp-body-text space-y-3 text-[15px] leading-[1.62] text-gray-700">
                  {chapter.paragraphs.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="tp-no-print mt-6 border-t border-gray-100 bg-[#F4F8F4] px-6 py-6 sm:px-9">
            <p className="tp-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2D5A27]/75">
              {UI.seeAlsoEyebrow}
            </p>
            <p className="tp-sans mt-2 max-w-xl text-sm text-gray-700 sm:text-[15px]">{UI.seeAlsoBody}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="#eic-why-exists"
                className="inline-flex min-h-[48px] items-center rounded-lg bg-[#2D5A27] px-5 text-sm font-semibold text-white hover:bg-[#23471f]"
              >
                {UI.seeGrantNarrativeInDocument}
              </a>
              <Link
                href={loc("/project-overview")}
                className="inline-flex min-h-[48px] items-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 hover:border-[#2D5A27]/35"
              >
                {UI.seeOverview}
              </Link>
              <Link
                href={loc("/investor-deck")}
                className="inline-flex min-h-[48px] items-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 hover:border-[#2D5A27]/35"
              >
                {UI.seeInvestorDeck}
              </Link>
            </div>
          </section>

          <div className="tp-sans hidden border-t border-gray-200 px-6 py-4 text-[10pt] text-gray-700 print:block sm:px-9">
            <p className="font-semibold text-gray-900">{UI.seeAlsoEyebrow}</p>
            <p className="mt-2">{UI.seeAlsoPrintBody}</p>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
