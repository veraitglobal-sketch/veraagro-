import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import sr from "../locales/sr.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    resources: {
      en: { translation: en },
      sr: { translation: sr },
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
