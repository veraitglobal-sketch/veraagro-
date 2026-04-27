import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

// English-only UI: do not load browser/device locale for copy.
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {
        translation: en,
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
