import type { Metadata } from "next";

const TITLE = "Bio Vera — Detailed technical proposal | PDF";
const DESCRIPTION =
  "Long-form Bio Vera proposal (English): EU grant narrative (purpose, market, economics, execution, budget), full programme diagnosis, innovation, architecture, roadmap, KPIs, team and risk—printable A4 PDF via Print → Save as PDF.";

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  await params;
  return {
    title: TITLE,
    description: DESCRIPTION,
    robots: { index: false, follow: false },
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
    twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
  };
}

export default function TechnicalProposalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
