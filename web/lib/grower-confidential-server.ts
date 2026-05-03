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

export type ConfidentialUrlField =
  | 'shortTermUrl'
  | 'mediumTermUrl'
  | 'longTermUrl'
  | 'confidentialTermUrl';

export type ConfidentialUnlockResponse = {
  ok: true;
  shortTermUrl?: string;
  mediumTermUrl?: string;
  longTermUrl?: string;
  confidentialTermUrl?: string;
  shortTermInternal?: boolean;
  mediumTermInternal?: boolean;
  longTermInternal?: boolean;
  confidentialTermInternal?: boolean;
  /** Correct password but tier blocked by account-age rule. */
  tenureRejected?: ConfidentialTier[];
};

export type TierTenureGate = { eligible: boolean; minYears: number };

export type PartnerPlanTenureBootstrap = {
  medium: TierTenureGate;
  long: TierTenureGate;
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
  confidential: {
    urlKey: 'GROWER_CONFIDENTIAL_BUSINESS_PLAN_CONFIDENTIAL_URL',
    passKey: 'GROWER_CONFIDENTIAL_BUSINESS_PLAN_CONFIDENTIAL_PASSWORD',
  },
};

const MAX_PASSWORD_CHARS = 512;

export function isConfidentialSectionEnabled(): boolean {
  return (process.env.GROWER_CONFIDENTIAL_SECTION_ENABLED || '').trim().toLowerCase() === 'true';
}

export function isInviteGateConfigured(): boolean {
  return !!(process.env.GROWER_CONFIDENTIAL_ACCESS_TOKEN || '').trim();
}

function parseNonNegativeIntEnv(val: string | undefined): number | null {
  if (val === undefined || val.trim() === '') return null;
  const n = Number(val.trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

/**
 * Medium- and long-term minimum full calendar years since grower account registration.
 *
 * - `GROWER_CONFIDENTIAL_MEDIUM_MIN_YEARS` — first gate (default **3**). Use **0** to disable the medium tenure check.
 * - `GROWER_CONFIDENTIAL_LONG_MIN_YEARS` — second gate (default **medium + 3**, or **6** when medium is 0). Use **0** to disable the long tenure check.
 * - Legacy: if only `GROWER_CONFIDENTIAL_MEDIUM_LONG_MIN_YEARS=Y` is set (and neither new key), both tiers use **Y** (old single-threshold behaviour).
 */
export function getPartnershipTenureThresholds(): { medium: number; long: number } {
  const legacy = parseNonNegativeIntEnv(process.env.GROWER_CONFIDENTIAL_MEDIUM_LONG_MIN_YEARS);
  const mediumExplicit = parseNonNegativeIntEnv(process.env.GROWER_CONFIDENTIAL_MEDIUM_MIN_YEARS);
  const longExplicit = parseNonNegativeIntEnv(process.env.GROWER_CONFIDENTIAL_LONG_MIN_YEARS);

  const usingLegacyOnly =
    legacy !== null && mediumExplicit === null && longExplicit === null;

  if (usingLegacyOnly) {
    return { medium: legacy, long: legacy };
  }

  const medium = mediumExplicit ?? 3;
  const longDefault = medium > 0 ? medium + 3 : 6;
  const long = longExplicit ?? longDefault;
  return { medium, long };
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

async function getGrowerAccountAgeYears(authHeader: string | null): Promise<number | null> {
  const row = await fetchFarmerProfileMe(authHeader);
  const iso = row?.accountCreatedAt;
  if (typeof iso !== 'string') return null;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return null;
  return wholeYearsBetween(start, new Date());
}

function tenureGateEligible(ageYears: number | null, minYears: number): boolean {
  if (minYears <= 0) return true;
  if (ageYears === null) return false;
  return ageYears >= minYears;
}

export async function resolvePartnerPlanTenure(
  authHeader: string | null,
): Promise<PartnerPlanTenureBootstrap> {
  const { medium: minM, long: minL } = getPartnershipTenureThresholds();
  const age = await getGrowerAccountAgeYears(authHeader);
  return {
    medium: { eligible: tenureGateEligible(age, minM), minYears: minM },
    long: { eligible: tenureGateEligible(age, minL), minYears: minL },
  };
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
    confidential: readTierSecrets('confidential') !== null,
  };
}

export async function resolveConfidentialBootstrap(authHeader: string | null): Promise<{
  tiersConfigured: ConfidentialTierAvailability;
  tiersAvailable: ConfidentialTierAvailability;
  partnerPlanTenure: PartnerPlanTenureBootstrap;
}> {
  const tiersConfigured = getTierSecretsConfigured();
  const tenure = await resolvePartnerPlanTenure(authHeader);
  return {
    tiersConfigured,
    tiersAvailable: {
      short: tiersConfigured.short,
      medium: tiersConfigured.medium && tenure.medium.eligible,
      long: tiersConfigured.long && tenure.long.eligible,
      confidential: tiersConfigured.confidential,
    },
    partnerPlanTenure: tenure,
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
  ctx?: { mediumTenureEligible?: boolean; longTenureEligible?: boolean },
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
        confidential: sanitizePasswordAttempt(o.confidential),
      };
    }
  }

  const mediumOk = ctx?.mediumTenureEligible !== false;
  const longOk = ctx?.longTenureEligible !== false;

  const out: ConfidentialUnlockResponse = { ok: true };

  const apply = (tier: ConfidentialTier, field: ConfidentialUrlField) => {
    const cfg = readTierSecrets(tier);
    if (!cfg) return;
    const attempt = passwords[tier] ?? '';
    if (!attempt) return;
    if (!safeEqualUtf8(attempt, cfg.password)) return;
    if (tier === 'medium' && !mediumOk) {
      out.tenureRejected = [...(out.tenureRejected ?? []), tier];
      return;
    }
    if (tier === 'long' && !longOk) {
      out.tenureRejected = [...(out.tenureRejected ?? []), tier];
      return;
    }
    if (cfg.url) {
      out[field] = cfg.url;
    }
    if (hasPartnerPlanMarkdown(tier)) {
      if (tier === 'short') out.shortTermInternal = true;
      if (tier === 'medium') out.mediumTermInternal = true;
      if (tier === 'long') out.longTermInternal = true;
      if (tier === 'confidential') out.confidentialTermInternal = true;
    }
  };

  apply('short', 'shortTermUrl');
  apply('medium', 'mediumTermUrl');
  apply('long', 'longTermUrl');
  apply('confidential', 'confidentialTermUrl');

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
