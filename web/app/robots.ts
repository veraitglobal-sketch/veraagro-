import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/register/',
          '/dashboard',
          '/admin/',
          '/buyer-portal/',
          '/grower/',
          '/fleet-partner/',
          '/hub-manager/',
          '/aeo-dashboard/',
          '/operations-center/',
          // Illustrative network map with placeholder hubs — not real locations, keep out of search/AI answers.
          '/distributor-network',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
