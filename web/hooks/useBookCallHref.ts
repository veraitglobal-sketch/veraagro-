'use client';

import { usePathname } from 'next/navigation';
import { bookCallRoleFromPath, bookCallRoleFromUserRoles } from '@biovera/shared/book-call';
import { useAuth } from '@/lib/auth';
import { BOOK_CALL_ENABLED } from '@/lib/book-call';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

/** Link to /[locale]/book-a-call with the role suggested by the current page or the signed-in user. */
export function useBookCallHref(): { href: string; enabled: boolean } {
  const loc = useLocalizedHref();
  const pathname = usePathname() ?? '/';
  const { user } = useAuth();
  const role = bookCallRoleFromPath(pathname) ?? bookCallRoleFromUserRoles(user?.roles);
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  params.set('from', pathname.slice(0, 120));
  return { href: `${loc('/book-a-call')}?${params.toString()}`, enabled: BOOK_CALL_ENABLED };
}
