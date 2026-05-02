import type { Metadata } from "next";

const TITLE = "Bio Vera — EIC Part B narrative (draft) | Bio Vera";
const DESCRIPTION =
  "Evaluator-oriented Part B draft: Excellence, impact, implementation, budget—English; printable PDF via browser Print. Deep engineering annex lives in Detailed technical proposal.";

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

export default function EicPartBLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
