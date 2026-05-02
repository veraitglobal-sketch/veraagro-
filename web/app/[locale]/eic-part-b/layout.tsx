import type { Metadata } from "next";

const TITLE = "Bio Vera — EU Part B narrative (why, market, revenue, success) | Bio Vera";
const DESCRIPTION =
  "Grant-oriented Part B draft in English: why Bio Vera exists, market size, how we earn, why we will succeed, plus implementation and budget. Printable PDF via browser Print.";

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
