import type { Metadata } from "next";

const META: Record<string, { description: string }> = {
  sr: {
    description:
      "Tehnički predlog Bio Vere — štampa ili PDF za međunarodne prijave. Detaljni inženjerski dokument (telo na engleskom); navigacija po poglavljima.",
  },
  en: {
    description:
      "Bio Vera detailed technical proposal for grants and diligence — printable / save as PDF with chapter outline and structured engineering narrative.",
  },
  de: {
    description:
      "Ausführlicher technischer Projekt-/Systemvorschlag Bio Vera zum Drucken oder als PDF – Kapitelgliederung, technischer Haupttext auf Englisch.",
  },
  ro: {
    description:
      "Propunere tehnică detaliată Bio Vera pentru tipărire/PDF și due diligence.",
  },
  bg: {
    description:
      "Подробно техническо предложение на Bio Vera за печат/PDF.",
  },
  fr: {
    description:
      "Proposition technique détaillée Bio Vera pour impression ou export PDF.",
  },
  es: {
    description:
      "Propuesta técnica detallada de Bio Vera para impresión o PDF.",
  },
};

const TITLE: Record<string, string> = {
  en: "Technical proposal | Bio Vera",
  sr: "Tehnički predlog | Bio Vera",
  de: "Technisches Konzept | Bio Vera",
  ro: "Propunere tehnică | Bio Vera",
  bg: "Техническо предложение | Bio Vera",
  fr: "Proposition technique | Bio Vera",
  es: "Propuesta técnica | Bio Vera",
};

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] ?? META.en;
  const title = TITLE[locale] ?? TITLE.en;
  return {
    title,
    description: m.description,
    robots: { index: true, follow: true },
    openGraph: { title, description: m.description, type: "website" },
    twitter: { card: "summary", title, description: m.description },
  };
}

export default function TechnicalProposalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
