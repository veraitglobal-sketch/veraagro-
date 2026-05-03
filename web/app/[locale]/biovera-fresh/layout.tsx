import type { Metadata } from "next";

const OG_LOCALE: Record<string, { description: string }> = {
  sr: {
    description:
      "Bio Vera Fresh koncept: maloprodajni franšizni format za svježu domaću robu, QR tragabilnost i podršku poljoprivrednicima — pregled, PDF prospekt i kontakt.",
  },
  en: {
    description:
      "Bio Vera Fresh concept: franchise-style retail for traceable local produce, QR transparency, and grower support — overview, prospect PDF, and contact.",
  },
  de: {
    description:
      "Bio Vera Fresh-Konzept: Einzelhandelsformat für nachverfolgbare regionale Ware, QR-Transparenz und Erzeugendenunterstützung — Überblick und Prospekt-PDF.",
  },
  ro: {
    description:
      "Conceptul Bio Vera Fresh: retail tip franciză pentru produse locale trasabile, transparență QR și sprijin pentru producători — prezentare și PDF.",
  },
  bg: {
    description:
      "Fresh концепцията на Bio Vera: търговски формат за проследима местна продукция, QR прозрачност и подкрепа за производители — преглед и PDF.",
  },
  fr: {
    description:
      "Concept Bio Vera Fresh : commerce type franchise pour produits locaux traçables, transparence QR et soutien aux producteurs — aperçu et PDF.",
  },
  es: {
    description:
      "Concepto Bio Vera Fresh: retail tipo franquicia para producto local trazable, transparencia QR y apoyo al productor — resumen y PDF.",
  },
};

const PAGE_TITLE: Record<string, string> = {
  en: "Fresh concept | Bio Vera",
  sr: "Fresh koncept | Bio Vera",
  de: "Fresh-Konzept | Bio Vera",
  ro: "Conceptul Fresh | Bio Vera",
  bg: "Fresh концепция | Bio Vera",
  fr: "Concept Fresh | Bio Vera",
  es: "Concepto Fresh | Bio Vera",
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

export default function BioVeraFreshLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
