import type { SiteLocale } from "@/i18n/config";

/** URL segments for public/marketing pages that live under /[locale]/… */
export const LOCALIZED_FIRST_SEGMENTS = new Set([
  "about",
  "careers",
  "contact",
  "cookies",
  "faq",
  "for-buyers",
  "growers",
  "suppliers",
  "products",
  "press",
  "privacy",
  "terms",
  "legal",
  "investors",
  "help-center",
  "security",
  "language",
]);

/** Routes that never use /en or /sr prefix (apps, APIs, tools). */
export const LOCALE_FREE_FIRST_SEGMENTS = new Set([
  "api",
  "_next",
  "admin",
  "grower",
  "buyer-portal",
  "buyer",
  "fleet-partner",
  "logistics-partner",
  "supplier",
  "producer",
  "register",
  "verify",
  "verify-email",
  "passport",
  "track",
  "batch",
  "estate",
  "plot",
  "farmer",
  "certificate",
  "transparency",
  "missions",
  "pre-order-2026",
  "hub-manager",
  "aeo-dashboard",
  "operations-center",
  "protocol-360",
  "distributor-network",
  "login",
  "coordinator",
]);

export const siteLocales = ["en", "sr", "de", "ro", "bg"] as const satisfies readonly SiteLocale[];

export function isSiteLocale(v: string): v is SiteLocale {
  return v === "en" || v === "sr" || v === "de" || v === "ro" || v === "bg";
}

/** Map i18next language tag to canonical site locale (URL prefix + cookie). */
export function siteLocaleFromLanguageTag(tag: string | undefined): SiteLocale {
  if (!tag) return "en";
  const lower = tag.toLowerCase();
  if (lower.startsWith("sr")) return "sr";
  if (lower.startsWith("de")) return "de";
  if (lower === "ro" || lower.startsWith("ro-")) return "ro";
  if (lower === "bg" || lower.startsWith("bg-")) return "bg";
  return "en";
}

/** `Intl` / `toLocaleDateString` tag for field copy (dates in UI). */
export function dateIntlLocaleFromLanguageTag(tag: string | undefined): string {
  const loc = siteLocaleFromLanguageTag(tag);
  if (loc === "sr") return "sr-Latn";
  if (loc === "de") return "de-DE";
  if (loc === "ro") return "ro-RO";
  if (loc === "bg") return "bg-BG";
  return "en-GB";
}

/** Locale for number/currency-style formatting (e.g. sr-RS, de-DE). */
export function numberIntlLocaleFromLanguageTag(tag: string | undefined): string {
  const loc = siteLocaleFromLanguageTag(tag);
  if (loc === "sr") return "sr-RS";
  if (loc === "de") return "de-DE";
  if (loc === "ro") return "ro-RO";
  if (loc === "bg") return "bg-BG";
  return "en-US";
}

/**
 * Marketing pages live at `/en/press` and `/sr/press`, but static press assets ship from
 * `public/press/` (e.g. `/press/biovera-logo.zip`). Those URLs must NOT get a locale redirect.
 */
export function pathIsUnderPressPublicAssets(pathname: string): boolean {
  return /^\/press\/[^/]+\.[a-z0-9]{2,14}$/i.test(pathname);
}

export function pathnameStartsWithLocale(pathname: string): SiteLocale | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (seg === "en" || seg === "sr" || seg === "de" || seg === "ro" || seg === "bg") return seg;
  return null;
}

/** Strip a leading `/en` or `/sr` so `/sr/grower/x` and `/grower/x` can be compared. */
export function stripLeadingSiteLocale(pathname: string): string {
  const loc = pathnameStartsWithLocale(pathname);
  if (!loc) return pathname;
  const rest = pathname.slice(`/${loc}`.length) || "/";
  return rest;
}

/** Whether middleware should prefix /en or /sr for this path when locale is missing. */
export function pathNeedsLocaleRedirect(pathname: string): boolean {
  if (pathIsUnderPressPublicAssets(pathname)) return false;
  if (pathname === "/" || pathname === "") return true;
  const seg = pathname.split("/").filter(Boolean)[0];
  return LOCALIZED_FIRST_SEGMENTS.has(seg);
}

export function pathIsLocaleFree(pathname: string): boolean {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg) return false;
  return LOCALE_FREE_FIRST_SEGMENTS.has(seg);
}

/**
 * Build a path with locale prefix. `path` should start with / (e.g. `/growers`, `/contact?x=1`).
 */
export function withLocalePrefix(locale: SiteLocale, path: string): string {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  const [pathnamePart, queryPart] = trimmed.split("?");
  const q = queryPart ? `?${queryPart}` : "";
  if (pathnamePart === "/" || pathnamePart === "") return `/${locale}${q}`;
  return `/${locale}${pathnamePart}${q}`;
}

/**
 * Swap locale in URL when already prefixed (`/en/about` → `/sr/about`).
 * When path has no locale prefix, prefix whole path with `newLocale`.
 */
export function replaceLocaleInPathname(pathname: string, newLocale: SiteLocale): string {
  const existing = pathnameStartsWithLocale(pathname);
  if (existing) {
    const rest = pathname.slice(existing.length + 2) || "/";
    return withLocalePrefix(newLocale, rest);
  }
  return withLocalePrefix(newLocale, pathname === "" ? "/" : pathname);
}

/**
 * When switching language from the UI: navigate if URL carries locale or is a localized marketing path;
 * otherwise only update i18n + cookie (e.g. `/grower`, `/admin`).
 */
export function getSwitchLocaleTarget(
  pathname: string,
  newLocale: SiteLocale,
): { kind: "navigate"; href: string } | { kind: "noop" } {
  const currentFromUrl = pathnameStartsWithLocale(pathname);
  if (currentFromUrl) {
    if (currentFromUrl === newLocale) return { kind: "noop" };
    return { kind: "navigate", href: replaceLocaleInPathname(pathname, newLocale) };
  }
  if (pathIsLocaleFree(pathname)) {
    const first = pathname.split("/").filter(Boolean)[0];
    /** Unprefixed grower app: keep language and URL in sync with `/sr/grower/…` / `/en/grower/…`. */
    if (first === "grower") {
      return { kind: "navigate", href: withLocalePrefix(newLocale, pathname) };
    }
    return { kind: "noop" };
  }
  const seg = pathname.split("/").filter(Boolean)[0];
  if (pathname === "/" || (seg && LOCALIZED_FIRST_SEGMENTS.has(seg))) {
    return {
      kind: "navigate",
      href: withLocalePrefix(newLocale, pathname === "/" ? "/" : pathname),
    };
  }
  return { kind: "noop" };
}
