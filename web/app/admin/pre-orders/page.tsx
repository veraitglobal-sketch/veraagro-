'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useAdminNavItems } from '@/lib/admin-nav';
import { preOrdersAPI } from '@/lib/api';
import { PRE_ORDER_SEASON } from '@biovera/shared/preorder';

type PreOrderLine = { productId: string; varietyId?: string | null; label: string; quantityKg: number };
type PreOrderRow = {
  id: string;
  season: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string | null;
  lines: PreOrderLine[];
  totalKg: number;
  deliveryFrom?: string | null;
  deliveryTo?: string | null;
  quality?: string | null;
  packaging?: string | null;
  notes?: string | null;
  status: string;
  adminNote?: string | null;
  createdAt: string;
};

const STATUSES = ['NEW', 'REVIEWED', 'CONFIRMED', 'DECLINED'] as const;

function PreOrdersContent() {
  const { t, i18n } = useTranslation();
  const nav = useAdminNavItems();
  const highlight = useSearchParams()?.get('id');
  const [rows, setRows] = useState<PreOrderRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const nf = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }), [i18n.language]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await preOrdersAPI.listAdmin({ season: PRE_ORDER_SEASON, status: status || undefined });
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError(t('adminPreOrders.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const setRowStatus = async (id: string, next: string) => {
    setBusyId(id);
    try {
      await preOrdersAPI.updateStatus(id, { status: next });
      await load();
    } catch {
      setError(t('adminPreOrders.saveFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const totalKg = rows.reduce((s, r) => s + r.totalKg, 0);

  return (
    <SidebarLayout title={t('adminPreOrders.title', { year: PRE_ORDER_SEASON })} navItems={nav}>
      <main className="mx-auto max-w-5xl space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t('adminPreOrders.title', { year: PRE_ORDER_SEASON })}</h1>
            <p className="text-sm text-gray-600">
              {t('adminPreOrders.summary', { count: rows.length, kg: nf.format(totalKg) })}
            </p>
          </div>
          <select className="rounded border p-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('adminPreOrders.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`adminPreOrders.status.${s}`)}
              </option>
            ))}
          </select>
        </div>
        {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{error}</p>}
        {loading ? (
          <p className="text-gray-600">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-600">{t('adminPreOrders.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className={`rounded-xl border bg-white p-5 shadow-sm ${highlight === r.id ? 'border-[#2D5A27]' : 'border-gray-200'}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{r.companyName}</p>
                    <p className="text-sm text-gray-600">
                      {r.contactPerson} · <a className="text-[#2D5A27] hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
                      {r.phone ? ` · ${r.phone}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString(i18n.language)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{nf.format(r.totalKg)} kg</span>
                    <select
                      className="rounded border p-1 text-sm"
                      value={r.status}
                      disabled={busyId === r.id}
                      onChange={(e) => void setRowStatus(r.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`adminPreOrders.status.${s}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <ul className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
                  {r.lines.map((l, i) => (
                    <li key={i}>• {l.label}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-gray-600">
                  {t('adminPreOrders.details', {
                    from: r.deliveryFrom || '—',
                    to: r.deliveryTo || '—',
                    quality: r.quality || '—',
                    packaging: r.packaging || '—',
                  })}
                </p>
                {r.notes && <p className="mt-1 text-xs text-gray-600">{r.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </main>
    </SidebarLayout>
  );
}

export default function AdminPreOrdersPage() {
  return (
    <AuthGuard requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
      <Suspense fallback={null}>
        <PreOrdersContent />
      </Suspense>
    </AuthGuard>
  );
}
