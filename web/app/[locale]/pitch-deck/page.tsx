"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Link2,
  Printer,
  Sparkles,
  Sprout,
  Truck,
  ClipboardCheck,
  Wallet,
  BadgeCheck,
  QrCode,
  Play,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import Footer from "@/components/Footer";
import { parsePitchDeckVideoUrl } from "@/lib/pitch-deck-video";

type TextBlock = { title: string; body: string };

type DetailSubItem = { heading: string; body: string };

type DetailSectionBlock = { title: string; items: DetailSubItem[] };

function isDetailSubItem(x: unknown): x is DetailSubItem {
  return (
    typeof x === "object" &&
    x !== null &&
    "heading" in x &&
    "body" in x &&
    typeof (x as DetailSubItem).heading === "string" &&
    typeof (x as DetailSubItem).body === "string"
  );
}

function parseDetailSections(raw: unknown): DetailSectionBlock[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: DetailSectionBlock[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null || !("title" in row) || !("items" in row)) continue;
    const title = (row as { title: unknown }).title;
    const itemsRaw = (row as { items: unknown }).items;
    if (typeof title !== "string" || !Array.isArray(itemsRaw)) continue;
    const items = itemsRaw.filter(isDetailSubItem);
    if (items.length > 0) out.push({ title, items });
  }
  return out;
}

function isTextBlockList(x: unknown): x is TextBlock[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    typeof x[0] === "object" &&
    x[0] !== null &&
    "title" in x[0] &&
    "body" in x[0]
  );
}

function isStringList(x: unknown): x is string[] {
  return Array.isArray(x) && x.length > 0 && typeof x[0] === "string";
}

const ADV_ICONS = [Sprout, BadgeCheck, Truck, Wallet, ClipboardCheck, Sparkles];
const TECH_ICONS = [Sparkles, ClipboardCheck, BadgeCheck, QrCode];

/** Bio Vera marketing shell: white cards, subtle ring, green accent rail */
function sectionClass(extra = ""): string {
  return [
    "pitch-slide rounded-xl border border-gray-200 bg-white p-5 sm:p-6 lg:p-8 shadow-sm ring-1 ring-gray-900/[0.04]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function PitchDeckPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const [copied, setCopied] = useState(false);

  const videoEmbed = useMemo(
    () => parsePitchDeckVideoUrl(process.env.NEXT_PUBLIC_PITCH_DECK_VIDEO_URL),
    [],
  );

  const howItWorksPhases = useMemo(() => {
    const raw = t("pitchDeck.howItWorksPhases", { returnObjects: true });
    return isTextBlockList(raw) ? raw : [];
  }, [t]);

  const whyBullets = useMemo(() => {
    const raw = t("pitchDeck.whyBullets", { returnObjects: true });
    return isStringList(raw) ? raw : [];
  }, [t]);

  const chainSteps = useMemo(() => {
    const raw = t("pitchDeck.chainSteps", { returnObjects: true });
    return isStringList(raw) ? raw : [];
  }, [t]);

  const advantages = useMemo(() => {
    const raw = t("pitchDeck.advantages", { returnObjects: true });
    return isTextBlockList(raw) ? raw : [];
  }, [t]);

  const techItems = useMemo(() => {
    const raw = t("pitchDeck.techItems", { returnObjects: true });
    return isTextBlockList(raw) ? raw : [];
  }, [t]);

  const transparencyBullets = useMemo(() => {
    const raw = t("pitchDeck.transparencyBullets", { returnObjects: true });
    return isStringList(raw) ? raw : [];
  }, [t]);

  const financeBullets = useMemo(() => {
    const raw = t("pitchDeck.financeBullets", { returnObjects: true });
    return isStringList(raw) ? raw : [];
  }, [t]);

  const detailSections = useMemo(() => {
    const raw = t("pitchDeck.detailSections", { returnObjects: true });
    return parseDetailSections(raw);
  }, [t]);

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
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @media print {
          .pitch-toolbar,
          .pitch-top-nav,
          .pitch-no-print {
            display: none !important;
          }
          .pitch-slide {
            break-after: page;
            page-break-after: always;
          }
          .pitch-slide:last-of-type {
            break-after: auto;
            page-break-after: auto;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      {/* Top nav */}
      <header className="pitch-top-nav fixed top-0 w-full z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link
              href={loc("/")}
              className="flex items-center gap-2 rounded-lg hover:opacity-90 transition-opacity shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/30 focus-visible:ring-offset-2"
            >
              <Image
                src="/logo1.png"
                alt={t("footer.logoAlt")}
                width={64}
                height={24}
                className="h-5 w-auto"
                priority
              />
              <span className="hidden sm:inline text-sm font-semibold text-gray-500 border-l border-gray-200 pl-3 ml-1">
                {t("footer.pitchDeck")}
              </span>
            </Link>
            <nav className="flex gap-6 items-center text-sm font-medium text-gray-600">
              <Link
                href={loc("/")}
                className="hover:text-[#2D5A27] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/35 focus-visible:ring-offset-2 hidden sm:inline"
              >
                {t("nav.home")}
              </Link>
              <Link
                href={loc("/about")}
                className="hover:text-[#2D5A27] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/35 focus-visible:ring-offset-2 hidden md:inline"
              >
                {t("footer.about")}
              </Link>
              <Link
                href={loc("/contact")}
                className="text-[#2D5A27] hover:text-[#23471f] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/35 focus-visible:ring-offset-2"
              >
                {t("nav.contact")}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Action bar — Bio Vera primary + neutral secondary */}
      <div
        className="pitch-toolbar print:hidden sticky top-14 sm:top-16 z-40 border-b border-gray-200 bg-white shadow-sm"
        role="region"
        aria-label={`${t("pitchDeck.toolbarCopyLink")} · ${t("pitchDeck.toolbarPrintPdf")}`}
      >
        <div className="h-1 bg-[#2D5A27]" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 justify-between">
          <p className="text-sm text-gray-600 leading-snug max-w-2xl">{t("pitchDeck.introNote")}</p>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={copyPublicUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 min-h-[48px] hover:border-[#2D5A27] hover:text-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/35 focus-visible:ring-offset-2 transition-colors"
            >
              <Link2 className="w-4 h-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {copied ? t("pitchDeck.toolbarCopied") : t("pitchDeck.toolbarCopyLink")}
            </button>
            <button
              type="button"
              onClick={openPrint}
              aria-label={t("pitchDeck.toolbarPrintAria")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2D5A27] px-4 py-2.5 text-sm font-medium text-white min-h-[48px] hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 shrink-0" aria-hidden />
              {t("pitchDeck.toolbarPrintPdf")}
            </button>
          </div>
        </div>
        <p className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2.5 text-xs text-gray-500">{t("pitchDeck.toolbarHint")}</p>
      </div>

      <main className="pt-[7.75rem] sm:pt-[8rem] pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 sm:space-y-10">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className={sectionClass(
            "pitch-slide bg-gradient-to-br from-white via-white to-[#2D5A27]/[0.07] border-[#2D5A27]/20",
          )}
        >
          <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-10">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2D5A27] mb-3">
                {t("pitchDeck.coverEyebrow")}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-semibold text-gray-900 leading-tight tracking-tight mb-4">
                {t("pitchDeck.coverTitle")}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">
                {t("pitchDeck.coverSubtitle")}
              </p>
            </div>
            <div className="mt-8 lg:mt-0 lg:w-[280px] shrink-0 flex flex-col justify-center">
              <div className="rounded-xl border border-[#2D5A27]/25 bg-[#2D5A27]/[0.06] p-5 text-center lg:text-left">
                <p className="text-xs font-semibold text-[#2D5A27] uppercase tracking-wide mb-2">{t("brand.name")}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{t("footer.tagline")}</p>
                <div className="mt-4 h-px bg-[#2D5A27]/20" aria-hidden />
                <p className="mt-4 text-xs text-gray-500 leading-snug">{t("pitchDeck.heroTechPill")}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How it works — expanded */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={sectionClass("pitch-slide border-t-4 border-t-[#2D5A27]")}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2D5A27] mb-2">
            {t("pitchDeck.howItWorksEyebrow")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-4">
            {t("pitchDeck.howItWorksTitle")}
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10 border-l-4 border-[#2D5A27]/35 pl-4 sm:pl-5">
            {t("pitchDeck.howItWorksLead")}
          </p>
          <ol className="space-y-6">
            {howItWorksPhases.map((phase, index) => (
              <li
                key={phase.title}
                className="relative flex gap-4 sm:gap-6 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-6 hover:border-[#2D5A27]/25 transition-colors"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2D5A27] text-sm font-bold text-white shadow-sm"
                  aria-hidden
                >
                  {index + 1}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{phase.title}</h3>
                  <p className="text-base text-gray-600 leading-relaxed">{phase.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* Video */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`${sectionClass("pitch-no-print")} overflow-hidden`}
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-[#2D5A27] mb-2">
                <Play className="w-5 h-5" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wider">{t("pitchDeck.videoTitle")}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                {t("pitchDeck.videoCaption")}
              </h2>
            </div>
          </div>
          {videoEmbed ? (
            <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-gray-200 bg-black shadow-md ring-1 ring-black/5">
              <iframe
                title={t("pitchDeck.videoTitle")}
                src={videoEmbed.embedUrl}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-[#2D5A27]/[0.04] flex flex-col items-center justify-center text-center px-6">
              <div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-gray-200 mb-4">
                <Play className="w-10 h-10 text-[#2D5A27]" aria-hidden />
              </div>
              <p className="text-base font-semibold text-gray-900 mb-2">{t("pitchDeck.videoPlaceholderTitle")}</p>
              <p className="text-sm text-gray-600 max-w-md leading-relaxed">{t("pitchDeck.videoPlaceholderBody")}</p>
            </div>
          )}
        </motion.section>

        {/* Why */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={sectionClass("pitch-slide")}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-3">
            {t("pitchDeck.whyTitle")}
          </h2>
          <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-prose">{t("pitchDeck.whyLead")}</p>
          <ul className="space-y-4 max-w-3xl">
            {whyBullets.map((line) => (
              <li key={line} className="flex gap-3 text-base text-gray-700 leading-relaxed">
                <span className="mt-2 h-2 w-2 rounded-full bg-[#2D5A27] shrink-0" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Solution + chain — numbered rail */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={sectionClass("pitch-slide")}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-3">
            {t("pitchDeck.solutionTitle")}
          </h2>
          <p className="text-base text-gray-600 leading-relaxed mb-10 max-w-3xl">{t("pitchDeck.solutionLead")}</p>
          <h3 className="text-sm font-semibold text-[#2D5A27] uppercase tracking-wide mb-6">{t("pitchDeck.chainTitle")}</h3>
          <ol className="relative space-y-0 max-w-3xl border-l-2 border-[#2D5A27]/25 pl-8 ml-3">
            {chainSteps.map((step, i) => (
              <li key={step} className="relative pb-8 last:pb-0">
                <span className="absolute -left-[1.8125rem] top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#2D5A27] text-xs font-bold text-white shadow-sm ring-2 ring-[#2D5A27]/20">
                  {i + 1}
                </span>
                <p className="text-base text-gray-800 font-medium leading-relaxed pt-0.5 pr-8">{step}</p>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* Advantages */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={sectionClass("pitch-slide")}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-8">
            {t("pitchDeck.advantagesTitle")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-5 lg:gap-6">
            {advantages.map((item, index) => {
              const Icon = ADV_ICONS[index % ADV_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="group rounded-xl border border-gray-200 bg-gray-50/40 p-5 sm:p-6 transition-all hover:border-[#2D5A27]/40 hover:bg-white hover:shadow-md ring-1 ring-transparent hover:ring-[#2D5A27]/10"
                >
                  <Icon className="w-7 h-7 text-[#2D5A27] mb-3" aria-hidden />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Tech */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={sectionClass("pitch-slide")}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            {t("pitchDeck.techTitle")}
          </h2>
          <p className="text-base text-gray-600 mb-8 max-w-3xl leading-relaxed">{t("pitchDeck.techLead")}</p>
          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {techItems.map((item, index) => {
              const Icon = TECH_ICONS[index % TECH_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 border-l-[3px] border-l-[#2D5A27] shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D5A27]/10">
                      <Icon className="w-5 h-5 text-[#2D5A27]" aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Transparency */}
        <motion.section initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={sectionClass("pitch-slide")}>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-6">
            {t("pitchDeck.transparencyTitle")}
          </h2>
          <ul className="space-y-5 max-w-3xl">
            {transparencyBullets.map((line) => (
              <li key={line} className="flex gap-4 text-base text-gray-700 leading-relaxed rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
                <QrCode className="w-6 h-6 text-[#2D5A27] shrink-0 mt-0.5" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Finance */}
        <motion.section initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={sectionClass("pitch-slide")}>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-3">
            {t("pitchDeck.financeTitle")}
          </h2>
          <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-3xl">{t("pitchDeck.financeLead")}</p>
          <ul className="space-y-4 max-w-3xl">
            {financeBullets.map((line) => (
              <li key={line} className="flex gap-3 text-base text-gray-700 leading-relaxed">
                <Wallet className="w-5 h-5 text-[#2D5A27] shrink-0 mt-1" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {detailSections.length > 0 && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={sectionClass("pitch-slide border-t-4 border-t-[#2D5A27]")}
              aria-labelledby="pitch-detail-spec-heading"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2D5A27] mb-2">{t("pitchDeck.detailSpecEyebrow")}</p>
              <h2 id="pitch-detail-spec-heading" className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-4">
                {t("pitchDeck.detailSpecTitle")}
              </h2>
              <p className="text-base text-gray-600 leading-relaxed max-w-3xl">{t("pitchDeck.detailSpecLead")}</p>
            </motion.section>

            {detailSections.map((block) => (
              <motion.section
                key={block.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                className={sectionClass("pitch-slide")}
              >
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight border-b border-gray-100 pb-3 mb-6">
                  {block.title}
                </h3>
                <div className="space-y-5">
                  {block.items.map((item) => (
                    <div
                      key={`${block.title}-${item.heading}`}
                      className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5 print:break-inside-avoid"
                    >
                      <p className="text-sm font-semibold text-[#2D5A27] uppercase tracking-wide mb-2">{item.heading}</p>
                      <p className="text-base text-gray-700 leading-relaxed">{item.body}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </>
        )}

        {/* Closing CTA */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pitch-slide rounded-xl border border-[#2D5A27]/30 bg-[#2D5A27] text-white p-8 sm:p-10 shadow-lg ring-1 ring-[#23471f]/40 print:bg-white print:text-gray-900 print:border-gray-300 print:ring-0"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">{t("pitchDeck.ctaClosingTitle")}</h2>
          <p className="text-base text-white/90 print:text-gray-600 mb-8 max-w-2xl leading-relaxed">
            {t("pitchDeck.ctaClosingBody")}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              href={loc("/contact")}
              className="inline-flex justify-center items-center min-h-[48px] px-5 rounded-lg bg-white text-[#23471f] text-sm font-semibold hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D5A27] print:ring-[#2D5A27] print:ring-offset-white"
            >
              {t("pitchDeck.ctaContact")}
            </Link>
            <Link
              href={loc("/growers")}
              className="inline-flex justify-center items-center min-h-[48px] px-5 rounded-lg border border-white/60 text-white hover:bg-white/10 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 print:border-gray-400 print:text-gray-900"
            >
              {t("pitchDeck.ctaGrowers")}
            </Link>
            <Link
              href={loc("/for-buyers")}
              className="inline-flex justify-center items-center min-h-[48px] px-5 rounded-lg border border-white/60 text-white hover:bg-white/10 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 print:border-gray-400 print:text-gray-900"
            >
              {t("pitchDeck.ctaBuyers")}
            </Link>
            <Link
              href={loc("/investors")}
              className="inline-flex justify-center items-center min-h-[48px] px-5 rounded-lg border border-white/60 text-white hover:bg-white/10 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 print:border-gray-400 print:text-gray-900"
            >
              {t("pitchDeck.ctaInvestors")}
            </Link>
          </div>
        </motion.section>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
