import { NextRequest } from 'next/server';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import type { ConfidentialUnlockResponse } from '@/lib/grower-confidential-server';
import {
  checkInviteGate,
  confidentialJsonResponse,
  isConfidentialSectionEnabled,
  isInviteGateConfigured,
  resolveConfidentialBootstrap,
  resolvePartnerPlanTenure,
  unlockFromPasswordBody,
  verifyGrowerJwt,
} from '@/lib/grower-confidential-server';
import {
  createPartnerPlanUnlockToken,
  hasPartnerPlanCookieSecret,
  serializePartnerPlanClearCookie,
  serializePartnerPlanSetCookie,
} from '@/lib/partner-plan-cookie';

async function requireGrowerAndGate(request: NextRequest) {
  if (!isConfidentialSectionEnabled()) {
    return confidentialJsonResponse({ error: 'disabled' as const }, 404);
  }

  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  const okUser = await verifyGrowerJwt(auth);
  if (!okUser) {
    return confidentialJsonResponse({ error: 'unauthorized' as const }, 401);
  }

  const gate = checkInviteGate(request);
  if (gate === 'missing') {
    return confidentialJsonResponse({ error: 'invite_gate_missing' as const }, 403);
  }
  if (gate === 'mismatch') {
    return confidentialJsonResponse({ error: 'invite_gate_invalid' as const }, 403);
  }

  return null;
}

/** Grower app only issues reader cookies for the three horizon tiers — confidential supplement is investor-deck only. */
const INTERNAL_KEYS: Array<{ tier: ConfidentialTier; flag: keyof ConfidentialUnlockResponse }> = [
  { tier: 'short', flag: 'shortTermInternal' },
  { tier: 'medium', flag: 'mediumTermInternal' },
  { tier: 'long', flag: 'longTermInternal' },
];

function stripUnsettableInternalFlags(payload: ConfidentialUnlockResponse): ConfidentialUnlockResponse {
  if (hasPartnerPlanCookieSecret()) return payload;
  const next = { ...payload };
  for (const { flag } of INTERNAL_KEYS) {
    delete (next as Record<string, unknown>)[flag as string];
  }
  return next;
}

function appendPartnerPlanCookies(res: ReturnType<typeof confidentialJsonResponse>, payload: ConfidentialUnlockResponse) {
  for (const { tier, flag } of INTERNAL_KEYS) {
    if (!payload[flag]) continue;
    const tok = createPartnerPlanUnlockToken(tier);
    if (tok) {
      res.headers.append('Set-Cookie', serializePartnerPlanSetCookie(tier, tok));
    }
  }
}

/** Lists which plans are configured (no URLs). Same auth + invite gate as POST. */
export async function GET(request: NextRequest) {
  const deny = await requireGrowerAndGate(request);
  if (deny) return deny;

  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  const boot = await resolveConfidentialBootstrap(auth);

  return confidentialJsonResponse({
    ok: true as const,
    inviteGateActive: isInviteGateConfigured(),
    tiersConfigured: boot.tiersConfigured,
    tiersAvailable: boot.tiersAvailable,
    partnerPlanTenure: boot.partnerPlanTenure,
  });
}

/** Body: `{ passwords?: { short?, medium?, long?, confidential? } }` — returns URLs / internal flags for matching tiers; sets HttpOnly cookies for internal reader. */
export async function POST(request: NextRequest) {
  const deny = await requireGrowerAndGate(request);
  if (deny) return deny;

  let parsed: unknown = {};
  try {
    parsed = await request.json();
  } catch {
    parsed = {};
  }

  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  const tenure = await resolvePartnerPlanTenure(auth);
  const unlocked = unlockFromPasswordBody(parsed, {
    mediumTenureEligible: tenure.medium.eligible,
    longTenureEligible: tenure.long.eligible,
  });
  const payload = stripUnsettableInternalFlags(unlocked);
  const res = confidentialJsonResponse(payload);
  appendPartnerPlanCookies(res, payload);
  return res;
}

/** Clears HttpOnly reader cookie for one tier (`?tier=short|medium|long|confidential`). */
export async function DELETE(request: NextRequest) {
  const deny = await requireGrowerAndGate(request);
  if (deny) return deny;

  const tierRaw = request.nextUrl.searchParams.get('tier');
  if (tierRaw !== 'short' && tierRaw !== 'medium' && tierRaw !== 'long' && tierRaw !== 'confidential') {
    return confidentialJsonResponse({ error: 'bad_request' as const }, 400);
  }
  const tier = tierRaw as ConfidentialTier;

  const res = confidentialJsonResponse({ ok: true as const });
  res.headers.append('Set-Cookie', serializePartnerPlanClearCookie(tier));
  return res;
}
