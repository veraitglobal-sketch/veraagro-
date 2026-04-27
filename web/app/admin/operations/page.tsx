'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { adminAPI } from '@/lib/api';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { Package, AlertCircle, RefreshCw } from 'lucide-react';

type SupplyRow = {
  productName: string;
  unit: string;
  availableInHubs: number;
  inBatchesPipeline: number;
  inOpenOrders: number;
  netEstimate: number;
  hubLabel: string;
  batchLineCount: number;
  openOrderLineCount: number;
};

type SupplyPayload = {
  asOf: string;
  description: string;
  filters: { inventoryStatus: string; batchStatus: string[]; openOrderStatus: string[] };
  rows: SupplyRow[];
};

export default function AdminOperationsSupplyPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [data, setData] = useState<SupplyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminAPI
      .getSupplySnapshot()
      .then((d) => setData(d as SupplyPayload))
      .catch((e: unknown) => {
        setError(
          (e as { message?: string; response?: { data?: { message?: string } } })?.response?.data
            ?.message ||
            (e as Error)?.message ||
            'Failed to load',
        );
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.operations')} navItems={adminNavItems}>
        <div className="max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">What you can ship vs. what is already sold</h1>
              <p className="text-sm text-gray-600 mt-1 max-w-3xl">
                Each row is one <strong>product name + unit</strong> (e.g. a specific apple variety in kg). Hub
                stock is from marketplace inventory; “batches” is produce still on farm / in the pipeline. Open
                orders are buyer commitments not yet in a terminal state. Net is a <em>rough</em> check — always
                confirm in hub inventory and batch detail.
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-sm text-amber-900">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Data hygiene</p>
              <p className="mt-0.5">
                Use one consistent product name for one variety in inventory, batches, and catalog (e.g. &quot;Apple
                Golden 2025&quot;). Different spellings create duplicate lines. Varieties (e.g. Idared vs. Gala) are
                separate <code className="text-xs bg-amber-100/80 px-1 rounded">productName</code> rows in the
                system today.
              </p>
            </div>
          </div>

          {data?.description && <p className="text-xs text-gray-500">{data.description}</p>}

          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm border border-red-100">{error}</div>
          )}

          {loading && !data ? (
            <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>
          ) : data && data.rows.length === 0 ? (
            <div className="p-8 border border-dashed border-gray-200 rounded-lg text-center text-gray-500">
              <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              No rows yet. Add inventory or create batches, or place a test order to see the matrix populate.
            </div>
          ) : data ? (
            <>
              <p className="text-xs text-gray-400">
                Updated {new Date(data.asOf).toLocaleString()}{' '}
                {data.filters && (
                  <>
                    · Inventory: {data.filters.inventoryStatus} · Open orders:{' '}
                    {data.filters.openOrderStatus.join(', ')}
                  </>
                )}
              </p>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Product (variety / listing)</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3 text-right">In hubs (available)</th>
                      <th className="px-4 py-3 text-right">Batches (pipeline)</th>
                      <th className="px-4 py-3 text-right">Open orders (committed)</th>
                      <th className="px-4 py-3 text-right">Net (rough)</th>
                      <th className="px-4 py-3">Hubs (sample)</th>
                      <th className="px-4 py-3 text-center"># batch lines</th>
                      <th className="px-4 py-3 text-center"># order lines</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.rows.map((r, i) => (
                      <tr key={`${r.productName}::${r.unit}::${i}`} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.productName}</td>
                        <td className="px-4 py-3 text-gray-600">{r.unit}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-800">{r.availableInHubs}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-800">{r.inBatchesPipeline}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-amber-800">{r.inOpenOrders}</td>
                        <td
                          className={`px-4 py-3 text-right font-medium tabular-nums ${
                            r.netEstimate < 0 ? 'text-red-700' : r.netEstimate === 0 ? 'text-gray-600' : 'text-green-800'
                          }`}
                        >
                          {r.netEstimate}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={r.hubLabel}>
                          {r.hubLabel}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{r.batchLineCount}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{r.openOrderLineCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
