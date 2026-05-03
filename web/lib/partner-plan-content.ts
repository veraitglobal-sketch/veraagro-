import fs from 'fs';
import path from 'path';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';

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

export function readPartnerPlanMarkdown(tier: ConfidentialTier): string | null {
  try {
    const p = partnerPlanMarkdownPath(tier);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}
