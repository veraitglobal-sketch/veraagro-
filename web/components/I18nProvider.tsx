"use client";

import { I18nextProvider } from "react-i18next";
import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import i18n, { LOCALE_STORAGE_KEY, type SiteLocale } from "@/i18n/config";
import { pathnameStartsWithLocale } from "@/lib/i18n-routing";

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

const STORED_LOCALES: readonly SiteLocale[] = ["en", "sr", "de", "ro", "bg", "fr", "es"];

function isStoredLocale(v: string | null): v is SiteLocale {
  return v !== null && (STORED_LOCALES as readonly string[]).includes(v);
}

/** Sync i18n to URL locale before children render (SSR + client) — no empty-shell gate. */
function ensureUrlLocale(urlLocale: SiteLocale | null) {
  if (!urlLocale) return;
  if ((i18n.resolvedLanguage || i18n.language) !== urlLocale) {
    i18n.language = urlLocale;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const urlLocale = pathnameStartsWithLocale(pathname ?? "/");

  ensureUrlLocale(urlLocale);

  useLayoutEffect(() => {
    if (!urlLocale) {
      return;
    }
    if ((i18n.resolvedLanguage || i18n.language) === urlLocale) {
      syncDocumentLang(urlLocale);
      return;
    }
    let cancelled = false;
    void i18n.changeLanguage(urlLocale).then(() => {
      if (cancelled) return;
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, urlLocale);
      } catch {
        /* ignore */
      }
      syncDocumentLang(urlLocale);
    });
    return () => {
      cancelled = true;
    };
  }, [urlLocale]);

  useEffect(() => {
    const handler = (lng: string) => syncDocumentLang(lng);
    i18n.on("languageChanged", handler);

    void (async () => {
      if (urlLocale) return;
      try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (isStoredLocale(stored)) {
          await i18n.changeLanguage(stored);
          syncDocumentLang(stored);
        } else {
          syncDocumentLang(i18n.language);
        }
      } catch {
        syncDocumentLang(i18n.language);
      }
    })();

    return () => {
      i18n.off("languageChanged", handler);
    };
  }, [urlLocale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
