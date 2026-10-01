'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pathnameStartsWithLocale } from '@/lib/i18n-routing';
import { useBookCallHref } from '@/hooks/useBookCallHref';

/** Pages where the floating pill would get in the way (the booking page itself, auth, legal print views). */
const HIDDEN_SEGMENTS = new Set(['book-a-call', 'login', 'register', 'verify-email', 'impressum', 'privacy', 'terms', 'cookies']);

/** Floating "Book a free call" pill stacked above the "Need help?" button on public pages. */
export default function BookCallPill() {
  const { t } = useTranslation();
  const pathname = usePathname() ?? '/';
  const bookCall = useBookCallHref();
  if (!bookCall.enabled || !pathnameStartsWithLocale(pathname)) return null;
  const segment = pathname.split('/').filter(Boolean)[1] ?? '';
  if (HIDDEN_SEGMENTS.has(segment)) return null;
  return (
    <Link
      href={bookCall.href}
      className="fixed bottom-[4.25rem] right-5 z-[60] flex items-center gap-2 rounded-lg border border-[#2D5A27]/30 bg-white px-4 py-2.5 text-sm font-medium text-[#2D5A27] shadow-sm transition hover:bg-[#2D5A27]/5 hover:border-[#2D5A27]/50 print:hidden"
      style={{ boxShadow: '0 2px 12px rgba(45, 90, 39, 0.12)' }}
    >
      <CalendarDays className="h-5 w-5" aria-hidden />
      <span>{t('bookCall.navCta')}</span>
    </Link>
  );
}
