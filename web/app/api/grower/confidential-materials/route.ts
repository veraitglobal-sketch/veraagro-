import { NextRequest } from 'next/server';
import {
  checkInviteGate,
  confidentialJsonResponse,
  getTierAvailability,
  isConfidentialSectionEnabled,
  isInviteGateConfigured,
  unlockFromPasswordBody,
  verifyGrowerJwt,
} from '@/lib/grower-confidential-server';

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

/** Lists which plans are configured (no URLs). Same auth + invite gate as POST. */
export async function GET(request: NextRequest) {
  const deny = await requireGrowerAndGate(request);
  if (deny) return deny;

  return confidentialJsonResponse({
    ok: true as const,
    inviteGateActive: isInviteGateConfigured(),
    tiersAvailable: getTierAvailability(),
  });
}

/** Body: `{ passwords?: { short?, medium?, long? } }` — returns URLs only for matching tiers. */
export async function POST(request: NextRequest) {
  const deny = await requireGrowerAndGate(request);
  if (deny) return deny;

  let parsed: unknown = {};
  try {
    parsed = await request.json();
  } catch {
    parsed = {};
  }

  const unlocked = unlockFromPasswordBody(parsed);
  return confidentialJsonResponse(unlocked);
}
