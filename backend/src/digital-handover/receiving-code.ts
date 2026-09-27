import * as crypto from 'crypto';

/**
 * Per-delivery receiving code the buyer shows at the dock ("STORE-…").
 * Derived with a server secret, so the carrier cannot produce it without being handed it on site.
 */
function secret(): string {
  const s = process.env.HANDOVER_CODE_SECRET || process.env.JWT_SECRET;
  if (!s) throw new Error('HANDOVER_CODE_SECRET or JWT_SECRET must be set');
  return s;
}

export function receivingCodeFor(deliveryId: string): string {
  const mac = crypto.createHmac('sha256', secret()).update(`receiving:${deliveryId}`).digest('hex');
  return `STORE-${mac.slice(0, 10).toUpperCase()}`;
}

/** Accepts the scanned QR or a hand-typed code (case, spaces and dashes are ignored). */
export function receivingCodeMatches(deliveryId: string, input: string): boolean {
  const norm = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const a = Buffer.from(norm(receivingCodeFor(deliveryId)));
  const b = Buffer.from(norm(input || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
