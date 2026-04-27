"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LOCALE_STORAGE_KEY, type SiteLocale } from "@/i18n/config";
import { getSwitchLocaleTarget, pathnameStartsWithLocale } from "@/lib/i18n-routing";

function setLocaleCookieClient(locale: SiteLocale) {
  try {
    document.cookie = `${LOCALE_STORAGE_KEY}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fromUrl = pathnameStartsWithLocale(pathname);
  const current: SiteLocale =
    fromUrl ?? (i18n.resolvedLanguage?.startsWith("sr") ? "sr" : "en");

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const applyLang = (lng: SiteLocale) => {
    void i18n.changeLanguage(lng);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, lng);
    } catch {
      /* ignore */
    }
    setLocaleCookieClient(lng);

    const target = getSwitchLocaleTarget(pathname, lng);
    if (target.kind === "navigate") {
      router.replace(target.href);
    }
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("locale.pickerAria")}
      >
        <Globe className="h-3.5 w-3.5 text-[#2D5A27]" aria-hidden />
        <span className="tabular-nums">{current === "sr" ? t("locale.nameSr") : t("locale.nameEn")}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-[60] mt-1 min-w-[10rem] rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
        >
          <li role="option">
            <button
              type="button"
              className={`flex w-full px-3 py-2 text-left hover:bg-gray-50 ${current === "en" ? "font-semibold text-[#2D5A27]" : ""}`}
              onClick={() => applyLang("en")}
            >
              {t("locale.nameEn")}
            </button>
          </li>
          <li role="option">
            <button
              type="button"
              className={`flex w-full px-3 py-2 text-left hover:bg-gray-50 ${current === "sr" ? "font-semibold text-[#2D5A27]" : ""}`}
              onClick={() => applyLang("sr")}
            >
              {t("locale.nameSr")}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
