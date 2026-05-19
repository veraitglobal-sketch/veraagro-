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
import AboutPageClient from '@/components/marketing/AboutPageClient';

type LocaleBundle = {
  aboutPage: {
    metaTitle?: string;
    metaDescription?: string;
    heroTitle: string;
    heroSubtitle: string;
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

function aboutMetadata(locale: SiteLocale): Pick<Metadata, 'title' | 'description'> {
  const b = bundles[locale] ?? bundles.en;
  const ap = b.aboutPage;
  const title = ap.metaTitle ?? `${ap.heroTitle} | Bio Vera`;
  const description = ap.metaDescription ?? ap.heroSubtitle;
  const path = locale === 'en' ? '/about' : `/${locale}/about`;
  return generatePageMetadata(title, description, path);
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return aboutMetadata(locale);
}

export default function AboutPage() {
  return <AboutPageClient />;
}
