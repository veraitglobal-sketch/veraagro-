import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import type { ConfidentialUnlockResponse } from '@/lib/grower-confidential-server';
import {
  confidentialJsonResponse,
  getTierSecretsConfigured,
  safeEqualUtf8,
  unlockFromPasswordBody,
} from '@/lib/grower-confidential-server';
import {
  getInvestorBusinessPlansGatePassword,
  isInvestorBusinessPlansPublicEnabled,
  isInvestorGatePasswordConfigured,
} from '@/lib/investor-business-plans-public';
import {
  createInvestorBundleUnlockToken,
  createInvestorPartnerPlanUnlockToken,
  hasInvestorPartnerPlanCookieSecret,
  investorBundleCookieName,
  serializeInvestorBundleClearCookie,
  serializeInvestorBundleSetCookie,
  serializeInvestorPartnerPlanClearCookie,
  serializeInvestorPartnerPlanSetCookie,
  verifyInvestorBundleUnlockToken,
} from '@/lib/investor-business-plan-cookie';

const INTERNAL_KEYS: Array<{ tier: ConfidentialTier; flag: keyof ConfidentialUnlockResponse }> = [
  { tier: 'short', flag: 'shortTermInternal' },
  { tier: 'medium', flag: 'mediumTermInternal' },
  { tier: 'long', flag: 'longTermInternal' },
  { tier: 'confidential', flag: 'confidentialTermInternal' },
];

function stripUnsettableInternalFlags(payload: ConfidentialUnlockResponse): ConfidentialUnlockResponse {
  if (hasInvestorPartnerPlanCookieSecret()) return payload;
  const next = { ...payload };
  for (const { flag } of INTERNAL_KEYS) {
    delete (next as Record<string, unknown>)[flag as string];
  }
  return next;
}

function appendTierPlanCookies(res: ReturnType<typeof confidentialJsonResponse>, payload: ConfidentialUnlockResponse) {
  for (const { tier, flag } of INTERNAL_KEYS) {
    if (!payload[flag]) continue;
    const tok = createInvestorPartnerPlanUnlockToken(tier);
    if (tok) {
      res.headers.append('Set-Cookie', serializeInvestorPartnerPlanSetCookie(tier, tok));
    }
  }
}

function parseTierBody(raw: unknown): ConfidentialTier | null {
  if (typeof raw !== 'string') return null;
  if (raw === 'short' || raw === 'medium' || raw === 'long' || raw === 'confidential') return raw;
  return null;
}

export async function GET() {
  if (!isInvestorBusinessPlansPublicEnabled()) {
    return confidentialJsonResponse({ error: 'disabled' as const }, 404);
  }

  const jar = await cookies();
  const bundleUnlocked = verifyInvestorBundleUnlockToken(jar.get(investorBundleCookieName())?.value);
  const tiersConfigured = getTierSecretsConfigured();
  const gateConfigured = isInvestorGatePasswordConfigured();

  return confidentialJsonResponse({
    ok: true as const,
    tiersConfigured,
    tiersAvailable: tiersConfigured,
    bundleUnlocked,
    gateConfigured,
  });
}

export async function POST(request: NextRequest) {
  if (!isInvestorBusinessPlansPublicEnabled()) {
    return confidentialJsonResponse({ error: 'disabled' as const }, 404);
  }

  let parsed: unknown = {};
  try {
    parsed = await request.json();
  } catch {
    parsed = {};
  }

  const root = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};

  /** Step 1 — gate password (opens all three documents for per-tier unlock). */
  if ('bundlePassword' in root) {
    if (!isInvestorGatePasswordConfigured()) {
      return confidentialJsonResponse({ error: 'gate_not_configured' as const }, 503);
    }
    const attempt =
      typeof root.bundlePassword === 'string' ? root.bundlePassword.trim() : '';
    const expected = getInvestorBusinessPlansGatePassword();
    if (!attempt || !safeEqualUtf8(attempt, expected)) {
      return confidentialJsonResponse({ ok: false as const, error: 'wrong_password' as const }, 401);
    }
    const tok = createInvestorBundleUnlockToken();
    if (!tok) {
      return confidentialJsonResponse({ error: 'cookie_secret_missing' as const }, 503);
    }
    const res = confidentialJsonResponse({ ok: true as const, bundleOk: true as const });
    res.headers.append('Set-Cookie', serializeInvestorBundleSetCookie(tok));
    return res;
  }

  /** Step 2 — single-tier password (only after bundle cookie is set). */
  const tier = parseTierBody(root.tier);
  const tierPassword = typeof root.password === 'string' ? root.password : '';
  if (!tier || !tierPassword.trim()) {
    return confidentialJsonResponse({ error: 'bad_request' as const }, 400);
  }

  const jar = await cookies();
  if (!verifyInvestorBundleUnlockToken(jar.get(investorBundleCookieName())?.value)) {
    return confidentialJsonResponse({ error: 'bundle_required' as const }, 403);
  }

  const investorBody = {
    passwords: {
      ...(tier === 'short' ? { short: tierPassword } : {}),
      ...(tier === 'medium' ? { medium: tierPassword } : {}),
      ...(tier === 'long' ? { long: tierPassword } : {}),
      ...(tier === 'confidential' ? { confidential: tierPassword } : {}),
    },
  };

  const unlocked = unlockFromPasswordBody(investorBody, {
    mediumTenureEligible: true,
    longTenureEligible: true,
  });
  const payload = stripUnsettableInternalFlags(unlocked);

  const flagOk =
    tier === 'short'
      ? !!(payload.shortTermInternal || payload.shortTermUrl)
      : tier === 'medium'
        ? !!(payload.mediumTermInternal || payload.mediumTermUrl)
        : tier === 'long'
          ? !!(payload.longTermInternal || payload.longTermUrl)
          : !!(payload.confidentialTermInternal || payload.confidentialTermUrl);

  if (!flagOk) {
    return confidentialJsonResponse({ ok: false as const, error: 'wrong_password' as const }, 401);
  }

  const res = confidentialJsonResponse(payload);
  appendTierPlanCookies(res, payload);
  return res;
}

export async function DELETE(request: NextRequest) {
  if (!isInvestorBusinessPlansPublicEnabled()) {
    return confidentialJsonResponse({ error: 'disabled' as const }, 404);
  }

  const scope = request.nextUrl.searchParams.get('scope');
  if (scope === 'bundle') {
    const res = confidentialJsonResponse({ ok: true as const });
    res.headers.append('Set-Cookie', serializeInvestorBundleClearCookie());
    for (const tier of ['short', 'medium', 'long', 'confidential'] as const) {
      res.headers.append('Set-Cookie', serializeInvestorPartnerPlanClearCookie(tier));
    }
    return res;
  }

  const tierRaw = request.nextUrl.searchParams.get('tier');
  if (tierRaw !== 'short' && tierRaw !== 'medium' && tierRaw !== 'long' && tierRaw !== 'confidential') {
    return confidentialJsonResponse({ error: 'bad_request' as const }, 400);
  }
  const tier = tierRaw as ConfidentialTier;

  const res = confidentialJsonResponse({ ok: true as const });
  res.headers.append('Set-Cookie', serializeInvestorPartnerPlanClearCookie(tier));
  return res;
}
