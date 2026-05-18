import fs from 'fs';
import path from 'path';

export type InvestorDocumentId =
  | 'projektbeschreibung-2026'
  | 'businessplan-2026'
  | 'pitch-deck-2026';

const FILE_BY_ID: Record<InvestorDocumentId, string> = {
  'projektbeschreibung-2026': 'de-projektbeschreibung-2026.md',
  'businessplan-2026': 'de-businessplan-2026.md',
  'pitch-deck-2026': 'de-pitch-deck-2026.md',
};

function contentRoot(): string {
  return path.join(process.cwd(), 'content', 'investor-de');
}

export function investorDocumentPath(id: InvestorDocumentId): string {
  return path.join(contentRoot(), FILE_BY_ID[id]);
}

export function hasInvestorDocument(id: InvestorDocumentId): boolean {
  try {
    return fs.existsSync(investorDocumentPath(id));
  } catch {
    return false;
  }
}

/** Full German source documents from Förderantrag PDFs (2026). */
export function readInvestorDocument(id: InvestorDocumentId): string | null {
  try {
    const p = investorDocumentPath(id);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}
