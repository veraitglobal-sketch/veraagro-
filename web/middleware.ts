import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SiteLocale } from "@/i18n/config";
import {
  pathnameStartsWithLocale,
  pathIsLocaleFree,
  pathNeedsLocaleRedirect,
} from "@/lib/i18n-routing";

const LOCALE_COOKIE = "biovera-locale";

function preferredLocale(request: NextRequest): SiteLocale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie === "sr" || cookie === "en") return cookie;
  const al = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (al.includes("sr")) return "sr";
  return "en";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const existingLocale = pathnameStartsWithLocale(pathname);
  if (existingLocale) {
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
