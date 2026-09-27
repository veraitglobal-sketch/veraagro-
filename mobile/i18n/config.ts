/** Intl.PluralRules is incomplete on some JSC/Hermes builds — required for i18next JSON v4 plurals. */
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/sr.js';

import deepmerge from 'deepmerge';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import sr from './locales/sr.json';
import growerJourneyEn from './locales/grower-journey.en.json';
import growerJourneySr from './locales/grower-journey.sr.json';
import growerSeasonEn from './locales/grower-season.en.json';
import growerSeasonSr from './locales/grower-season.sr.json';

/** Same journey copy as web `grower-journey.*.json` + mobile-only `grower.season.*` banners. */

/**
 * Serbian UI: full `sr.json` + grower journey/season bundles.
 * Missing keys fall back to English via i18n `fallbackLng`.
 */
type Dict = Record<string, unknown>;

/** Localized lists (FAQ, steps…) replace the English list — deepmerge would concatenate them. */
const merge = (a: Dict, b: Dict) => deepmerge(a, b, { arrayMerge: (_target, source) => source });

const translationEn = merge(en as Dict, {
  grower: {
    journey: growerJourneyEn,
    season: growerSeasonEn,
  },
}) as typeof en;

const translationSr = merge(merge(en as Dict, sr as Dict), {
  grower: {
    journey: growerJourneySr,
    season: growerSeasonSr,
  },
}) as typeof en;

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: {
      translation: translationEn,
    },
    sr: {
      translation: translationSr,
    },
  },
  lng: 'sr',
  fallbackLng: 'en',
  supportedLngs: ['en', 'sr'],
  load: 'languageOnly',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
