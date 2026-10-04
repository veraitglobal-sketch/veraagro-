/** Parse QR / barcode scan payloads into passport navigation targets. */

export type ParsedPassportScan =
  | { kind: 'batch'; batchId: string }
  | { kind: 'passport'; batchId: string; badgeSerial: string | null }
  | { kind: 'badge'; badgeSerial: string };

const PUBLIC_BADGE_PATH = /\/public\/badges\/([^/?#]+)/i;
const PASSPORT_PATH = /\/passport\/([^/?#]+)/i;
/** Legacy consumer QR from generateBatchQR — /verify/BATCH-… (not /verify/seed/…) */
const VERIFY_BATCH_PATH = /\/verify\/(?!seed\/)([^/?#]+)/i;

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function stripBioVeraPrefix(batchId: string): string {
  return batchId.startsWith('BIO-VERA-') ? batchId.slice('BIO-VERA-'.length) : batchId;
}

/** Extract badge serial from a public badge API URL or path fragment. */
export function extractBadgeSerialFromScan(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const badgeMatch = trimmed.match(PUBLIC_BADGE_PATH);
  if (badgeMatch?.[1]) return decodeSegment(badgeMatch[1]);

  try {
    const url = new URL(trimmed);
    const pathMatch = url.pathname.match(PUBLIC_BADGE_PATH);
    if (pathMatch?.[1]) return decodeSegment(pathMatch[1]);
  } catch {
    /* not a URL */
  }

  return null;
}

/** Parse scan input into batch-only, passport+badge, or badge-serial resolution. */
export function parsePassportScanInput(raw: string): ParsedPassportScan | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const badgeFromUrl = extractBadgeSerialFromScan(trimmed);
  if (badgeFromUrl) {
    return { kind: 'badge', badgeSerial: badgeFromUrl };
  }

  const parsePassportLikePath = (pathname: string, query: string): ParsedPassportScan | null => {
    const passportMatch = pathname.match(PASSPORT_PATH) ?? pathname.match(VERIFY_BATCH_PATH);
    if (!passportMatch?.[1]) return null;
    const params = query ? new URLSearchParams(query.startsWith('?') ? query.slice(1) : query) : new URLSearchParams();
    return {
      kind: 'passport',
      batchId: stripBioVeraPrefix(decodeSegment(passportMatch[1])),
      badgeSerial: params.get('badge')?.trim() || null,
    };
  };

  try {
    const url = new URL(trimmed);
    const fromUrl = parsePassportLikePath(url.pathname, url.search);
    if (fromUrl) return fromUrl;
  } catch {
    /* not a URL */
  }

  const qIndex = trimmed.indexOf('?');
  const pathPart = qIndex >= 0 ? trimmed.slice(0, qIndex) : trimmed;
  const queryPart = qIndex >= 0 ? trimmed.slice(qIndex) : '';
  const fromPath = parsePassportLikePath(pathPart, queryPart);
  if (fromPath) return fromPath;

  if (trimmed.startsWith('BIO-VERA-')) {
    return { kind: 'batch', batchId: stripBioVeraPrefix(trimmed) };
  }

  return { kind: 'batch', batchId: trimmed };
}

/** Append badge query param to a passport URL returned by publicResolve. */
export function passportUrlWithBadge(basePassportUrl: string, badgeSerial: string): string {
  const url = new URL(basePassportUrl);
  url.searchParams.set('badge', badgeSerial);
  return url.toString();
}
