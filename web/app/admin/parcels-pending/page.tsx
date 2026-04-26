'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { parcelsAPI } from '@/lib/api';
import { getAdminNavItems } from '@/lib/admin-nav';
import { MapPin, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminParcelsPendingPage() {
  const adminNavItems = getAdminNavItems();
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parcelsAPI.getPending();
      setParcels(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load pending parcels');
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (parcelId: string) => {
    setApprovingId(parcelId);
    setError(null);
    try {
      await parcelsAPI.approve(parcelId);
      await loadPending();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to approve parcel');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title="Parcels pending approval" navItems={adminNavItems}>
        <div className="p-6 max-w-4xl">
          <h1 className="text-2xl font-light text-gray-900 mb-1">Parcels pending approval</h1>
          <p className="text-sm text-gray-600 mb-6">
            The grower adds a field and a parcel; you approve the parcel. After approval, the grower can work the field
            and create batches.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
            </div>
          ) : parcels.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-600">
              No parcels waiting for approval.
            </div>
          ) : (
            <ul className="space-y-4">
              {parcels.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.estates?.name || 'Estate'} — {p.cropType || 'Parcel'}
                      </p>
                      <p className="text-xs text-gray-500">ID: {p.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApprove(p.id)}
                    disabled={approvingId !== null}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50"
                  >
                    {approvingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
