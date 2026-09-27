import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { generateLocaleMetadata, pageIntentTitle } from '@/lib/seo-metadata';

type MarketingMetaFields = {
  metaTitle?: string;
  metaDescription?: string;
  title: string;
  descriptionFallback: string;
};

export function marketingRouteMetadata(
  locale: SiteLocale,
  segment: string,
  fields: MarketingMetaFields,
): Metadata {
  return generateLocaleMetadata({
    locale,
    title: pageIntentTitle(fields.metaTitle, fields.title),
    description: fields.metaDescription ?? fields.descriptionFallback,
    segment,
  });
}
