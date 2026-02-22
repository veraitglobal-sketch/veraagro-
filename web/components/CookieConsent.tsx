'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Settings, Check, Cookie } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functionality: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    functionality: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 500);
    } else {
      // Load saved preferences
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
      } catch (e) {
        // If parsing fails, show banner again
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
        } catch (_) {}
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
    
    // Trigger custom event for other components to react
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: prefs }));
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
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
              // Main Banner
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Cookie className="w-5 h-5 text-[#2D5A27]" />
                    <h3 className="text-base font-light text-gray-900">
                      Cookie notice
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 font-light leading-relaxed">
                    We use <strong>essential</strong> cookies so the platform works (login, security, your consent choice). 
                    Optional cookies help us improve the site (analytics), remember your preferences (functionality), and, if you allow, support marketing. 
                    You can accept all, reject non-essential, or choose by category. Full list of cookies, purposes, and retention is in our{' '}
                    <Link href="/cookies" className="text-[#2D5A27] hover:underline font-medium">
                      Cookie Policy
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-[#2D5A27] hover:underline font-medium">
                      Privacy Policy
                    </Link>.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 text-sm font-light text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Customize
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-sm font-light text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reject All
                  </button>
                    <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2D5A27] rounded-lg hover:bg-[#23471f] transition-colors"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              // Settings Panel
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-light text-gray-900">Cookie Preferences</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Essential Cookies */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Essential Cookies</h4>
                        <p className="text-xs text-gray-500 font-light mt-1">
                          Required for the platform to function
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-light">Always Active</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-light mb-2">
                      Necessary for the platform to work. They cannot be disabled.
                    </p>
                    <details className="text-xs text-gray-500 font-light">
                      <summary className="cursor-pointer text-[#2D5A27] hover:underline">Details</summary>
                      <ul className="mt-2 ml-4 space-y-1 list-disc">
                        <li><strong>Purpose:</strong> Login session, authentication token (JWT), security (e.g. CSRF), load balancing, and storing this consent choice.</li>
                        <li><strong>Examples:</strong> Session ID, token (in localStorage), cookie-consent and cookie-consent-date (localStorage).</li>
                        <li><strong>Retention:</strong> Session (until you close the browser) or up to 1 year for persistent ones (e.g. consent).</li>
                      </ul>
                    </details>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Analytics Cookies</h4>
                        <p className="text-xs text-gray-500 font-light mt-1">
                          Help us understand how you use our platform
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={() => togglePreference('analytics')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2D5A27]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D5A27]"></div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 font-light mb-2">
                      Help us understand how the platform is used so we can improve it.
                    </p>
                    <details className="text-xs text-gray-500 font-light">
                      <summary className="cursor-pointer text-[#2D5A27] hover:underline">Details</summary>
                      <ul className="mt-2 ml-4 space-y-1 list-disc">
                        <li><strong>Purpose:</strong> Anonymous statistics: page views, navigation paths, device type, and performance (e.g. load times). No identification of individuals.</li>
                        <li><strong>Examples:</strong> Analytics cookies from tools we may use (e.g. page view counters, session duration).</li>
                        <li><strong>Retention:</strong> Up to 2 years, depending on the tool. You can turn this category off at any time.</li>
                      </ul>
                    </details>
                  </div>

                  {/* Functionality Cookies */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Functionality Cookies</h4>
                        <p className="text-xs text-gray-500 font-light mt-1">
                          Remember your preferences and settings
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.functionality}
                          onChange={() => togglePreference('functionality')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 font-light mb-2">
                      Remember your choices and settings for a more convenient experience.
                    </p>
                    <details className="text-xs text-gray-500 font-light">
                      <summary className="cursor-pointer text-[#2D5A27] hover:underline">Details</summary>
                      <ul className="mt-2 ml-4 space-y-1 list-disc">
                        <li><strong>Purpose:</strong> Language, region, display options (e.g. theme), accessibility settings, and temporary form data to avoid data loss.</li>
                        <li><strong>Examples:</strong> preference_*, language, theme, or similar identifiers stored in localStorage/sessionStorage.</li>
                        <li><strong>Retention:</strong> Up to 1 year or until you clear site data.</li>
                      </ul>
                    </details>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Marketing Cookies</h4>
                        <p className="text-xs text-gray-500 font-light mt-1">
                          Used for advertising and marketing purposes
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={() => togglePreference('marketing')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D5A27]"></div>
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 font-light mb-2">
                      Used for advertising and measuring campaign effectiveness, if we use such tools in the future.
                    </p>
                    <details className="text-xs text-gray-500 font-light">
                      <summary className="cursor-pointer text-[#2D5A27] hover:underline">Details</summary>
                      <ul className="mt-2 ml-4 space-y-1 list-disc">
                        <li><strong>Purpose:</strong> Personalized ads and measurement of ad performance (e.g. conversions). May involve third-party ad partners.</li>
                        <li><strong>Examples:</strong> Advertising or marketing cookies set by us or our partners, if we enable them.</li>
                        <li><strong>Retention:</strong> As per the relevant provider; typically up to 2 years. You can withdraw consent at any time.</li>
                      </ul>
                    </details>
                  </div>
                </div>

                <p className="text-xs text-gray-500 font-light">
                  Full list of cookies, retention periods, and third-party services: <Link href="/cookies" className="text-[#2D5A27] hover:underline">Cookie Policy</Link>. 
                  How we use data: <Link href="/privacy" className="text-[#2D5A27] hover:underline">Privacy Policy</Link>.
                </p>
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <Link
                    href="/cookies"
                    className="px-4 py-2 text-sm font-light text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Full Cookie Policy
                  </Link>
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-sm font-light text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2D5A27] rounded-lg hover:bg-[#23471f] transition-colors"
                  >
                    Save Preferences
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
