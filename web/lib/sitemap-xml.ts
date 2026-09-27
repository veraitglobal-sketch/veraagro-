import type { SiteLocale } from '@/i18n/config';
import { MARKETING_LOCALES } from '@/lib/marketing-locales';
import { getSiteUrl } from '@/lib/site-url';
import { localePath } from '@/lib/seo-metadata';
import type { MarketingRouteEntry } from '@/lib/marketing-route-registry';

const siteUrl = getSiteUrl();

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hreflangLinks(segment: string): string {
  return MARKETING_LOCALES.map(
    (locale) =>
      `    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(`${siteUrl}${localePath(locale, segment)}`)}" />`,
  )
    .concat(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${siteUrl}${localePath('en', segment)}`)}" />`,
    )
    .join('\n');
}

function urlEntry(locale: SiteLocale, route: MarketingRouteEntry): string {
  const loc = `${siteUrl}${localePath(locale, route.segment)}`;
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${hreflangLinks(route.segment)}
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
}

export function buildUrlsetXml(routes: MarketingRouteEntry[]): string {
  const urls = MARKETING_LOCALES.flatMap((locale) =>
    routes.map((route) => urlEntry(locale, route)),
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}

export function buildSitemapIndexXml(childFiles: string[], lastmod: string): string {
  const entries = childFiles
    .map(
      (file) => `  <sitemap>
    <loc>${escapeXml(`${siteUrl}/${file}`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}
