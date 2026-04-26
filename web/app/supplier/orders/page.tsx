'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI } from '@/lib/api';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED', 'CANCELLED'] as const;

export default function SupplierOrdersPage() {
  const [list, setList] = useState<
    Awaited<ReturnType<typeof b2bSupplierPortalAPI.getIncomingOrders>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      setList(await b2bSupplierPortalAPI.getIncomingOrders());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (orderId: string, status: (typeof STATUS_OPTIONS)[number]) => {
    setUpdating(orderId);
    setErr(null);
    try {
      await b2bSupplierPortalAPI.patchOrderStatus(orderId, { status });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AuthGuard
      requiredRoles={['MATERIAL_SUPPLIER']}
      redirectTo="/login?returnTo=%2Fsupplier%2Forders"
    >
      <h1 className="text-xl font-light text-gray-900 mb-4">Incoming orders</h1>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      <div className="space-y-3">
        {list.map((o) => (
          <div
            key={o.id}
            className="bg-white border border-gray-200 rounded-lg p-4 text-sm"
          >
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <span className="text-gray-500 font-mono text-xs">{o.id.slice(0, 8)}…</span>
              <span className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-gray-800 mb-1">
              {o.farmer
                ? `${o.farmer.firstName || ''} ${o.farmer.lastName || ''} (${o.farmer.partnerCode || 'grower'})`
                : 'Grower'}
            </p>
            {o.noteFromFarmer && <p className="text-gray-600 text-xs mb-2">Note: {o.noteFromFarmer}</p>}
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mb-3 text-gray-700">
              {JSON.stringify(o.items, null, 2)}
            </pre>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Status: {o.status}</span>
              <select
                className="text-xs border rounded px-2 py-1"
                disabled={updating === o.id}
                value={o.status}
                onChange={(e) =>
                  setStatus(
                    o.id,
                    e.target.value as (typeof STATUS_OPTIONS)[number],
                  )
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      {!loading && list.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
    </AuthGuard>
  );
}
