/**
 * Shown to buyers when order is APPROVED (bank / wire before card integration).
 * Set in deployment (Vercel, etc.):
 *   NEXT_PUBLIC_BIOVERA_BENEFICIARY_NAME, NEXT_PUBLIC_BIOVERA_BANK_IBAN,
 *   NEXT_PUBLIC_BIOVERA_BANK_NAME, NEXT_PUBLIC_BIOVERA_SWIFT, NEXT_PUBLIC_BIOVERA_PAYMENT_CURRENCY
 *   NEXT_PUBLIC_BIOVERA_PAYMENT_NOTES — optional, pipe-separated extra lines
 */

export function getPublicPaymentConfig() {
  const notes = process.env.NEXT_PUBLIC_BIOVERA_PAYMENT_NOTES || '';
  return {
    beneficiary: process.env.NEXT_PUBLIC_BIOVERA_BENEFICIARY_NAME?.trim() || '',
    iban: process.env.NEXT_PUBLIC_BIOVERA_BANK_IBAN?.replace(/\s/g, '') || '',
    bankName: process.env.NEXT_PUBLIC_BIOVERA_BANK_NAME?.trim() || '',
    swift: process.env.NEXT_PUBLIC_BIOVERA_SWIFT?.trim() || '',
    currency: (process.env.NEXT_PUBLIC_BIOVERA_PAYMENT_CURRENCY || 'EUR').trim() || 'EUR',
    extraLines: notes ? notes.split('|').map((s) => s.trim()).filter(Boolean) : [],
  };
}

export function hasAnyPaymentConfig(): boolean {
  const c = getPublicPaymentConfig();
  return Boolean(c.beneficiary || c.iban || c.bankName);
}
