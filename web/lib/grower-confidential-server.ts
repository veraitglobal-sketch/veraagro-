import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { WEB_API_BASE } from '@/lib/api-base';

/** Echoed by GET so UI can explain invite links without exposing secrets. */
export const CONFIDENTIAL_ACCESS_HEADER = 'x-grower-confidential-access';

export type ConfidentialTier = 'short' | 'medium' | 'long';

export type ConfidentialTierAvailability = Record<ConfidentialTier, boolean>;

export type ConfidentialUrlField = 'shortTermUrl' | 'mediumTermUrl' | 'longTermUrl';

export type ConfidentialUnlockResponse = {
  ok: true;
  shortTermUrl?: string;
  mediumTermUrl?: string;
  longTermUrl?: string;
};

const TIER_ENV_KEYS: Record<ConfidentialTier, { urlKey: string; passKey: string }> = {
  short: {
    urlKey: 'GROWER_CONFIDENTIAL_BUSINESS_PLAN_SHORT_URL',
    passKey: 'GROWER_CONFIDENTIAL_BUSINESS_PLAN_SHORT_PASSWORD',
  },
  medium: {
    urlKey: 'GROWER_CONFIDENTIAL_BUSINESS_PLAN_MEDIUM_URL',
    passKey: 'GROWER_CONFIDENTIAL_BUSINESS_PLAN_MEDIUM_PASSWORD',
  },
  long: {
    urlKey: 'GROWER_CONFIDENTIAL_BUSINESS_PLAN_LONG_URL',
    passKey: 'GROWER_CONFIDENTIAL_BUSINESS_PLAN_LONG_PASSWORD',
  },
};

const MAX_PASSWORD_CHARS = 512;

export function isConfidentialSectionEnabled(): boolean {
  return (process.env.GROWER_CONFIDENTIAL_SECTION_ENABLED || '').trim().toLowerCase() === 'true';
}

export function isInviteGateConfigured(): boolean {
  return !!(process.env.GROWER_CONFIDENTIAL_ACCESS_TOKEN || '').trim();
}

/** HTTPS everywhere; HTTP allowed only for localhost dev. */
export function isAllowedPartnerDocumentUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol === 'https:') return true;
    if (
      u.protocol === 'http:' &&
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function safeEqualUtf8(a: string, b: string): boolean {
  const na = Buffer.from(a, 'utf8');
  const nb = Buffer.from(b, 'utf8');
  if (na.length !== nb.length) return false;
  return timingSafeEqual(na, nb);
}

function readTierSecrets(tier: ConfidentialTier): { url: string; password: string } | null {
  const { urlKey, passKey } = TIER_ENV_KEYS[tier];
  const url = String(process.env[urlKey] ?? '').trim();
  const password = String(process.env[passKey] ?? '').trim();
  if (!url || !password) return null;
  if (!isAllowedPartnerDocumentUrl(url)) return null;
  return { url, password };
}

export function getTierAvailability(): ConfidentialTierAvailability {
  return {
    short: readTierSecrets('short') !== null,
    medium: readTierSecrets('medium') !== null,
    long: readTierSecrets('long') !== null,
  };
}

export async function verifyGrowerJwt(authHeader: string | null): Promise<boolean> {
  if (!authHeader || !/^Bearer\s+\S+/i.test(authHeader)) return false;
  const apiBase = WEB_API_BASE.replace(/\/$/, '');
  try {
    const res = await fetch(`${apiBase}/farmer-profile/me`, {
      method: 'GET',
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type InviteGateResult = 'ok' | 'missing' | 'mismatch';

export function checkInviteGate(request: Request): InviteGateResult {
  const gate = (process.env.GROWER_CONFIDENTIAL_ACCESS_TOKEN || '').trim();
  if (!gate) return 'ok';

  const lower = request.headers.get(CONFIDENTIAL_ACCESS_HEADER)?.trim();
  const titled = request.headers.get('X-Grower-Confidential-Access')?.trim();
  const sent = lower ?? titled ?? '';

  if (!sent) return 'missing';
  if (!safeEqualUtf8(sent, gate)) return 'mismatch';
  return 'ok';
}

function sanitizePasswordAttempt(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const t = raw.trim();
  if (t.length > MAX_PASSWORD_CHARS) return '';
  return t;
}

export function unlockFromPasswordBody(body: unknown): ConfidentialUnlockResponse {
  let passwords: Partial<Record<ConfidentialTier, string>> = {};
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const p = (body as { passwords?: unknown }).passwords;
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      const o = p as Record<string, unknown>;
      passwords = {
        short: sanitizePasswordAttempt(o.short),
        medium: sanitizePasswordAttempt(o.medium),
        long: sanitizePasswordAttempt(o.long),
      };
    }
  }

  const out: ConfidentialUnlockResponse = { ok: true };

  const apply = (tier: ConfidentialTier, field: ConfidentialUrlField) => {
    const cfg = readTierSecrets(tier);
    if (!cfg) return;
    const attempt = passwords[tier] ?? '';
    if (!attempt) return;
    if (!safeEqualUtf8(attempt, cfg.password)) return;
    out[field] = cfg.url;
  };

  apply('short', 'shortTermUrl');
  apply('medium', 'mediumTermUrl');
  apply('long', 'longTermUrl');

  return out;
}

export function confidentialJsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
    },
  });
}
