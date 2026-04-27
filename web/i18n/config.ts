import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import sr from "../locales/sr.json";
import growerJourneyEn from "../locales/grower-journey.en.json";
import growerJourneySr from "../locales/grower-journey.sr.json";

const enWithJourney = {
  ...en,
  grower: {
    ...en.grower,
    journey: growerJourneyEn,
  },
};
const srWithJourney = {
  ...sr,
  grower: {
    ...sr.grower,
    journey: growerJourneySr,
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    resources: {
      en: { translation: enWithJourney },
      sr: { translation: srWithJourney },
    },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "sr"],
    interpolation: { escapeValue: true },
  });
}

export default i18n;

export const LOCALE_STORAGE_KEY = "biovera-locale";
export type SiteLocale = "en" | "sr";
