import type { Metadata } from "next";

const OG_LOCALE: Record<
  string,
  { description: string }
> = {
  sr: {
    description:
      "Bio Vera pitch: vertikalni lanac od polja do maloprodaje, transparentnost i prednosti za partnere. Podelite link ili sačuvajte PDF.",
  },
  en: {
    description:
      "Bio Vera pitch deck: field-to-retail vertical chain, transparency, and partner advantages. Share the link or save as PDF.",
  },
};

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  const og = OG_LOCALE[locale] ?? OG_LOCALE.en;
  const title = "Pitch deck | Bio Vera";
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

export default function PitchDeckLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
