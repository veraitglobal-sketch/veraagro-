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
import ForBuyersPageClient from '@/components/marketing/ForBuyersPageClient';
import { MarketingBreadcrumbJsonLd } from '@/components/marketing/MarketingBreadcrumbJsonLd';

type LocaleBundle = {
  forBuyersPage: {
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

function forBuyersMetadata(locale: SiteLocale): Metadata {
  const b = bundles[locale] ?? bundles.en;
  const fb = b.forBuyersPage;
  return marketingRouteMetadata(locale, 'for-buyers', {
    metaTitle: fb.metaTitle,
    metaDescription: fb.metaDescription,
    title: fb.title,
    descriptionFallback: fb.heroLead,
  });
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return forBuyersMetadata(locale);
}

export default async function ForBuyersPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const fb = (bundles[locale] ?? bundles.en).forBuyersPage;
  return (
    <>
      <MarketingBreadcrumbJsonLd
        locale={locale}
        items={[{ name: fb.title, segment: 'for-buyers' }]}
      />
      <ForBuyersPageClient />
    </>
  );
}
