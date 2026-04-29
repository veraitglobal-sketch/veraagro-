import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import sr from "../locales/sr.json";
import de from "../locales/de.json";
import ro from "../locales/ro.json";
import bg from "../locales/bg.json";
import growerJourneyEn from "../locales/grower-journey.en.json";
import growerJourneySr from "../locales/grower-journey.sr.json";
import growerJourneyDe from "../locales/grower-journey.de.json";
import growerJourneyRo from "../locales/grower-journey.ro.json";
import growerJourneyBg from "../locales/grower-journey.bg.json";
import suppliersPageEn from "../locales/suppliers-page.en.json";
import suppliersPageSr from "../locales/suppliers-page.sr.json";
import suppliersPageDe from "../locales/suppliers-page.de.json";
import suppliersPageRo from "../locales/suppliers-page.ro.json";
import suppliersPageBg from "../locales/suppliers-page.bg.json";
import buyerRetailEn from "../locales/buyer-retail.en.json";
import buyerRetailSr from "../locales/buyer-retail.sr.json";
import buyerRetailDe from "../locales/buyer-retail.de.json";
import buyerRetailRo from "../locales/buyer-retail.ro.json";
import buyerRetailBg from "../locales/buyer-retail.bg.json";
import passportPublicEn from "../locales/passport-public.en.json";
import passportPublicSr from "../locales/passport-public.sr.json";
import passportPublicDe from "../locales/passport-public.de.json";
import passportPublicRo from "../locales/passport-public.ro.json";
import passportPublicBg from "../locales/passport-public.bg.json";

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
const deWithJourney = {
  ...de,
  suppliersPage: suppliersPageDe,
  buyerRetail: buyerRetailDe,
  passportPublic: passportPublicDe,
  grower: {
    ...de.grower,
    journey: growerJourneyDe,
  },
};
const roWithJourney = {
  ...ro,
  suppliersPage: suppliersPageRo,
  buyerRetail: buyerRetailRo,
  passportPublic: passportPublicRo,
  grower: {
    ...ro.grower,
    journey: growerJourneyRo,
  },
};
const bgWithJourney = {
  ...bg,
  suppliersPage: suppliersPageBg,
  buyerRetail: buyerRetailBg,
  passportPublic: passportPublicBg,
  grower: {
    ...bg.grower,
    journey: growerJourneyBg,
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    resources: {
      en: { translation: enWithJourney },
      sr: { translation: srWithJourney },
      de: { translation: deWithJourney },
      ro: { translation: roWithJourney },
      bg: { translation: bgWithJourney },
    },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "sr", "de", "ro", "bg"],
    interpolation: { escapeValue: true },
  });
}

export default i18n;

export const LOCALE_STORAGE_KEY = "biovera-locale";
export type SiteLocale = "en" | "sr" | "de" | "ro" | "bg";
