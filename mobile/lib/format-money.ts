import { formatEur as sharedFormatEur } from '../../shared/i18n/format';

/** Locale currency string — delegates to shared/i18n/format (same rules as web). */
export function formatEur(amount: number, locale: string, currency = 'EUR'): string {
  return sharedFormatEur(amount, locale, currency);
}
