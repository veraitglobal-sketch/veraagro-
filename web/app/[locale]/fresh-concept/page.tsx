import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { generatePageMetadata } from '@/app/metadata';
import bioVeraFreshPageEn from '@/locales/biovera-fresh-page.en.json';
import bioVeraFreshPageSr from '@/locales/biovera-fresh-page.sr.json';
import bioVeraFreshPageDe from '@/locales/biovera-fresh-page.de.json';
import bioVeraFreshPageRo from '@/locales/biovera-fresh-page.ro.json';
import bioVeraFreshPageBg from '@/locales/biovera-fresh-page.bg.json';
import bioVeraFreshPageFr from '@/locales/biovera-fresh-page.fr.json';
import bioVeraFreshPageEs from '@/locales/biovera-fresh-page.es.json';
import BioVeraFreshPageClient from '@/components/marketing/BioVeraFreshPageClient';

type BioVeraFreshMeta = {
  metaTitle?: string;
  metaDescription?: string;
  coverTitle: string;
  introNote: string;
};

const bundles: Record<SiteLocale, BioVeraFreshMeta> = {
  en: bioVeraFreshPageEn as BioVeraFreshMeta,
  sr: bioVeraFreshPageSr as BioVeraFreshMeta,
  de: bioVeraFreshPageDe as BioVeraFreshMeta,
  ro: bioVeraFreshPageRo as BioVeraFreshMeta,
  bg: bioVeraFreshPageBg as BioVeraFreshMeta,
  fr: bioVeraFreshPageFr as BioVeraFreshMeta,
  es: bioVeraFreshPageEs as BioVeraFreshMeta,
};

function freshConceptMetadata(locale: SiteLocale): Pick<Metadata, 'title' | 'description'> {
  const bf = bundles[locale] ?? bundles.en;
  const title = bf.metaTitle ?? `${bf.coverTitle} | Bio Vera`;
  const description = bf.metaDescription ?? bf.introNote;
  const path = locale === 'en' ? '/fresh-concept' : `/${locale}/fresh-concept`;
  return generatePageMetadata(title, description, path);
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return freshConceptMetadata(locale);
}

export default async function FreshConceptPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return <BioVeraFreshPageClient initialLocale={locale} />;
}
