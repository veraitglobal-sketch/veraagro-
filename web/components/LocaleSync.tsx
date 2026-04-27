"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SiteLocale } from "@/i18n/config";
import { LOCALE_STORAGE_KEY } from "@/i18n/config";

export function LocaleSync({ locale }: { locale: SiteLocale }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    void i18n.changeLanguage(locale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale, i18n]);

  return null;
}
