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
import GrowersPageClient from '@/components/marketing/GrowersPageClient';

type LocaleBundle = {
  growersPage: {
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

function growersMetadata(locale: SiteLocale): Pick<Metadata, 'title' | 'description'> {
  const b = bundles[locale] ?? bundles.en;
  const gp = b.growersPage;
  const title = gp.metaTitle ?? `${gp.title} | Bio Vera`;
  const description = gp.metaDescription ?? gp.heroLead;
  const path = locale === 'en' ? '/for-growers' : `/${locale}/for-growers`;
  return generatePageMetadata(title, description, path);
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return growersMetadata(locale);
}

export default function ForGrowersPage() {
  return <GrowersPageClient />;
}
