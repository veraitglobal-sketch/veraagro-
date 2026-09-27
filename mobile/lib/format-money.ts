/** Locale currency string (e.g. "1.234,50 €" in sr-Latn). Falls back if the currency code is unknown. */
export function formatEur(amount: number, locale: string, currency = 'EUR'): string {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return value.toLocaleString(locale, { style: 'currency', currency });
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
