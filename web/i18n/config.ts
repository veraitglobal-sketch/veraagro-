import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import sr from "../locales/sr.json";
import growerJourneyEn from "../locales/grower-journey.en.json";
import growerJourneySr from "../locales/grower-journey.sr.json";
import suppliersPageEn from "../locales/suppliers-page.en.json";
import suppliersPageSr from "../locales/suppliers-page.sr.json";
import buyerRetailEn from "../locales/buyer-retail.en.json";
import buyerRetailSr from "../locales/buyer-retail.sr.json";
import passportPublicEn from "../locales/passport-public.en.json";
import passportPublicSr from "../locales/passport-public.sr.json";

const enWithJourney = {
  ...en,
  suppliersPage: suppliersPageEn,
  buyerRetail: buyerRetailEn,
  passportPublic: passportPublicEn,
  grower: {
    ...en.grower,
    journey: growerJourneyEn,
  },
};
const srWithJourney = {
  ...sr,
  suppliersPage: suppliersPageSr,
  buyerRetail: buyerRetailSr,
  passportPublic: passportPublicSr,
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
