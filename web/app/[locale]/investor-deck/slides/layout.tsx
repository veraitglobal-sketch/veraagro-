import type { Metadata } from "next";

const OG_LOCALE: Record<string, { description: string }> = {
  sr: {
    description:
      "Bio Vera: jedinstven vertikalni operativni model za uzgajivače, kupce i logistiku širom Evrope koji prihvate Bio-Ready standarde. Podelite investitorski deck ili izvezite PDF.",
  },
  en: {
    description:
      "Bio Vera: one vertical operating model for growers, buyers and logistics partners throughout Europe who adopt Bio-Ready standards. Share this investor deck or export PDF.",
  },
  de: {
    description:
      "Bio Vera: ein vertikales Betriebsmodell für Erzeuger, Einkäufer und Logistikpartner in ganz Europa unter Bio‑Ready‑Standards. Dieses Investor‑Deck teilen oder als PDF exportieren.",
  },
};

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  const og = OG_LOCALE[locale] ?? OG_LOCALE.en;
  const title = "Investor deck | Bio Vera";
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

export default function InvestorDeckSlidesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
