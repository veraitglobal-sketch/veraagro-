"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";

/**
 * Fourth card on the legal hub: language settings (Vera card style, localized href).
 */
export function LegalLanguageCard() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  return (
    <Link
      href={loc("/language")}
      className="group block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-[#2D5A27] hover:bg-[#2D5A27]/10"
    >
      <div className="flex items-center gap-2 mb-2 text-[#2D5A27]">
        <Globe className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        <h3 className="text-xl font-medium text-gray-900 group-hover:text-[#2D5A27]">
          {t("languagePage.cardLinkTitle")}
        </h3>
      </div>
      <p className="text-sm text-gray-600 font-light">{t("languagePage.cardLinkBody")}</p>
    </Link>
  );
}
