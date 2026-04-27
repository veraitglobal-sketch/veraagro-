"use client";

import { I18nextProvider } from "react-i18next";
import { useEffect } from "react";
import i18n, { LOCALE_STORAGE_KEY, type SiteLocale } from "@/i18n/config";

function syncDocumentLang(lng: string) {
  const short = lng.startsWith("sr") ? "sr" : "en";
  if (typeof document !== "undefined") {
    document.documentElement.lang = short === "sr" ? "sr-Latn" : "en";
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as SiteLocale | null;
      if (stored === "sr" || stored === "en") {
        void i18n.changeLanguage(stored);
      }
    } catch {
      /* ignore */
    }
    syncDocumentLang(i18n.language);
    const handler = (lng: string) => syncDocumentLang(lng);
    i18n.on("languageChanged", handler);
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
