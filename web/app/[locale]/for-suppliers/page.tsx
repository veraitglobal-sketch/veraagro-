import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { marketingRouteMetadata } from '@/lib/marketing-route-metadata';
import suppliersPageEn from '@/locales/suppliers-page.en.json';
import suppliersPageSr from '@/locales/suppliers-page.sr.json';
import suppliersPageDe from '@/locales/suppliers-page.de.json';
import suppliersPageRo from '@/locales/suppliers-page.ro.json';
import suppliersPageBg from '@/locales/suppliers-page.bg.json';
import suppliersPageFr from '@/locales/suppliers-page.fr.json';
import suppliersPageEs from '@/locales/suppliers-page.es.json';
import SuppliersPageClient from '@/components/marketing/SuppliersPageClient';
import { MarketingBreadcrumbJsonLd } from '@/components/marketing/MarketingBreadcrumbJsonLd';

type SuppliersPageBundle = {
  metaTitle?: string;
  metaDescription?: string;
  hero: { title: string; subtitle: string };
};

const bundles: Record<SiteLocale, SuppliersPageBundle> = {
  en: suppliersPageEn as SuppliersPageBundle,
  sr: suppliersPageSr as SuppliersPageBundle,
  de: suppliersPageDe as SuppliersPageBundle,
  ro: suppliersPageRo as SuppliersPageBundle,
  bg: suppliersPageBg as SuppliersPageBundle,
  fr: suppliersPageFr as SuppliersPageBundle,
  es: suppliersPageEs as SuppliersPageBundle,
};

function suppliersMetadata(locale: SiteLocale): Metadata {
  const b = bundles[locale] ?? bundles.en;
  return marketingRouteMetadata(locale, 'for-suppliers', {
    metaTitle: b.metaTitle,
    metaDescription: b.metaDescription,
    title: b.hero.title,
    descriptionFallback: b.hero.subtitle,
  });
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return suppliersMetadata(locale);
}

export default async function ForSuppliersPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const b = bundles[locale] ?? bundles.en;
  return (
    <>
      <MarketingBreadcrumbJsonLd
        locale={locale}
        items={[{ name: b.hero.title, segment: 'for-suppliers' }]}
      />
      <SuppliersPageClient />
    </>
  );
}
