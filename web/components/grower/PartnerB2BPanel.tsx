'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { growerSupplierB2bAPI } from '@/lib/api';
import { Inbox, Loader2, MessageCircle, Package, Store } from 'lucide-react';

function formatB2bOrderLines(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((row) => {
    if (row && typeof row === 'object' && 'label' in row) {
      const o = row as { label: string; quantity?: number; unit?: string };
      const u = o.unit && o.unit !== 'order' && o.unit !== 'inquiry' ? ` ${o.unit}` : '';
      return `${o.label} — ${o.quantity ?? 1}${u}`.trim();
    }
    return String(row);
  });
}

function supplierDisplayName(o: {
  supplier: { firstName: string | null; lastName: string | null; partnerCode: string | null } | null;
}) {
  if (!o.supplier) return 'Partner';
  const n = [o.supplier.firstName, o.supplier.lastName].filter(Boolean).join(' ').trim();
  if (n) return n;
  return o.supplier.partnerCode || 'Partner';
}

type OrderRow = Awaited<ReturnType<typeof growerSupplierB2bAPI.getMyDirectOrders>>[number];
type ThreadRow = Awaited<ReturnType<typeof growerSupplierB2bAPI.getMyThreads>>[number];

function threadTitle(t: ThreadRow) {
  const b = t.supplier?.material_supplier_profile?.businessName;
  if (b) return b;
  const n = [t.supplier?.firstName, t.supplier?.lastName].filter(Boolean).join(' ').trim();
  return n || t.supplier?.partnerCode || 'Partner';
}

type PartnerB2BPanelProps = {
  className?: string;
};

/**
 * Right column on "Suppliers & orders": direct B2B orders + message threads (same card style as Request Transport).
 */
export default function PartnerB2BPanel({ className = '' }: PartnerB2BPanelProps) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [receiving, setReceiving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [o, th] = await Promise.all([
        growerSupplierB2bAPI.getMyDirectOrders(),
        growerSupplierB2bAPI.getMyThreads(),
      ]);
      setOrders(o);
      setThreads(th);
    } catch (e) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e instanceof Error ? e.message : 'Failed to load'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const markReceivedAtFarm = async (orderId: string) => {
    setReceiving(orderId);
    setErr(null);
    try {
      await growerSupplierB2bAPI.markOrderReceivedAtFarm(orderId);
      await load();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join(' ') : msg;
      setErr(text || (e instanceof Error ? e.message : 'Could not mark receipt'));
    } finally {
      setReceiving(null);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div
      id="my-orders"
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6 space-y-6 min-h-0 flex flex-col lg:sticky lg:top-20 lg:max-h-[min(calc(100vh-5rem),56rem)] lg:overflow-y-auto [scrollbar-gutter:stable] ${className}`.trim()}
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
          <Inbox className="h-5 w-5 text-[#2D5A27] shrink-0" />
          My orders &amp; messages
        </h2>
        <p className="text-sm text-gray-600">
          B2B order status, <strong>Received at farm</strong>, and partner threads. New partner? Pick them in the
          directory first.
        </p>
        <p className="text-xs text-gray-500 mt-1.5">
          Balances in{' '}
          <Link href="/grower/materials" className="text-[#2D5A27] font-medium hover:underline">
            Materials
          </Link>
          . Full process: <a href="#supply-flow" className="text-[#2D5A27] font-medium hover:underline">steps below</a>.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </p>
      )}
      {err && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{String(err)}</div>
      )}

      {!loading && !err && (
        <>
          <section>
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-[#2D5A27]" />
              Direct orders
            </h3>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500 font-light">No orders yet — use a partner store from the directory.</p>
            ) : (
              <ul className="space-y-3 max-h-[min(40vh,28rem)] overflow-y-auto pr-1">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <span className="font-medium text-gray-900">{supplierDisplayName(o)}</span>
                      <span
                        className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                          o.status === 'FULFILLED' || o.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : o.status === 'REJECTED' || o.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(o.createdAt).toLocaleString()} · {o.id.slice(0, 8)}…
                    </p>
                    <ul className="list-disc pl-4 text-gray-800 space-y-0.5 mb-2 text-xs">
                      {formatB2bOrderLines(o.items).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                    {o.noteFromFarmer && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="text-gray-500">Your note:</span> {o.noteFromFarmer}
                      </p>
                    )}
                    {o.noteFromSupplier && (
                      <p className="text-xs text-gray-600">
                        <span className="text-gray-500">Partner:</span> {o.noteFromSupplier}
                      </p>
                    )}
                    {o.farmerReceivedAt && (
                      <p className="text-xs font-medium text-emerald-800 mt-2">
                        Received at farm: {new Date(o.farmerReceivedAt).toLocaleString()}
                      </p>
                    )}
                    {!o.farmerReceivedAt &&
                      (o.status === 'CONFIRMED' || o.status === 'FULFILLED') && (
                        <button
                          type="button"
                          disabled={receiving === o.id}
                          onClick={() => void markReceivedAtFarm(o.id)}
                          className="mt-2 inline-flex items-center rounded-lg border border-[#2D5A27] bg-white px-3 py-1.5 text-xs font-medium text-[#23471f] hover:bg-[#2D5A27]/5 disabled:opacity-50"
                        >
                          {receiving === o.id ? 'Saving…' : 'Received at farm'}
                        </button>
                      )}
                    {!o.farmerReceivedAt && o.status === 'PENDING' && (
                      <p className="text-xs text-amber-800/90 mt-2">Waiting for supplier to confirm the order…</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/grower/where-to-buy/store/${o.supplierUserId}`}
                        className="inline-flex items-center gap-1.5 text-xs text-[#2D5A27] font-medium hover:underline"
                      >
                        <Store className="h-3.5 w-3.5" />
                        Store
                      </Link>
                      {o.threadId && (
                        <Link
                          href={`/grower/where-to-buy/thread/${o.threadId}`}
                          className="inline-flex items-center gap-1.5 text-xs text-[#2D5A27] font-medium hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Thread
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
              <Inbox className="h-4 w-4 text-[#2D5A27]" />
              Conversations
            </h3>
            {threads.length === 0 ? (
              <p className="text-sm text-gray-500 font-light">No threads yet — message a partner from a store page.</p>
            ) : (
              <ul className="space-y-2 max-h-[min(32vh,22rem)] overflow-y-auto pr-1">
                {threads.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/grower/where-to-buy/thread/${t.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm hover:border-[#2D5A27]/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{threadTitle(t)}</p>
                        {t.supplier?.material_supplier_profile?.city && (
                          <p className="text-xs text-gray-500 font-light truncate">
                            {[t.supplier.material_supplier_profile.city, t.supplier.material_supplier_profile.country]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                        {new Date(t.lastMessageAt).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
