'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * Product catalog is only visible in the buyer dashboard after registration.
 * This route redirects: unauthenticated -> /for-buyers; buyer -> /buyer-portal/trade-panel.
 */
export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const hasBuyerAccess = isAuthenticated && user?.roles?.includes?.('buyer');
    if (hasBuyerAccess) {
      router.replace('/buyer-portal/trade-panel');
    } else {
      router.replace('/for-buyers');
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}
