import { createHmac, timingSafeEqual } from 'crypto';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';

const TTL_MS = 8 * 60 * 60 * 1000;

export const INVESTOR_PARTNER_PLAN_COOKIE_PREFIX = 'biovera_invbp_';

function sessionSecret(): string {
  const s = process.env.GROWER_CONFIDENTIAL_SESSION_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === 'development') return '__biovera_dev_partner_plan_cookie__';
  return '';
}

export function hasInvestorPartnerPlanCookieSecret(): boolean {
  return !!sessionSecret();
}

export function investorPartnerPlanCookieName(tier: ConfidentialTier): string {
  return `${INVESTOR_PARTNER_PLAN_COOKIE_PREFIX}${tier}`;
}

export function createInvestorPartnerPlanUnlockToken(tier: ConfidentialTier): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const exp = Date.now() + TTL_MS;
  const body = `${tier}|${exp}|inv`;
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  return `${body}|${sig}`;
}

export function verifyInvestorPartnerPlanUnlockToken(tier: ConfidentialTier, raw: string | undefined): boolean {
  const secret = sessionSecret();
  if (!raw || !secret) return false;
  const parts = raw.split('|');
  if (parts.length !== 4) return false;
  const [t, expStr, kind, sig] = parts;
  if (t !== tier || kind !== 'inv') return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const body = `${t}|${exp}|${kind}`;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/** Site-wide path so `/[locale]/investor-deck/...` receives the cookie. */
export function serializeInvestorPartnerPlanSetCookie(tier: ConfidentialTier, token: string): string {
  const name = investorPartnerPlanCookieName(tier);
  const maxAge = Math.floor(TTL_MS / 1000);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function serializeInvestorPartnerPlanClearCookie(tier: ConfidentialTier): string {
  const name = investorPartnerPlanCookieName(tier);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
