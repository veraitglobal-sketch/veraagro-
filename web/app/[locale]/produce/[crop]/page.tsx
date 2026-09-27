import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { generateLocaleMetadata } from '@/lib/seo-metadata';
import { MARKETING_LOCALES } from '@/lib/marketing-locales';
import { getProduce, publishedProduceSlugs } from '@/lib/guides/registry';
import GuideArticle from '@/components/marketing/GuideArticle';

export async function generateStaticParams() {
  return MARKETING_LOCALES.flatMap((locale) =>
    publishedProduceSlugs(locale).map((crop) => ({ locale, crop })),
  );
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string; crop: string }>;
}>): Promise<Metadata> {
  const { locale: loc, crop } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const produce = getProduce(locale, crop);
  if (!produce) return {};
  return generateLocaleMetadata({
    locale,
    title: `${produce.cropName} Programme`,
    description: produce.metaDescription,
    segment: `produce/${crop}`,
  });
}

export default async function ProducePage({
  params,
}: Readonly<{
  params: Promise<{ locale: string; crop: string }>;
}>) {
  const { locale: loc, crop } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const produce = getProduce(locale, crop);
  if (!produce) notFound();

  return (
    <GuideArticle
      locale={locale}
      eyebrow="Crop programme"
      title={`${produce.cropName} — Bio Vera programme`}
      lead={produce.lead}
      sections={produce.sections}
      relatedLinks={produce.relatedLinks}
    />
  );
}
