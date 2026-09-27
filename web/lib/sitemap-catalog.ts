/** Canonical sitemap entries — aligned with fixtures/sitemap.maximum.golden.xml */

export type SitemapFreq = 'weekly' | 'monthly' | 'yearly';

export type MarketingSitemapEntry = {
  segment: string;
  changeFrequency: SitemapFreq;
  priority: number;
};

export const SITEMAP_MARKETING_PAGES: MarketingSitemapEntry[] = [
  { segment: '', changeFrequency: 'weekly', priority: 1.0 },
  { segment: 'for-growers', changeFrequency: 'weekly', priority: 0.9 },
  { segment: 'for-buyers', changeFrequency: 'weekly', priority: 0.9 },
  { segment: 'for-logistics', changeFrequency: 'weekly', priority: 0.9 },
  { segment: 'for-suppliers', changeFrequency: 'weekly', priority: 0.9 },
  { segment: 'about', changeFrequency: 'monthly', priority: 0.8 },
  { segment: 'faq', changeFrequency: 'weekly', priority: 0.8 },
  { segment: 'protocol-360', changeFrequency: 'monthly', priority: 0.8 },
  { segment: 'contact', changeFrequency: 'monthly', priority: 0.7 },
  { segment: 'security', changeFrequency: 'monthly', priority: 0.7 },
  { segment: 'press', changeFrequency: 'monthly', priority: 0.6 },
  { segment: 'fresh-concept', changeFrequency: 'monthly', priority: 0.7 },
  { segment: 'help-center', changeFrequency: 'weekly', priority: 0.6 },
  { segment: 'careers', changeFrequency: 'weekly', priority: 0.5 },
  { segment: 'investors', changeFrequency: 'monthly', priority: 0.5 },
  { segment: 'investor-deck', changeFrequency: 'monthly', priority: 0.5 },
  { segment: 'language', changeFrequency: 'yearly', priority: 0.3 },
  { segment: 'legal', changeFrequency: 'yearly', priority: 0.3 },
  { segment: 'terms', changeFrequency: 'yearly', priority: 0.3 },
  { segment: 'privacy', changeFrequency: 'yearly', priority: 0.3 },
  { segment: 'cookies', changeFrequency: 'yearly', priority: 0.2 },
  { segment: 'data-consent-declaration', changeFrequency: 'yearly', priority: 0.2 },
  { segment: 'project-overview', changeFrequency: 'monthly', priority: 0.45 },
  { segment: 'technical-proposal', changeFrequency: 'monthly', priority: 0.45 },
  { segment: 'investor-deck/slides', changeFrequency: 'monthly', priority: 0.4 },
];

export const SITEMAP_GUIDE_HUB: MarketingSitemapEntry = {
  segment: 'guides',
  changeFrequency: 'weekly',
  priority: 0.65,
};

export const SITEMAP_GUIDE_ARTICLES: MarketingSitemapEntry[] = [
  { segment: 'guides/digital-product-passport-fresh-produce', changeFrequency: 'monthly', priority: 0.7 },
  { segment: 'guides/farm-to-fork-fresh-produce-traceability', changeFrequency: 'monthly', priority: 0.7 },
  { segment: 'guides/globalgap-group-certification', changeFrequency: 'monthly', priority: 0.7 },
  { segment: 'guides/cold-chain-custody-retail-qa', changeFrequency: 'monthly', priority: 0.65 },
  {
    segment: 'guides/bio-vera-vs-farm-apps-vs-certificate-marketplaces',
    changeFrequency: 'monthly',
    priority: 0.65,
  },
  { segment: 'guides/secured-settlement', changeFrequency: 'monthly', priority: 0.65 },
];

export const SITEMAP_PRODUCE_PAGES: MarketingSitemapEntry[] = [
  { segment: 'produce/raspberry', changeFrequency: 'monthly', priority: 0.6 },
  { segment: 'produce/strawberry', changeFrequency: 'monthly', priority: 0.6 },
  { segment: 'produce/blueberry', changeFrequency: 'monthly', priority: 0.6 },
  { segment: 'produce/blackberry', changeFrequency: 'monthly', priority: 0.55 },
  { segment: 'produce/apple', changeFrequency: 'monthly', priority: 0.55 },
];

export function sitemapGuideSlugs(): string[] {
  return SITEMAP_GUIDE_ARTICLES.map((e) => e.segment.replace(/^guides\//, ''));
}

export function sitemapProduceCrops(): string[] {
  return SITEMAP_PRODUCE_PAGES.map((e) => e.segment.replace(/^produce\//, ''));
}
