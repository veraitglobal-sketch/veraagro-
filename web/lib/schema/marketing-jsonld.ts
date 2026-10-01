import { getSiteUrl } from '@/lib/site-url';
import { localePath } from '@/lib/seo-metadata';
import type { SiteLocale } from '@/i18n/config';

export function buildAboutPageJsonLd(locale: SiteLocale) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${siteUrl}${localePath(locale, 'about')}#aboutpage`,
    url: `${siteUrl}${localePath(locale, 'about')}`,
    name: 'About Bio Vera',
    isPartOf: { '@id': `${siteUrl}/#website` },
    about: { '@id': `${siteUrl}/#organization` },
    mainEntity: { '@id': `${siteUrl}/#organization` },
  };
}

export function buildContactPageJsonLd(locale: SiteLocale) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${siteUrl}${localePath(locale, 'contact')}#contactpage`,
    url: `${siteUrl}${localePath(locale, 'contact')}`,
    name: 'Contact Bio Vera',
    isPartOf: { '@id': `${siteUrl}/#website` },
    mainEntity: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'info@biovera.app',
        telephone: '+49-155-63740470',
        areaServed: 'Europe',
        availableLanguage: ['English', 'German', 'Serbian', 'Spanish', 'French', 'Romanian', 'Bulgarian'],
      },
    },
  };
}

export function buildWebPageJsonLd(
  locale: SiteLocale,
  segment: string,
  name: string,
  description: string,
) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${localePath(locale, segment)}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { '@id': `${siteUrl}/#website` },
    publisher: { '@id': `${siteUrl}/#organization` },
  };
}
