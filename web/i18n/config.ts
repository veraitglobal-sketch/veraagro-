import i18n from "i18next";
import { initReactI18next } from "react-i18next";
/**
 * Single English namespace for now (`locales/en.json`):
 * marketing, nav, grower, adminNav, buyerPortalNav, common, …
 * Import the same file in `lib/messages` / nav modules so copy stays DRY. Add `sr.json` + `lng` when you ship Serbian on web.
 */
import en from "../locales/en.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en"],
    interpolation: { escapeValue: true },
  });
}

export default i18n;
