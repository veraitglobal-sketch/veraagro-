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
import LogisticsPartnerPageClient from '@/components/marketing/LogisticsPartnerPageClient';
import { MarketingBreadcrumbJsonLd } from '@/components/marketing/MarketingBreadcrumbJsonLd';

type LocaleBundle = {
  logisticsPartnerPage: {
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

function logisticsMetadata(locale: SiteLocale): Metadata {
  const b = bundles[locale] ?? bundles.en;
  const lp = b.logisticsPartnerPage;
  return marketingRouteMetadata(locale, 'for-logistics', {
    metaTitle: lp.metaTitle,
    metaDescription: lp.metaDescription,
    title: lp.title,
    descriptionFallback: lp.heroLead,
  });
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return logisticsMetadata(locale);
}

export default async function ForLogisticsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const lp = (bundles[locale] ?? bundles.en).logisticsPartnerPage;
  return (
    <>
      <MarketingBreadcrumbJsonLd
        locale={locale}
        items={[{ name: lp.title, segment: 'for-logistics' }]}
      />
      <LogisticsPartnerPageClient />
    </>
  );
}
