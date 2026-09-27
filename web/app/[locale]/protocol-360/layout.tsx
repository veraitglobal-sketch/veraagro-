import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { generateLocaleMetadata } from '@/lib/seo-metadata';
import { getLocaleBundle } from '@/lib/locale-bundles';
import { MarketingBreadcrumbJsonLd } from '@/components/marketing/MarketingBreadcrumbJsonLd';

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const p = getLocaleBundle(locale).protocol360Page;
  const title = 'Protocol 360 — Quality & Traceability';
  const description =
    p?.threeTierSystem ??
    'Three-tier quality control from field audit through packaging to cold-chain transport.';
  return generateLocaleMetadata({
    locale,
    title,
    description,
    segment: 'protocol-360',
  });
}

export default async function Protocol360Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return (
    <>
      <MarketingBreadcrumbJsonLd
        locale={locale}
        items={[{ name: 'Protocol 360', segment: 'protocol-360' }]}
      />
      {children}
    </>
  );
}
