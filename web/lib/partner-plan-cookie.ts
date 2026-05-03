import { createHmac, timingSafeEqual } from 'crypto';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';

const TTL_MS = 8 * 60 * 60 * 1000;

export const PARTNER_PLAN_COOKIE_PREFIX = 'biovera_bp_';

function sessionSecret(): string {
  const s = process.env.GROWER_CONFIDENTIAL_SESSION_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === 'development') return '__biovera_dev_partner_plan_cookie__';
  return '';
}

/** Production needs `GROWER_CONFIDENTIAL_SESSION_SECRET` so HttpOnly reader cookies can be issued. */
export function hasPartnerPlanCookieSecret(): boolean {
  return !!sessionSecret();
}

export function partnerPlanCookieName(tier: ConfidentialTier): string {
  return `${PARTNER_PLAN_COOKIE_PREFIX}${tier}`;
}

/** Value: tier|expMs|hexHmac */
export function createPartnerPlanUnlockToken(tier: ConfidentialTier): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const exp = Date.now() + TTL_MS;
  const body = `${tier}|${exp}`;
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  return `${body}|${sig}`;
}

export function verifyPartnerPlanUnlockToken(tier: ConfidentialTier, raw: string | undefined): boolean {
  const secret = sessionSecret();
  if (!raw || !secret) return false;
  const parts = raw.split('|');
  if (parts.length !== 3) return false;
  const [t, expStr, sig] = parts;
  if (t !== tier) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const body = `${t}|${exp}`;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export function serializePartnerPlanSetCookie(tier: ConfidentialTier, token: string): string {
  const name = partnerPlanCookieName(tier);
  const maxAge = Math.floor(TTL_MS / 1000);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(token)}; Path=/grower; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function serializePartnerPlanClearCookie(tier: ConfidentialTier): string {
  const name = partnerPlanCookieName(tier);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=; Path=/grower; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
