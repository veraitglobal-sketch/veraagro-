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
      "Structured Bio Vera project overview for grant-style PDF uploads (e.g. Projektbeschreibung): concise narrative, outline navigation, print and save as PDF.",
  },
  de: {
    description:
      "Strukturierter Bio-Vera-Projektüberblick für Förderunterlagen (Projektbeschreibung als PDF, oft max. fünf Seiten) — Inhalt, Druck oder PDF.",
  },
  ro: {
    description:
      "Prezentarea proiectului Bio Vera pentru dosare tip PDF: concisă, navigare pe secțiuni, tipărire.",
  },
  bg: {
    description:
      "Преглед на проекта Bio Vera за подаване като PDF: стегнат текст, секции за навигация, печат.",
  },
  fr: {
    description:
      "Aperçu projet Bio Vera pour dossiers PDF: concis, sommaire cliquable, impression.",
  },
  es: {
    description:
      "Descripción del proyecto Bio Vera para PDFs de convocatorias: contenido compacto e impresión.",
  },
};

const PAGE_TITLE: Record<string, string> = {
  en: "Project overview | Bio Vera",
  sr: "Pregled projekta | Bio Vera",
  de: "Projektüberblick | Bio Vera",
  ro: "Prezentarea proiectului | Bio Vera",
  bg: "Преглед на проекта | Bio Vera",
  fr: "Aperçu du projet | Bio Vera",
  es: "Descripción del proyecto | Bio Vera",
};

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  const og = OG_LOCALE[locale] ?? OG_LOCALE.en;
  const title = PAGE_TITLE[locale] ?? PAGE_TITLE.en;
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
