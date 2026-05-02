"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Link2,
  Printer,
  Sparkles,
  Sprout,
  Truck,
  ClipboardCheck,
  Wallet,
  BadgeCheck,
  QrCode,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import Footer from "@/components/Footer";

type TextBlock = { title: string; body: string };

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

export default function PitchDeckPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const [copied, setCopied] = useState(false);

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

  const slideClass =
    "pitch-slide rounded-xl border border-gray-200 bg-white shadow-sm p-8 sm:p-10 md:p-12 min-h-[min(70vh,560px)] flex flex-col justify-center print:min-h-0 print:break-after-page print:shadow-none";

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @media print {
          .pitch-toolbar,
          .pitch-top-nav {
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

      <header className="pitch-top-nav fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href={loc("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <Image
                src="/logo1.png"
                alt={t("footer.logoAlt")}
                width={56}
                height={20}
                className="h-4 w-auto"
                priority
              />
            </Link>
            <nav className="flex gap-4 sm:gap-6 items-center text-sm text-gray-600">
              <Link href={loc("/")} className="hover:text-[#2D5A27] transition-colors hidden sm:inline">
                {t("nav.home")}
              </Link>
              <Link href={loc("/contact")} className="hover:text-[#2D5A27] transition-colors">
                {t("nav.contact")}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Sticky share / print bar */}
      <div
        className="pitch-toolbar print:hidden fixed top-14 sm:top-16 left-0 right-0 z-40 bg-[#2D5A27] text-white shadow-sm"
        role="region"
        aria-label={`${t("pitchDeck.toolbarCopyLink")} · ${t("pitchDeck.toolbarPrintPdf")}`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center gap-2 sm:gap-3 justify-between">
          <p className="text-xs sm:text-sm text-white/90 leading-snug flex-1 min-w-[200px]">
            {t("pitchDeck.introNote")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyPublicUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-xs sm:text-sm font-medium min-h-[44px] ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Link2 className="w-4 h-4 shrink-0" aria-hidden />
              {copied ? t("pitchDeck.toolbarCopied") : t("pitchDeck.toolbarCopyLink")}
            </button>
            <button
              type="button"
              onClick={openPrint}
              aria-label={t("pitchDeck.toolbarPrintAria")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white text-[#23471f] hover:bg-gray-100 px-3 py-2 text-xs sm:text-sm font-medium min-h-[44px] ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Printer className="w-4 h-4 shrink-0" aria-hidden />
              {t("pitchDeck.toolbarPrintPdf")}
            </button>
          </div>
        </div>
        <p className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 text-[11px] sm:text-xs text-white/75">
          {t("pitchDeck.toolbarHint")}
        </p>
      </div>

      <main className="pt-36 sm:pt-40 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Cover */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className={`${slideClass} bg-gradient-to-br from-white to-[#2D5A27]/[0.06] border-[#2D5A27]/25`}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-[#2D5A27] mb-3">
            {t("pitchDeck.coverEyebrow")}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 leading-tight mb-4">
            {t("pitchDeck.coverTitle")}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-light leading-relaxed max-w-2xl">
            {t("pitchDeck.coverSubtitle")}
          </p>
        </motion.section>

        {/* Why now */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={slideClass}
        >
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">{t("pitchDeck.whyTitle")}</h2>
          <p className="text-gray-600 leading-relaxed mb-6 max-w-prose">{t("pitchDeck.whyLead")}</p>
          <ul className="space-y-3">
            {whyBullets.map((line) => (
              <li key={line} className="flex gap-3 text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#2D5A27] shrink-0" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Solution + chain */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={slideClass}
        >
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">{t("pitchDeck.solutionTitle")}</h2>
          <p className="text-gray-600 leading-relaxed mb-8 max-w-prose">{t("pitchDeck.solutionLead")}</p>
          <h3 className="text-sm font-semibold text-[#2D5A27] uppercase tracking-wide mb-4">
            {t("pitchDeck.chainTitle")}
          </h3>
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-1 text-sm sm:text-base text-gray-800">
            {chainSteps.map((step, i) => (
              <span key={step} className="flex items-center gap-1 md:contents">
                <span className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-medium text-center md:inline-block">
                  {step}
                </span>
                {i < chainSteps.length - 1 && (
                  <ArrowRight
                    className="w-4 h-4 text-[#2D5A27] hidden md:inline mx-1 shrink-0"
                    aria-hidden
                  />
                )}
                {i < chainSteps.length - 1 && (
                  <span className="md:hidden text-[#2D5A27] text-xs pl-1" aria-hidden>
                    ↓
                  </span>
                )}
              </span>
            ))}
          </div>
        </motion.section>

        {/* Advantages */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={slideClass}
        >
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-8">{t("pitchDeck.advantagesTitle")}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {advantages.map((item, index) => {
              const Icon = ADV_ICONS[index % ADV_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-gray-200 p-5 hover:border-[#2D5A27]/40 transition-colors"
                >
                  <Icon className="w-6 h-6 text-[#2D5A27] mb-3" aria-hidden />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
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
          className={slideClass}
        >
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-3">{t("pitchDeck.techTitle")}</h2>
          <p className="text-gray-600 mb-8 max-w-prose">{t("pitchDeck.techLead")}</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {techItems.map((item, index) => {
              const Icon = TECH_ICONS[index % TECH_ICONS.length];
              return (
                <div key={item.title} className="border-l-2 border-[#2D5A27] pl-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-[#2D5A27]" aria-hidden />
                    <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Transparency */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`${slideClass} bg-white`}
        >
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-6">{t("pitchDeck.transparencyTitle")}</h2>
          <ul className="space-y-4">
            {transparencyBullets.map((line) => (
              <li key={line} className="flex gap-3 text-gray-700 text-base leading-relaxed">
                <QrCode className="w-5 h-5 text-[#2D5A27] shrink-0 mt-0.5" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Finance */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={slideClass}
        >
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4">{t("pitchDeck.financeTitle")}</h2>
          <p className="text-gray-600 leading-relaxed mb-6 max-w-prose">{t("pitchDeck.financeLead")}</p>
          <ul className="space-y-3">
            {financeBullets.map((line) => (
              <li key={line} className="flex gap-3 text-gray-700">
                <Wallet className="w-5 h-5 text-[#2D5A27] shrink-0 mt-0.5" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Closing CTA */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pitch-slide rounded-xl border border-gray-200 bg-[#2D5A27] text-white shadow-sm p-8 sm:p-10 print:bg-white print:text-gray-900 print:border-gray-300"
        >
          <h2 className="text-2xl sm:text-3xl font-light mb-3">{t("pitchDeck.ctaClosingTitle")}</h2>
          <p className="text-white/90 print:text-gray-600 mb-8 max-w-prose leading-relaxed">
            {t("pitchDeck.ctaClosingBody")}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              href={loc("/contact")}
              className="inline-flex justify-center items-center min-h-[48px] px-5 rounded-lg bg-white text-[#23471f] text-sm font-medium hover:bg-gray-100 ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white print:ring-[#2D5A27]"
            >
              {t("pitchDeck.ctaContact")}
            </Link>
            <Link
              href={loc("/growers")}
              className="inline-flex justify-center items-center min-h-[48px] px-5 rounded-lg border border-white/50 text-white hover:bg-white/10 text-sm font-medium print:border-gray-400 print:text-gray-900"
            >
              {t("pitchDeck.ctaGrowers")}
            </Link>
            <Link
              href={loc("/for-buyers")}
              className="inline-flex justify-center items-center min-h-[48px] px-5 rounded-lg border border-white/50 text-white hover:bg-white/10 text-sm font-medium print:border-gray-400 print:text-gray-900"
            >
              {t("pitchDeck.ctaBuyers")}
            </Link>
            <Link
              href={loc("/investors")}
              className="inline-flex justify-center items-center min-h-[48px] px-5 rounded-lg border border-white/50 text-white hover:bg-white/10 text-sm font-medium print:border-gray-400 print:text-gray-900"
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
