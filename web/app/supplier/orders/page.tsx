'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED', 'CANCELLED'] as const;

/** B2B lines may use `label` (from catalog) or `name` (older/alternate) */
function orderLinesFromItems(items: unknown, itemFallback: string): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((row) => {
    if (row && typeof row === 'object') {
      const o = row as { label?: string; name?: string; quantity?: number; unit?: string };
      const title = (o.label || o.name || itemFallback).trim() || itemFallback;
      const u = o.unit && o.unit !== 'order' && o.unit !== 'inquiry' ? ` ${o.unit}` : '';
      return `${title} — ${o.quantity ?? 1}${u}`.trim();
    }
    return String(row);
  });
}

export default function SupplierOrdersPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = dateIntlLocaleFromLanguageTag(i18n.resolvedLanguage ?? i18n.language);
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
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'supplier.ordersPage.errLoad'));
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
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'supplier.ordersPage.errUpdate'));
    } finally {
      setUpdating(null);
    }
  };

  const itemFb = t('supplier.ordersPage.itemFallback');

  return (
    <AuthGuard
      requiredRoles={['MATERIAL_SUPPLIER']}
      redirectTo="/login?returnTo=%2Fsupplier%2Forders"
    >
      <h1 className="text-xl font-light text-gray-900 mb-1">{t('supplier.ordersPage.title')}</h1>
      <p className="text-sm text-gray-500 font-light mb-4 max-w-2xl">{t('supplier.ordersPage.intro')}</p>
      {loading && <p className="text-sm text-gray-500">{t('supplier.ordersPage.loading')}</p>}
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      <div className="space-y-3">
        {list.map((o) => {
          const lines = orderLinesFromItems(o.items, itemFb);
          return (
            <div key={o.id} className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2 mb-1">
                <div>
                  <p className="text-xs text-gray-500">
                    {t('supplier.ordersPage.orderRef')}{' '}
                    <span className="font-mono text-gray-800" title={o.id}>
                      {o.id.slice(0, 8).toUpperCase()}…
                    </span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 max-w-md">{t('supplier.ordersPage.orderRefHint')}</p>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {new Date(o.createdAt).toLocaleString(dateLocale)}
                </span>
              </div>
              <p className="text-gray-800 mb-1">
                {o.farmer
                  ? `${o.farmer.firstName || ''} ${o.farmer.lastName || ''} (${o.farmer.partnerCode || t('supplier.ordersPage.grower')})`
                  : t('supplier.ordersPage.grower')}
              </p>
              {o.noteFromFarmer && (
                <p className="text-gray-600 text-xs mb-2">
                  {t('supplier.ordersPage.noteLabel')}: {o.noteFromFarmer}
                </p>
              )}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1.5">{t('supplier.ordersPage.orderLines')}</p>
                {lines.length === 0 ? (
                  <p className="text-xs text-gray-500">{t('supplier.ordersPage.noLines')}</p>
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
                  {t('supplier.ordersPage.receivedAtFarm', {
                    when: new Date(o.farmerReceivedAt).toLocaleString(dateLocale),
                  })}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">
                  {t('supplier.ordersPage.statusLabel')}:{' '}
                  {t(`supplier.orderStatusB2B.${o.status}`, { defaultValue: o.status })}
                </span>
                <select
                  className="text-xs border rounded px-2 py-1"
                  disabled={updating === o.id}
                  value={o.status}
                  onChange={(e) =>
                    setStatus(o.id, e.target.value as (typeof STATUS_OPTIONS)[number])
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {t(`supplier.orderStatusB2B.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
        {!loading && list.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-8 text-center text-sm text-gray-600 space-y-3">
            <p className="font-medium text-gray-800">{t('supplier.ordersPage.emptyTitle')}</p>
            <p className="text-gray-600 font-light max-w-md mx-auto">{t('supplier.ordersPage.emptyBody')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/supplier/catalog"
                className="inline-flex min-h-[44px] items-center rounded-md bg-[#2D5A27] px-4 py-2 text-base font-medium text-white hover:bg-[#23471f]"
              >
                {t('supplier.ordersPage.emptyCtaCatalog')}
              </Link>
              <Link
                href="/supplier/messages"
                className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-800 hover:bg-gray-50"
              >
                {t('supplier.ordersPage.emptyCtaMessages')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
