import { INTL_LOCALE, isSupportedLocale, type SupportedLocale } from './constants';

/** Resolve BCP 47 tag from app language code (en, sr, de, …). */
export function intlLocaleFor(lang: string | null | undefined): string {
  const code = lang?.split('-')[0]?.toLowerCase();
  if (code && isSupportedLocale(code)) return INTL_LOCALE[code];
  return INTL_LOCALE.en;
}

export function formatEur(amount: number, lang: string | null | undefined, currency = 'EUR'): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const locale = intlLocaleFor(lang);
  try {
    return value.toLocaleString(locale, { style: 'currency', currency });
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatKg(kg: number, lang: string | null | undefined, decimals = 2): string {
  const value = Number.isFinite(kg) ? kg : 0;
  const locale = intlLocaleFor(lang);
  try {
    return `${value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} kg`;
  } catch {
    return `${value.toFixed(decimals)} kg`;
  }
}

export function formatDate(
  date: Date | string | number,
  lang: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString(intlLocaleFor(lang), options);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
