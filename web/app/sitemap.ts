import type { MetadataRoute } from 'next';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.biovera.app').replace(/\/$/, '');

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

type SitemapSpec = {
  path: string;
  changeFrequency: ChangeFreq;
  priority: number;
  /** Homepage hreflang cluster (en + sr + x-default). */
  homeAlternates?: boolean;
};

/** Public marketing URLs — EN-first index; home also in SR with hreflang. */
const SITEMAP_SPECS: SitemapSpec[] = [
  { path: '/en', changeFrequency: 'weekly', priority: 1.0, homeAlternates: true },
  { path: '/sr', changeFrequency: 'weekly', priority: 0.9, homeAlternates: true },
  { path: '/en/for-buyers', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/en/growers', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/en/suppliers', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/en/logistics', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/en/biovera-fresh', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/en/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/en/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/en/faq', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/en/press', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/en/security', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/en/careers', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/en/help-center', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/en/investors', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/en/investor-deck', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/en/legal', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/en/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/en/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/en/cookies', changeFrequency: 'yearly', priority: 0.3 },
];

function homeHreflangAlternates() {
  return {
    languages: {
      en: `${siteUrl}/en`,
      sr: `${siteUrl}/sr`,
      'x-default': `${siteUrl}/en`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return SITEMAP_SPECS.map(({ path, changeFrequency, priority, homeAlternates }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
    ...(homeAlternates ? { alternates: homeHreflangAlternates() } : {}),
  }));
}
