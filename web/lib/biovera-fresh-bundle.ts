import type { SiteLocale } from '@/i18n/config';
import bioVeraFreshPageEn from '@/locales/biovera-fresh-page.en.json';
import bioVeraFreshPageSr from '@/locales/biovera-fresh-page.sr.json';
import bioVeraFreshPageDe from '@/locales/biovera-fresh-page.de.json';
import bioVeraFreshPageRo from '@/locales/biovera-fresh-page.ro.json';
import bioVeraFreshPageBg from '@/locales/biovera-fresh-page.bg.json';
import bioVeraFreshPageFr from '@/locales/biovera-fresh-page.fr.json';
import bioVeraFreshPageEs from '@/locales/biovera-fresh-page.es.json';

export type BioVeraFreshSection = { title: string; body: string };

export type BioVeraFreshResourceItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  size: string;
  publicPath?: string;
};

export type BioVeraFreshBundle = {
  toolbarCopyLink: string;
  toolbarCopied: string;
  toolbarPrintPdf: string;
  toolbarPrintAria: string;
  introNote: string;
  pdfHint: string;
  contentsTitle: string;
  contentsNav: string;
  skipToContent: string;
  coverEyebrow: string;
  coverTitle: string;
  coverSubtitle: string;
  heroImageAlt: string;
  pdfDocumentTitle: string;
  pdfDocumentSubtitle: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  webSections: BioVeraFreshSection[];
  pdfSections: BioVeraFreshSection[];
  downloadProspectCta: string;
  downloadProspectError: string;
  prospectNote: string;
  franchiseBlueprintTitle: string;
  franchiseBlueprintLead: string;
  franchiseBlueprintItems: BioVeraFreshSection[];
  resourcesTitle: string;
  resourcesLead: string;
  resourceItems: BioVeraFreshResourceItem[];
  resourceDownload: string;
  resourceDownloading: string;
  metaTitle?: string;
  metaDescription?: string;
  heroSubtitle?: string;
};

const bundles: Record<SiteLocale, BioVeraFreshBundle> = {
  en: bioVeraFreshPageEn as BioVeraFreshBundle,
  sr: bioVeraFreshPageSr as BioVeraFreshBundle,
  de: bioVeraFreshPageDe as BioVeraFreshBundle,
  ro: bioVeraFreshPageRo as BioVeraFreshBundle,
  bg: bioVeraFreshPageBg as BioVeraFreshBundle,
  fr: bioVeraFreshPageFr as BioVeraFreshBundle,
  es: bioVeraFreshPageEs as BioVeraFreshBundle,
};

export function getBioVeraFreshBundle(locale: SiteLocale): BioVeraFreshBundle {
  return bundles[locale] ?? bundles.en;
}
