/** Intl.PluralRules polyfill for Hermes/JSC — extend as locales are added. */
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/sr.js';
import '@formatjs/intl-pluralrules/locale-data/de.js';
import '@formatjs/intl-pluralrules/locale-data/es.js';
import '@formatjs/intl-pluralrules/locale-data/fr.js';
import '@formatjs/intl-pluralrules/locale-data/ro.js';
import '@formatjs/intl-pluralrules/locale-data/bg.js';

import deepmerge from 'deepmerge';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../../shared/i18n/constants';
import { withGlossary } from '../../shared/i18n/load-glossary';
import en from './locales/en.json';
import sr from './locales/sr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ro from './locales/ro.json';
import bg from './locales/bg.json';
import growerJourneyEn from './locales/grower-journey.en.json';
import growerJourneySr from './locales/grower-journey.sr.json';
import growerJourneyDe from './locales/grower-journey.de.json';
import growerJourneyEs from './locales/grower-journey.es.json';
import growerJourneyFr from './locales/grower-journey.fr.json';
import growerJourneyRo from './locales/grower-journey.ro.json';
import growerJourneyBg from './locales/grower-journey.bg.json';
import growerSeasonEn from './locales/grower-season.en.json';
import growerSeasonSr from './locales/grower-season.sr.json';
import growerSeasonDe from './locales/grower-season.de.json';
import growerSeasonEs from './locales/grower-season.es.json';
import growerSeasonFr from './locales/grower-season.fr.json';
import growerSeasonRo from './locales/grower-season.ro.json';
import growerSeasonBg from './locales/grower-season.bg.json';

type Dict = Record<string, unknown>;

const merge = (a: Dict, b: Dict) => deepmerge(a, b, { arrayMerge: (_target, source) => source });

const JOURNEY: Record<SupportedLocale, Dict> = {
  en: growerJourneyEn as Dict,
  sr: growerJourneySr as Dict,
  de: growerJourneyDe as Dict,
  es: growerJourneyEs as Dict,
  fr: growerJourneyFr as Dict,
  ro: growerJourneyRo as Dict,
  bg: growerJourneyBg as Dict,
};

const SEASON: Record<SupportedLocale, Dict> = {
  en: growerSeasonEn as Dict,
  sr: growerSeasonSr as Dict,
  de: growerSeasonDe as Dict,
  es: growerSeasonEs as Dict,
  fr: growerSeasonFr as Dict,
  ro: growerSeasonRo as Dict,
  bg: growerSeasonBg as Dict,
};

const MAIN: Record<SupportedLocale, Dict> = {
  en: en as Dict,
  sr: merge(en as Dict, sr as Dict),
  de: merge(en as Dict, de as Dict),
  es: merge(en as Dict, es as Dict),
  fr: merge(en as Dict, fr as Dict),
  ro: merge(en as Dict, ro as Dict),
  bg: merge(en as Dict, bg as Dict),
};

function buildTranslation(locale: SupportedLocale): Dict {
  return withGlossary(
    locale,
    merge(MAIN[locale], {
      grower: {
        journey: JOURNEY[locale],
        season: SEASON[locale],
      },
    }),
  );
}

const resources = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, { translation: buildTranslation(locale) }]),
);

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LOCALES],
  load: 'languageOnly',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
