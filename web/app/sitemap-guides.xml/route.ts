import { buildUrlsetXml } from '@/lib/sitemap-xml';
import { MARKETING_GUIDE_ROUTES } from '@/lib/marketing-route-registry';

export const revalidate = 86400;

export function GET() {
  const body = buildUrlsetXml(MARKETING_GUIDE_ROUTES);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
