import * as Localization from 'expo-localization';
import deepmerge from 'deepmerge';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import srPartial from './locales/sr-partial.json';

/**
 * Serbian UI: merge English (source of truth for keys) with sr-partial overrides.
 * Missing keys in sr still resolve from English via i18n fallback + deep structure.
 */
const srTranslation = deepmerge(
  en as Record<string, unknown>,
  srPartial as Record<string, unknown>,
) as typeof en;

const deviceCode = (Localization.getLocales()[0]?.languageCode ?? 'en').toLowerCase();
const deviceIsSerbian = deviceCode === 'sr';
const initialLng = deviceIsSerbian ? 'sr' : 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: {
      translation: en,
    },
    sr: {
      translation: srTranslation,
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
