import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { generatePageMetadata } from '@/app/metadata';
import { getBioVeraFreshBundle } from '@/lib/biovera-fresh-bundle';
import BioVeraFreshPageClient from '@/components/marketing/BioVeraFreshPageClient';

function bioVeraFreshMetadata(locale: SiteLocale): Pick<Metadata, 'title' | 'description'> {
  const bf = getBioVeraFreshBundle(locale);
  const title = bf.metaTitle ?? bf.coverTitle;
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

export default async function BioVeraFreshPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return <BioVeraFreshPageClient initial={getBioVeraFreshBundle(locale)} />;
}
