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
import GrowersPageClient from '@/components/marketing/GrowersPageClient';
import { MarketingBreadcrumbJsonLd } from '@/components/marketing/MarketingBreadcrumbJsonLd';

type LocaleBundle = {
  growersPage: {
    metaTitle?: string;
    metaDescription?: string;
    title: string;
    heroLead: string;
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

function growersMetadata(locale: SiteLocale): Metadata {
  const b = bundles[locale] ?? bundles.en;
  const gp = b.growersPage;
  return marketingRouteMetadata(locale, 'for-growers', {
    metaTitle: gp.metaTitle,
    metaDescription: gp.metaDescription,
    title: gp.title,
    descriptionFallback: gp.heroLead,
  });
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return growersMetadata(locale);
}

export default async function ForGrowersPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const gp = (bundles[locale] ?? bundles.en).growersPage;
  return (
    <>
      <MarketingBreadcrumbJsonLd
        locale={locale}
        items={[{ name: gp.title, segment: 'for-growers' }]}
      />
      <GrowersPageClient />
    </>
  );
}
