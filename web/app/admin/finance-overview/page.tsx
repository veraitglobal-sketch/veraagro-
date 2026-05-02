'use client';

import { useCallback, useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { financialDashboardAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, PieChart, RefreshCw } from 'lucide-react';

type DashboardPayload = {
  dashboardRole?: 'PLATFORM' | 'GROWER';
  summary?: {
    totalProfit?: number;
    seedMargin?: number;
    transportMargin?: number;
    packagingCommissions?: number;
    groupCertificationSavings?: number;
    insuranceCommissions?: number;
    veraBonusPaid?: number;
    netProfit?: number;
    platformFeeBookedTotal?: number;
  };
  monthly?: { totalBatches?: number; totalQuantity?: number; period?: string };
  yearly?: { totalBatches?: number; totalQuantity?: number; period?: string };
};

function formatEuro(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `€${n.toFixed(2)}`;
}

export default function AdminFinanceOverviewPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    financialDashboardAPI
      .getDashboard()
      .then((d) => setData(d as DashboardPayload))
      .catch((e: unknown) => {
        setError(apiErrorOrT(e, t, 'adminPages.financeOverview.loadFailed'));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.summary;
  const wrongRole = data && data.dashboardRole === 'GROWER';

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.financeOverview')} navItems={adminNavItems}>
        <div className="max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <PieChart className="w-7 h-7 text-[#2D5A27]" aria-hidden />
                {t('adminPages.financeOverview.heading')}
              </h1>
              <p className="text-sm text-gray-600 mt-2 max-w-3xl leading-relaxed">
                {t('adminPages.financeOverview.intro')}
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              {t('adminPages.financeOverview.refresh')}
            </button>
          </div>

          {wrongRole && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-sm text-amber-950">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" aria-hidden />
              <p>{t('adminPages.financeOverview.roleWarning')}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm border border-red-100">{error}</div>
          )}

          {loading && !data ? (
            <div className="flex items-center justify-center h-56 text-gray-500">
              {t('adminPages.financeOverview.loading')}
            </div>
          ) : s ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-[#2D5A27]/20 bg-[#f7faf6] p-4">
                  <p className="text-sm font-medium text-gray-600">{t('adminPages.financeOverview.netProfit')}</p>
                  <p className="text-2xl font-semibold text-[#23471f] tabular-nums mt-1">
                    {formatEuro(s.netProfit ?? s.totalProfit)}
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4">
                  <p className="text-sm font-medium text-gray-600">{t('adminPages.financeOverview.seedMargin')}</p>
                  <p className="text-2xl font-semibold text-blue-900 tabular-nums mt-1">
                    {formatEuro(s.seedMargin)}
                  </p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t('adminPages.financeOverview.certificationSavings')}
                  </p>
                  <p className="text-2xl font-semibold text-violet-900 tabular-nums mt-1">
                    {formatEuro(s.groupCertificationSavings)}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t('adminPages.financeOverview.packagingCommissions')}
                  </p>
                  <p className="text-2xl font-semibold text-amber-900 tabular-nums mt-1">
                    {formatEuro(s.packagingCommissions)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">{t('adminPages.financeOverview.transportMargin')}</p>
                  <p className="text-xl font-semibold text-gray-900 tabular-nums mt-1">
                    {formatEuro(s.transportMargin)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t('adminPages.financeOverview.insuranceCommissions')}
                  </p>
                  <p className="text-xl font-semibold text-gray-900 tabular-nums mt-1">
                    {formatEuro(s.insuranceCommissions)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-600">{t('adminPages.financeOverview.veraBonusPaid')}</p>
                  <p className="text-xl font-semibold text-gray-900 tabular-nums mt-1">
                    {formatEuro(s.veraBonusPaid)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t('adminPages.financeOverview.platformFeeBooked')}
                  </p>
                  <p className="text-xl font-semibold text-emerald-950 tabular-nums mt-1">
                    {formatEuro(s.platformFeeBookedTotal)}
                  </p>
                  <p className="text-xs text-gray-600 mt-2 leading-snug">
                    {t('adminPages.financeOverview.platformFeeBookedHint')}
                  </p>
                </div>
              </div>
              {(data.monthly || data.yearly) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.monthly && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm">
                      <p className="font-semibold text-gray-900">{t('adminPages.financeOverview.periodMonth')}</p>
                      <p className="text-gray-600 mt-2">
                        {t('adminPages.financeOverview.batchesCount', {
                          count: data.monthly.totalBatches ?? 0,
                        })}
                      </p>
                      <p className="text-gray-600">
                        {t('adminPages.financeOverview.quantityTotal', {
                          qty: data.monthly.totalQuantity ?? 0,
                        })}
                      </p>
                    </div>
                  )}
                  {data.yearly && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm">
                      <p className="font-semibold text-gray-900">{t('adminPages.financeOverview.periodYear')}</p>
                      <p className="text-gray-600 mt-2">
                        {t('adminPages.financeOverview.batchesCount', {
                          count: data.yearly.totalBatches ?? 0,
                        })}
                      </p>
                      <p className="text-gray-600">
                        {t('adminPages.financeOverview.quantityTotal', {
                          qty: data.yearly.totalQuantity ?? 0,
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : !error ? (
            <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center text-gray-500">
              {t('adminPages.financeOverview.empty')}
            </div>
          ) : null}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
