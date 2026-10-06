import type { Metadata } from "next";
import InvestorDeckHubClient from "./hub-client";

const HUB_OG_LOCALE: Record<string, { description: string }> = {
  sr: {
    description:
      "Jedna stranica sa kartama ka investitorskom prezentacije, pregledu projekta i tehničkom predlogu programa Bio Vera.",
  },
  en: {
    description:
      "One hub page linking to Bio Vera investor slides, structured project overview, and technical proposal.",
  },
  de: {
    description:
      "Zentrale Seite mit Karten zum Investor‑Deck, zur Projektübersicht und zum technischen Antrag bei Bio Vera.",
  },
};

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  const og = HUB_OG_LOCALE[locale] ?? HUB_OG_LOCALE.en;
  const title = "Investor materials | Bio Vera";
  return {
    title,
    description: og.description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: og.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: og.description,
    },
  };
}

export default function InvestorDeckHubPage() {
  return <InvestorDeckHubClient />;
}
