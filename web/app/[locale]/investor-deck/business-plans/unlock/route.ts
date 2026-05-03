import { NextRequest } from 'next/server';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import type { ConfidentialUnlockResponse } from '@/lib/grower-confidential-server';
import {
  confidentialJsonResponse,
  getTierSecretsConfigured,
  unlockFromPasswordBody,
} from '@/lib/grower-confidential-server';
import { isInvestorBusinessPlansPublicEnabled } from '@/lib/investor-business-plans-public';
import {
  createInvestorPartnerPlanUnlockToken,
  hasInvestorPartnerPlanCookieSecret,
  serializeInvestorPartnerPlanClearCookie,
  serializeInvestorPartnerPlanSetCookie,
} from '@/lib/investor-business-plan-cookie';

const INTERNAL_KEYS: Array<{ tier: ConfidentialTier; flag: keyof ConfidentialUnlockResponse }> = [
  { tier: 'short', flag: 'shortTermInternal' },
  { tier: 'medium', flag: 'mediumTermInternal' },
  { tier: 'long', flag: 'longTermInternal' },
];

function stripUnsettableInternalFlags(payload: ConfidentialUnlockResponse): ConfidentialUnlockResponse {
  if (hasInvestorPartnerPlanCookieSecret()) return payload;
  const next = { ...payload };
  for (const { flag } of INTERNAL_KEYS) {
    delete (next as Record<string, unknown>)[flag as string];
  }
  return next;
}

function appendInvestorPlanCookies(res: ReturnType<typeof confidentialJsonResponse>, payload: ConfidentialUnlockResponse) {
  for (const { tier, flag } of INTERNAL_KEYS) {
    if (!payload[flag]) continue;
    const tok = createInvestorPartnerPlanUnlockToken(tier);
    if (tok) {
      res.headers.append('Set-Cookie', serializeInvestorPartnerPlanSetCookie(tier, tok));
    }
  }
}

/**
 * Confidential unlock API — colocated under investor deck (`/[locale]/investor-deck/business-plans/unlock`).
 * No copy on this route; same JSON contract as former `/api/investor/business-plans`.
 */
export async function GET() {
  if (!isInvestorBusinessPlansPublicEnabled()) {
    return confidentialJsonResponse({ error: 'disabled' as const }, 404);
  }

  const tiersConfigured = getTierSecretsConfigured();
  return confidentialJsonResponse({
    ok: true as const,
    tiersConfigured,
    tiersAvailable: tiersConfigured,
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

  const unlocked = unlockFromPasswordBody(parsed, {
    mediumTenureEligible: true,
    longTenureEligible: true,
  });
  const payload = stripUnsettableInternalFlags(unlocked);
  const res = confidentialJsonResponse(payload);
  appendInvestorPlanCookies(res, payload);
  return res;
}

export async function DELETE(request: NextRequest) {
  if (!isInvestorBusinessPlansPublicEnabled()) {
    return confidentialJsonResponse({ error: 'disabled' as const }, 404);
  }

  const tierRaw = request.nextUrl.searchParams.get('tier');
  if (tierRaw !== 'short' && tierRaw !== 'medium' && tierRaw !== 'long') {
    return confidentialJsonResponse({ error: 'bad_request' as const }, 400);
  }
  const tier = tierRaw as ConfidentialTier;

  const res = confidentialJsonResponse({ ok: true as const });
  res.headers.append('Set-Cookie', serializeInvestorPartnerPlanClearCookie(tier));
  return res;
}
