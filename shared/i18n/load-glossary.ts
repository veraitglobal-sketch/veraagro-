import type { SupportedLocale } from './constants';
import glossaryEn from './glossary/en.json';
import glossarySr from './glossary/sr.json';
import glossaryDe from './glossary/de.json';
import glossaryEs from './glossary/es.json';
import glossaryFr from './glossary/fr.json';
import glossaryRo from './glossary/ro.json';
import glossaryBg from './glossary/bg.json';

const GLOSSARIES: Record<SupportedLocale, Record<string, unknown>> = {
  en: glossaryEn as Record<string, unknown>,
  sr: glossarySr as Record<string, unknown>,
  de: glossaryDe as Record<string, unknown>,
  es: glossaryEs as Record<string, unknown>,
  fr: glossaryFr as Record<string, unknown>,
  ro: glossaryRo as Record<string, unknown>,
  bg: glossaryBg as Record<string, unknown>,
};

/** Merge shared glossary into an app translation bundle under `glossary`. */
export function withGlossary<T extends Record<string, unknown>>(
  locale: SupportedLocale,
  bundle: T,
): T & { glossary: Record<string, unknown> } {
  return {
    ...bundle,
    glossary: GLOSSARIES[locale] ?? GLOSSARIES.en,
  };
}

export function getGlossary(locale: SupportedLocale): Record<string, unknown> {
  return GLOSSARIES[locale] ?? GLOSSARIES.en;
}
