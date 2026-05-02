'use client';

import { useAuth } from '@/lib/auth';
import { useCallback, useEffect, useState } from 'react';
import { estatesAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type EstateDetail = Awaited<ReturnType<typeof estatesAPI.getOne>>;

/**
 * Legacy /producer/estates/[id] — prefer /grower/fields?estate= (redirect in next.config).
 * Simple read-only style detail; full parcel tools live on My fields.
 */
export default function ProducerEstateDetailPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [estate, setEstate] = useState<EstateDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const data = await estatesAPI.getOne(id);
      setEstate(data);
    } catch (e: unknown) {
      setEstate(null);
      setError(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/producer');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && id) void load();
  }, [isAuthenticated, id, load]);

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
          <Link
            href="/grower/fields"
            className="text-sm text-gray-600 hover:text-[#2D5A27]"
          >
            ← My fields
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error || !estate ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 text-sm">
            {error || 'Estate not found.'}
            <p className="mt-3">
              <Link href="/grower/fields" className="underline font-medium">
                Back to my fields
              </Link>
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-light text-gray-900 mb-1">{estate.name}</h1>
            <p className="text-sm text-gray-500 mb-6">
              Status: <span className="font-medium text-gray-800">{(estate as any).status || '—'}</span>
              {typeof (estate as any).calculatedArea === 'number' && (
                <span className="ml-3">
                  · Boundary ~{Math.round((estate as any).calculatedArea).toLocaleString()} m² (
                  {((estate as any).calculatedArea / 10000).toFixed(2)} ha)
                </span>
              )}
            </p>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Parcels</h2>
              {Array.isArray((estate as any).parcels) && (estate as any).parcels.length > 0 ? (
                <ul className="space-y-2">
                  {(estate as any).parcels.map((p: any) => (
                    <li
                      key={p.id}
                      className="text-sm text-gray-700 border border-gray-100 rounded-md px-3 py-2 flex justify-between gap-2"
                    >
                      <span>{p.cropType || 'Parcel'}</span>
                      <span className="text-gray-500">
                        {p.approvedAt ? 'Approved' : 'Pending approval'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No parcels on this estate yet.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/grower/fields"
                className="px-4 py-2 bg-[#2D5A27] text-white rounded-lg font-medium hover:opacity-95"
              >
                Open My fields (parcels & batches)
              </Link>
              <Link
                href="/grower/fields"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50"
              >
                All fields
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
