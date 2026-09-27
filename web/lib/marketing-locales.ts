import type { SiteLocale } from '@/i18n/config';

/** All public marketing locales — equal weight in sitemap and hreflang (golden 2026-09-13). */
export const MARKETING_LOCALES: SiteLocale[] = ['en', 'de', 'sr', 'bg', 'ro', 'fr', 'es'];

export const MARKETING_OG_LOCALE: Record<SiteLocale, string> = {
  en: 'en_US',
  de: 'de_DE',
  sr: 'sr_RS',
  bg: 'bg_BG',
  ro: 'ro_RO',
  fr: 'fr_FR',
  es: 'es_ES',
};
