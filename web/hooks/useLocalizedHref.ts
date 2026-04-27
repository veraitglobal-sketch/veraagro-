"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { SiteLocale } from "@/i18n/config";
import { pathnameStartsWithLocale, withLocalePrefix } from "@/lib/i18n-routing";

/** Locale from URL (`/en/...`) when present; otherwise from i18n (dashboard routes). */
export function useLocaleFromPath(): SiteLocale {
  const pathname = usePathname() ?? "/";
  const { i18n } = useTranslation();

  return useMemo(() => {
    const fromPath = pathnameStartsWithLocale(pathname);
    if (fromPath) return fromPath;
    const lng = i18n.resolvedLanguage || i18n.language || "en";
    return lng.startsWith("sr") ? "sr" : "en";
  }, [pathname, i18n.resolvedLanguage, i18n.language]);
}

/** Prefix a path like `/growers` or `/contact?x=1` with the active locale. */
export function useLocalizedHref() {
  const locale = useLocaleFromPath();
  return useCallback((path: string) => withLocalePrefix(locale, path), [locale]);
}
