import type { Metadata } from "next";

const OG_LOCALE: Record<
  string,
  { description: string }
> = {
  sr: {
    description:
      "Bio Vera: jedinstven vertikalni operativni model za uzgajivače, kupce i logistiku širom sveta koji prihvate Bio-Ready standarde. Delite prezentacionu stranu ili izvezite PDF.",
  },
  en: {
    description:
      "Bio Vera: one vertical operating model for growers, buyers and logistics partners worldwide who adopt Bio-Ready standards. Share this deck or export PDF.",
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
