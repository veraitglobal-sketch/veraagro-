import { JsonLd } from '@/components/JsonLd';
import {
  buildBreadcrumbListJsonLd,
  type BreadcrumbItem,
} from '@/lib/schema/breadcrumb-jsonld';
import type { SiteLocale } from '@/i18n/config';

export function MarketingBreadcrumbJsonLd({
  locale,
  items,
}: Readonly<{
  locale: SiteLocale;
  items: BreadcrumbItem[];
}>) {
  return <JsonLd data={buildBreadcrumbListJsonLd(locale, items)} />;
}
