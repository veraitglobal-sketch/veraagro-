import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { getFaqItems, getLocaleBundle } from '@/lib/locale-bundles';
import FaqPageClient, { type FaqPageInitial } from '@/components/marketing/FaqPageClient';

function faqInitial(locale: SiteLocale): FaqPageInitial {
  const fp = getLocaleBundle(locale).faqPage ?? getLocaleBundle('en').faqPage;
  return {
    title: fp.title ?? 'FAQ',
    subtitle: fp.subtitle ?? '',
    searchPlaceholder: fp.searchPlaceholder ?? '',
    catAll: fp.catAll ?? 'All',
    catGeneral: fp.catGeneral ?? 'General',
    catGrowers: fp.catGrowers ?? 'Growers',
    catBuyers: fp.catBuyers ?? 'Buyers',
    catLogistics: fp.catLogistics ?? 'Logistics',
    catTechnical: fp.catTechnical ?? 'Technical',
    empty: fp.empty ?? '',
    ctaTitle: fp.ctaTitle ?? '',
    ctaBody: fp.ctaBody ?? '',
    ctaButton: fp.ctaButton ?? '',
    items: getFaqItems(locale),
  };
}

export default async function FAQPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return <FaqPageClient initialLocale={locale} initial={faqInitial(locale)} />;
}
