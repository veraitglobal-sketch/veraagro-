import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { WEB_API_BASE } from '@/lib/api-base';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import { hasPartnerPlanMarkdown } from '@/lib/partner-plan-content';
import { hasPartnerPlanCookieSecret } from '@/lib/partner-plan-cookie';

export type { ConfidentialTier } from '@/lib/grower-confidential-types';

/** Echoed by GET so UI can explain invite links without exposing secrets. */
export const CONFIDENTIAL_ACCESS_HEADER = 'x-grower-confidential-access';

export type ConfidentialTierAvailability = Record<ConfidentialTier, boolean>;

export type ConfidentialUrlField = 'shortTermUrl' | 'mediumTermUrl' | 'longTermUrl';

export type ConfidentialUnlockResponse = {
  ok: true;
  shortTermUrl?: string;
  mediumTermUrl?: string;
  longTermUrl?: string;
  shortTermInternal?: boolean;
  mediumTermInternal?: boolean;
  longTermInternal?: boolean;
  /** Correct password but medium/long blocked by partnership tenure rule. */
  tenureRejected?: ConfidentialTier[];
};

export type MediumLongTenureBootstrap = {
  eligible: boolean;
  minYears: number;
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

/** Minimum full calendar years since grower account creation before medium/long unlock. Use `0` to disable (e.g. dev). Default `3`. */
export function getMediumLongMinPartnershipYears(): number {
  const raw = process.env.GROWER_CONFIDENTIAL_MEDIUM_LONG_MIN_YEARS?.trim();
  if (!raw) return 3;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 3;
  return Math.floor(n);
}

function wholeYearsBetween(start: Date, end: Date): number {
  let years = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  const dayDiff = end.getDate() - start.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) years -= 1;
  return Math.max(0, years);
}

async function fetchFarmerProfileMe(
  authHeader: string | null,
): Promise<{ accountCreatedAt?: string } | null> {
  if (!authHeader || !/^Bearer\s+\S+/i.test(authHeader)) return null;
  const apiBase = WEB_API_BASE.replace(/\/$/, '');
  try {
    const res = await fetch(`${apiBase}/farmer-profile/me`, {
      method: 'GET',
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { farmer?: { accountCreatedAt?: string } };
    return data?.farmer ?? null;
  } catch {
    return null;
  }
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

/** Tier has password + markdown or external URL (and cookie secret when markdown-only). */
function readTierSecrets(tier: ConfidentialTier): { url: string | null; password: string } | null {
  const { urlKey, passKey } = TIER_ENV_KEYS[tier];
  const urlRaw = String(process.env[urlKey] ?? '').trim();
  const password = String(process.env[passKey] ?? '').trim();
  if (!password) return null;

  const md = hasPartnerPlanMarkdown(tier);
  const urlOk = urlRaw.length > 0 && isAllowedPartnerDocumentUrl(urlRaw);

  if (!md && !urlOk) return null;

  if (md && !urlOk && !hasPartnerPlanCookieSecret()) {
    return null;
  }

  return { url: urlOk ? urlRaw : null, password };
}

/** Env/content publishing status — ignores tenure (medium/long may still be locked). */
export function getTierSecretsConfigured(): ConfidentialTierAvailability {
  return {
    short: readTierSecrets('short') !== null,
    medium: readTierSecrets('medium') !== null,
    long: readTierSecrets('long') !== null,
  };
}

export async function isMediumLongTenureEligible(authHeader: string | null): Promise<boolean> {
  const minY = getMediumLongMinPartnershipYears();
  if (minY <= 0) return true;
  const row = await fetchFarmerProfileMe(authHeader);
  const iso = row?.accountCreatedAt;
  if (typeof iso !== 'string') return false;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return false;
  return wholeYearsBetween(start, new Date()) >= minY;
}

export async function resolveConfidentialBootstrap(authHeader: string | null): Promise<{
  tiersConfigured: ConfidentialTierAvailability;
  tiersAvailable: ConfidentialTierAvailability;
  mediumLongTenure: MediumLongTenureBootstrap;
}> {
  const tiersConfigured = getTierSecretsConfigured();
  const minYears = getMediumLongMinPartnershipYears();
  const eligible = minYears <= 0 ? true : await isMediumLongTenureEligible(authHeader);
  return {
    tiersConfigured,
    tiersAvailable: {
      short: tiersConfigured.short,
      medium: tiersConfigured.medium && eligible,
      long: tiersConfigured.long && eligible,
    },
    mediumLongTenure: { eligible, minYears },
  };
}

export async function verifyGrowerJwt(authHeader: string | null): Promise<boolean> {
  const row = await fetchFarmerProfileMe(authHeader);
  return row !== null;
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

export function unlockFromPasswordBody(
  body: unknown,
  ctx?: { mediumLongTenureEligible?: boolean },
): ConfidentialUnlockResponse {
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

  const tenureOk = ctx?.mediumLongTenureEligible !== false;

  const out: ConfidentialUnlockResponse = { ok: true };

  const apply = (tier: ConfidentialTier, field: ConfidentialUrlField) => {
    const cfg = readTierSecrets(tier);
    if (!cfg) return;
    const attempt = passwords[tier] ?? '';
    if (!attempt) return;
    if (!safeEqualUtf8(attempt, cfg.password)) return;
    if ((tier === 'medium' || tier === 'long') && !tenureOk) {
      const prev = out.tenureRejected ?? [];
      out.tenureRejected = [...prev, tier];
      return;
    }
    if (cfg.url) {
      out[field] = cfg.url;
    }
    if (hasPartnerPlanMarkdown(tier)) {
      if (tier === 'short') out.shortTermInternal = true;
      if (tier === 'medium') out.mediumTermInternal = true;
      if (tier === 'long') out.longTermInternal = true;
    }
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
