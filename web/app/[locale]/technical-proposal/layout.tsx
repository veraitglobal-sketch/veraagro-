import type { Metadata } from "next";

const TITLE = "Bio Vera — Detailed technical proposal | PDF";
const DESCRIPTION =
  "Long-form Bio Vera technical proposal (English): innovation, architecture, roadmap, KPIs, team, illustrative economics—printable A4 PDF via browser Print → Save as PDF.";

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  await params;
  return {
    title: TITLE,
    description: DESCRIPTION,
    robots: { index: true, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
    twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
  };
}

export default function TechnicalProposalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
