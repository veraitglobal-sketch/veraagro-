import { getSiteUrl } from '@/lib/site-url';
import { localePath } from '@/lib/seo-metadata';
import type { SiteLocale } from '@/i18n/config';

export type BreadcrumbItem = {
  name: string;
  segment: string;
};

export function buildBreadcrumbListJsonLd(
  locale: SiteLocale,
  items: BreadcrumbItem[],
) {
  const siteUrl = getSiteUrl();
  const list = [
    { name: 'Bio Vera', segment: '' },
    ...items,
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${localePath(locale, item.segment)}`,
    })),
  };
}
