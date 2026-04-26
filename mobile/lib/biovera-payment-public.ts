/**
 * Bank transfer copy for approved orders (mirrors web `NEXT_PUBLIC_BIOVERA_*` but uses Expo env).
 * Set in EAS / .env: EXPO_PUBLIC_BIOVERA_BENEFICIARY_NAME, EXPO_PUBLIC_BIOVERA_BANK_IBAN, etc.
 */

export function getExpoPublicPaymentConfig() {
  const notes = process.env.EXPO_PUBLIC_BIOVERA_PAYMENT_NOTES || '';
  return {
    beneficiary: process.env.EXPO_PUBLIC_BIOVERA_BENEFICIARY_NAME?.trim() || '',
    iban: process.env.EXPO_PUBLIC_BIOVERA_BANK_IBAN?.replace(/\s/g, '') || '',
    bankName: process.env.EXPO_PUBLIC_BIOVERA_BANK_NAME?.trim() || '',
    swift: process.env.EXPO_PUBLIC_BIOVERA_SWIFT?.trim() || '',
    currency: (process.env.EXPO_PUBLIC_BIOVERA_PAYMENT_CURRENCY || 'EUR').trim() || 'EUR',
    extraLines: notes ? notes.split('|').map((s) => s.trim()).filter(Boolean) : [],
  };
}

export function hasExpoPaymentConfig(): boolean {
  const c = getExpoPublicPaymentConfig();
  return Boolean(c.beneficiary || c.iban || c.bankName);
}
