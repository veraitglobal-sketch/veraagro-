import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { generateLocaleMetadata } from '@/lib/seo-metadata';
import { MARKETING_LOCALES } from '@/lib/marketing-locales';
import { getGuide, publishedGuideSlugs } from '@/lib/guides/registry';
import GuideArticle from '@/components/marketing/GuideArticle';

export async function generateStaticParams() {
  return MARKETING_LOCALES.flatMap((locale) =>
    publishedGuideSlugs(locale).map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string; slug: string }>;
}>): Promise<Metadata> {
  const { locale: loc, slug } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const guide = getGuide(locale, slug);
  if (!guide) return {};
  return generateLocaleMetadata({
    locale,
    title: guide.title,
    description: guide.metaDescription,
    segment: `guides/${slug}`,
  });
}

export default async function GuidePage({
  params,
}: Readonly<{
  params: Promise<{ locale: string; slug: string }>;
}>) {
  const { locale: loc, slug } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const guide = getGuide(locale, slug);
  if (!guide) notFound();

  return (
    <GuideArticle
      locale={locale}
      eyebrow={guide.eyebrow}
      title={guide.title}
      lead={guide.lead}
      sections={guide.sections}
      relatedLinks={guide.relatedLinks}
    />
  );
}
