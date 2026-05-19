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
import BioVeraFreshPageClient from '@/components/marketing/BioVeraFreshPageClient';

type BioVeraFreshMeta = {
  metaTitle?: string;
  metaDescription?: string;
  coverTitle: string;
  introNote: string;
};

function readBioVeraFreshMeta(bundle: unknown): BioVeraFreshMeta | undefined {
  if (typeof bundle !== 'object' || bundle === null) return undefined;
  const bf = (bundle as { bioVeraFresh?: BioVeraFreshMeta }).bioVeraFresh;
  if (!bf || typeof bf.coverTitle !== 'string' || typeof bf.introNote !== 'string') return undefined;
  return bf;
}

const localeBundles: Record<SiteLocale, unknown> = {
  en,
  sr,
  de,
  ro,
  bg,
  fr,
  es,
};

function bioVeraFreshMetadata(locale: SiteLocale): Pick<Metadata, 'title' | 'description'> {
  const bf = readBioVeraFreshMeta(localeBundles[locale]) ?? readBioVeraFreshMeta(en)!;
  const title = bf.metaTitle ?? `${bf.coverTitle} | Bio Vera`;
  const description = bf.metaDescription ?? bf.introNote;
  const path = locale === 'en' ? '/biovera-fresh' : `/${locale}/biovera-fresh`;
  return generatePageMetadata(title, description, path);
}

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return bioVeraFreshMetadata(locale);
}

export default function BioVeraFreshPage() {
  return <BioVeraFreshPageClient />;
}
