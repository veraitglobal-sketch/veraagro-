import type { Metadata } from "next";
import type { SiteLocale } from "@/i18n/config";
import { isSiteLocale } from "@/lib/i18n-routing";
import { marketingPageMetadata } from "@/lib/marketing-page-meta";
import { getFaqItems } from "@/lib/locale-bundles";
import { JsonLd } from "@/components/JsonLd";
import { MarketingBreadcrumbJsonLd } from "@/components/marketing/MarketingBreadcrumbJsonLd";
import { buildFaqPageSchema } from "@/lib/schema/biovera-jsonld";
import { getSiteUrl } from "@/lib/site-url";
import en from "@/locales/en.json";
import sr from "@/locales/sr.json";
import de from "@/locales/de.json";
import ro from "@/locales/ro.json";
import bg from "@/locales/bg.json";
import fr from "@/locales/fr.json";
import es from "@/locales/es.json";

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : "en";
  return marketingPageMetadata(locale, "faq");
}

export default async function FaqLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : "en";
  const items = getFaqItems(locale).map((item) => ({
    question: item.q,
    answer: item.a,
  }));
  const faqSchema =
    items.length > 0
      ? buildFaqPageSchema(items, getSiteUrl(), locale)
      : null;

  const faqBundles: Record<SiteLocale, { faqPage: { title: string } }> = {
    en: en as { faqPage: { title: string } },
    sr: sr as { faqPage: { title: string } },
    de: de as { faqPage: { title: string } },
    ro: ro as { faqPage: { title: string } },
    bg: bg as { faqPage: { title: string } },
    fr: fr as { faqPage: { title: string } },
    es: es as { faqPage: { title: string } },
  };
  const faqTitle = (faqBundles[locale] ?? faqBundles.en).faqPage.title;

  return (
    <>
      <MarketingBreadcrumbJsonLd
        locale={locale}
        items={[{ name: faqTitle, segment: "faq" }]}
      />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      {children}
    </>
  );
}
