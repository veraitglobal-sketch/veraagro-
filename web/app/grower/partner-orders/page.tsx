'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { growerNavItems } from '@/lib/grower-nav';
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

function supplierDisplayName(
  o: { supplier: { firstName: string | null; lastName: string | null; partnerCode: string | null } | null },
) {
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

export default function GrowerPartnerOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title="Partner orders & messages" navItems={growerNavItems}>
        <p className="text-sm text-gray-600 font-light mb-6 max-w-2xl">
          Direct material orders to Vera partners and your message threads. To find a new supplier, use{' '}
          <Link href="/grower/where-to-buy" className="text-[#2D5A27] hover:underline">
            Where to buy
          </Link>
          .
        </p>

        {loading && (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        )}
        {err && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 mb-6">
            {String(err)}
          </div>
        )}

        {!loading && !err && (
          <div className="space-y-10 max-w-3xl">
            <section>
              <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-[#2D5A27]" />
                My direct orders
              </h2>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-500 font-light">No orders yet. Order from a partner store under Where to buy.</p>
              ) : (
                <ul className="space-y-3">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm"
                    >
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
                      <ul className="list-disc pl-4 text-gray-800 space-y-0.5 mb-2">
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
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Link
                          href={`/grower/where-to-buy/store/${o.supplierUserId}`}
                          className="inline-flex items-center gap-1.5 text-xs text-[#2D5A27] font-medium hover:underline"
                        >
                          <Store className="h-3.5 w-3.5" />
                          Open store
                        </Link>
                        {o.threadId && (
                          <Link
                            href={`/grower/partner-orders/thread/${o.threadId}`}
                            className="inline-flex items-center gap-1.5 text-xs text-[#2D5A27] font-medium hover:underline"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Open thread
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
                <Inbox className="h-4 w-4 text-[#2D5A27]" />
                Conversations with partners
              </h2>
              {threads.length === 0 ? (
                <p className="text-sm text-gray-500 font-light">
                  No threads yet. They appear when you message a partner from a store or the map.
                </p>
              ) : (
                <ul className="space-y-2">
                  {threads.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/grower/partner-orders/thread/${t.id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm hover:border-[#2D5A27]/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{threadTitle(t)}</p>
                          {t.supplier?.material_supplier_profile?.city && (
                            <p className="text-xs text-gray-500 font-light">
                              {[
                                t.supplier.material_supplier_profile.city,
                                t.supplier.material_supplier_profile.country,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(t.lastMessageAt).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SidebarLayout>
    </AuthGuard>
  );
}
