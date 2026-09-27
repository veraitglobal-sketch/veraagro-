import type { SiteLocale } from '@/i18n/config';
import en from '@/locales/en.json';
import sr from '@/locales/sr.json';
import de from '@/locales/de.json';
import ro from '@/locales/ro.json';
import bg from '@/locales/bg.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bundles: Record<SiteLocale, any> = { en, sr, de, ro, bg, fr, es };

export function getLocaleBundle(locale: SiteLocale) {
  return bundles[locale] ?? bundles.en;
}

export type FaqItem = {
  q: string;
  a: string;
  category: string;
};

const FAQ_CATEGORIES = new Set(['general', 'growers', 'buyers', 'logistics', 'technical']);

export function getFaqItems(locale: SiteLocale): FaqItem[] {
  const raw = getLocaleBundle(locale).faqPage?.items;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (row): row is FaqItem =>
      !!row &&
      typeof row === 'object' &&
      typeof (row as FaqItem).q === 'string' &&
      typeof (row as FaqItem).a === 'string' &&
      FAQ_CATEGORIES.has((row as FaqItem).category),
  );
}
