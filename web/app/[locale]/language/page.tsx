"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import Footer from "@/components/Footer";
import { useLocalizedHref } from "@/hooks/useLocalizedHref";
import { useSiteLocale } from "@/hooks/useSiteLocale";
import { siteLocales } from "@/lib/i18n-routing";
export default function LanguageSettingsPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const { current, applyLocale } = useSiteLocale();

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-sm font-medium text-[#2D5A27] mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              {t("languagePage.eyebrow")}
            </p>
            <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">{t("languagePage.title")}</h1>
            <p className="text-gray-600 font-light leading-relaxed text-base sm:text-lg">{t("languagePage.intro")}</p>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-light text-gray-900 mb-2">{t("languagePage.sectionTitle")}</h2>
            <p className="text-sm text-gray-500 mb-6 font-light">{t("languagePage.sectionSubtitle")}</p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
              {siteLocales.map((code) => {
                const isActive = current === code;
                return (
                  <div
                    key={code}
                    className={`relative flex flex-col rounded-lg border p-6 transition-colors ${
                      isActive
                        ? "border-[#2D5A27] bg-[#2D5A27]/[0.04] ring-1 ring-[#2D5A27]/20"
                        : "border-gray-200 bg-white hover:border-[#2D5A27]/40 hover:bg-gray-50/80"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-[#2D5A27] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                        {t("languagePage.activeBadge")}
                      </span>
                    )}
                    <h3 className="text-lg font-medium text-gray-900 pr-24 mb-2">
                      {t(`languagePage.locales.${code}.title` as const)}
                    </h3>
                    <p className="text-sm text-gray-600 font-light leading-relaxed flex-1 mb-6">
                      {t(`languagePage.locales.${code}.body` as const)}
                    </p>
                    <button
                      type="button"
                      disabled={isActive}
                      onClick={() => applyLocale(code)}
                      className={`mt-auto inline-flex w-full sm:w-auto items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "cursor-default border border-gray-200 bg-white text-gray-400"
                          : "bg-[#2D5A27] text-white hover:bg-[#23471f]"
                      }`}
                    >
                      {isActive ? t("languagePage.alreadyUsing") : t("languagePage.useThisLanguage")}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-6">
              <p className="text-sm text-gray-600 font-light leading-relaxed">{t("languagePage.futureNote")}</p>
            </div>

            <p className="mt-8 text-center text-sm text-gray-500 font-light">
              <Link href={loc("/legal")} className="text-[#2D5A27] hover:underline">
                {t("languagePage.backToLegal")}
              </Link>
              {" · "}
              <Link href={loc("/")} className="text-[#2D5A27] hover:underline">
                {t("languagePage.backHome")}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
