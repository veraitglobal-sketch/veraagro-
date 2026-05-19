import type { MetadataRoute } from 'next';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.biovera.app').replace(/\/$/, '');

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
type SitemapLocale = 'en' | 'sr';

type MarketingPage = {
  /** Path segment after locale; empty string = homepage. */
  segment: string;
  changeFrequency: ChangeFreq;
  priority: number;
};

/** Public marketing URLs indexed per locale (EN + SR sitemaps). */
const MARKETING_PAGES: MarketingPage[] = [
  { segment: '', changeFrequency: 'weekly', priority: 1.0 },
  { segment: 'for-buyers', changeFrequency: 'weekly', priority: 0.9 },
  { segment: 'growers', changeFrequency: 'weekly', priority: 0.9 },
  { segment: 'suppliers', changeFrequency: 'monthly', priority: 0.8 },
  { segment: 'logistics', changeFrequency: 'monthly', priority: 0.8 },
  { segment: 'biovera-fresh', changeFrequency: 'monthly', priority: 0.8 },
  { segment: 'about', changeFrequency: 'monthly', priority: 0.7 },
  { segment: 'contact', changeFrequency: 'monthly', priority: 0.7 },
  { segment: 'faq', changeFrequency: 'monthly', priority: 0.7 },
  { segment: 'press', changeFrequency: 'monthly', priority: 0.6 },
  { segment: 'security', changeFrequency: 'monthly', priority: 0.5 },
  { segment: 'careers', changeFrequency: 'monthly', priority: 0.5 },
  { segment: 'help-center', changeFrequency: 'monthly', priority: 0.4 },
  { segment: 'investors', changeFrequency: 'monthly', priority: 0.5 },
  { segment: 'investor-deck', changeFrequency: 'monthly', priority: 0.4 },
  { segment: 'legal', changeFrequency: 'yearly', priority: 0.3 },
  { segment: 'terms', changeFrequency: 'yearly', priority: 0.3 },
  { segment: 'privacy', changeFrequency: 'yearly', priority: 0.3 },
  { segment: 'cookies', changeFrequency: 'yearly', priority: 0.3 },
];

function resolvePath(locale: SitemapLocale, segment: string): string {
  if (segment === 'logistics') {
    return locale === 'en' ? '/en/logistics' : '/logistics-partner';
  }
  return segment ? `/${locale}/${segment}` : `/${locale}`;
}

function hreflangAlternates(segment: string): MetadataRoute.Sitemap[number]['alternates'] {
  return {
    languages: {
      en: `${siteUrl}${resolvePath('en', segment)}`,
      sr: `${siteUrl}${resolvePath('sr', segment)}`,
      'x-default': `${siteUrl}${resolvePath('en', segment)}`,
    },
  };
}

export async function generateSitemaps() {
  return [{ id: 'en' }, { id: 'sr' }];
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const locale = (await id) as SitemapLocale;
  const lastModified = new Date();

  return MARKETING_PAGES.map(({ segment, changeFrequency, priority }) => ({
    url: `${siteUrl}${resolvePath(locale, segment)}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: hreflangAlternates(segment),
  }));
}
