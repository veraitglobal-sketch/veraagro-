"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import { LegalLanguageCard } from "@/components/LegalLanguageCard";

type Props = {
  className?: string;
};

/** Terms, privacy, cookies, and language picker — reused on `/legal` and Investor Deck hub. */
export function LegalDocumentsCardGrid({ className = "" }: Props) {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const cardClass =
    "block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-[#2D5A27] hover:bg-[#2D5A27]/10";

  return (
    <div className={`grid gap-6 md:grid-cols-2 ${className}`.trim()}>
      <Link href={loc("/terms")} className={cardClass}>
        <h3 className="mb-2 text-xl font-medium text-gray-900">{t("legalPage.cardTermsTitle")}</h3>
        <p className="text-sm font-light leading-relaxed text-gray-600">{t("legalPage.cardTermsDesc")}</p>
      </Link>

      <Link href={loc("/privacy")} className={cardClass}>
        <h3 className="mb-2 text-xl font-medium text-gray-900">{t("legalPage.cardPrivacyTitle")}</h3>
        <p className="text-sm font-light leading-relaxed text-gray-600">{t("legalPage.cardPrivacyDesc")}</p>
      </Link>

      <Link href={loc("/cookies")} className={cardClass}>
        <h3 className="mb-2 text-xl font-medium text-gray-900">{t("legalPage.cardCookiesTitle")}</h3>
        <p className="text-sm font-light leading-relaxed text-gray-600">{t("legalPage.cardCookiesDesc")}</p>
      </Link>

      <LegalLanguageCard />
    </div>
  );
}
