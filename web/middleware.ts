import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SiteLocale } from "@/i18n/config";
import {
  pathnameStartsWithLocale,
  pathIsLocaleFree,
  pathNeedsLocaleRedirect,
} from "@/lib/i18n-routing";
import { CANONICAL_SITE_HOST } from "@/lib/site-url";

const LOCALE_COOKIE = "biovera-locale";
const LOCALE_HEADER = "x-biovera-locale";

function redirectApexToWww(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "biovera.app") return null;
  const url = request.nextUrl.clone();
  url.hostname = CANONICAL_SITE_HOST;
  return NextResponse.redirect(url, 301);
}

function withLocaleHeader(response: NextResponse, locale: SiteLocale): NextResponse {
  response.headers.set(LOCALE_HEADER, locale);
  return response;
}

/**
 * First-time visitors: always English. No Accept-Language sniffing — avoids
 * surprise locales (VPN, shared PCs, “wrong” browser defaults). After the user
 * picks SR in the UI or opens /sr/…, the cookie (or URL) pins the choice.
 */
function preferredLocale(request: NextRequest): SiteLocale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie === "sr" || cookie === "en" || cookie === "de" || cookie === "ro" || cookie === "bg" || cookie === "fr" || cookie === "es") return cookie;
  return "en";
}

/** No trailing slash on marketing URLs (matches Next trailingSlash: false + sitemap locs). */
function redirectTrailingSlash(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname.length <= 1 || !pathname.endsWith("/")) return null;
  const url = request.nextUrl.clone();
  url.pathname = pathname.slice(0, -1);
  return NextResponse.redirect(url, 301);
}

export function middleware(request: NextRequest) {
  const apexRedirect = redirectApexToWww(request);
  if (apexRedirect) return apexRedirect;

  const trailingSlashRedirect = redirectTrailingSlash(request);
  if (trailingSlashRedirect) return trailingSlashRedirect;

  const { pathname } = request.nextUrl;

  /** Legacy locale-free Protocol 360 → EN marketing route. */
  if (pathname === "/protocol-360" || pathname === "/protocol-360/") {
    const url = request.nextUrl.clone();
    url.pathname = "/en/protocol-360";
    const res = NextResponse.redirect(url, 301);
    return withLocaleHeader(res, "en");
  }

  /** Main marketing login lives under /[locale]/login; keep query (e.g. returnTo). */
  if (pathname === "/login" || pathname === "/login/") {
    const locale = preferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  }

  const existingLocale = pathnameStartsWithLocale(pathname);
  if (existingLocale) {
    const afterLocale = pathname.slice(`/${existingLocale}`.length) || "/";
    /** `/sr/login/buyer` etc. → locale-free `/login/buyer`. Keep `/sr/login` on `[locale]/login`. */
    if (afterLocale.startsWith("/login/")) {
      const url = request.nextUrl.clone();
      url.pathname = afterLocale;
      const res = NextResponse.rewrite(url);
      res.cookies.set(LOCALE_COOKIE, existingLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return withLocaleHeader(res, existingLocale);
    }
    /** `/sr/grower/…` and `/en/grower/…` are locale-prefixed URLs for the grower app (same pages as `/grower/…`). */
    if (afterLocale === "/grower" || afterLocale.startsWith("/grower/")) {
      const url = request.nextUrl.clone();
      url.pathname = afterLocale;
      const res = NextResponse.rewrite(url);
      res.cookies.set(LOCALE_COOKIE, existingLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return res;
    }

    const res = NextResponse.next();
    res.cookies.set(LOCALE_COOKIE, existingLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return withLocaleHeader(res, existingLocale);
  }

  if (pathIsLocaleFree(pathname)) {
    return NextResponse.next();
  }

  if (!pathNeedsLocaleRedirect(pathname)) {
    return NextResponse.next();
  }

  /** Root `/` → `/en` or `/sr` from cookie; first visit defaults EN (spec §1.2). */
  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const res = NextResponse.redirect(url, 301);
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|SVG|PNG|JPG|JPEG|GIF|WEBP|ICO)$).*)",
  ],
};
