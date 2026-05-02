"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  Package,
  Handshake,
  Flag,
  ChevronRight,
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
const PLAIN_LANGUAGE_ICONS = [Package, Handshake, Flag];

const ACCENT = "#2D5A27";
const ACCENT_HOVER = "#23471f";

type DeckVariant = "cover" | "light" | "wash" | "split" | "appendix-intro";

/** Slide shells — restrained presentation layout */
function slideShell(variant: DeckVariant): string {
  const base =
    "pitch-slide relative mx-auto max-w-[1200px] px-6 sm:px-10 lg:px-14 print:rounded-none";

  switch (variant) {
    case "cover":
      return [
        base,
        "pitch-slide-cover",
        "py-14 sm:py-16 lg:py-24",
        "bg-white border-b-[10px] border-b-[#2D5A27] print:border-b-[3px] print:pb-10 print:sm:pb-12",
        "rounded-none sm:rounded-2xl shadow-[0_1px_0_rgba(0,0,0,0.06)] print:shadow-none",
      ].join(" ");
    case "wash":
      return [
        base,
        "py-12 sm:py-16 lg:py-20",
        "rounded-none sm:rounded-2xl bg-[#F4F8F4]",
        "border border-gray-200/60",
      ].join(" ");
    case "split":
      return [
        base,
        "pitch-slide-split",
        "py-12 sm:py-16 lg:py-20",
        `bg-[linear-gradient(90deg,#fafcfa_0%,#fafcfa_52%,white_52%,white_100%)]`,
        "border border-gray-200/70 rounded-none sm:rounded-2xl",
      ].join(" ");
    case "appendix-intro":
      return [
        base,
        "pitch-appendix-intro",
        "py-10 sm:py-12 lg:py-14",
        "bg-neutral-900 text-neutral-50 rounded-none sm:rounded-2xl px-8 sm:px-12 lg:px-16",
        "print:!bg-gray-100 print:!text-gray-900 print:!border print:!border-gray-200",
      ].join(" ");
    default:
      return [
        base,
        "py-12 sm:py-16 lg:py-20",
        "bg-white border border-gray-200/70 rounded-none sm:rounded-2xl shadow-sm shadow-gray-950/[0.02] print:shadow-none",
      ].join(" ");
  }
}

function SlideKicker({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={[
        "text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] mb-3",
        "text-[#2D5A27]/85",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </p>
  );
}

export default function PitchDeckPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const [copied, setCopied] = useState(false);

  const chips = useMemo(() => {
    const raw = t("pitchDeck.heroTechPill");
    return String(raw)
      .split(/[\u00b7·]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [t]);

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

  const plainLanguageCards = useMemo(() => {
    const raw = t("pitchDeck.plainLanguageCards", { returnObjects: true });
    return isTextBlockList(raw) ? raw : [];
  }, [t]);

  const detailSections = useMemo(() => {
    const raw = t("pitchDeck.detailSections", { returnObjects: true });
    return parseDetailSections(raw);
  }, [t]);

  const storySection = useMemo(() => {
    const narrativeRaw = t("pitchDeck.narrativeParagraphs", { returnObjects: true });
    const narrativeParagraphs = isStringList(narrativeRaw) ? narrativeRaw : [];
    if (narrativeParagraphs.length > 0) {
      return (
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={slideShell("wash")}>
          <SlideKicker>{t("pitchDeck.narrativeEyebrow")}</SlideKicker>
          <h2 className="mb-8 text-[1.5rem] sm:text-[1.85rem] font-semibold text-gray-900 tracking-tight leading-tight max-w-[40ch]">{t("pitchDeck.narrativeTitle")}</h2>
          <div className="max-w-[58ch] space-y-5 text-[15px] sm:text-[1.0625rem] leading-[1.75] text-gray-700">
            {narrativeParagraphs.map((block, i) => (
              <p key={i} className="pitch-avoid-split whitespace-pre-line">
                {block}
              </p>
            ))}
          </div>
        </motion.section>
      );
    }
    if (plainLanguageCards.length > 0) {
      return (
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={slideShell("wash")}>
          <SlideKicker className="">{t("pitchDeck.plainLanguageEyebrow")}</SlideKicker>
          <h2 className="text-[1.5rem] sm:text-[1.85rem] font-semibold text-gray-900 tracking-tight leading-tight max-w-[22ch] mb-6">{t("pitchDeck.plainLanguageTitle")}</h2>
          <p className="mb-11 max-w-[52ch] text-[15px] leading-relaxed text-gray-600">{t("pitchDeck.plainLanguageIntro")}</p>
          <div
            className={`grid gap-10 sm:gap-12 lg:gap-14 ${plainLanguageCards.length >= 3 ? "lg:grid-cols-3" : plainLanguageCards.length === 2 ? "sm:grid-cols-2" : ""}`}
          >
            {plainLanguageCards.map((card, index) => {
              const Icon = PLAIN_LANGUAGE_ICONS[index % PLAIN_LANGUAGE_ICONS.length];
              const n = String(index + 1).padStart(2, "0");
              return (
                <div key={card.title} className="pitch-avoid-split group relative pl-5 border-l-[2px]" style={{ borderColor: ACCENT }}>
                  <span className="absolute -left-px top-0 block h-[2px] w-3 bg-white -translate-x-0" aria-hidden />
                  <p className="mb-4 font-mono text-[11px] font-bold tracking-widest text-gray-400">{n}</p>
                  <Icon className="mb-4 size-[22px]" style={{ color: ACCENT }} aria-hidden />
                  <h3 className="mb-3 text-[1.05rem] font-semibold text-gray-900 leading-snug">{card.title}</h3>
                  <p className="text-[14px] sm:text-[15px] leading-[1.65] text-gray-600">{card.body}</p>
                </div>
              );
            })}
          </div>
        </motion.section>
      );
    }
    return null;
  }, [t, plainLanguageCards]);

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
    <div className="min-h-screen bg-[#EBEEEB] print:min-h-0 print:bg-white">
      <style jsx global>{`
        @page {
          margin: 14mm 14mm 16mm;
          size: auto;
        }
        /* Print/PDF = document flow — not full-screen slides */
        @media print {
          .pitch-toolbar,
          .pitch-top-nav,
          .pitch-no-print {
            display: none !important;
          }
          /*
           * Framer Motion: sections use whileInView({ opacity: 1 }) from opacity 0.
           * Print often rasterizes without every block having been in view → blank “pages”.
           * !important beats inline opacity/transform from motion.
           */
          main section {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            visibility: visible !important;
          }
          main {
            padding-top: 0.5rem !important;
          }
          .pitch-slide {
            break-after: auto !important;
            page-break-after: auto !important;
            padding-top: 1.1rem !important;
            padding-bottom: 1.35rem !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
            background-image: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pitch-slide + .pitch-slide {
            padding-top: 1.65rem !important;
            margin-top: 0.65rem !important;
            border-top: 1px solid #e5e7eb !important;
          }
          .pitch-slide-cover {
            break-after: page !important;
            page-break-after: always !important;
            margin-top: 0 !important;
            padding-bottom: 1.75rem !important;
          }
          .pitch-slide-cover + .pitch-slide {
            border-top: none !important;
            padding-top: 1.1rem !important;
          }
          .pitch-slide:last-of-type {
            break-after: auto !important;
            page-break-after: auto !important;
            padding-bottom: 1.75rem !important;
          }
          .pitch-slide-closing {
            min-height: 0 !important;
            margin-top: 1.75rem !important;
            padding: 1.25rem 1rem !important;
            display: block !important;
            background: #f9fafb !important;
            color: #111827 !important;
            border-radius: 0 !important;
            border: 1px solid #e5e7eb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pitch-slide-closing .pitch-closing-inner {
            max-width: 100% !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .pitch-slide-closing h2,
          .pitch-slide-closing > .pitch-closing-inner > p.mb-10 {
            color: #111827 !important;
          }
          .pitch-slide-closing > .pitch-closing-inner > p:first-of-type {
            color: #6b7280 !important;
          }
          .pitch-slide-closing a {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #fff !important;
            color: #1f2937 !important;
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
          }
          .pitch-slide-closing a:first-of-type {
            background: #2d5a27 !important;
            color: #fff !important;
            border-color: #2d5a27 !important;
          }
          .pitch-appendix-intro + .pitch-slide {
            margin-top: 0 !important;
          }
          /* Split “advantages” slide: Chrome often orphans the eyebrow+H2 above a 2‑col grid in PDF — keep heading with body, flatten grid while printing */
          .pitch-slide-split {
            overflow: visible !important;
          }
          .pitch-slide-split > .pitch-print-keep-with-next {
            margin-bottom: 0.85rem !important;
            padding-bottom: 0 !important;
            page-break-after: avoid !important;
            break-after: avoid-page !important;
          }
          .pitch-slide-split > .pitch-advantages-grid {
            display: block !important;
          }
          .pitch-slide-split > .pitch-advantages-grid > * {
            padding-top: 0.35rem !important;
            padding-bottom: 1rem !important;
            margin-bottom: 0.25rem !important;
            border-bottom: 1px solid #e5e7eb !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .pitch-slide-split > .pitch-advantages-grid > *:last-child {
            border-bottom: none !important;
          }
          body {
            background: white !important;
          }
          /*
           * Avoiding breaks inside many tall blocks makes Chrome insert odd blank pages;
           * allow natural breaks in print while keeping screen layout unchanged.
           */
          .pitch-avoid-split {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
        }
      `}</style>

      <header className="pitch-top-nav fixed top-0 w-full z-50 border-b border-gray-200/90 bg-[#fafcfa]/92 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 sm:h-[3.65rem] max-w-[1240px] items-center justify-between px-6 sm:px-8 lg:px-10">
          <Link
            href={loc("/")}
            className="flex items-center gap-2 rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/30 focus-visible:ring-offset-2"
          >
            <Image src="/logo1.png" alt={t("footer.logoAlt")} width={64} height={24} className="h-6 w-auto" priority />
            <span className="hidden sm:inline border-l border-gray-200 pl-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
              {t("footer.investorDeck")}
            </span>
          </Link>
          <nav className="flex gap-7 text-[13px] font-medium text-gray-600">
            <Link href={loc("/")} className="hover:text-[#2D5A27] transition-colors hidden sm:inline">
              {t("nav.home")}
            </Link>
            <Link href={loc("/about")} className="hover:text-[#2D5A27] transition-colors hidden md:inline">
              {t("footer.about")}
            </Link>
            <Link href={loc("/contact")} className="font-semibold text-[#2D5A27] hover:text-[#23471f]">
              {t("nav.contact")}
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="pitch-toolbar sticky top-14 sm:top-[3.65rem] z-40 border-b border-gray-200/90 bg-[#fafcfa]/96 backdrop-blur print:hidden shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]"
        role="region"
        aria-label={`${t("pitchDeck.toolbarCopyLink")} · ${t("pitchDeck.toolbarPrintPdf")}`}
      >
        <div className="h-[3px] w-full shrink-0 bg-[#2D5A27]" aria-hidden />
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3.5 sm:px-8 lg:px-10">
          <p className="text-[13px] leading-snug text-gray-600 sm:max-w-[52%]">{t("pitchDeck.introNote")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyPublicUrl}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-800 hover:border-[#2D5A27]/50 hover:bg-white"
            >
              <Link2 className="size-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {copied ? t("pitchDeck.toolbarCopied") : t("pitchDeck.toolbarCopyLink")}
            </button>
            <button
              type="button"
              onClick={openPrint}
              aria-label={t("pitchDeck.toolbarPrintAria")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#2D5A27] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#23471f] shadow-md shadow-[#2D5A27]/25"
            >
              <Printer className="size-4 shrink-0" aria-hidden />
              {t("pitchDeck.toolbarPrintPdf")}
            </button>
          </div>
        </div>
        <p className="mx-auto max-w-[1240px] px-6 pb-2.5 text-[11px] text-gray-500 sm:px-8 lg:px-10">{t("pitchDeck.toolbarHint")}</p>
      </div>

      <main className="mx-auto max-w-[1240px] space-y-7 px-5 pb-20 pt-[calc(8.25rem)] sm:space-y-8 sm:pt-[8.85rem] sm:px-6 lg:space-y-9 lg:px-8 lg:pb-28 print:mx-0 print:max-w-none print:space-y-0 print:px-4 print:!pb-0 print:!pt-4">
        {/* Cover */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`${slideShell("cover")}`}
        >
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 lg:items-end">
            <div className="lg:col-span-8 space-y-5">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] mb-1" style={{ color: ACCENT }}>
                {t("pitchDeck.coverEyebrow")}
              </p>
              <h1 className="text-[2rem] sm:text-[2.65rem] lg:text-[clamp(2.5rem,4.2vw,3.35rem)] font-semibold text-gray-900 leading-[1.08] tracking-[-0.03em]">
                {t("pitchDeck.coverTitle")}
              </h1>
              <p className="text-base sm:text-[1.0625rem] text-gray-600 leading-[1.6] max-w-2xl border-l-[4px] pl-5 py-1" style={{ borderColor: ACCENT }}>
                {t("pitchDeck.coverSubtitle")}
              </p>
              <div className="pt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-gray-500">
                <span className="flex items-center gap-1 font-medium text-gray-800">
                  <ChevronRight className="size-4 text-[#2D5A27]" aria-hidden /> {t("footer.tagline")}
                </span>
              </div>
            </div>
            <aside className="lg:col-span-4 lg:pl-6 lg:border-l lg:border-gray-200/90 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">{t("brand.name")}</p>
              <div className="flex flex-wrap gap-2">
                {(chips.length ? chips : [t("pitchDeck.heroTechPill")]).map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-gray-200/90 bg-[#fafcfa] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </motion.section>

        {storySection}

        {/* Operating model */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className={slideShell("light")}
        >
          <SlideKicker>{t("pitchDeck.howItWorksEyebrow")}</SlideKicker>
          <div className="mb-12 max-w-[48ch]">
            <h2 className="text-[1.5rem] sm:text-[1.85rem] font-semibold tracking-tight text-gray-900 leading-tight mb-4">
              {t("pitchDeck.howItWorksTitle")}
            </h2>
            <p className="text-[15px] leading-relaxed text-gray-600">{t("pitchDeck.howItWorksLead")}</p>
          </div>
          <div className="relative space-y-0 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-24px)] before:w-px before:bg-gray-300 sm:before:left-[19px]">
            {howItWorksPhases.map((phase, index) => (
              <div key={phase.title} className="relative pb-11 pl-11 sm:pl-14 pitch-avoid-split last:pb-0">
                <span
                  className="absolute left-0 top-0.5 flex size-8 sm:size-[2.375rem] items-center justify-center rounded-full border-[3px] border-white bg-gray-900 text-[11px] font-bold tabular-nums text-white shadow-sm sm:text-xs"
                  style={{ outline: `1px solid ${ACCENT}33`, boxShadow: `0 0 0 6px rgba(245,247,244,1)` }}
                >
                  {index + 1}
                </span>
                <h3 className="text-[1.0625rem] font-semibold text-gray-900 mb-2">{phase.title}</h3>
                <p className="text-[14px] sm:text-[15px] leading-[1.65] text-gray-600 max-w-[62ch]">{phase.body}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Demo */}
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={`${slideShell("light")} pitch-no-print overflow-hidden`}>
          <SlideKicker>{t("pitchDeck.videoTitle")}</SlideKicker>
          <h2 className="mb-10 text-[1.35rem] sm:text-[1.65rem] font-semibold tracking-tight text-gray-900">{t("pitchDeck.videoCaption")}</h2>
          {videoEmbed ? (
            <div className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-black/10">
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
            <div className="relative mx-auto flex aspect-video w-full max-w-4xl flex-col items-center justify-center rounded-xl bg-gradient-to-br from-neutral-900 to-[#1a3817] px-8 text-center text-white shadow-lg">
              <Play className="mb-6 size-12 opacity-95" aria-hidden />
              <p className="mb-3 text-[1.0625rem] font-semibold tracking-tight">{t("pitchDeck.videoPlaceholderTitle")}</p>
              <p className="max-w-md text-sm leading-relaxed text-white/72">{t("pitchDeck.videoPlaceholderBody")}</p>
            </div>
          )}
        </motion.section>

        {/* Problem → Solution / chain */}
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={slideShell("wash")}>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="mb-3 text-[1.5rem] font-semibold tracking-tight text-gray-900">{t("pitchDeck.whyTitle")}</h2>
              <p className="mb-9 text-[15px] leading-relaxed text-gray-600">{t("pitchDeck.whyLead")}</p>
              <ul className="space-y-5">
                {whyBullets.map((line) => (
                  <li key={line} className="flex gap-3 text-[14px] sm:text-[15px] leading-[1.62] text-gray-700 pitch-avoid-split">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-[#2D5A27]" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`lg:border-l lg:pl-14 lg:border-gray-300/70`}>
              <h2 className="mb-3 text-[1.5rem] font-semibold tracking-tight text-gray-900">{t("pitchDeck.solutionTitle")}</h2>
              <p className="mb-10 text-[15px] leading-relaxed text-gray-600">{t("pitchDeck.solutionLead")}</p>
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
                {t("pitchDeck.chainTitle")}
              </p>
              <ol className="space-y-6">
                {chainSteps.map((step, i) => (
                  <li key={step} className="flex gap-4 pitch-avoid-split">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-[#2D5A27] text-xs font-bold tabular-nums text-white">{i + 1}</span>
                    <span className="text-[14px] sm:text-[15px] font-semibold leading-[1.55] text-gray-800 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </motion.section>

        {/* Value */}
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={`${slideShell("split")}`}>
          <div className="pitch-print-keep-with-next mb-14 max-w-[40ch] print:mb-4">
            <SlideKicker>{t("pitchDeck.advantagesEyebrow")}</SlideKicker>
            <div className="mb-6 h-px w-12 bg-[#2D5A27]" aria-hidden />
            <h2 className="text-[1.5rem] sm:text-[1.75rem] font-semibold tracking-tight text-gray-900 leading-snug">{t("pitchDeck.advantagesTitle")}</h2>
          </div>
          <div className="pitch-advantages-grid grid gap-x-14 gap-y-12 sm:grid-cols-2">
            {advantages.map((item, index) => {
              const Icon = ADV_ICONS[index % ADV_ICONS.length];
              return (
                <div key={item.title} className="pitch-avoid-split group">
                  <Icon className="mb-5 size-[22px]" style={{ color: ACCENT }} aria-hidden />
                  <h3 className="mb-3 text-[1.05rem] font-semibold tracking-tight text-gray-900">{item.title}</h3>
                  <p className="text-[14px] sm:text-[15px] leading-[1.62] text-gray-600">{item.body}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Proof row: tech */}
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={slideShell("light")}>
          <h2 className="mb-2 text-[1.5rem] font-semibold tracking-tight text-gray-900">{t("pitchDeck.techTitle")}</h2>
          <p className="mb-12 max-w-[52ch] text-[15px] text-gray-600 leading-relaxed">{t("pitchDeck.techLead")}</p>
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {techItems.map((item, index) => {
              const Icon = TECH_ICONS[index % TECH_ICONS.length];
              return (
                <div key={item.title} className="grid gap-6 py-7 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-12 sm:items-start">
                  <div className="flex items-center gap-2 sm:flex-col sm:items-start">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#2D5A27]/10">
                      <Icon className="size-[18px] text-[#2D5A27]" aria-hidden />
                    </div>
                    <span className="text-[13px] font-semibold uppercase tracking-[0.05em] text-gray-900 sm:mt-2">{item.title}</span>
                  </div>
                  <p className="text-[14px] sm:text-[15px] leading-[1.62] text-gray-600">{item.body}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Buyer + Economics */}
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={slideShell("wash")}>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className="mb-10 flex items-center gap-3">
                <QrCode className="size-[26px]" style={{ color: ACCENT }} aria-hidden />
                <h2 className="text-[1.35rem] font-semibold tracking-tight text-gray-900">{t("pitchDeck.transparencyTitle")}</h2>
              </div>
              <ul className="space-y-6">
                {transparencyBullets.map((line) => (
                  <li
                    key={line}
                    className="pitch-avoid-split border-l-[3px] border-l-[#6B8F6B] pl-5 text-[14px] sm:text-[15px] leading-relaxed text-gray-700"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-10 flex items-center gap-3">
                <Wallet className="size-[26px]" style={{ color: ACCENT }} aria-hidden />
                <h2 className="text-[1.35rem] font-semibold tracking-tight text-gray-900">{t("pitchDeck.financeTitle")}</h2>
              </div>
              <p className="mb-8 max-w-[50ch] text-[15px] leading-relaxed text-gray-600">{t("pitchDeck.financeLead")}</p>
              <ul className="space-y-6">
                {financeBullets.map((line) => (
                  <li key={line} className="flex gap-4 text-[14px] sm:text-[15px] leading-[1.62] text-gray-700 pitch-avoid-split">
                    <span className="mt-2 inline-block size-1.5 shrink-0 rounded-sm bg-[#2D5A27]" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        {detailSections.length > 0 && (
          <>
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className={`${slideShell("appendix-intro")} pitch-appendix`}
              aria-labelledby="pitch-detail-spec-heading"
            >
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em] text-white/55 print:!text-gray-500">
                {t("pitchDeck.detailSpecEyebrow")}
              </p>
              <h2
                id="pitch-detail-spec-heading"
                className="text-[clamp(1.35rem,2.5vw,1.85rem)] font-semibold tracking-tight text-white print:!text-gray-900"
              >
                {t("pitchDeck.detailSpecTitle")}
              </h2>
              <p className="mt-6 max-w-[58ch] text-[14px] sm:text-[15px] leading-[1.62] text-white/76 print:!text-gray-700">
                {t("pitchDeck.detailSpecLead")}
              </p>
            </motion.section>

            {detailSections.map((block) => (
              <motion.section key={block.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={slideShell("light")}>
                <div className="mb-10 flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
                  <h3 className="text-[clamp(1.15rem,2vw,1.35rem)] font-semibold tracking-tight text-gray-900">{block.title}</h3>
                  <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">{t("pitchDeck.appendixWatermark")}</span>
                </div>
                <dl className="space-y-10">
                  {block.items.map((item) => (
                    <div key={`${block.title}-${item.heading}`} className="pitch-avoid-split max-w-[68ch]">
                      <dt className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em]" style={{ color: ACCENT }}>
                        {item.heading}
                      </dt>
                      <dd className="text-[13px] sm:text-[14px] leading-[1.65] text-gray-600">{item.body}</dd>
                    </div>
                  ))}
                </dl>
              </motion.section>
            ))}
          </>
        )}

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className={`pitch-slide pitch-slide-closing mx-auto max-w-[1200px] rounded-none sm:rounded-2xl px-8 py-12 text-white shadow-[0_24px_50px_-20px_rgba(45,90,39,0.45)] print:rounded-none print:!shadow-none`}
          style={{ backgroundColor: ACCENT }}
        >
          <div className="pitch-closing-inner mx-auto max-w-[56ch]">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/65">{t("pitchDeck.ctaClosingEyebrow")}</p>
            <h2 className="mb-6 text-[1.65rem] sm:text-[1.95rem] font-semibold tracking-tight leading-tight">{t("pitchDeck.ctaClosingTitle")}</h2>
            <p className="mb-10 hidden text-[15px] leading-relaxed text-white/[0.92] print:block">{t("pitchDeck.ctaClosingBodyPrint")}</p>
            <p className="mb-10 text-[15px] leading-relaxed text-white/[0.92] print:hidden">{t("pitchDeck.ctaClosingBody")}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={loc("/contact")}
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-6 py-3 text-[14px] font-semibold hover:bg-neutral-50"
                style={{ color: ACCENT_HOVER }}
              >
                {t("pitchDeck.ctaContact")}
              </Link>
              <Link
                href={loc("/growers")}
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/65 px-6 py-3 text-[14px] font-semibold hover:bg-white/10"
              >
                {t("pitchDeck.ctaGrowers")}
              </Link>
              <Link href={loc("/for-buyers")} className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/65 px-6 py-3 text-[14px] font-semibold hover:bg-white/10">
                {t("pitchDeck.ctaBuyers")}
              </Link>
              <Link href={loc("/investors")} className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/65 px-6 py-3 text-[14px] font-semibold hover:bg-white/10">
                {t("pitchDeck.ctaInvestors")}
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
