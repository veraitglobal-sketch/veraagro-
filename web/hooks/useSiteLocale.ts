"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import { LOCALE_STORAGE_KEY, type SiteLocale } from "@/i18n/config";
import { getSwitchLocaleTarget, pathnameStartsWithLocale, siteLocaleFromLanguageTag } from "@/lib/i18n-routing";

function setLocaleCookieClient(locale: SiteLocale) {
  try {
    document.cookie = `${LOCALE_STORAGE_KEY}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/**
 * Current locale from URL or i18n, plus one action to apply a new site language
 * (cookie, localStorage, i18n, and same navigation rules as the header switcher).
 */
export function useSiteLocale() {
  const { i18n } = useTranslation();
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  const current: SiteLocale = useMemo(() => {
    const fromUrl = pathnameStartsWithLocale(pathname);
    if (fromUrl) return fromUrl;
    return siteLocaleFromLanguageTag(i18n.resolvedLanguage);
  }, [pathname, i18n.resolvedLanguage]);

  const applyLocale = useCallback(
    (lng: SiteLocale) => {
      void i18n.changeLanguage(lng);
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, lng);
      } catch {
        /* ignore */
      }
      setLocaleCookieClient(lng);

      const target = getSwitchLocaleTarget(pathname, lng);
      if (target.kind === "navigate") {
        router.replace(target.href);
      }
    },
    [i18n, pathname, router],
  );

  return { current, applyLocale };
}
