import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://biovera.app';

const locales = ['en', 'sr', 'de', 'ro', 'bg', 'fr', 'es'] as const;

/** Marketing URLs living under /[locale]/… — mirror lib/i18n-routing LOCALIZED_FIRST_SEGMENTS + home */
const localizedPaths = [
  '',
  'about',
  'contact',
  'growers',
  'suppliers',
  'for-buyers',
  'products',
  'faq',
  'careers',
  'press',
  'security',
  'help-center',
  'legal',
  'terms',
  'privacy',
  'cookies',
  'investors',
  'investor-deck',
  'project-overview',
  'technical-proposal',
  'eic-part-b',
] as const;

function localizedUrls(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const path of localizedPaths) {
      const pathSeg = path === '' ? '' : `/${path}`;
      const url = `${siteUrl}/${locale}${pathSeg}`;
      const priority =
        path === ''
          ? 1
          : path === 'growers' || path === 'suppliers' || path === 'for-buyers'
            ? 0.9
            : path === 'contact' || path === 'about'
              ? 0.8
              : 0.6;
      out.push({
        url,
        lastModified: new Date(),
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority,
      });
    }
  }
  return out;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...localizedUrls(),
    {
      url: `${siteUrl}/protocol-360`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/logistics-partner`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];
}
