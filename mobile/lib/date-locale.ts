import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type AppLocaleTag = 'sr-Latn' | 'en-US';

/** Resolve BCP 47 tag from i18n language (usable outside React hooks). */
export function resolveAppLocaleTag(language?: string): AppLocaleTag {
  return typeof language === 'string' && language.toLowerCase().startsWith('sr') ? 'sr-Latn' : 'en-US';
}

/** BCP 47 tag for dates, times, and EUR formatting (matches other grower screens). */
export function useAppLocaleTag(): AppLocaleTag {
  const { i18n } = useTranslation();
  return useMemo(() => resolveAppLocaleTag(i18n.language), [i18n.language]);
}

export function formatAppDate(
  value: Date | string | number,
  locale: AppLocaleTag,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, options);
}

export function formatAppDateTime(
  value: Date | string | number,
  locale: AppLocaleTag,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, options);
}

export function formatAppCurrency(amount: number, locale: AppLocaleTag, currency = 'EUR'): string {
  return amount.toLocaleString(locale, { style: 'currency', currency });
}

/** Shared a11y props for icon-only buttons (App Store VoiceOver). */
export function a11yIconButton(label: string) {
  return { accessibilityRole: 'button' as const, accessibilityLabel: label };
}
