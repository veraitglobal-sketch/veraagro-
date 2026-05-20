/** Intl.PluralRules is incomplete on some JSC/Hermes builds — required for i18next JSON v4 plurals. */
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/sr.js';

import * as Localization from 'expo-localization';
import deepmerge from 'deepmerge';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import srPartial from './locales/sr-partial.json';
import growerJourneyEn from './locales/grower-journey.en.json';
import growerJourneySr from './locales/grower-journey.sr.json';
import growerSeasonEn from './locales/grower-season.en.json';
import growerSeasonSr from './locales/grower-season.sr.json';

/** Same journey copy as web `grower-journey.*.json` + mobile-only `grower.season.*` banners. */

/**
 * Serbian UI: merge English (source of truth for keys) with sr-partial overrides.
 * Missing keys in sr still resolve from English via i18n fallback + deep structure.
 */
type Dict = Record<string, unknown>;

const translationEn = deepmerge(en as Dict, {
  grower: {
    journey: growerJourneyEn,
    season: growerSeasonEn,
  },
}) as typeof en;

const translationSr = deepmerge(deepmerge(en as Dict, srPartial as Dict), {
  grower: {
    journey: growerJourneySr,
    season: growerSeasonSr,
  },
}) as typeof en;

const deviceCode = (Localization.getLocales()[0]?.languageCode ?? 'en').toLowerCase();
const deviceIsSerbian = deviceCode === 'sr';
const initialLng = deviceIsSerbian ? 'sr' : 'en';

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
  lng: initialLng,
  fallbackLng: 'en',
  supportedLngs: ['en', 'sr'],
  load: 'languageOnly',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
