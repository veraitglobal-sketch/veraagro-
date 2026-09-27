/**
 * Single route registry for public marketing SEO (sitemap, CI gates).
 * Golden: fixtures/golden/sitemap-pages.golden.xml (175) + sitemap-guides.golden.xml (84).
 */
import {
  SITEMAP_GUIDE_ARTICLES,
  SITEMAP_GUIDE_HUB,
  SITEMAP_MARKETING_PAGES,
  SITEMAP_PRODUCE_PAGES,
  type SitemapFreq,
} from '@/lib/sitemap-catalog';

export type MarketingRouteEntry = {
  segment: string;
  changeFrequency: SitemapFreq;
  priority: number;
  indexable: boolean;
  /** ISO date (YYYY-MM-DD) of last meaningful content change. */
  lastmod: string;
};

const CONTENT_LASTMOD = '2026-09-13';

function toRegistry(
  entries: { segment: string; changeFrequency: SitemapFreq; priority: number }[],
  indexable = true,
): MarketingRouteEntry[] {
  return entries.map((e) => ({
    ...e,
    indexable,
    lastmod: CONTENT_LASTMOD,
  }));
}

export const MARKETING_PAGE_ROUTES: MarketingRouteEntry[] = toRegistry(SITEMAP_MARKETING_PAGES);

export const MARKETING_GUIDE_ROUTES: MarketingRouteEntry[] = [
  ...toRegistry([SITEMAP_GUIDE_HUB]),
  ...toRegistry(SITEMAP_GUIDE_ARTICLES),
  ...toRegistry(SITEMAP_PRODUCE_PAGES),
];

export const MARKETING_ALL_ROUTES: MarketingRouteEntry[] = [
  ...MARKETING_PAGE_ROUTES,
  ...MARKETING_GUIDE_ROUTES,
];

export function indexableMarketingRoutes(): MarketingRouteEntry[] {
  return MARKETING_ALL_ROUTES.filter((r) => r.indexable);
}

/** Tier-1 paths for SSR QA (spec §5.3) — one per locale cluster. */
export const TIER1_SSR_PATHS = [
  '/en',
  '/de',
  '/sr',
  '/en/for-growers',
  '/de/for-growers',
  '/sr/for-growers',
  '/en/faq',
  '/sr/protocol-360',
] as const;
