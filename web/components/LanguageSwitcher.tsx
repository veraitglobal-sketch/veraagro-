'use client';

import { useTranslation } from 'react-i18next';
import { LOCALE_STORAGE_KEY, type SiteLocale } from '@/i18n/config';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('sr') ? 'sr' : 'en';

  const setLng = (lng: SiteLocale) => {
    void i18n.changeLanguage(lng);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, lng);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs font-medium shadow-sm ${className}`}
      role="group"
      aria-label={t('locale.aria')}
    >
      <button
        type="button"
        onClick={() => setLng('en')}
        className={`rounded-md px-2.5 py-1 transition-colors ${
          current === 'en' ? 'bg-[#2D5A27] text-white' : 'text-gray-600 hover:bg-gray-50'
        }`}
        aria-pressed={current === 'en'}
      >
        {t('locale.enShort')}
      </button>
      <button
        type="button"
        onClick={() => setLng('sr')}
        className={`rounded-md px-2.5 py-1 transition-colors ${
          current === 'sr' ? 'bg-[#2D5A27] text-white' : 'text-gray-600 hover:bg-gray-50'
        }`}
        aria-pressed={current === 'sr'}
      >
        {t('locale.srShort')}
      </button>
    </div>
  );
}
