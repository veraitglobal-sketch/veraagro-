import * as crypto from 'crypto';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SERIAL_RE = /^BV-(\d{2})-([A-Z0-9]{3,12})-(\d{6})-([0-9A-HJKMNP-TV-Z]{4})$/i;

export function seedLabelSecret(): string {
  const s = process.env.SEED_LABEL_SECRET || process.env.JWT_SECRET;
  if (!s) throw new Error('SEED_LABEL_SECRET or JWT_SECRET must be set');
  return s;
}

function encodeCheck(payload: string): string {
  const digest = crypto.createHmac('sha256', seedLabelSecret()).update(payload).digest();
  let value = 0;
  let bits = 0;
  let out = '';
  for (let i = 0; i < digest.length && out.length < 4; i++) {
    value = (value << 8) | digest[i];
    bits += 8;
    while (bits >= 5 && out.length < 4) {
      bits -= 5;
      out += CROCKFORD[(value >> bits) & 31];
    }
  }
  return out.slice(0, 4);
}

export function buildSeedSerial(year: number, lot: string, bagNo: number): string {
  const yy = String(year).slice(-2);
  const lotUp = lot.toUpperCase();
  const bag = String(bagNo).padStart(6, '0');
  const payload = `BV-${yy}-${lotUp}-${bag}`;
  const check = encodeCheck(payload);
  return `${payload}-${check}`;
}

export function verifyUrlForSerial(serial: string): string {
  return `https://biovera.app/s/${serial}`;
}

/** Extract serial from bare code, URL, or scanner input with noise. */
export function extractSerialFromInput(raw: string): string {
  let s = (raw || '').trim();
  if (!s) return s;

  try {
    if (/^https?:\/\//i.test(s) || s.startsWith('www.')) {
      const url = new URL(s.startsWith('www.') ? `https://${s}` : s);
      const path = url.pathname.replace(/\/+$/, '');
      const m =
        path.match(/\/s\/([^/?#]+)/i) ||
        path.match(/\/verify\/seed\/([^/?#]+)/i);
      if (m?.[1]) s = decodeURIComponent(m[1]);
    }
  } catch {
    /* keep raw */
  }

  const compact = s.replace(/\s+/g, '').toUpperCase();
  if (compact.includes('-')) return compact;
  const m = compact.match(/^BV(\d{2})([A-Z0-9]{3,12})(\d{6})([0-9A-HJKMNP-TV-Z]{4})$/);
  if (m) return `BV-${m[1]}-${m[2]}-${m[3]}-${m[4]}`;
  return compact;
}

export type ParseSeedSerialResult =
  | { ok: true; year: number; lot: string; bagNo: number; serial: string }
  | { ok: false; reason: 'FORMAT' | 'CHECK' };

export function parseSeedSerial(input: string): ParseSeedSerialResult {
  const normalized = extractSerialFromInput(input);
  const m = normalized.match(SERIAL_RE);
  if (!m) return { ok: false, reason: 'FORMAT' };

  const yy = parseInt(m[1], 10);
  const lot = m[2].toUpperCase();
  const bagNo = parseInt(m[3], 10);
  const check = m[4].toUpperCase();
  const year = yy >= 70 ? 1900 + yy : 2000 + yy;
  const payload = `BV-${m[1]}-${lot}-${m[3]}`;
  const expected = encodeCheck(payload);

  const a = Buffer.from(expected);
  const b = Buffer.from(check);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'CHECK' };
  }

  return {
    ok: true,
    year,
    lot,
    bagNo,
    serial: `${payload}-${check}`,
  };
}

export function isBioVeraSerialFormat(input: string): boolean {
  const normalized = extractSerialFromInput(input);
  return /^BV-/i.test(normalized);
}
