import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  hasInvestorDocument,
  readInvestorDocument,
  type InvestorDocumentId,
} from '@/lib/investor-document-content';
import InvestorDocumentReaderShell from '@/components/investor/InvestorDocumentReaderShell';

const VALID_IDS: InvestorDocumentId[] = [
  'projektbeschreibung-2026',
  'businessplan-2026',
  'pitch-deck-2026',
];

function parseDocId(raw: string): InvestorDocumentId | null {
  return VALID_IDS.includes(raw as InvestorDocumentId) ? (raw as InvestorDocumentId) : null;
}

type PageProps = {
  params: Promise<{ locale: string; docId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { docId } = await params;
  const id = parseDocId(docId);
  if (!id) return { title: 'Document' };
  const titles: Record<InvestorDocumentId, string> = {
    'projektbeschreibung-2026': 'Bio Vera — Projektbeschreibung 2026',
    'businessplan-2026': 'Bio Vera — Businessplan 2026',
    'pitch-deck-2026': 'Bio Vera — Pitch Deck 2026',
  };
  return {
    title: titles[id],
    robots: { index: false, follow: false },
  };
}

export default async function InvestorDocumentPage({ params }: PageProps) {
  const { locale, docId: raw } = await params;
  const docId = parseDocId(raw);
  if (!docId || !hasInvestorDocument(docId)) notFound();

  const markdown = readInvestorDocument(docId);
  if (!markdown) notFound();

  if (locale !== 'de') {
    notFound();
  }

  return (
    <InvestorDocumentReaderShell
      docId={docId}
      markdown={markdown}
      backHref={`/${locale}/investor-deck`}
    />
  );
}
