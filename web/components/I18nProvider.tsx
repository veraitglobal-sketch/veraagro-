"use client";

import { I18nextProvider } from "react-i18next";
import { useEffect } from "react";
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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    /** URL prefix (`/fr/...`) wins over localStorage so locale switch + refresh stay consistent. */
    const handler = (lng: string) => syncDocumentLang(lng);
    i18n.on("languageChanged", handler);

    void (async () => {
      const fromUrl = pathnameStartsWithLocale(pathname ?? "/");
      try {
        if (fromUrl) {
          await i18n.changeLanguage(fromUrl);
          if (cancelled) return;
          try {
            localStorage.setItem(LOCALE_STORAGE_KEY, fromUrl);
          } catch {
            /* ignore */
          }
          syncDocumentLang(fromUrl);
        } else {
          try {
            const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
            if (isStoredLocale(stored)) {
              await i18n.changeLanguage(stored);
              if (!cancelled) syncDocumentLang(stored);
            } else if (!cancelled) {
              syncDocumentLang(i18n.language);
            }
          } catch {
            if (!cancelled) syncDocumentLang(i18n.language);
          }
        }
      } catch {
        if (!cancelled) syncDocumentLang(i18n.language);
      }
    })();

    return () => {
      cancelled = true;
      i18n.off("languageChanged", handler);
    };
  }, [pathname, i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
