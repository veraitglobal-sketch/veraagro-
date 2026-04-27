"use client";

import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SiteLocale } from "@/i18n/config";
import { pathnameStartsWithLocale, withLocalePrefix } from "@/lib/i18n-routing";

/**
 * Prefixes `/grower/…` links with `/sr` or `/en` to match locale-prefixed grower URLs.
 */
export function useGrowerHref() {
  const pathname = usePathname() ?? "/";
  const { i18n } = useTranslation();

  const locale: SiteLocale = useMemo(
    () =>
      pathnameStartsWithLocale(pathname) ??
      (i18n.resolvedLanguage?.startsWith("sr") ? "sr" : "en"),
    [pathname, i18n.resolvedLanguage],
  );

  return useCallback(
    (path: string) => withLocalePrefix(locale, path.startsWith("/") ? path : `/${path}`),
    [locale],
  );
}
