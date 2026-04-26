'use client';

import { useState, useEffect, useCallback } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI, parcelsAPI } from '@/lib/api';
import { growerNavItems } from '@/lib/grower-nav';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function GrowerFieldSeasonPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasParcel, setHasParcel] = useState(false);
  const [hasApprovedParcel, setHasApprovedParcel] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await estatesAPI.getAll();
      let approved = 0;
      let pending = 0;
      let parcelsTotal = 0;
      for (const e of list || []) {
        const parcels = await parcelsAPI.getByEstate(e.id).catch(() => []);
        for (const p of parcels || []) {
          parcelsTotal += 1;
          if (p.approvedAt) approved += 1;
          else pending += 1;
        }
      }
      setHasParcel(parcelsTotal > 0);
      setHasApprovedParcel(approved > 0);
      setPendingCount(pending);
    } catch (err: any) {
      setError(err.message || 'Could not load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title="Steps" navItems={growerNavItems}>
        <div className="w-full max-w-6xl mx-auto space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6">
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Three steps</h1>
            <p className="text-sm text-gray-500 mb-6">Parcels → approval → work &amp; harvest</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-[#2D5A27]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-800">
                  <span className="font-semibold text-gray-900">1. Add parcels</span>
                  <p className="text-gray-600 mt-1 mb-2">Name fields and add crop blocks in My fields.</p>
                  <Link href="/grower/fields" className="text-[#2D5A27] font-medium text-sm hover:underline">
                    Open My fields →
                  </Link>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-800">
                  <span className="font-semibold text-gray-900">2. Admin approval</span>
                  <p className="text-gray-600 mt-1">
                    {hasApprovedParcel
                      ? 'You are approved — continue to the right.'
                      : hasParcel
                        ? `${pendingCount} waiting for approval.`
                        : 'Add a parcel first (step 1).'}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-800 md:col-span-1">
                  <span className="font-semibold text-gray-900">3. Then</span>
                  {hasApprovedParcel ? (
                    <ul className="mt-2 space-y-2 list-none">
                      <li>
                        <Link href="/grower/materials" className="text-[#2D5A27] font-medium hover:underline">
                          Materials
                        </Link>
                      </li>
                      <li className="text-gray-600">Field diary &amp; seed — mobile app</li>
                      <li>
                        <Link href="/grower/fields" className="text-[#2D5A27] font-medium hover:underline">
                          Report harvest (batch)
                        </Link>
                      </li>
                      <li>
                        <Link href="/grower/batches" className="text-gray-700 hover:underline">
                          My batches
                        </Link>
                      </li>
                    </ul>
                  ) : (
                    <p className="text-gray-500 mt-1">Unlocked after step 2.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
