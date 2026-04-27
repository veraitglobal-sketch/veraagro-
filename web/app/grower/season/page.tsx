'use client';

import { useState, useEffect, useCallback } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI, parcelsAPI } from '@/lib/api';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import GrowerSeasonJourney from '@/components/grower/GrowerSeasonJourney';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

export default function GrowerFieldSeasonPage() {
  const growerNavItems = useGrowerNavItems();
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
        <GrowerPageShell>
            <GrowerPageHeader
              title="Steps"
              description={
                <>
                  From first setup to transport. The cards below are <strong>12 numbered steps</strong> (full story); the
                  green sidebar has <strong>11 links</strong> in the same order — a few steps here are split for clarity (e.g.
                  approval, field work). Use the chips to jump.
                </>
              }
              right={
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-gray-500 shadow-sm ring-1 ring-gray-200/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2D5A27]" />
                  12 cards · 11 nav links
                </span>
              }
            />

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-[#2D5A27]" />
              </div>
            ) : (
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-semibold text-amber-950">Your parcels at a glance</p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-950/90">
                    {hasApprovedParcel
                      ? 'At least one parcel is approved — you can proceed with work and batches as rules allow.'
                      : hasParcel
                        ? `${pendingCount} parcel(s) still waiting for administrator approval. Some actions stay locked until a parcel is approved.`
                        : 'No parcel yet. Start in My fields: add a parcel and crop block.'}
                  </p>
                </div>
                <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Fields &amp; map</p>
                  <Link
                    href="/grower/fields"
                    className="mt-1 text-base font-semibold text-[#23471f] underline decoration-[#2D5A27]/30 underline-offset-2 hover:decoration-[#2D5A27]"
                  >
                    My fields
                  </Link>
                  <p className="mt-1 text-sm text-gray-600">
                    The grid has 12 cards; the sidebar skips duplicate headings — same journey, easier navigation.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
              <GrowerSeasonJourney />
            </div>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
