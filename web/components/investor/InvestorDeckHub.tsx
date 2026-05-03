"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";

/** Four document cards — pitch, overview, technical, password-gated partner plans (`/investor-deck/business-plans`). */
export function InvestorDeckHub() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const cardClass =
    "block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-[#2D5A27] hover:bg-[#2D5A27]/10";

  return (
    <section id="investor-deck-hub" aria-labelledby="investor-deck-documents-heading">
      <h2 id="investor-deck-documents-heading" className="mb-4 text-2xl font-light text-gray-900">
        {t("investorDeckPage.sectionDocumentsTitle")}
      </h2>
      <p className="mb-6 font-light leading-relaxed text-gray-600">{t("investorDeckPage.documentsLead")}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href={loc("/investor-deck/slides")} className={cardClass}>
          <h3 className="mb-2 text-xl font-medium text-gray-900">{t("footer.investorDeck")}</h3>
          <p className="text-sm font-light leading-relaxed text-gray-600">{t("investorDeckPage.cardPitchDesc")}</p>
        </Link>

        <Link href={loc("/project-overview")} className={cardClass}>
          <h3 className="mb-2 text-xl font-medium text-gray-900">{t("footer.projectOverview")}</h3>
          <p className="text-sm font-light leading-relaxed text-gray-600">{t("investorDeckPage.cardProjectDesc")}</p>
        </Link>

        <Link href={loc("/technical-proposal")} className={cardClass}>
          <h3 className="mb-2 text-xl font-medium text-gray-900">{t("footer.technicalProposal")}</h3>
          <p className="text-sm font-light leading-relaxed text-gray-600">{t("investorDeckPage.cardTechnicalDesc")}</p>
        </Link>

        <Link href={loc("/investor-deck/business-plans")} className={cardClass}>
          <h3 className="mb-2 text-xl font-medium text-gray-900">{t("investorDeckPage.cardConfidentialTitle")}</h3>
          <p className="text-sm font-light leading-relaxed text-gray-600">{t("investorDeckPage.cardConfidentialDesc")}</p>
        </Link>
      </div>
    </section>
  );
}
