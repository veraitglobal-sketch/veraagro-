"use client";

import { I18nextProvider } from "react-i18next";
import { useEffect } from "react";
import i18n, { LOCALE_STORAGE_KEY, type SiteLocale } from "@/i18n/config";

function syncDocumentLang(lng: string) {
  let htmlLang = "en";
  if (lng.startsWith("sr")) htmlLang = "sr-Latn";
  else if (lng.startsWith("de")) htmlLang = "de";
  else if (lng === "ro" || lng.startsWith("ro-")) htmlLang = "ro";
  else if (lng === "bg" || lng.startsWith("bg-")) htmlLang = "bg";
  else if (lng === "fr" || lng.startsWith("fr-")) htmlLang = "fr";
  else if (lng === "es" || lng.startsWith("es-")) htmlLang = "es";
  if (typeof document !== "undefined") {
    document.documentElement.lang = htmlLang;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as SiteLocale | null;
      if (stored === "sr" || stored === "en" || stored === "de" || stored === "ro" || stored === "bg" || stored === "fr" || stored === "es") {
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
