'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  /** Inside a parent card on "Suppliers & orders" — drops outer border/shadow. */
  embedded?: boolean;
};

/**
 * Right column on "Suppliers & orders": direct B2B orders + message threads (same card style as Request Transport).
 */
function orderStatusSortKey(status: string): number {
  if (status === 'PENDING') return 0;
  if (status === 'CONFIRMED') return 1;
  if (status === 'FULFILLED') return 2;
  return 3;
}

export default function PartnerB2BPanel({ className = '', embedded = false }: PartnerB2BPanelProps) {
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

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dr = orderStatusSortKey(a.status) - orderStatusSortKey(b.status);
      if (dr !== 0) return dr;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders]);

  const shellClass = embedded
    ? `space-y-5 min-h-0 flex flex-col flex-1 min-w-0 px-5 pb-5 pt-4 ${className}`.trim()
    : `bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-6 min-h-0 flex flex-col lg:sticky lg:top-20 lg:max-h-[min(calc(100vh-5rem),56rem)] lg:overflow-y-auto [scrollbar-gutter:stable] ${className}`.trim();

  return (
    <div className={shellClass}>
      <div>
        {!embedded ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Inbox className="h-5 w-5 text-[#2D5A27] shrink-0" />
              {t('growerPages.b2bOrdersTitle')}
            </h2>
            <p className="text-base text-gray-600 font-light leading-relaxed">{t('growerPages.b2bOrdersLead')}</p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
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
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#2D5A27] shrink-0" />
              {t('growerPages.b2bDirectOrders')}
            </h2>
            <p className="text-sm text-gray-600 font-light mt-1.5 leading-relaxed">
              {t('growerPages.b2bOrdersEmbeddedLead')}{' '}
              <Link href="/grower/materials" className="text-[#2D5A27] font-medium hover:underline whitespace-nowrap">
                {t('grower.nav.materials')}
              </Link>
              {' · '}
              <a href="#supply-flow" className="text-[#2D5A27] font-medium hover:underline">
                {t('growerPages.b2bOrdersStepsLink')}
              </a>
            </p>
          </>
        )}
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
          <section className="space-y-3">
            {!embedded && (
              <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-[#2D5A27]" />
                {t('growerPages.b2bDirectOrders')}
              </h3>
            )}
            {embedded && sortedOrders.length > 0 && (
              <p className="text-xs font-medium text-gray-500 tabular-nums">
                {t('growerPages.b2bOrderCount', { count: sortedOrders.length })}
              </p>
            )}
            {sortedOrders.length === 0 ? (
              <p className="text-base text-gray-500 font-light leading-relaxed">{t('growerPages.b2bNoOrdersYet')}</p>
            ) : (
              <ul className="space-y-3 max-h-[min(52vh,36rem)] overflow-y-auto pr-0.5 [scrollbar-gutter:stable]">
                {sortedOrders.map((o) => {
                  const accent =
                    o.status === 'FULFILLED' || o.status === 'CONFIRMED'
                      ? 'border-l-emerald-500'
                      : o.status === 'REJECTED' || o.status === 'CANCELLED'
                        ? 'border-l-red-400'
                        : 'border-l-amber-500';
                  return (
                  <li
                    key={o.id}
                    className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm border-l-4 ${accent}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-base leading-snug">
                          {supplierDisplayName(o, t)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 tabular-nums">
                          {new Date(o.createdAt).toLocaleString()} · #{o.id.slice(0, 8)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${
                          o.status === 'FULFILLED' || o.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
                            : o.status === 'REJECTED' || o.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-900 border border-red-200/80'
                              : 'bg-amber-50 text-amber-950 border border-amber-200/80'
                        }`}
                      >
                        {b2bStatusLabel(o.status, t)}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-gray-800">
                      {formatB2bOrderLines(o.items).map((line, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-[#2D5A27] shrink-0" aria-hidden>
                            ·
                          </span>
                          <span className="min-w-0">{line}</span>
                        </li>
                      ))}
                    </ul>
                    {o.noteFromFarmer && (
                      <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                        <span className="font-medium text-gray-700">{t('growerPages.b2bYourNote')}</span>{' '}
                        {o.noteFromFarmer}
                      </p>
                    )}
                    {o.noteFromSupplier && (
                      <p className="text-xs text-gray-600 mt-2">
                        <span className="font-medium text-gray-700">{t('growerPages.b2bPartnerNote')}</span>{' '}
                        {o.noteFromSupplier}
                      </p>
                    )}
                    {o.farmerReceivedAt && (
                      <p className="text-xs font-semibold text-emerald-800 mt-3">
                        {t('growerPages.b2bReceivedAt')} {new Date(o.farmerReceivedAt).toLocaleString()}
                      </p>
                    )}
                    {!o.farmerReceivedAt &&
                      (o.status === 'CONFIRMED' || o.status === 'FULFILLED') && (
                        <button
                          type="button"
                          disabled={receiving === o.id}
                          onClick={() => void markReceivedAtFarm(o.id)}
                          className="mt-3 w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center rounded-lg bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
                        >
                          {receiving === o.id ? t('growerPages.b2bSaving') : t('growerPages.b2bMarkReceived')}
                        </button>
                      )}
                    {!o.farmerReceivedAt && o.status === 'PENDING' && (
                      <p className="text-xs text-amber-900 mt-3 rounded-md bg-amber-50/90 border border-amber-100 px-2.5 py-2">
                        {t('growerPages.b2bWaitingSupplier')}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-gray-100">
                      <Link
                        href={`/grower/where-to-buy/store/${o.supplierUserId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-[#2D5A27] font-medium hover:underline"
                      >
                        <Store className="h-4 w-4 shrink-0" />
                        {t('growerPages.b2bStore')}
                      </Link>
                      {o.threadId && (
                        <Link
                          href={`/grower/where-to-buy/thread/${o.threadId}`}
                          className="inline-flex items-center gap-1.5 text-sm text-[#2D5A27] font-medium hover:underline"
                        >
                          <MessageCircle className="h-4 w-4 shrink-0" />
                          {t('growerPages.b2bThread')}
                        </Link>
                      )}
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
            <div className={`pt-3 ${embedded ? '' : 'border-t border-gray-100'}`}>
              <p className="text-xs text-gray-500 font-light">
                {t('growerPages.b2bConversations')}:{' '}
                <Link href="/grower/where-to-buy/messages" className="text-[#2D5A27] font-semibold hover:underline">
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
