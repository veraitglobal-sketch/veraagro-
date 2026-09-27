import type { SiteLocale } from "@/i18n/config";
import type { Metadata } from "next";
import en from "@/locales/en.json";
import sr from "@/locales/sr.json";
import de from "@/locales/de.json";
import ro from "@/locales/ro.json";
import bg from "@/locales/bg.json";
import fr from "@/locales/fr.json";
import es from "@/locales/es.json";
import { generateLocaleMetadata } from "@/lib/seo-metadata";

type MarketingStrings = {
  contactPage: { heroTitle: string; heroSubtitle: string };
  faqPage: { title: string; subtitle: string };
  pressPage: { title: string; subtitle: string };
  helpCenterPage?: { title: string; subtitle: string };
  securityPage?: { heroTitle: string; heroLead: string };
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

export type MarketingMetaPage = "contact" | "faq" | "press" | "help-center" | "security";

export function marketingPageMetadata(locale: SiteLocale, page: MarketingMetaPage): Metadata {
  const b = bundles[locale] ?? stringsFor(en);

  if (page === "contact") {
    return generateLocaleMetadata({
      locale,
      title: b.contactPage.heroTitle,
      description: b.contactPage.heroSubtitle,
      segment: "contact",
    });
  }
  if (page === "faq") {
    return generateLocaleMetadata({
      locale,
      title: b.faqPage.title,
      description: b.faqPage.subtitle,
      segment: "faq",
    });
  }
  if (page === "help-center") {
    const hc = b.helpCenterPage ?? bundles.en.helpCenterPage!;
    const metaDescription =
      (hc as { subtitle?: string; metaDescription?: string }).metaDescription ??
      (hc as { subtitle?: string }).subtitle ??
      "Guidance for buyers, growers, drivers, and partners on Bio Vera workflows, quality, and traceability.";
    return generateLocaleMetadata({
      locale,
      title: hc.title,
      description: metaDescription,
      segment: "help-center",
    });
  }
  if (page === "security") {
    const sec = b.securityPage ?? bundles.en.securityPage!;
    return generateLocaleMetadata({
      locale,
      title: sec.heroTitle,
      description: sec.heroLead,
      segment: "security",
    });
  }
  return generateLocaleMetadata({
    locale,
    title: b.pressPage.title,
    description: b.pressPage.subtitle,
    segment: "press",
  });
}
