import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import PartnerPlanClientShell from './PartnerPlanClientShell';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import { readPartnerPlanMarkdown } from '@/lib/partner-plan-content';
import {
  partnerPlanCookieName,
  verifyPartnerPlanUnlockToken,
} from '@/lib/partner-plan-cookie';

function parseTier(raw: string): ConfidentialTier | null {
  if (raw === 'short' || raw === 'medium' || raw === 'long') return raw;
  return null;
}

type PageProps = {
  params: Promise<{ tier: string }>;
};

export default async function PartnerPlanPage({ params }: PageProps) {
  const { tier: tierRaw } = await params;
  const tier = parseTier(tierRaw);
  if (!tier) notFound();

  const markdown = readPartnerPlanMarkdown(tier);
  if (!markdown) notFound();

  const jar = await cookies();
  const token = jar.get(partnerPlanCookieName(tier))?.value;
  if (!verifyPartnerPlanUnlockToken(tier, token)) {
    redirect('/grower/confidential');
  }

  return <PartnerPlanClientShell tier={tier} markdown={markdown} />;
}
