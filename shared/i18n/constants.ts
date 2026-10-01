/** Supported product locales — keep in sync with web/i18n/config.ts and mobile/i18n/config.ts */
export const SUPPORTED_LOCALES = ['en', 'sr', 'de', 'es', 'fr', 'ro', 'bg'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export function isSupportedLocale(code: string | null | undefined): code is SupportedLocale {
  return !!code && (SUPPORTED_LOCALES as readonly string[]).includes(code);
}

/** BCP 47 tags for Intl (dates, numbers, currency). */
export const INTL_LOCALE: Record<SupportedLocale, string> = {
  en: 'en-GB',
  sr: 'sr-Latn-RS',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  ro: 'ro-RO',
  bg: 'bg-BG',
};
