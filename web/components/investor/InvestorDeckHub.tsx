"use client";

import Link from "next/link";
import { FileText, FolderOpen, Presentation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import { LegalDocumentsCardGrid } from "@/components/legal/LegalDocumentsCardGrid";

export function InvestorDeckHub() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const docCard =
    "group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-[#2D5A27] hover:bg-[#2D5A27]/10";

  return (
    <section
      id="investor-deck-hub"
      className="pitch-deck-hub scroll-mt-[calc(var(--investor-nav-height,8.25rem))] rounded-none border border-gray-200/70 bg-white px-6 py-10 shadow-sm sm:rounded-2xl sm:px-10 print:rounded-none print:shadow-none"
      aria-labelledby="investor-deck-hub-heading"
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2D5A27]/85">
        {t("investorDeckPage.documentsEyebrow")}
      </p>
      <h2 id="investor-deck-hub-heading" className="mb-3 text-[1.5rem] font-semibold tracking-tight text-gray-900">
        {t("investorDeckPage.documentsTitle")}
      </h2>
      <p className="mb-8 max-w-[56ch] text-[15px] leading-relaxed text-gray-600">{t("investorDeckPage.documentsLead")}</p>

      <div className="mb-14 grid gap-6 md:grid-cols-3">
        <a href="#investor-deck-pitch" className={docCard}>
          <Presentation className="mb-4 size-[22px] shrink-0 text-[#2D5A27]" strokeWidth={1.75} aria-hidden />
          <h3 className="mb-2 text-[1.05rem] font-semibold text-gray-900 group-hover:text-[#23471f]">{t("footer.investorDeck")}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{t("investorDeckPage.cardPitchDesc")}</p>
        </a>

        <Link href={loc("/project-overview")} className={docCard}>
          <FolderOpen className="mb-4 size-[22px] shrink-0 text-[#2D5A27]" strokeWidth={1.75} aria-hidden />
          <h3 className="mb-2 text-[1.05rem] font-semibold text-gray-900 group-hover:text-[#23471f]">{t("footer.projectOverview")}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{t("investorDeckPage.cardProjectDesc")}</p>
        </Link>

        <Link href={loc("/technical-proposal")} className={docCard}>
          <FileText className="mb-4 size-[22px] shrink-0 text-[#2D5A27]" strokeWidth={1.75} aria-hidden />
          <h3 className="mb-2 text-[1.05rem] font-semibold text-gray-900 group-hover:text-[#23471f]">{t("footer.technicalProposal")}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{t("investorDeckPage.cardTechnicalDesc")}</p>
        </Link>
      </div>

      <div id="investor-deck-legal" className="scroll-mt-[calc(var(--investor-nav-height,8.25rem))] border-t border-gray-100 pt-10">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-gray-900">{t("legalPage.sectionDocumentsTitle")}</h2>
        <p className="mb-6 max-w-[56ch] text-[15px] leading-relaxed text-gray-600">{t("legalPage.sectionDocumentsLead")}</p>
        <LegalDocumentsCardGrid />
      </div>
    </section>
  );
}
