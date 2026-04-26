import { NextResponse } from 'next/server';

/**
 * Bank requisites for wire transfer — read on the **server** at request time
 * (works even when NEXT_PUBLIC_* was missing at `next build` on CI).
 * Set in Vercel / .env: either NEXT_PUBLIC_BIOVERA_* or server aliases below.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function pick(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    const t = (v ?? '').trim();
    if (t) return t;
  }
  return '';
}

export async function GET() {
  const notesRaw = pick(
    process.env.BIOVERA_PAYMENT_NOTES,
    process.env.NEXT_PUBLIC_BIOVERA_PAYMENT_NOTES,
  );
  const extraLines = notesRaw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  const payload = {
    beneficiary: pick(
      process.env.BIOVERA_BENEFICIARY_NAME,
      process.env.NEXT_PUBLIC_BIOVERA_BENEFICIARY_NAME,
    ),
    bankName: pick(process.env.BIOVERA_BANK_NAME, process.env.NEXT_PUBLIC_BIOVERA_BANK_NAME),
    iban: pick(
      process.env.BIOVERA_BANK_IBAN,
      process.env.NEXT_PUBLIC_BIOVERA_BANK_IBAN,
    )
      .replace(/\s/g, '')
      .trim(),
    swift: pick(process.env.BIOVERA_SWIFT, process.env.NEXT_PUBLIC_BIOVERA_SWIFT),
    currency: pick(
      process.env.BIOVERA_PAYMENT_CURRENCY,
      process.env.NEXT_PUBLIC_BIOVERA_PAYMENT_CURRENCY,
    ) || 'EUR',
    extraLines,
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
