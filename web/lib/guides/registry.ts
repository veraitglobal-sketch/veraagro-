import { EN_GUIDES, EN_GUIDE_SLUGS } from '@/content/guides/en-guides';
import { EN_PRODUCE, EN_PRODUCE_SLUGS } from '@/content/guides/en-produce';
import { guideLocaleMeta } from '@/content/guides/guide-locale-meta';
import { sitemapGuideSlugs, sitemapProduceCrops } from '@/lib/sitemap-catalog';
import { MARKETING_LOCALES } from '@/lib/marketing-locales';
import type { GuideDefinition, ProduceDefinition } from '@/lib/guides/types';
import type { SiteLocale } from '@/i18n/config';

const PUBLIC_GUIDE_LOCALES = new Set<SiteLocale>(MARKETING_LOCALES);

function resolveGuideRecord(slug: string): GuideDefinition | null {
  return EN_GUIDES[slug] ?? null;
}

/** EN body with localized title/meta where overlays exist. */
export function getGuide(locale: SiteLocale, slug: string): GuideDefinition | null {
  if (!PUBLIC_GUIDE_LOCALES.has(locale)) return null;
  const guide = resolveGuideRecord(slug);
  if (!guide?.published) return null;
  const overlay = guideLocaleMeta(slug, locale);
  if (!overlay) return guide;
  return { ...guide, title: overlay.title, metaDescription: overlay.metaDescription };
}

export function getProduce(locale: SiteLocale, slug: string): ProduceDefinition | null {
  if (!PUBLIC_GUIDE_LOCALES.has(locale)) return null;
  const produce = EN_PRODUCE[slug];
  if (!produce?.published) return null;
  return produce;
}

export function publishedGuideSlugs(locale: SiteLocale): string[] {
  if (!PUBLIC_GUIDE_LOCALES.has(locale)) return [];
  return sitemapGuideSlugs().filter((s) => EN_GUIDES[s]?.published);
}

export function publishedProduceSlugs(locale: SiteLocale): string[] {
  if (!PUBLIC_GUIDE_LOCALES.has(locale)) return [];
  return sitemapProduceCrops().filter((s) => EN_PRODUCE[s]?.published);
}

/** All published guide slugs in content (includes articles not yet in sitemap). */
export function allPublishedGuideSlugs(): string[] {
  return EN_GUIDE_SLUGS.filter((s) => EN_GUIDES[s]?.published);
}

export function allPublishedProduceSlugs(): string[] {
  return EN_PRODUCE_SLUGS.filter((s) => EN_PRODUCE[s]?.published);
}
