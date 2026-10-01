'use client';

import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BookCallRole } from '@biovera/shared/book-call';
import { BOOK_CALL_ENABLED } from '@/lib/book-call';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

/** In-page "Book a free call" button (outline, same size as the page's secondary CTAs). */
export default function BookCallButton({
  role,
  from,
  className = '',
}: {
  role?: BookCallRole;
  from: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  if (!BOOK_CALL_ENABLED) return null;
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  params.set('from', from);
  return (
    <Link
      href={`${loc('/book-a-call')}?${params.toString()}`}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] border-2 border-[#2D5A27] text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5 transition-colors ${className}`.trim()}
    >
      <CalendarDays className="h-4 w-4" aria-hidden />
      {t('bookCall.navCta')}
    </Link>
  );
}
