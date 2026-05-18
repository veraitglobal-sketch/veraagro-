import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import { isInvestorBusinessPlansPublicEnabled } from '@/lib/investor-business-plans-public';
import {
  investorBundleCookieName,
  investorPartnerPlanCookieName,
  verifyInvestorBundleUnlockToken,
  verifyInvestorPartnerPlanUnlockToken,
} from '@/lib/investor-business-plan-cookie';
import { readPartnerPlanMarkdown } from '@/lib/partner-plan-content';

type RouteCtx = { params: Promise<{ locale: string; tier: string }> };

function parseTier(raw: string): ConfidentialTier | null {
  if (raw === 'short' || raw === 'medium' || raw === 'long') return raw;
  return null;
}

/**
 * Markdown for one tier after **bundle** cookie + **tier** cookie (investor two-step unlock).
 */
export async function GET(_req: Request, ctx: RouteCtx) {
  if (!isInvestorBusinessPlansPublicEnabled()) {
    return NextResponse.json({ error: 'disabled' as const }, { status: 404 });
  }

  const { locale, tier: raw } = await ctx.params;
  const tier = parseTier(raw);
  if (!tier) {
    return NextResponse.json({ error: 'bad_request' as const }, { status: 400 });
  }

  const jar = await cookies();
  if (!verifyInvestorBundleUnlockToken(jar.get(investorBundleCookieName())?.value)) {
    return NextResponse.json({ error: 'bundle_required' as const }, { status: 403 });
  }

  const token = jar.get(investorPartnerPlanCookieName(tier))?.value;
  if (!verifyInvestorPartnerPlanUnlockToken(tier, token)) {
    return NextResponse.json({ error: 'unauthorized' as const }, { status: 401 });
  }

  const markdown = readPartnerPlanMarkdown(tier, locale);
  if (!markdown) {
    return NextResponse.json({ error: 'not_found' as const }, { status: 404 });
  }

  return NextResponse.json(
    { markdown },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
      },
    },
  );
}
