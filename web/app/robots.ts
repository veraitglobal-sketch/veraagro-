import { MetadataRoute } from 'next';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.biovera.app').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/buyer-portal/',
          '/grower/',
          '/fleet-partner/',
          '/hub-manager/',
          '/aeo-dashboard/',
          '/operations-center/',
          '/login/',
          '/register/',
        ],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/sitemap/en.xml`, `${siteUrl}/sitemap/sr.xml`],
  };
}
