'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BookCallPill from '@/components/BookCallPill';

const VeraAIChatbot = dynamic(() => import('@/components/VeraAIChatbot'), { ssr: false });

function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('cookie-consent'));
}

export default function VeraAIChatbotWrapper() {
  const [mounted, setMounted] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const sync = () => setShowChat(hasCookieConsent());

    sync();

    const onConsentOpen = () => setShowChat(false);
    const onConsentUpdated = () => setShowChat(true);

    window.addEventListener('cookie-consent-open', onConsentOpen);
    window.addEventListener('cookie-consent-updated', onConsentUpdated);
    return () => {
      window.removeEventListener('cookie-consent-open', onConsentOpen);
      window.removeEventListener('cookie-consent-updated', onConsentUpdated);
    };
  }, [mounted]);

  if (!mounted || !showChat) return null;
  return (
    <div className="print:hidden">
      <BookCallPill />
      <VeraAIChatbot />
    </div>
  );
}
