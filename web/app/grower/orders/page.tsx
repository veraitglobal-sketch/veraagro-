'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { ordersAPI } from '@/lib/api';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { formatAppOrderDate } from '@biovera/shared/i18n/buyer-order-format';
import { orderStatusLabel } from '@biovera/shared/i18n/labels';
import { growerApiErrorOrT } from '@/lib/grower-api-error';

type GrowerOrderRow = {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
  packLine?: string;
  quantity: number;
  unit: string;
  deliveryCity?: string;
  deliveryNotes?: string | null;
  nextAction?: string;
  packedPackCount?: number | null;
  packCount?: number | null;
  createdAt: string;
};

export default function GrowerOrdersPage() {
  const { t, i18n } = useTranslation();
  const nav = useGrowerNavItems();
  const lang = i18n.language?.split('-')[0] || 'en';
  const [orders, setOrders] = useState<GrowerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await ordersAPI.getForGrower('prepare');
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setErr(growerApiErrorOrT(e, t, 'growerPages.loadFailed'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('growerPages.ordersToPrepareTitle', { defaultValue: 'Orders to prepare' })} navItems={nav}>
        <GrowerPageShell className="space-y-5">
          <GrowerPageHeader
            title={t('growerPages.ordersToPrepareTitle', { defaultValue: 'Orders to prepare' })}
            description={t('growerPages.ordersToPrepareLead', {
              defaultValue: 'Paid catalogue orders from your farm — pack before pickup.',
            })}
          />
          {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">{err}</div>}
          {loading ? (
            <p className="text-gray-600">{t('common.loading')}</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-600">{t('growerPages.ordersToPrepareEmpty', { defaultValue: 'No orders awaiting preparation.' })}</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{o.orderNumber}</p>
                      <p className="text-sm text-gray-700">{o.productName}</p>
                      {o.packLine && <p className="text-sm text-[#2D5A27] mt-1">{o.packLine}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {o.quantity} {o.unit}
                        {o.deliveryCity ? ` · ${o.deliveryCity}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">{formatAppOrderDate(o.createdAt, lang)}</p>
                    </div>
                    <span className="text-xs rounded-full border border-gray-200 px-2 py-1 text-gray-700">
                      {orderStatusLabel(t, o.status, 'buyer')}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {o.nextAction === 'PREPARE_AND_PACK' && (
                      <Link
                        href="/grower/quality-entry"
                        className="inline-flex min-h-[44px] items-center rounded-lg bg-[#2D5A27] px-4 text-sm font-medium text-white hover:bg-[#23471f]"
                      >
                        {t('growerPages.prepareAndPack', { defaultValue: 'Prepare and pack' })}
                      </Link>
                    )}
                    {o.nextAction === 'REQUEST_PICKUP' && (
                      <Link
                        href="/grower/missions/create"
                        className="inline-flex min-h-[44px] items-center rounded-lg border border-[#2D5A27] px-4 text-sm font-medium text-[#2D5A27] hover:bg-[#2D5A27]/5"
                      >
                        {t('growerPages.requestPickup', { defaultValue: 'Request pickup' })}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
