import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { generatePageMetadata } from '@/app/metadata';
import en from '@/locales/en.json';
import sr from '@/locales/sr.json';
import de from '@/locales/de.json';
import ro from '@/locales/ro.json';
import bg from '@/locales/bg.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';
import ForBuyersPageClient from '@/components/marketing/ForBuyersPageClient';

type LocaleBundle = {
  forBuyersPage: {
    metaTitle?: string;
    metaDescription?: string;
    title: string;
    heroLead: string;
  };
};

const bundles: Record<SiteLocale, LocaleBundle> = {
  en: en as LocaleBundle,
  sr: sr as LocaleBundle,
  de: de as LocaleBundle,
  ro: ro as LocaleBundle,
  bg: bg as LocaleBundle,
  fr: fr as LocaleBundle,
  es: es as LocaleBundle,
};

function forBuyersMetadata(locale: SiteLocale): Pick<Metadata, 'title' | 'description'> {
  const b = bundles[locale] ?? bundles.en;
  const fb = b.forBuyersPage;
  const title = fb.metaTitle ?? `${fb.title} | Bio Vera`;
  const description = fb.metaDescription ?? fb.heroLead;
  const path = locale === 'en' ? '/for-buyers' : `/${locale}/for-buyers`;
  return generatePageMetadata(title, description, path);
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return forBuyersMetadata(locale);
}

export default function ForBuyersPage() {
  return <ForBuyersPageClient />;
}
