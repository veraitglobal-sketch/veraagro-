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
import HomePageClient, { type HomeHeroInitial } from '@/components/marketing/HomePageClient';

type LocaleBundle = {
  metadata: {
    homeTitle?: string;
    siteDescription: string;
    siteName: string;
  };
  home: {
    hero: HomeHeroInitial & {
      preOrderTip1: string;
      preOrderTip2: string;
    };
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

function homeHero(locale: SiteLocale): HomeHeroInitial {
  const h = (bundles[locale] ?? bundles.en).home.hero;
  return {
    title1: h.title1,
    title2: h.title2,
    subtitle: h.subtitle,
    browseProducts: h.browseProducts,
    becomeProducer: h.becomeProducer,
    preOrder: h.preOrder,
    preOrderAria: h.preOrderAria,
  };
}

function homeMetadata(locale: SiteLocale): Pick<Metadata, 'title' | 'description'> {
  const b = bundles[locale] ?? bundles.en;
  const title = b.metadata.homeTitle ?? `${b.metadata.siteName} | Traceable Fresh Produce — Field to Shelf`;
  const description = b.metadata.siteDescription;
  const path = locale === 'en' ? '/' : `/${locale}`;
  return generatePageMetadata(title, description, path);
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return homeMetadata(locale);
}

export default async function HomePage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return <HomePageClient initialLocale={locale} initialHero={homeHero(locale)} />;
}
