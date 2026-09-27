import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { marketingRouteMetadata } from '@/lib/marketing-route-metadata';
import en from '@/locales/en.json';
import sr from '@/locales/sr.json';
import de from '@/locales/de.json';
import ro from '@/locales/ro.json';
import bg from '@/locales/bg.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';
import AboutPageClient from '@/components/marketing/AboutPageClient';
import { MarketingBreadcrumbJsonLd } from '@/components/marketing/MarketingBreadcrumbJsonLd';
import { JsonLd } from '@/components/JsonLd';
import { buildAboutPageJsonLd } from '@/lib/schema/marketing-jsonld';

type LocaleBundle = {
  aboutPage: {
    metaTitle?: string;
    metaDescription?: string;
    heroTitle: string;
    heroSubtitle: string;
  };
};

const bundles: Record<SiteLocale, LocaleBundle> = {
  en: en as LocaleBundle,
  sr: sr as LocaleBundle,
  de: de as LocaleBundle,
  ro: ro as LocaleBundle,
  bg: bg as LocaleBundle,
  fr: fr as LocaleBundle,
  es: es as LocaleBundle,
};

function aboutMetadata(locale: SiteLocale): Metadata {
  const b = bundles[locale] ?? bundles.en;
  const ap = b.aboutPage;
  return marketingRouteMetadata(locale, 'about', {
    metaTitle: ap.metaTitle,
    metaDescription: ap.metaDescription,
    title: ap.heroTitle,
    descriptionFallback: ap.heroSubtitle,
  });
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return aboutMetadata(locale);
}

export default async function AboutPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const ap = (bundles[locale] ?? bundles.en).aboutPage;
  return (
    <>
      <JsonLd data={buildAboutPageJsonLd(locale)} />
      <MarketingBreadcrumbJsonLd
        locale={locale}
        items={[{ name: ap.heroTitle, segment: 'about' }]}
      />
      <AboutPageClient />
    </>
  );
}
