import type { Metadata } from "next";

const TITLE = "Data and Consent Declaration | Bio Vera";
const DESCRIPTION =
  "Declaration on personal data in proposals: consent, GDPR, participant agreement, confidentiality. Printable PDF via browser.";

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

export default function DataConsentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
