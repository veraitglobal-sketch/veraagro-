"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useSiteLocale } from "@/hooks/useSiteLocale";
import type { SiteLocale } from "@/i18n/config";
import { siteLocales, localeNativeDisplayName } from "@/lib/i18n-routing";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { current, applyLocale } = useSiteLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const onPick = async (lng: SiteLocale) => {
    await applyLocale(lng);
    setOpen(false);
  };

  const currentLabel = localeNativeDisplayName[current];

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
        <span className="tabular-nums">{currentLabel}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-[60] mt-1 min-w-[10rem] max-h-[min(70vh,24rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
        >
          {siteLocales.map((code) => (
            <li key={code} role="option">
              <button
                type="button"
                className={`flex w-full px-3 py-2 text-left hover:bg-gray-50 ${current === code ? "font-semibold text-[#2D5A27]" : ""}`}
                onClick={() => void onPick(code)}
              >
                {localeNativeDisplayName[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
