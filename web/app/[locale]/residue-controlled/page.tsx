import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { marketingRouteMetadata } from '@/lib/marketing-route-metadata';
import en from '@/locales/en.json';
import de from '@/locales/de.json';
import ResidueControlledPageClient from '@/components/marketing/ResidueControlledPageClient';
import { MarketingBreadcrumbJsonLd } from '@/components/marketing/MarketingBreadcrumbJsonLd';

type ResiduePageCopy = {
  metaTitle?: string;
  metaDescription?: string;
  title: string;
  heroLead: string;
};

type LocaleBundle = { residueControlledPage: ResiduePageCopy };

const bundles: Partial<Record<SiteLocale, LocaleBundle>> = {
  en: en as LocaleBundle,
  de: de as LocaleBundle,
};

function residueMetadata(locale: SiteLocale): Metadata {
  const rp = (bundles[locale] ?? bundles.en)!.residueControlledPage;
  return marketingRouteMetadata(locale, 'residue-controlled', {
    metaTitle: rp.metaTitle,
    metaDescription: rp.metaDescription,
    title: rp.title,
    descriptionFallback: rp.heroLead,
  });
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  return residueMetadata(isSiteLocale(loc) ? loc : 'en');
}

export default async function ResidueControlledPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const rp = (bundles[locale] ?? bundles.en)!.residueControlledPage;

  return (
    <>
      <MarketingBreadcrumbJsonLd
        locale={locale}
        items={[{ name: rp.title, segment: 'residue-controlled' }]}
      />
      <ResidueControlledPageClient />
    </>
  );
}
