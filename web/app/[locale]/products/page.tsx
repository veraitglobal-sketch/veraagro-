'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

/**
 * Product catalog is only visible in the buyer dashboard after registration.
 * This route redirects: unauthenticated -> /for-buyers; buyer -> /buyer-portal/trade-panel.
 */
export default function ProductsPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const hasBuyerAccess = isAuthenticated && user?.roles?.includes?.('buyer');
    if (hasBuyerAccess) {
      router.replace('/buyer-portal/trade-panel');
    } else {
      router.replace(loc('/for-buyers'));
    }
  }, [isLoading, isAuthenticated, user, router, loc]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-[#2D5A27] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">{t('productsPage.redirecting')}</p>
      </div>
    </div>
  );
}
