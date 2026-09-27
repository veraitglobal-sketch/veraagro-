import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { marketingPageMetadata } from '@/lib/marketing-page-meta';
import { JsonLd } from '@/components/JsonLd';
import { MarketingBreadcrumbJsonLd } from '@/components/marketing/MarketingBreadcrumbJsonLd';
import { buildContactPageJsonLd } from '@/lib/schema/marketing-jsonld';
import en from '@/locales/en.json';
import sr from '@/locales/sr.json';

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return marketingPageMetadata(locale, 'contact');
}

export default async function ContactLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const title =
    locale === 'sr'
      ? (sr as { contactPage: { heroTitle: string } }).contactPage.heroTitle
      : en.contactPage.heroTitle;

  return (
    <>
      <JsonLd data={buildContactPageJsonLd(locale)} />
      <MarketingBreadcrumbJsonLd
        locale={locale}
        items={[{ name: title, segment: 'contact' }]}
      />
      {children}
    </>
  );
}
