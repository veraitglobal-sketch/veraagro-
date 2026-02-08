'use client';

import { useState, useEffect } from 'react';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functionality: boolean;
  marketing: boolean;
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load preferences from localStorage
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      try {
        const prefs = JSON.parse(consent);
        setPreferences(prefs);
      } catch (e) {
        console.error('Failed to parse cookie preferences:', e);
      }
    }
    setIsLoading(false);

    // Listen for updates
    const handleUpdate = (event: CustomEvent<CookiePreferences>) => {
      setPreferences(event.detail);
    };

    window.addEventListener('cookie-consent-updated', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('cookie-consent-updated', handleUpdate as EventListener);
    };
  }, []);

  const hasConsent = (type: keyof CookiePreferences): boolean => {
    if (!preferences) return false;
    // Essential cookies are always allowed
    if (type === 'essential') return true;
    return preferences[type] === true;
  };

  return {
    preferences,
    isLoading,
    hasConsent,
  };
}
