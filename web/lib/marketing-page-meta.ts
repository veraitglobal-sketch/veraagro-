import type { SiteLocale } from "@/i18n/config";
import type { Metadata } from "next";
import en from "@/locales/en.json";
import sr from "@/locales/sr.json";
import de from "@/locales/de.json";
import ro from "@/locales/ro.json";
import bg from "@/locales/bg.json";
import fr from "@/locales/fr.json";
import es from "@/locales/es.json";

/** Subset of each locale file — JSON files differ slightly; we only read these keys. */
type MarketingStrings = {
  contactPage: { heroTitle: string; heroSubtitle: string };
  faqPage: { title: string; subtitle: string };
  pressPage: { title: string; subtitle: string };
};

function stringsFor(localeFile: unknown): MarketingStrings {
  return localeFile as MarketingStrings;
}

const bundles: Record<SiteLocale, MarketingStrings> = {
  en: stringsFor(en),
  sr: stringsFor(sr),
  de: stringsFor(de),
  ro: stringsFor(ro),
  bg: stringsFor(bg),
  fr: stringsFor(fr),
  es: stringsFor(es),
};

const BRAND = "Bio Vera";

export type MarketingMetaPage = "contact" | "faq" | "press";

export function marketingPageMetadata(locale: SiteLocale, page: MarketingMetaPage): Pick<Metadata, "title" | "description"> {
  const b = bundles[locale] ?? stringsFor(en);
  if (page === "contact") {
    return {
      title: `${b.contactPage.heroTitle} | ${BRAND}`,
      description: b.contactPage.heroSubtitle,
    };
  }
  if (page === "faq") {
    return {
      title: `${b.faqPage.title} | ${BRAND}`,
      description: b.faqPage.subtitle,
    };
  }
  return {
    title: `${b.pressPage.title} | ${BRAND}`,
    description: b.pressPage.subtitle,
  };
}
