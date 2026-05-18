import fs from 'fs';
import path from 'path';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import { readInvestorDocument } from '@/lib/investor-document-content';

export function partnerPlanMarkdownPath(tier: ConfidentialTier): string {
  return path.join(process.cwd(), 'content', 'partner-plans', `${tier}.md`);
}

export function hasPartnerPlanMarkdown(tier: ConfidentialTier): boolean {
  try {
    return fs.existsSync(partnerPlanMarkdownPath(tier));
  } catch {
    return false;
  }
}

export function readPartnerPlanMarkdown(tier: ConfidentialTier, locale?: string): string | null {
  if (locale === 'de' && tier === 'long') {
    const dePlan = readInvestorDocument('businessplan-2026');
    if (dePlan) return dePlan;
  }
  try {
    const p = partnerPlanMarkdownPath(tier);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}
