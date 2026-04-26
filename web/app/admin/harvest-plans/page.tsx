'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { harvestAnnouncementsAPI } from '@/lib/api';
import { getAdminNavItems } from '@/lib/admin-nav';
import { CalendarRange, Loader2, CheckCircle, XCircle, Clock, User, MapPin } from 'lucide-react';

type Row = {
  id: string;
  announcementType: string;
  cropType: string;
  estimatedDate: string;
  estimatedQuantity?: number | null;
  status: string;
  marketChannel?: string | null;
  qualityGrade?: string | null;
  loadQuantityKg?: number | null;
  plannedLoadingStart?: string | null;
  plannedLoadingEnd?: string | null;
  sortingSpec?: string | null;
  adminNotes?: string | null;
  user?: { firstName?: string; lastName?: string; partnerCode?: string };
  parcel?: { cropType?: string; estates?: { name?: string } };
};

function HarvestPlansInner() {
  const adminNavItems = getAdminNavItems();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await harvestAnnouncementsAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      const notes: Record<string, string> = {};
      list.forEach((r: Row) => {
        if (r.adminNotes) notes[r.id] = r.adminNotes;
      });
      setAdminNotes((prev) => ({ ...prev, ...notes }));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load harvest plans');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    setSaving(id);
    setError(null);
    try {
      await harvestAnnouncementsAPI.setStatus(id, status);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSaving(null);
    }
  };

  const saveAdminNotes = async (id: string) => {
    setSaving(id);
    setError(null);
    try {
      await harvestAnnouncementsAPI.updateAdmin(id, { adminNotes: adminNotes[id] || '' });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title="Harvest plans" navItems={adminNavItems}>
        <div className="p-6 max-w-4xl">
          <h1 className="text-2xl font-light text-gray-900 mb-1">Harvest &amp; planting plans</h1>
          <p className="text-sm text-gray-600 mb-6">
            Growers submit planned dates, load quantities, and channel (industrial / retail). You confirm, adjust internally, and coordinate operations.
          </p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-600">No plans yet.</div>
          ) : (
            <ul className="space-y-4">
              {rows.map((r) => {
                const name = r.user
                  ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || r.user.partnerCode
                  : '—';
                const estate = r.parcel?.estates?.name || '—';
                const isHi = highlightId === r.id;
                return (
                  <li
                    key={r.id}
                    className={`p-4 bg-white border rounded-xl ${isHi ? 'ring-2 ring-[#2D5A27] border-[#2D5A27]/40' : 'border-gray-200'}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {name}
                          {r.user?.partnerCode && <span className="text-xs text-gray-500">({r.user.partnerCode})</span>}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {estate} — {r.cropType} ({r.announcementType})
                        </p>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <CalendarRange className="w-4 h-4" />
                          Planned harvest: {new Date(r.estimatedDate).toLocaleString()}
                          {r.estimatedQuantity != null && ` · ~${r.estimatedQuantity} kg expected`}
                        </p>
                        {(r.plannedLoadingStart || r.plannedLoadingEnd) && (
                          <p className="text-sm text-gray-600">
                            Load window:{' '}
                            {r.plannedLoadingStart
                              ? new Date(r.plannedLoadingStart).toLocaleString()
                              : '—'}{' '}
                            —{' '}
                            {r.plannedLoadingEnd ? new Date(r.plannedLoadingEnd).toLocaleString() : '—'}
                            {r.loadQuantityKg != null && ` · ${r.loadQuantityKg} kg for load`}
                          </p>
                        )}
                        {r.marketChannel && (
                          <p className="text-sm text-gray-700">
                            <span className="text-gray-500">Channel: </span>
                            {r.marketChannel}
                          </p>
                        )}
                        {(r.qualityGrade || r.sortingSpec) && (
                          <p className="text-sm text-gray-700 mt-0.5">
                            {r.qualityGrade && <span>Quality: {r.qualityGrade}. </span>}
                            {r.sortingSpec && <span>Sorting: {r.sortingSpec}</span>}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded ${
                              r.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800'
                                : r.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setStatus(r.id, 'CONFIRMED')}
                          disabled={saving === r.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2D5A27] text-white text-xs font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50"
                        >
                          {saving === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(r.id, 'PENDING')}
                          disabled={saving === r.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg hover:bg-gray-50"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(r.id, 'REJECTED')}
                          disabled={saving === r.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-700 text-xs font-medium rounded-lg hover:bg-red-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <label className="text-xs font-medium text-gray-500" htmlFor={`notes-${r.id}`}>
                        Internal admin notes
                      </label>
                      <textarea
                        id={`notes-${r.id}`}
                        value={adminNotes[r.id] ?? ''}
                        onChange={(e) => setAdminNotes((m) => ({ ...m, [r.id]: e.target.value }))}
                        rows={2}
                        className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                        placeholder="Logistics, QC, truck booking…"
                      />
                      <button
                        type="button"
                        onClick={() => saveAdminNotes(r.id)}
                        disabled={saving === r.id}
                        className="mt-2 text-xs text-[#2D5A27] font-medium hover:underline"
                      >
                        Save notes
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

export default function HarvestPlansPage() {
  return (
    <Suspense fallback={null}>
      <HarvestPlansInner />
    </Suspense>
  );
}
