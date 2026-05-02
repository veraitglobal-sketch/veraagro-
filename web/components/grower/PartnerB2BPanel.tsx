'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
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
  o: {
    supplier: { firstName: string | null; lastName: string | null; partnerCode: string | null } | null;
  },
  t: (k: string) => string,
) {
  if (!o.supplier) return t('growerPages.partner');
  const n = [o.supplier.firstName, o.supplier.lastName].filter(Boolean).join(' ').trim();
  if (n) return n;
  return o.supplier.partnerCode || t('growerPages.partner');
}

function b2bStatusLabel(status: string, t: (k: string) => string) {
  const key = `growerPages.b2bStatus_${status}` as const;
  const translated = t(key);
  if (translated !== key) return translated;
  return status.replace(/_/g, ' ');
}

type OrderRow = Awaited<ReturnType<typeof growerSupplierB2bAPI.getMyDirectOrders>>[number];
type PartnerB2BPanelProps = {
  className?: string;
};

/**
 * Right column on "Suppliers & orders": direct B2B orders + message threads (same card style as Request Transport).
 */
export default function PartnerB2BPanel({ className = '' }: PartnerB2BPanelProps) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [receiving, setReceiving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const o = await growerSupplierB2bAPI.getMyDirectOrders();
      setOrders(o);
    } catch (e) {
      setErr(
        String(
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (e instanceof Error ? e.message : t('growerPages.loadFailed')),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      setErr(text || (e instanceof Error ? e.message : t('growerPages.loadFailed')));
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
          {t('growerPages.b2bOrdersTitle')}
        </h2>
        <p className="text-base text-gray-600">{t('growerPages.b2bOrdersLead')}</p>
        <p className="text-xs text-gray-500 mt-1.5">
          {t('growerPages.b2bOrdersMaterialsLineBefore')}{' '}
          <Link href="/grower/materials" className="text-[#2D5A27] font-medium hover:underline">
            {t('grower.nav.materials')}
          </Link>
          {t('growerPages.b2bOrdersMaterialsLineAfter')}{' '}
          <a href="#supply-flow" className="text-[#2D5A27] font-medium hover:underline">
            {t('growerPages.b2bOrdersStepsLink')}
          </a>
          .
        </p>
      </div>

      {loading && (
        <p className="text-base text-gray-500 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('growerPages.b2bLoading')}
        </p>
      )}
      {err && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-950">{String(err)}</div>
      )}

      {!loading && !err && (
        <>
          <section>
            <h3 className="text-base font-medium text-gray-900 flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-[#2D5A27]" />
              {t('growerPages.b2bDirectOrders')}
            </h3>
            {orders.length === 0 ? (
              <p className="text-base text-gray-500 font-light">{t('growerPages.b2bNoOrdersYet')}</p>
            ) : (
              <ul className="space-y-3 max-h-[min(50vh,32rem)] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-base">
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <span className="font-medium text-gray-900">{supplierDisplayName(o, t)}</span>
                      <span
                        className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                          o.status === 'FULFILLED' || o.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : o.status === 'REJECTED' || o.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {b2bStatusLabel(o.status, t)}
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
                        <span className="text-gray-500">{t('growerPages.b2bYourNote')}</span> {o.noteFromFarmer}
                      </p>
                    )}
                    {o.noteFromSupplier && (
                      <p className="text-xs text-gray-600">
                        <span className="text-gray-500">{t('growerPages.b2bPartnerNote')}</span> {o.noteFromSupplier}
                      </p>
                    )}
                    {o.farmerReceivedAt && (
                      <p className="text-xs font-medium text-emerald-800 mt-2">
                        {t('growerPages.b2bReceivedAt')} {new Date(o.farmerReceivedAt).toLocaleString()}
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
                          {receiving === o.id ? t('growerPages.b2bSaving') : t('growerPages.b2bMarkReceived')}
                        </button>
                      )}
                    {!o.farmerReceivedAt && o.status === 'PENDING' && (
                      <p className="text-xs text-amber-800/90 mt-2">{t('growerPages.b2bWaitingSupplier')}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/grower/where-to-buy/store/${o.supplierUserId}`}
                        className="inline-flex items-center gap-1.5 text-xs text-[#2D5A27] font-medium hover:underline"
                      >
                        <Store className="h-3.5 w-3.5" />
                        {t('growerPages.b2bStore')}
                      </Link>
                      {o.threadId && (
                        <Link
                          href={`/grower/where-to-buy/thread/${o.threadId}`}
                          className="inline-flex items-center gap-1.5 text-xs text-[#2D5A27] font-medium hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {t('growerPages.b2bThread')}
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-light">
                {t('growerPages.b2bConversations')}:{' '}
                <Link href="/grower/where-to-buy/messages" className="text-[#2D5A27] font-medium hover:underline">
                  {t('growerPages.openInbox')}
                </Link>
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
