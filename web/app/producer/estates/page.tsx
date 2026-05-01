'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState, useCallback } from 'react';
import { estatesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Legacy /producer/estates list — prefer /grower/fields (redirect in next.config).
 * Kept for backwards compatibility; links herein point to canonical routes.
 */
export default function ProducerEstatesListPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [estates, setEstates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(data || []);
    } catch (e) {
      console.error(e);
      setEstates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/producer');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-[#2D5A27]">
            vera
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/grower" className="text-gray-600 hover:text-[#2D5A27]">
              Grower
            </Link>
            <Link href="/grower/fields" className="px-3 py-1.5 bg-[#2D5A27] text-white rounded-lg text-sm font-medium">
              + Add estate
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-light text-gray-900">My estates</h1>
          <Link
            href="/grower/fields"
            className="inline-block px-4 py-2 bg-[#2D5A27] text-white rounded-lg text-sm font-medium hover:opacity-95"
          >
            + Add estate
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : estates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {estates.map((estate: any) => (
              <Link
                key={estate.id}
                href={`/grower/fields?estate=${encodeURIComponent(estate.id)}`}
                className="block bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-[#2D5A27]/40 transition-colors"
              >
                <h2 className="text-lg font-medium text-gray-900 mb-1">{estate.name}</h2>
                <p className="text-sm text-gray-500 mb-3">
                  {estate.parcels?.length ?? 0} parcel{estate.parcels?.length === 1 ? '' : 's'}
                </p>
                <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded bg-gray-100 text-gray-800">
                  {estate.status || '—'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-lg p-10 text-center">
            <p className="text-gray-600 mb-4">You have no estates yet.</p>
            <Link href="/grower/fields" className="text-[#2D5A27] font-medium hover:underline">
              Create your first estate →
            </Link>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-8">
          <Link href="/grower/fields" className="text-[#2D5A27] underline">
            My fields
          </Link>{' '}
          (grower) has parcel tools on the same data.
        </p>
      </div>
    </div>
  );
}
