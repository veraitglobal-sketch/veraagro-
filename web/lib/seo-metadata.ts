import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { MARKETING_LOCALES, MARKETING_OG_LOCALE } from '@/lib/marketing-locales';
import { getSiteUrl } from '@/lib/site-url';

const BRAND = 'Bio Vera';

/** One brand suffix sitewide — never `| Bio Vera | Bio Vera`. */
export function withBrandSuffix(title: string): string {
  const trimmed = title.trim().replace(/\s*\|\s*Bio Vera\s*(\|\s*Bio Vera\s*)+$/gi, ' | Bio Vera');
  if (!trimmed) return BRAND;
  if (/\|\s*Bio Vera\s*$/i.test(trimmed)) return trimmed;
  if (/\bBio Vera\b/i.test(trimmed)) return trimmed;
  return `${trimmed} | ${BRAND}`;
}

/** Strip trailing `| Bio Vera` from locale metaTitle strings for single brand suffix. */
export function pageIntentTitle(metaTitle: string | undefined, fallback: string): string {
  if (!metaTitle?.trim()) return fallback;
  const idx = metaTitle.search(/\s\|\s*Bio Vera\b/i);
  return idx >= 0 ? metaTitle.slice(0, idx).trim() : metaTitle.trim();
}

export function localePath(locale: SiteLocale, segment = ''): string {
  const seg = segment.replace(/^\//, '');
  return seg ? `/${locale}/${seg}` : `/${locale}`;
}

function hreflangLanguageMap(segment: string): Record<string, string> {
  const siteUrl = getSiteUrl();
  const languages: Record<string, string> = {};
  for (const locale of MARKETING_LOCALES) {
    languages[locale] = `${siteUrl}${localePath(locale, segment)}`;
  }
  languages['x-default'] = `${siteUrl}${localePath('en', segment)}`;
  return languages;
}

export function hreflangAlternates(segment = ''): Metadata['alternates'] {
  const siteUrl = getSiteUrl();
  return {
    canonical: `${siteUrl}${localePath('en', segment)}`,
    languages: hreflangLanguageMap(segment),
  };
}

export function hreflangAlternatesForLocale(
  locale: SiteLocale,
  segment = '',
): Metadata['alternates'] {
  const siteUrl = getSiteUrl();
  const path = localePath(locale, segment);
  return {
    canonical: `${siteUrl}${path}`,
    languages: hreflangLanguageMap(segment),
  };
}

type LocaleMetadataInput = {
  locale: SiteLocale;
  /** Page intent only — brand suffix added once. */
  title: string;
  description: string;
  /** Path segment after locale, e.g. `for-growers` or empty for home. */
  segment?: string;
  /** Include 7-locale hreflang cluster (default true for marketing pages). */
  hreflang?: boolean;
  robots?: Metadata['robots'];
};

/** Marketing metadata: single `| Bio Vera` suffix, www canonical, locale OG URL. */
export function generateLocaleMetadata(input: LocaleMetadataInput): Metadata {
  const { locale, title, description, segment = '', hreflang = true, robots } = input;
  const siteUrl = getSiteUrl();
  const path = localePath(locale, segment);
  const fullTitle = withBrandSuffix(title);
  const image = `${siteUrl}/biovera-logo.png`;
  const ogLocale = MARKETING_OG_LOCALE[locale] ?? MARKETING_OG_LOCALE.en;
  const ogAlternateLocales = MARKETING_LOCALES.filter((l) => l !== locale).map(
    (l) => MARKETING_OG_LOCALE[l],
  );

  return {
    title: { absolute: fullTitle },
    description,
    alternates: hreflang ? hreflangAlternatesForLocale(locale, segment) : { canonical: `${siteUrl}${path}` },
    openGraph: {
      type: 'website',
      locale: ogLocale,
      alternateLocale: ogAlternateLocales,
      url: `${siteUrl}${path}`,
      siteName: BRAND,
      title: fullTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: BRAND }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    ...(robots ? { robots } : {}),
  };
}

function localeAndSegmentFromPath(path: string): { locale: SiteLocale; segment: string } {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const parts = normalizedPath.split('/').filter(Boolean);
  const maybeLocale = parts[0];
  if (maybeLocale && MARKETING_LOCALES.includes(maybeLocale as SiteLocale)) {
    return { locale: maybeLocale as SiteLocale, segment: parts.slice(1).join('/') };
  }
  return { locale: 'en', segment: parts.join('/') };
}

/** Legacy helper — path must include locale prefix, e.g. `/en/faq`. */
export function generatePageMetadata(
  title: string,
  description: string,
  path: string,
  options?: { robots?: Metadata['robots'] },
): Metadata {
  const siteUrl = getSiteUrl();
  const fullTitle = withBrandSuffix(title);
  const image = `${siteUrl}/biovera-logo.png`;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const { locale, segment } = localeAndSegmentFromPath(normalizedPath);
  const ogLocale = MARKETING_OG_LOCALE[locale] ?? MARKETING_OG_LOCALE.en;
  const ogAlternateLocales = MARKETING_LOCALES.filter((l) => l !== locale).map(
    (l) => MARKETING_OG_LOCALE[l],
  );

  return {
    title: { absolute: fullTitle },
    description,
    alternates: hreflangAlternatesForLocale(locale, segment),
    openGraph: {
      type: 'website',
      locale: ogLocale,
      alternateLocale: ogAlternateLocales,
      url: `${siteUrl}${normalizedPath}`,
      siteName: BRAND,
      title: fullTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: BRAND }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    ...(options?.robots ? { robots: options.robots } : {}),
  };
}
