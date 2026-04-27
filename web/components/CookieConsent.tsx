'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslation, Trans } from 'react-i18next';
import { X, Settings, Check, Cookie } from 'lucide-react';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functionality: boolean;
  marketing: boolean;
}

type CookieBlock = 'essential' | 'analytics' | 'functionality' | 'marketing';

function DetailList({ block }: { block: CookieBlock }) {
  const { t } = useTranslation();
  const p = `cookieConsent.${block}` as const;
  return (
    <ul className="mt-2 ml-4 space-y-1 list-disc">
      <li>
        <strong>{t('cookieConsent.essential.d1')}</strong> {t(`${p}.d1t` as 'cookieConsent.essential.d1t')}
      </li>
      <li>
        <strong>{t('cookieConsent.essential.d2')}</strong> {t(`${p}.d2t` as 'cookieConsent.essential.d2t')}
      </li>
      <li>
        <strong>{t('cookieConsent.essential.d3')}</strong> {t(`${p}.d3t` as 'cookieConsent.essential.d3t')}
      </li>
    </ul>
  );
}

export default function CookieConsent() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    functionality: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setTimeout(() => setShowBanner(true), 500);
    } else {
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  useEffect(() => {
    const openSettings = () => {
      const consent = localStorage.getItem('cookie-consent');
      if (consent) {
        try {
          setPreferences(JSON.parse(consent));
        } catch (_) {
          // ignore
        }
      }
      setShowBanner(true);
      setShowSettings(true);
    };
    window.addEventListener('cookie-consent-open', openSettings);
    return () => window.removeEventListener('cookie-consent-open', openSettings);
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      functionality: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      analytics: false,
      functionality: false,
      marketing: false,
    };
    savePreferences(onlyEssential);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: prefs }));
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return;
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
            {!showSettings ? (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Cookie className="w-5 h-5 text-[#2D5A27]" />
                    <h3 className="text-base font-light text-gray-900">
                      {t('cookieConsent.noticeTitle')}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">
                    <Trans
                      i18nKey="cookieConsent.mainBanner"
                      components={{
                        strong: <strong />,
                        cookie: <Link href={loc('/cookies')} className="text-[#2D5A27] hover:underline font-medium" />,
                        privacy: <Link href={loc('/privacy')} className="text-[#2D5A27] hover:underline font-medium" />,
                      }}
                    />
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 text-sm font-light text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {t('cookieConsent.customize')}
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-sm font-light text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('cookieConsent.rejectAll')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2D5A27] rounded-lg hover:bg-[#23471f] transition-colors"
                  >
                    {t('cookieConsent.acceptAll')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-light text-gray-900">{t('cookieConsent.prefsTitle')}</h3>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={t('common.close')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {t('cookieConsent.essential.title')}
                        </h4>
                        <p className="text-xs text-gray-500 font-light mt-1">
                          {t('cookieConsent.essential.subtitle')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-light">{t('cookieConsent.essential.always')}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-light mb-2">{t('cookieConsent.essential.p1')}</p>
                    <details className="text-xs text-gray-500 font-light">
                      <summary className="cursor-pointer text-[#2D5A27] hover:underline">
                        {t('cookieConsent.essential.details')}
                      </summary>
                      <DetailList block="essential" />
                    </details>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {t('cookieConsent.analytics.title')}
                        </h4>
                        <p className="text-xs text-gray-500 font-light mt-1">
                          {t('cookieConsent.analytics.subtitle')}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={() => togglePreference('analytics')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2D5A27]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D5A27]" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 font-light mb-2">{t('cookieConsent.analytics.p1')}</p>
                    <details className="text-xs text-gray-500 font-light">
                      <summary className="cursor-pointer text-[#2D5A27] hover:underline">
                        {t('cookieConsent.essential.details')}
                      </summary>
                      <DetailList block="analytics" />
                    </details>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {t('cookieConsent.functionality.title')}
                        </h4>
                        <p className="text-xs text-gray-500 font-light mt-1">
                          {t('cookieConsent.functionality.subtitle')}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.functionality}
                          onChange={() => togglePreference('functionality')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 font-light mb-2">{t('cookieConsent.functionality.p1')}</p>
                    <details className="text-xs text-gray-500 font-light">
                      <summary className="cursor-pointer text-[#2D5A27] hover:underline">
                        {t('cookieConsent.essential.details')}
                      </summary>
                      <DetailList block="functionality" />
                    </details>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {t('cookieConsent.marketing.title')}
                        </h4>
                        <p className="text-xs text-gray-500 font-light mt-1">
                          {t('cookieConsent.marketing.subtitle')}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={() => togglePreference('marketing')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D5A27]" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 font-light mb-2">{t('cookieConsent.marketing.p1')}</p>
                    <details className="text-xs text-gray-500 font-light">
                      <summary className="cursor-pointer text-[#2D5A27] hover:underline">
                        {t('cookieConsent.essential.details')}
                      </summary>
                      <DetailList block="marketing" />
                    </details>
                  </div>
                </div>

                <p className="text-xs text-gray-500 font-light">
                  <Trans
                    i18nKey="cookieConsent.fullListFooter"
                    components={{
                      1: <Link href={loc('/cookies')} className="text-[#2D5A27] hover:underline" />,
                      2: <Link href={loc('/privacy')} className="text-xs text-gray-500 font-light text-[#2D5A27] hover:underline" />,
                    }}
                  />
                </p>
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <Link
                    href={loc('/cookies')}
                    className="px-4 py-2 text-sm font-light text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('cookieConsent.fullPolicyLink')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-sm font-light text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('cookieConsent.rejectAll')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2D5A27] rounded-lg hover:bg-[#23471f] transition-colors"
                  >
                    {t('cookieConsent.savePrefs')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
