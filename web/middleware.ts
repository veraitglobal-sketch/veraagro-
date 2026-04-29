import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SiteLocale } from "@/i18n/config";
import {
  pathnameStartsWithLocale,
  pathIsLocaleFree,
  pathNeedsLocaleRedirect,
} from "@/lib/i18n-routing";

const LOCALE_COOKIE = "biovera-locale";

/**
 * First-time visitors: always English. No Accept-Language sniffing — avoids
 * surprise locales (VPN, shared PCs, “wrong” browser defaults). After the user
 * picks SR in the UI or opens /sr/…, the cookie (or URL) pins the choice.
 */
function preferredLocale(request: NextRequest): SiteLocale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie === "sr" || cookie === "en" || cookie === "de" || cookie === "ro" || cookie === "bg") return cookie;
  return "en";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    /** `/sr/grower/…` and `/en/grower/…` are locale-prefixed URLs for the grower app (same pages as `/grower/…`). */
    const afterLocale = pathname.slice(`/${existingLocale}`.length) || "/";
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
    return res;
  }

  if (pathIsLocaleFree(pathname)) {
    return NextResponse.next();
  }

  if (!pathNeedsLocaleRedirect(pathname)) {
    return NextResponse.next();
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const res = NextResponse.redirect(url);
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
