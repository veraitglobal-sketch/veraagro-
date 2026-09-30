'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { PremiumStatCard, PremiumButton } from '@/components/ui/Premium';
import { catalogAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { formatDateEn, formatDateTimeEn } from '@/lib/en-locale-dates';
import {
  Layers,
  Loader2,
  Search,
  X,
  User,
  MapPin,
  Package,
  Camera,
  ExternalLink,
  Plus,
} from 'lucide-react';

type SupplyLot = {
  batchId: string;
  id: string;
  status: string;
  kg: number | null;
};

type SupplyRow = {
  id: string;
  announcementType: string;
  cropType: string;
  plantingDate: string | null;
  expectedHarvestDate: string;
  expectedKg: number | null;
  harvestedKg: number;
  inProductsKg: number;
  unallocatedKg: number;
  status: string;
  derivedStatus?: string;
  marketChannel: string | null;
  qualityGrade: string | null;
  catalogProductId: string | null;
  grower: { name: string; partnerCode: string } | null;
  farm: { id: string; name: string } | null;
  parcel: { id: string; name: string; area: number | null; crop: string; bioStatus: string } | null;
  lots: SupplyLot[];
  latestGrowthPhotoAt: string | null;
  bioVeraSeed?: {
    bagCount: number;
    lots: string[];
    serials: string[];
  } | null;
};

type SupplyPayload = {
  stats: {
    totalExpectedKg: number;
    totalHarvestedKg: number;
    totalInProductsKg: number;
    totalUnallocatedKg: number;
  };
  rows: SupplyRow[];
};

function fmtKg(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toLocaleString('en-GB', { maximumFractionDigits: 1 })} kg`;
}

function derivedStatusBadgeClass(status: string): string {
  if (status === 'IN_CATALOGUE') return 'bg-green-100 text-green-800';
  if (status === 'HARVESTED') return 'bg-blue-100 text-blue-800';
  if (status === 'LOT_CREATED') return 'bg-purple-100 text-purple-800';
  if (status === 'PLANNED') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-700';
}

function derivedStatusLabel(t: (k: string) => string, status: string): string {
  const key = `adminPages.supply.derivedStatus.${status}`;
  const translated = t(key);
  return translated !== key ? translated : status;
}

export default function AdminSupplyPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const router = useRouter();
  const [payload, setPayload] = useState<SupplyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<SupplyRow | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (await catalogAPI.getSupply()) as SupplyPayload;
      setPayload(data);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const cropOptions = useMemo(() => {
    const crops = new Set<string>();
    payload?.rows.forEach((r) => {
      if (r.cropType) crops.add(r.cropType);
    });
    return Array.from(crops).sort();
  }, [payload]);

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    payload?.rows.forEach((r) => {
      if (r.status) statuses.add(r.status);
    });
    return Array.from(statuses).sort();
  }, [payload]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (payload?.rows ?? []).filter((r) => {
      if (cropFilter && r.cropType !== cropFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        r.cropType,
        r.grower?.name,
        r.grower?.partnerCode,
        r.farm?.name,
        r.announcementType,
        r.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [payload, search, cropFilter, statusFilter]);

  const stats = payload?.stats;

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.supply')} navItems={adminNavItems}>
        <div className="max-w-7xl space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900">{t('adminPages.supply.heading')}</h1>
              <p className="mt-1 text-sm text-gray-600">{t('adminPages.supply.subtitle')}</p>
            </div>
            <PremiumButton variant="secondary" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('adminPages.supply.refresh')}
            </PremiumButton>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {loading && !payload ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#2D5A27]" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <PremiumStatCard
                  label={t('adminPages.supply.stats.expected')}
                  value={fmtKg(stats?.totalExpectedKg)}
                  icon={<Layers className="h-5 w-5" />}
                />
                <PremiumStatCard
                  label={t('adminPages.supply.stats.harvested')}
                  value={fmtKg(stats?.totalHarvestedKg)}
                  icon={<Package className="h-5 w-5" />}
                />
                <PremiumStatCard
                  label={t('adminPages.supply.stats.inProducts')}
                  value={fmtKg(stats?.totalInProductsKg)}
                  icon={<Package className="h-5 w-5" />}
                />
                <PremiumStatCard
                  label={t('adminPages.supply.stats.unallocated')}
                  value={fmtKg(stats?.totalUnallocatedKg)}
                  icon={<Layers className="h-5 w-5" />}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('adminPages.supply.filters.search')}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </div>
                  <select
                    value={cropFilter}
                    onChange={(e) => setCropFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                  >
                    <option value="">{t('adminPages.supply.filters.allCrops')}</option>
                    {cropOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                  >
                    <option value="">{t('adminPages.supply.filters.allStatuses')}</option>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredRows.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
                  {t('adminPages.supply.empty')}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.supply.colGrower')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.supply.colFarm')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.supply.colCrop')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.supply.colDates')}</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">{t('adminPages.supply.colExpected')}</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">{t('adminPages.supply.colHarvested')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.supply.colStatus')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredRows.map((r) => {
                          const growerLabel = r.grower?.name || r.grower?.partnerCode || '—';
                          return (
                            <tr
                              key={r.id}
                              onClick={() => setSelected(r)}
                              className={`cursor-pointer transition-colors hover:bg-[#2D5A27]/5 ${selected?.id === r.id ? 'bg-[#2D5A27]/8' : ''}`}
                            >
                              <td className="px-4 py-3 text-gray-900">
                                <span className="inline-flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-gray-400" />
                                  {growerLabel}
                                  {r.grower?.partnerCode && r.grower.name ? (
                                    <span className="text-xs text-gray-500">({r.grower.partnerCode})</span>
                                  ) : null}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                  {r.farm?.name ?? '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {r.cropType}
                                <span className="ml-1 text-xs text-gray-500">({r.announcementType})</span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {r.plantingDate ? (
                                  <div>{t('adminPages.supply.planted')}: {formatDateEn(r.plantingDate)}</div>
                                ) : null}
                                <div>{t('adminPages.supply.harvest')}: {formatDateEn(r.expectedHarvestDate)}</div>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-gray-900">{fmtKg(r.expectedKg)}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-gray-900">{fmtKg(r.harvestedKg)}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${derivedStatusBadgeClass(r.derivedStatus ?? r.status)}`}
                                  title={r.status !== r.derivedStatus ? r.status : undefined}
                                >
                                  {derivedStatusLabel(t, r.derivedStatus ?? r.status)}
                                </span>
                                {r.bioVeraSeed ? (
                                  <span className="ml-2 inline-block rounded bg-[#2D5A27]/10 px-2 py-0.5 text-xs font-medium text-[#2D5A27]">
                                    {t('adminPages.supply.bioVeraSeedBadge', {
                                      count: r.bioVeraSeed.bagCount,
                                      lots: r.bioVeraSeed.lots.join(', '),
                                    })}
                                  </span>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {selected && (
          <>
            <button
              type="button"
              aria-label={t('adminPages.supply.closePanel')}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setSelected(null)}
            />
            <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{selected.cropType}</h2>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {selected.farm?.name ?? '—'} · {selected.announcementType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('adminPages.supply.colExpected')}</p>
                    <p className="mt-1 tabular-nums text-gray-900">{fmtKg(selected.expectedKg)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('adminPages.supply.colHarvested')}</p>
                    <p className="mt-1 tabular-nums text-gray-900">{fmtKg(selected.harvestedKg)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('adminPages.supply.inProducts')}</p>
                    <p className="mt-1 tabular-nums text-gray-900">{fmtKg(selected.inProductsKg)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('adminPages.supply.unallocated')}</p>
                    <p className="mt-1 tabular-nums text-gray-900">{fmtKg(selected.unallocatedKg)}</p>
                  </div>
                </div>

                {selected.bioVeraSeed ? (
                  <div className="rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 p-4">
                    <h3 className="text-sm font-medium text-[#2D5A27]">{t('adminPages.supply.bioVeraSeedTitle')}</h3>
                    <p className="mt-1 text-sm text-gray-700">
                      {t('adminPages.supply.bioVeraSeedDetail', {
                        count: selected.bioVeraSeed.bagCount,
                        lots: selected.bioVeraSeed.lots.join(', '),
                      })}
                    </p>
                    <ul className="mt-2 max-h-40 overflow-y-auto font-mono text-xs text-gray-800">
                      {selected.bioVeraSeed.serials.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <h3 className="text-sm font-medium text-gray-900">{t('adminPages.supply.lots')}</h3>
                  {selected.lots.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">{t('adminPages.supply.noLots')}</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {selected.lots.map((lot) => (
                        <li key={lot.id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                          <span className="font-medium text-gray-900">{lot.batchId}</span>
                          <span className="mx-2 text-gray-400">·</span>
                          <span className="text-gray-600">{lot.status}</span>
                          {lot.kg != null && (
                            <span className="ml-2 tabular-nums text-gray-700">{fmtKg(lot.kg)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Camera className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{t('adminPages.supply.latestPhoto')}</p>
                    <p className="text-gray-600">
                      {selected.latestGrowthPhotoAt
                        ? formatDateTimeEn(selected.latestGrowthPhotoAt)
                        : t('adminPages.supply.noPhoto')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <Link
                    href={`/admin/grower-control?tab=plans&id=${encodeURIComponent(selected.id)}`}
                    className="flex items-center gap-2 text-sm text-[#2D5A27] hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('adminPages.supply.linkGrowerControl')}
                  </Link>
                  <Link
                    href={`/admin/harvest-plans?id=${encodeURIComponent(selected.id)}`}
                    className="flex items-center gap-2 text-sm text-[#2D5A27] hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('adminPages.supply.linkHarvestPlans')}
                  </Link>
                </div>
              </div>

              <div className="border-t border-gray-200 p-5">
                {selected.catalogProductId ? (
                  <PremiumButton
                    className="w-full"
                    variant="secondary"
                    onClick={() => router.push(`/admin/products?edit=${encodeURIComponent(selected.catalogProductId!)}`)}
                  >
                    {t('adminPages.supply.viewProduct')}
                  </PremiumButton>
                ) : (
                  <PremiumButton
                    className="w-full"
                    onClick={() =>
                      router.push(`/admin/products?fromSupply=${encodeURIComponent(selected.id)}`)
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('adminPages.supply.createProduct')}
                  </PremiumButton>
                )}
              </div>
            </aside>
          </>
        )}
      </SidebarLayout>
    </AuthGuard>
  );
}
