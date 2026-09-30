'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import {
  PremiumButton,
  PremiumButtonLink,
  PremiumPageTitle,
  PremiumStatCard,
} from '@/components/ui/Premium';
import {
  seedProductionAPI,
  type SeedApprovedProduct,
  type SeedDashboard,
  type SeedProducer,
  type SeedProductionRun,
} from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { formatDateEn } from '@/lib/en-locale-dates';
import { Loader2, Plus, Sprout, X } from 'lucide-react';

function runStatusClass(status: string): string {
  if (status === 'RELEASED') return 'bg-green-100 text-green-800';
  if (status === 'PRODUCED') return 'bg-blue-100 text-blue-800';
  if (status === 'LABELS_ISSUED') return 'bg-amber-100 text-amber-800';
  if (status === 'RECALLED') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

type NewRunForm = {
  approvedProductId: string;
  producerId: string;
  lotNumber: string;
  seedCropYear: string;
  originCountry: string;
  originRegion: string;
  bagSizeLabel: string;
  bagsPlanned: string;
  expiresAt: string;
};

const EMPTY_RUN: NewRunForm = {
  approvedProductId: '',
  producerId: '',
  lotNumber: '',
  seedCropYear: String(new Date().getFullYear()),
  originCountry: '',
  originRegion: '',
  bagSizeLabel: '5 kg',
  bagsPlanned: '100',
  expiresAt: '',
};

export default function SeedProductionDashboardPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<SeedDashboard | null>(null);
  const [products, setProducts] = useState<SeedApprovedProduct[]>([]);
  const [producers, setProducers] = useState<SeedProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewRunForm>(EMPTY_RUN);
  const [saving, setSaving] = useState(false);
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportProductId, setReportProductId] = useState('');
  const [reports, setReports] = useState<Awaited<ReturnType<typeof seedProductionAPI.getReportsSummary>> | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dash, prods, prodList] = await Promise.all([
        seedProductionAPI.getDashboard(),
        seedProductionAPI.listApprovedProducts(),
        seedProductionAPI.listProducers(),
      ]);
      setDashboard(dash);
      setProducts(Array.isArray(prods) ? prods.filter((p) => p.status === 'ACTIVE' && p.category === 'SEED') : []);
      setProducers(Array.isArray(prodList) ? prodList.filter((p) => p.isActive) : []);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const loadReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const data = await seedProductionAPI.getReportsSummary({
        year: reportYear ? parseInt(reportYear, 10) : undefined,
        productId: reportProductId || undefined,
      });
      setReports(data);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setReportsLoading(false);
    }
  }, [reportYear, reportProductId, t]);

  useEffect(() => {
    if (!loading) void loadReports();
  }, [loading, loadReports]);

  const exportCsv = async () => {
    setCsvBusy(true);
    try {
      const blob = await seedProductionAPI.downloadBagsRegisterCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seed-bags-register.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setCsvBusy(false);
    }
  };

  const createRun = async () => {
    setSaving(true);
    setError(null);
    try {
      const run = (await seedProductionAPI.createRun({
        approvedProductId: form.approvedProductId,
        producerId: form.producerId,
        lotNumber: form.lotNumber.trim().toUpperCase(),
        seedCropYear: Number(form.seedCropYear),
        originCountry: form.originCountry.trim(),
        originRegion: form.originRegion.trim() || undefined,
        bagSizeLabel: form.bagSizeLabel.trim(),
        bagsPlanned: Number(form.bagsPlanned),
        expiresAt: form.expiresAt || undefined,
      })) as SeedProductionRun;
      setModalOpen(false);
      setForm(EMPTY_RUN);
      router.push(`/admin/seed-production/runs/${run.id}`);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const runs = dashboard?.runs ?? [];
  const totals = dashboard?.totals;

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('seedProduction.title')} navItems={adminNavItems}>
        <div className="space-y-6">
          <PremiumPageTitle
            eyebrow={t('seedProduction.title')}
            title={t('seedProduction.title')}
            description={t('seedProduction.subtitle')}
            right={
              <div className="flex flex-wrap gap-2">
                <PremiumButton onClick={() => setModalOpen(true)}>
                  <Plus className="mr-2 inline h-4 w-4" />
                  {t('seedProduction.runs.newRun')}
                </PremiumButton>
              </div>
            }
          />

          <nav className="flex flex-wrap gap-2 text-sm">
            <PremiumButtonLink href="/admin/seed-production" variant="primary">
              {t('seedProduction.nav.dashboard')}
            </PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/approved-products" variant="secondary">
              {t('seedProduction.nav.approvedProducts')}
            </PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/producers" variant="secondary">
              {t('seedProduction.nav.producers')}
            </PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/lookup" variant="secondary">
              {t('seedProduction.nav.lookup')}
            </PremiumButtonLink>
          </nav>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('seedProduction.common.loading')}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <PremiumStatCard
                  label={t('seedProduction.stats.labeled')}
                  value={totals?.labeled ?? 0}
                  icon={<Sprout className="h-5 w-5" />}
                />
                <PremiumStatCard label={t('seedProduction.stats.available')} value={totals?.available ?? 0} />
                <PremiumStatCard label={t('seedProduction.stats.assigned')} value={totals?.assigned ?? 0} />
                <PremiumStatCard label={t('seedProduction.stats.planted')} value={totals?.planted ?? 0} />
                <PremiumStatCard label={t('seedProduction.stats.recalled')} value={totals?.recalled ?? 0} />
                <PremiumStatCard label={t('seedProduction.stats.voided')} value={totals?.voided ?? 0} />
              </div>

              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{t('seedProduction.reports.title')}</h2>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <label className="text-sm">
                        <span className="text-gray-600">{t('seedProduction.reports.yearFilter')}</span>
                        <input
                          type="number"
                          value={reportYear}
                          onChange={(e) => setReportYear(e.target.value)}
                          className="mt-1 block w-28 rounded-lg border border-gray-300 px-3 py-2 text-base"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="text-gray-600">{t('seedProduction.newRunModal.product')}</span>
                        <select
                          value={reportProductId}
                          onChange={(e) => setReportProductId(e.target.value)}
                          className="mt-1 block min-w-[12rem] rounded-lg border border-gray-300 px-3 py-2 text-base"
                        >
                          <option value="">{t('common.all', { defaultValue: 'All' })}</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </label>
                      <PremiumButton variant="secondary" onClick={() => void loadReports()} disabled={reportsLoading}>
                        {reportsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.common.refresh')}
                      </PremiumButton>
                    </div>
                  </div>
                  <PremiumButton variant="secondary" onClick={() => void exportCsv()} disabled={csvBusy}>
                    {csvBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.reports.exportCsv')}
                  </PremiumButton>
                </div>
                {reportsLoading && !reports ? (
                  <div className="flex items-center gap-2 px-5 py-8 text-gray-600 sm:px-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('seedProduction.common.loading')}
                  </div>
                ) : reports ? (
                  <div className="space-y-8 px-5 py-6 sm:px-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-3">{t('seedProduction.reports.funnelTitle')}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">{t('seedProduction.runs.product')}</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">{t('seedProduction.runs.seedYear')}</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">{t('seedProduction.stats.labeled')}</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">{t('seedProduction.stats.available')}</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">{t('seedProduction.reports.shipped', { defaultValue: 'Shipped' })}</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">{t('seedProduction.reports.sold', { defaultValue: 'Sold' })}</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">{t('seedProduction.stats.planted')}</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">{t('seedProduction.stats.recalled')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {reports.byProductYear.length === 0 ? (
                              <tr><td colSpan={8} className="px-3 py-6 text-gray-500">{t('seedProduction.runs.empty')}</td></tr>
                            ) : reports.byProductYear.map((row) => (
                              <tr key={`${row.productId}-${row.seedCropYear}`}>
                                <td className="px-3 py-2">{String(row.product)}{row.variety ? ` (${String(row.variety)})` : ''}</td>
                                <td className="px-3 py-2 tabular-nums">{String(row.seedCropYear)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{Number(row.labeled)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{Number(row.atProducer)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{Number(row.shipped)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{Number(row.sold)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{Number(row.planted)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{Number(row.recalled)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-3">{t('seedProduction.reports.suppliersTitle')}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">{t('seedProduction.runs.producer')}</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">{t('seedProduction.reports.received', { defaultValue: 'Received' })}</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">{t('seedProduction.reports.inStock', { defaultValue: 'In stock' })}</th>
                              <th className="px-3 py-2 text-right font-medium text-gray-600">{t('seedProduction.reports.sold', { defaultValue: 'Sold' })}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {reports.suppliers.filter((s) => Number(s.received) > 0 || Number(s.inStock) > 0).map((s) => (
                              <tr key={String(s.supplierUserId)}>
                                <td className="px-3 py-2">{String(s.name)} · {String(s.partnerCode)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{Number(s.received)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{Number(s.inStock)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{Number(s.sold)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-3">{t('seedProduction.reports.plantedParcelsTitle')}</h3>
                      {reports.plantedParcels.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('seedProduction.runs.empty')}</p>
                      ) : (
                        <ul className="divide-y divide-gray-100 text-sm">
                          {reports.plantedParcels.map((p) => (
                            <li key={String(p.parcelId)} className="py-2 flex flex-wrap gap-x-4 gap-y-1">
                              <span className="font-mono text-xs">{String(p.growerPartnerCode ?? '—')}</span>
                              <span>{String(p.lot ?? '—')}</span>
                              <span>{Number(p.bags)} bag(s)</span>
                              {p.plantedAt ? <span>{String(p.plantedAt)}</span> : null}
                              <Link href={`/admin/farm?parcel=${encodeURIComponent(String(p.parcelId))}`} className="text-[#2D5A27] hover:underline">
                                {t('seedProduction.reports.viewParcel', { defaultValue: 'View parcel' })}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
                  <h2 className="text-lg font-medium text-gray-900">{t('seedProduction.runs.title')}</h2>
                  <PremiumButton variant="secondary" onClick={load}>
                    {t('seedProduction.common.refresh')}
                  </PremiumButton>
                </div>
                {runs.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-gray-600 sm:px-6">{t('seedProduction.runs.empty')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runs.lot')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runs.product')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runs.producer')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runs.seedYear')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runs.bagsPlanned')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runs.bagsProduced')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runs.status')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runs.created')}</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">{t('seedProduction.common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {runs.map((run) => (
                          <tr key={run.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-xs">{run.lotNumber}</td>
                            <td className="px-4 py-3">{run.approvedProduct?.name ?? '—'}</td>
                            <td className="px-4 py-3">{run.producer?.name ?? '—'}</td>
                            <td className="px-4 py-3 tabular-nums">{run.seedCropYear}</td>
                            <td className="px-4 py-3 tabular-nums">{run.bagsPlanned}</td>
                            <td className="px-4 py-3 tabular-nums">{run.bagsProduced ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${runStatusClass(run.status)}`}>
                                {t(`seedProduction.runStatus.${run.status}`)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{formatDateEn(run.createdAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/admin/seed-production/runs/${run.id}`}
                                className="font-medium text-[#2D5A27] hover:text-[#23471f] hover:underline"
                              >
                                {t('seedProduction.runs.view')}
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" role="dialog" aria-modal="true">
            <div className="mb-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">{t('seedProduction.newRunModal.title')}</h2>
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100" aria-label={t('seedProduction.common.close')}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.newRunModal.product')}</span>
                  <select
                    value={form.approvedProductId}
                    onChange={(e) => setForm((f) => ({ ...f, approvedProductId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  >
                    <option value="">—</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{p.variety ? ` (${p.variety})` : ''}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.newRunModal.producer')}</span>
                  <select
                    value={form.producerId}
                    onChange={(e) => setForm((f) => ({ ...f, producerId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  >
                    <option value="">—</option>
                    {producers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{p.city ? ` · ${p.city}` : ''}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.newRunModal.lotNumber')}</span>
                  <input
                    value={form.lotNumber}
                    onChange={(e) => setForm((f) => ({ ...f, lotNumber: e.target.value.toUpperCase() }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-base uppercase focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    placeholder="NS2604"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('seedProduction.newRunModal.lotHint')}</p>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">{t('seedProduction.newRunModal.seedCropYear')}</span>
                    <input
                      type="number"
                      value={form.seedCropYear}
                      onChange={(e) => setForm((f) => ({ ...f, seedCropYear: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">{t('seedProduction.newRunModal.bagsPlanned')}</span>
                    <input
                      type="number"
                      min={1}
                      value={form.bagsPlanned}
                      onChange={(e) => setForm((f) => ({ ...f, bagsPlanned: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.newRunModal.originCountry')}</span>
                  <input
                    value={form.originCountry}
                    onChange={(e) => setForm((f) => ({ ...f, originCountry: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.newRunModal.originRegion')}</span>
                  <input
                    value={form.originRegion}
                    onChange={(e) => setForm((f) => ({ ...f, originRegion: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.newRunModal.bagSizeLabel')}</span>
                  <input
                    value={form.bagSizeLabel}
                    onChange={(e) => setForm((f) => ({ ...f, bagSizeLabel: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.newRunModal.expiresAt')}</span>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <PremiumButton variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                  {t('seedProduction.newRunModal.cancel')}
                </PremiumButton>
                <PremiumButton
                  onClick={createRun}
                  disabled={saving || !form.approvedProductId || !form.producerId || !form.lotNumber.trim() || !form.originCountry.trim()}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.newRunModal.create')}
                </PremiumButton>
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </AuthGuard>
  );
}
