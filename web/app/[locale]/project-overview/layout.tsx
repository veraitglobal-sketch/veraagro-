import type { Metadata } from "next";

const OG_LOCALE: Record<
  string,
  { description: string }
> = {
  sr: {
    description:
      "Strukturisan pregled projekta Bio Vera za podnošenje kao PDF (npr. Projektbeschreibung): sažeto, do pet stranica, štampa i PDF.",
  },
  en: {
    description:
      "Structured Bio Vera project overview for grant-style PDF uploads (e.g. Projektbeschreibung): concise narrative, print and save as PDF.",
  },
  de: {
    description:
      "Strukturierter Bio-Vera-Projektüberblick für Förderunterlagen (Projektbeschreibung als PDF, oft max. fünf Seiten) — drucken oder als PDF speichern.",
  },
};

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  const og = OG_LOCALE[locale] ?? OG_LOCALE.en;
  const title = "Project overview | Bio Vera";
  return {
    title,
    description: og.description,
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

export default function ProjectOverviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
