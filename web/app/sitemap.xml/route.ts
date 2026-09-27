import { buildSitemapIndexXml } from '@/lib/sitemap-xml';
import { MARKETING_PAGE_ROUTES } from '@/lib/marketing-route-registry';

export const revalidate = 86400;

export function GET() {
  const lastmod = MARKETING_PAGE_ROUTES[0]?.lastmod ?? '2026-09-13';
  const body = buildSitemapIndexXml(['sitemap-pages.xml', 'sitemap-guides.xml'], lastmod);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
