import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import { readPartnerPlanMarkdown } from '@/lib/partner-plan-content';
import {
  investorBundleCookieName,
  investorPartnerPlanCookieName,
  verifyInvestorBundleUnlockToken,
  verifyInvestorPartnerPlanUnlockToken,
} from '@/lib/investor-business-plan-cookie';
import InvestorBusinessPlanReaderShell from '@/components/investor/InvestorBusinessPlanReaderShell';

function parseTier(raw: string): ConfidentialTier | null {
  if (raw === 'short' || raw === 'medium' || raw === 'long') return raw;
  return null;
}

type PageProps = {
  params: Promise<{ locale: string; tier: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

export default async function InvestorBusinessPlanPage({ params }: PageProps) {
  const { locale, tier: tierRaw } = await params;
  const tier = parseTier(tierRaw);
  if (!tier) notFound();

  const markdown = readPartnerPlanMarkdown(tier);
  if (!markdown) notFound();

  const jar = await cookies();
  if (!verifyInvestorBundleUnlockToken(jar.get(investorBundleCookieName())?.value)) {
    redirect(`/${locale}/investor-deck/business-plans`);
  }

  const token = jar.get(investorPartnerPlanCookieName(tier))?.value;
  if (!verifyInvestorPartnerPlanUnlockToken(tier, token)) {
    redirect(`/${locale}/investor-deck/business-plans`);
  }

  const backHref = `/${locale}/investor-deck/business-plans`;

  return <InvestorBusinessPlanReaderShell tier={tier} markdown={markdown} backHref={backHref} />;
}
