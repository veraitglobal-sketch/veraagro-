import { MetadataRoute } from 'next';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://biovera.app').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/dashboard',
          '/admin/',
          '/buyer-portal/',
          '/grower/',
          '/fleet-partner/',
          '/hub-manager/',
          '/aeo-dashboard/',
          '/operations-center/',
          '/register/',
        ],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`],
  };
}
