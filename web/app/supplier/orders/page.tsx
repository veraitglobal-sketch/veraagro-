'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI } from '@/lib/api';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED', 'CANCELLED'] as const;

/** B2B lines may use `label` (from catalog) or `name` (older/alternate) */
function orderLinesFromItems(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((row) => {
    if (row && typeof row === 'object') {
      const o = row as { label?: string; name?: string; quantity?: number; unit?: string };
      const title = (o.label || o.name || 'Item').trim() || 'Item';
      const u = o.unit && o.unit !== 'order' && o.unit !== 'inquiry' ? ` ${o.unit}` : '';
      return `${title} — ${o.quantity ?? 1}${u}`.trim();
    }
    return String(row);
  });
}

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
      <h1 className="text-xl font-light text-gray-900 mb-1">Incoming orders</h1>
      <p className="text-sm text-gray-500 font-light mb-4 max-w-2xl">
        You set the workflow status. When the grower physically receives the goods, they can press{' '}
        <strong>Received at farm</strong> on their side — you will see that timestamp below. That is separate from
        FULFILLED (e.g. you may set FULFILLED when you dispatch; they confirm when it arrives). B2B lines below are
        the request; <strong>barcodes / in-app material balances</strong> are on the grower&apos;s Materials / compliance
        side, not on this page.
      </p>
      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      <div className="space-y-3">
        {list.map((o) => {
          const lines = orderLinesFromItems(o.items);
          return (
          <div
            key={o.id}
            className="bg-white border border-gray-200 rounded-lg p-4 text-sm"
          >
            <div className="flex flex-wrap justify-between gap-2 mb-1">
              <div>
                <p className="text-xs text-gray-500">
                  Order ref{' '}
                  <span className="font-mono text-gray-800" title={o.id}>
                    {o.id.slice(0, 8).toUpperCase()}…
                  </span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 max-w-md">
                  First 8 characters of the system order id — not a product barcode.
                </p>
              </div>
              <span className="text-xs text-gray-500 shrink-0">{new Date(o.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-gray-800 mb-1">
              {o.farmer
                ? `${o.farmer.firstName || ''} ${o.farmer.lastName || ''} (${o.farmer.partnerCode || 'grower'})`
                : 'Grower'}
            </p>
            {o.noteFromFarmer && <p className="text-gray-600 text-xs mb-2">Note: {o.noteFromFarmer}</p>}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Order lines</p>
              {lines.length === 0 ? (
                <p className="text-xs text-gray-500">No line items in this order.</p>
              ) : (
                <ul className="list-disc pl-4 space-y-0.5 text-gray-800 text-sm">
                  {lines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
            {o.farmerReceivedAt && (
              <p className="text-xs text-emerald-800 font-medium mb-2">
                Grower received at farm: {new Date(o.farmerReceivedAt).toLocaleString()}
              </p>
            )}
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
          );
        })}
      </div>
      {!loading && list.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
    </AuthGuard>
  );
}
