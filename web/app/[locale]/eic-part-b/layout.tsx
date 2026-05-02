import type { Metadata } from "next";

const TITLE = "Bio Vera — EU grant narrative | Bio Vera";
const DESCRIPTION =
  "This URL forwards to the Detailed technical proposal. The EU grant storyline (purpose, market, revenue, execution, budget) is part of that document — print via browser Print → Save as PDF.";
const canonicalPath = "/technical-proposal";

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://biovera.app";
  const canonical = `${base}/${locale}${canonicalPath}`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: canonical },
    twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
  };
}

export default function EicPartBLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
