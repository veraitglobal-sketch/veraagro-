'use client';

import { useState, useEffect, useCallback } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI, parcelsAPI } from '@/lib/api';
import { growerNavItems } from '@/lib/grower-nav';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import GrowerSeasonJourney from '@/components/grower/GrowerSeasonJourney';

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
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="mb-6">
            <h1 className="text-3xl font-light text-gray-900">Steps</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-3xl">
              Full path from first setup to the end of a harvest. The sidebar is ordered the same:{' '}
              <strong>Dashboard</strong> → <strong>Steps</strong> → <strong>My fields</strong> … through{' '}
              <strong>Mission tracker</strong> → <strong>Profile</strong>.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-[#2D5A27]" />
            </div>
          ) : (
            <div className="mb-6 rounded-lg border border-amber-200/80 bg-amber-50/60 p-4 sm:p-5 text-sm text-amber-950">
              <p className="font-medium text-amber-950">Your parcels at a glance</p>
              <p className="mt-1 text-amber-900/90">
                {hasApprovedParcel
                  ? 'At least one parcel is approved — you can proceed with work and batches as rules allow.'
                  : hasParcel
                    ? `${pendingCount} parcel(s) still waiting for administrator approval. Some actions stay locked until a parcel is approved.`
                    : 'No parcel yet. Start in My fields: add a parcel and crop block.'}
              </p>
              <p className="mt-2">
                <Link href="/grower/fields" className="font-semibold text-[#23471f] underline">
                  My fields
                </Link>
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6">
            <GrowerSeasonJourney />
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
