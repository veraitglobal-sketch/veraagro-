'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { PremiumCard, PremiumStatCard, PremiumButton, PremiumPageTitle } from '@/components/ui/Premium';
import { catalogAPI, estatesAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { formatDateEn } from '@/lib/en-locale-dates';
import {
  Loader2,
  Plus,
  Pencil,
  Package,
  Archive,
  Upload,
  X,
} from 'lucide-react';

type EstateOption = { id: string; name: string; ownerId?: string };

type PackOption = {
  id?: string;
  label: string;
  packSizeKg: string;
  pricePerPack: string;
  isActive?: boolean;
};

type CatalogProduct = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  estateId: string | null;
  sourcePlantingId: string | null;
  plannedQuantityKg: number;
  availableFrom: string | null;
  availableUntil: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  availableKg: number;
  soldKg: number;
  orderCount: number;
  estate?: { id: string; name: string } | null;
  packOptions: Array<{
    id: string;
    label: string;
    packSizeKg: number;
    pricePerPack: number;
    isActive: boolean;
    sortOrder: number;
  }>;
};

type StockMovement = {
  id: string;
  createdAt: string;
  type: string;
  quantityKg: number;
  runningBalanceKg: number;
  orderNumber: string | null;
  batchId: string | null;
  reason: string | null;
};

type StockHistory = {
  productId: string;
  plannedQuantityKg: number;
  availableKg: number;
  soldKg: number;
  history: StockMovement[];
};

type ProductForm = {
  name: string;
  category: string;
  description: string;
  estateId: string;
  sourcePlantingId: string;
  plannedQuantityKg: string;
  availableFrom: string;
  availableUntil: string;
  packOptions: PackOption[];
};

const EMPTY_FORM: ProductForm = {
  name: '',
  category: '',
  description: '',
  estateId: '',
  sourcePlantingId: '',
  plannedQuantityKg: '',
  availableFrom: '',
  availableUntil: '',
  packOptions: [{ label: '', packSizeKg: '', pricePerPack: '' }],
};

function fmtKg(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toLocaleString('en-GB', { maximumFractionDigits: 1 })} kg`;
}

function statusBadgeClass(status: string): string {
  if (status === 'PUBLISHED') return 'bg-green-100 text-green-800';
  if (status === 'ARCHIVED') return 'bg-gray-200 text-gray-700';
  return 'bg-amber-100 text-amber-800';
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function packSummary(packs: CatalogProduct['packOptions']): string {
  const active = packs.filter((p) => p.isActive);
  if (active.length === 0) return '—';
  return active
    .slice(0, 3)
    .map((p) => `${p.label} €${p.pricePerPack.toFixed(2)}`)
    .join(' · ');
}

function publishBlockReason(product: CatalogProduct | null, t: (k: string) => string): string | null {
  if (!product) return null;
  if (product.status === 'PUBLISHED') return t('adminPages.products.publishAlready');
  if (product.status === 'ARCHIVED') return t('adminPages.products.publishArchived');
  const activePacks = product.packOptions.filter((p) => p.isActive);
  if (activePacks.length === 0) return t('adminPages.products.publishNeedsPacks');
  if (product.availableKg <= 0) return t('adminPages.products.publishNeedsStock');
  if (!product.availableUntil || new Date(product.availableUntil) <= new Date()) {
    return t('adminPages.products.publishNeedsUntil');
  }
  return null;
}

function archiveBlockReason(product: CatalogProduct | null, t: (k: string) => string): string | null {
  if (!product) return null;
  if (product.status === 'ARCHIVED') return t('adminPages.products.archiveAlready');
  return null;
}

function ProductsPageInner() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSupplyId = searchParams.get('fromSupply');
  const editIdParam = searchParams.get('edit');

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [estates, setEstates] = useState<EstateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  const [stockHistory, setStockHistory] = useState<StockHistory | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [addStockKg, setAddStockKg] = useState('');
  const [addStockBatchId, setAddStockBatchId] = useState('');
  const [addStockNote, setAddStockNote] = useState('');
  const [removeStockKg, setRemoveStockKg] = useState('');
  const [removeReason, setRemoveReason] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [list, est] = await Promise.all([
        catalogAPI.listAdminProducts(),
        estatesAPI.getFulfillmentEstates().catch(() => []),
      ]);
      setProducts(Array.isArray(list) ? list : []);
      setEstates(Array.isArray(est) ? est : []);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadStockHistory = useCallback(async (productId: string) => {
    try {
      setStockLoading(true);
      const data = (await catalogAPI.getStockHistory(productId)) as StockHistory;
      setStockHistory(data);
    } catch {
      setStockHistory(null);
    } finally {
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openCreate = useCallback((prefill?: Partial<ProductForm>) => {
    setEditingId(null);
    setStockHistory(null);
    setForm({ ...EMPTY_FORM, ...prefill, packOptions: prefill?.packOptions ?? [{ label: '', packSizeKg: '', pricePerPack: '' }] });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback(
    async (product: CatalogProduct) => {
      setEditingId(product.id);
      setForm({
        name: product.name,
        category: product.category ?? '',
        description: product.description ?? '',
        estateId: product.estateId ?? '',
        sourcePlantingId: product.sourcePlantingId ?? '',
        plannedQuantityKg: String(product.plannedQuantityKg),
        availableFrom: toDateInput(product.availableFrom),
        availableUntil: toDateInput(product.availableUntil),
        packOptions:
          product.packOptions.length > 0
            ? product.packOptions.map((p) => ({
                id: p.id,
                label: p.label,
                packSizeKg: String(p.packSizeKg),
                pricePerPack: String(p.pricePerPack),
                isActive: p.isActive,
              }))
            : [{ label: '', packSizeKg: '', pricePerPack: '' }],
      });
      setModalOpen(true);
      await loadStockHistory(product.id);
    },
    [loadStockHistory],
  );

  useEffect(() => {
    if (loading) return;
    if (editIdParam) {
      const product = products.find((p) => p.id === editIdParam);
      if (product) openEdit(product);
      return;
    }
    if (fromSupplyId) {
      catalogAPI
        .getSupply()
        .then((data: { rows?: Array<Record<string, unknown>> }) => {
          const row = data.rows?.find((r) => r.id === fromSupplyId);
          if (!row) return;
          openCreate({
            name: String(row.cropType ?? ''),
            category: 'FRUIT',
            estateId: (row.farm as { id?: string } | null)?.id ?? '',
            sourcePlantingId: String(row.id ?? ''),
            plannedQuantityKg: String(
              (row.unallocatedKg as number) > 0 ? row.unallocatedKg : row.expectedKg ?? '',
            ),
          });
        })
        .catch(() => undefined);
    }
  }, [loading, fromSupplyId, editIdParam, products, openCreate, openEdit]);

  const editingProduct = useMemo(
    () => (editingId ? products.find((p) => p.id === editingId) ?? null : null),
    [editingId, products],
  );

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setStockHistory(null);
    setAddStockKg('');
    setAddStockBatchId('');
    setAddStockNote('');
    setRemoveStockKg('');
    setRemoveReason('');
    if (fromSupplyId || editIdParam) {
      router.replace('/admin/products');
    }
  };

  const saveProduct = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        description: form.description.trim() || undefined,
        estateId: form.estateId || undefined,
        sourcePlantingId: form.sourcePlantingId || undefined,
        plannedQuantityKg: Number(form.plannedQuantityKg),
        availableFrom: form.availableFrom || undefined,
        availableUntil: form.availableUntil || undefined,
      };

      let productId = editingId;
      if (editingId) {
        await catalogAPI.updateProduct(editingId, body);
      } else {
        const created = (await catalogAPI.createProduct(body)) as CatalogProduct;
        productId = created.id;
      }

      if (productId) {
        for (const [idx, pack] of form.packOptions.entries()) {
          if (!pack.label.trim() || !pack.packSizeKg || !pack.pricePerPack) continue;
          const packBody = {
            label: pack.label.trim(),
            packSizeKg: Number(pack.packSizeKg),
            pricePerPack: Number(pack.pricePerPack),
            sortOrder: idx,
          };
          if (pack.id) {
            await catalogAPI.updatePackOption(pack.id, packBody);
          } else {
            await catalogAPI.addPackOption(productId, packBody);
          }
        }
      }

      await loadProducts();
      if (productId && editingId) {
        await loadStockHistory(productId);
      }
      closeModal();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const publishProduct = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await catalogAPI.publishProduct(id);
      await loadProducts();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setActionId(null);
    }
  };

  const archiveProduct = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      await catalogAPI.archiveProduct(id);
      await loadProducts();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setActionId(null);
    }
  };

  const adjustStock = async (type: 'ADMIN_ADD' | 'ADMIN_REMOVE') => {
    if (!editingId) return;
    const qty = type === 'ADMIN_ADD' ? Number(addStockKg) : Number(removeStockKg);
    if (!qty || qty <= 0) return;
    if (type === 'ADMIN_REMOVE' && !removeReason.trim()) {
      setError(t('adminPages.products.removeReasonRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await catalogAPI.adjustStock(editingId, {
        type,
        quantityKg: qty,
        reason: type === 'ADMIN_REMOVE' ? removeReason.trim() : addStockNote.trim() || undefined,
        batchId: type === 'ADMIN_ADD' && addStockBatchId.trim() ? addStockBatchId.trim() : undefined,
      });
      setAddStockKg('');
      setAddStockBatchId('');
      setAddStockNote('');
      setRemoveStockKg('');
      setRemoveReason('');
      await loadProducts();
      await loadStockHistory(editingId);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const updatePackRow = (idx: number, field: keyof PackOption, value: string) => {
    setForm((prev) => {
      const packOptions = [...prev.packOptions];
      packOptions[idx] = { ...packOptions[idx], [field]: value };
      return { ...prev, packOptions };
    });
  };

  const addPackRow = () => {
    setForm((prev) => ({
      ...prev,
      packOptions: [...prev.packOptions, { label: '', packSizeKg: '', pricePerPack: '' }],
    }));
  };

  const removePackRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      packOptions: prev.packOptions.filter((_, i) => i !== idx),
    }));
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.products')} navItems={adminNavItems}>
        <div className="max-w-7xl space-y-6 p-6">
          <PremiumPageTitle
            title={t('adminPages.products.heading')}
            description={t('adminPages.products.subtitle')}
            right={
              <PremiumButton onClick={() => openCreate()}>
                <Plus className="mr-2 h-4 w-4" />
                {t('adminPages.products.addProduct')}
              </PremiumButton>
            }
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#2D5A27]" />
            </div>
          ) : products.length === 0 ? (
            <PremiumCard className="text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-600">{t('adminPages.products.empty')}</p>
              <PremiumButton className="mt-4" onClick={() => openCreate()}>
                {t('adminPages.products.addProduct')}
              </PremiumButton>
            </PremiumCard>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.products.colName')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.products.colCategory')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.products.colFarm')}</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">{t('adminPages.products.colPlanned')}</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">{t('adminPages.products.colAvailable')}</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">{t('adminPages.products.colSold')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.products.colUntil')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.products.colPacks')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('adminPages.products.colStatus')}</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">{t('adminPages.products.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => {
                      const publishReason = publishBlockReason(p, t);
                      const archiveReason = archiveBlockReason(p, t);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                          <td className="px-4 py-3 text-gray-600">{p.category ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{p.estate?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{fmtKg(p.plannedQuantityKg)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{fmtKg(p.availableKg)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{fmtKg(p.soldKg)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDateEn(p.availableUntil)}</td>
                          <td className="px-4 py-3 text-gray-600">{packSummary(p.packOptions)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(p)}
                                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                {t('adminPages.products.edit')}
                              </button>
                              {p.status !== 'PUBLISHED' && (
                                <button
                                  type="button"
                                  disabled={!!publishReason || actionId === p.id}
                                  title={publishReason ?? undefined}
                                  onClick={() => publishProduct(p.id)}
                                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#2D5A27] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#23471f] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {actionId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                  {p.status === 'ARCHIVED'
                                    ? t('adminPages.products.publishAgain')
                                    : t('adminPages.products.publish')}
                                </button>
                              )}
                              {p.status === 'PUBLISHED' && (
                                <button
                                  type="button"
                                  disabled={!!archiveReason || actionId === p.id}
                                  title={archiveReason ?? undefined}
                                  onClick={() => archiveProduct(p.id)}
                                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                  {t('adminPages.products.archive')}
                                </button>
                              )}
                            </div>
                            {publishReason && p.status === 'DRAFT' && (
                              <p className="mt-1 max-w-[180px] text-right text-[10px] text-gray-500">{publishReason}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" role="dialog" aria-modal="true">
            <div className="mb-10 w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {editingId ? t('adminPages.products.editProduct') : t('adminPages.products.newProduct')}
                </h2>
                <button type="button" onClick={closeModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-gray-700">{t('adminPages.products.fieldName')}</span>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">{t('adminPages.products.fieldCategory')}</span>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    >
                      <option value="">{t('adminPages.products.categoryNone')}</option>
                      <option value="FRUIT">FRUIT</option>
                      <option value="VEGETABLE">VEGETABLE</option>
                      <option value="GRAIN">GRAIN</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">{t('adminPages.products.fieldFarm')}</span>
                    <select
                      value={form.estateId}
                      onChange={(e) => setForm((f) => ({ ...f, estateId: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    >
                      <option value="">{t('adminPages.products.farmNone')}</option>
                      {estates.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-gray-700">{t('adminPages.products.fieldDescription')}</span>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">{t('adminPages.products.fieldPlannedKg')}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.plannedQuantityKg}
                      onChange={(e) => setForm((f) => ({ ...f, plannedQuantityKg: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">{t('adminPages.products.fieldAvailableFrom')}</span>
                    <input
                      type="date"
                      value={form.availableFrom}
                      onChange={(e) => setForm((f) => ({ ...f, availableFrom: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">{t('adminPages.products.fieldAvailableUntil')}</span>
                    <input
                      type="date"
                      value={form.availableUntil}
                      onChange={(e) => setForm((f) => ({ ...f, availableUntil: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">{t('adminPages.products.packOptions')}</h3>
                    <button
                      type="button"
                      onClick={addPackRow}
                      className="text-sm font-medium text-[#2D5A27] hover:underline"
                    >
                      + {t('adminPages.products.addPack')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.packOptions.map((pack, idx) => {
                      const sizeKg = Number(pack.packSizeKg);
                      const pricePack = Number(pack.pricePerPack);
                      const pricePerKg =
                        sizeKg > 0 && pricePack > 0 ? (pricePack / sizeKg).toFixed(2) : null;
                      const availableKg = editingProduct?.availableKg ?? 0;
                      const maxPacks =
                        sizeKg > 0 && availableKg > 0 ? Math.floor(availableKg / sizeKg) : null;
                      return (
                        <div key={pack.id ?? idx} className="rounded-lg border border-gray-200 p-3 space-y-2">
                          <div className="grid gap-2 sm:grid-cols-[1fr_100px_100px_auto]">
                            <input
                              placeholder={t('adminPages.products.packLabel')}
                              value={pack.label}
                              onChange={(e) => updatePackRow(idx, 'label', e.target.value)}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              placeholder={t('adminPages.products.packSize')}
                              value={pack.packSizeKg}
                              onChange={(e) => updatePackRow(idx, 'packSizeKg', e.target.value)}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={t('adminPages.products.packPrice')}
                              value={pack.pricePerPack}
                              onChange={(e) => updatePackRow(idx, 'pricePerPack', e.target.value)}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                            />
                            {form.packOptions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePackRow(idx)}
                                className="rounded-lg border border-gray-300 px-2 py-2 text-gray-500 hover:bg-gray-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {(pricePerKg || maxPacks != null) && (
                            <p className="text-xs text-gray-500">
                              {pricePerKg ? `€${pricePerKg}/kg` : ''}
                              {pricePerKg && maxPacks != null ? ' · ' : ''}
                              {maxPacks != null ? t('adminPages.products.packMaxPacks', { count: maxPacks }) : ''}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {editingId && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="mb-4 text-sm font-medium text-gray-900">{t('adminPages.products.stockPanel')}</h3>
                    <div className="mb-4 grid gap-3 sm:grid-cols-3">
                      <PremiumStatCard
                        label={t('adminPages.products.stockPlanned')}
                        value={fmtKg(stockHistory?.plannedQuantityKg ?? editingProduct?.plannedQuantityKg)}
                      />
                      <PremiumStatCard
                        label={t('adminPages.products.stockOnOffer')}
                        value={fmtKg(stockHistory?.availableKg ?? editingProduct?.availableKg)}
                      />
                      <PremiumStatCard
                        label={t('adminPages.products.stockSold')}
                        value={fmtKg(stockHistory?.soldKg ?? editingProduct?.soldKg)}
                      />
                    </div>

                    <div className="mb-4 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="mb-2 text-sm font-medium text-gray-900">{t('adminPages.products.addStock')}</p>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={addStockKg}
                              onChange={(e) => setAddStockKg(e.target.value)}
                              placeholder={t('adminPages.products.quantityKg')}
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                            />
                            <PremiumButton
                              variant="secondary"
                              disabled={saving || !addStockKg}
                              onClick={() => adjustStock('ADMIN_ADD')}
                            >
                              {t('adminPages.products.addStockBtn')}
                            </PremiumButton>
                          </div>
                          <input
                            value={addStockBatchId}
                            onChange={(e) => setAddStockBatchId(e.target.value)}
                            placeholder={t('adminPages.products.sourceLotOptional')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                          />
                          <input
                            value={addStockNote}
                            onChange={(e) => setAddStockNote(e.target.value)}
                            placeholder={t('adminPages.products.addStockNoteOptional')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                          />
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="mb-2 text-sm font-medium text-gray-900">{t('adminPages.products.removeStock')}</p>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={removeStockKg}
                          onChange={(e) => setRemoveStockKg(e.target.value)}
                          placeholder={t('adminPages.products.quantityKg')}
                          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                        />
                        <input
                          value={removeReason}
                          onChange={(e) => setRemoveReason(e.target.value)}
                          placeholder={t('adminPages.products.removeReason')}
                          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                        />
                        <PremiumButton
                          variant="secondary"
                          disabled={saving || !removeStockKg || !removeReason.trim()}
                          onClick={() => adjustStock('ADMIN_REMOVE')}
                        >
                          {t('adminPages.products.removeStockBtn')}
                        </PremiumButton>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-900">{t('adminPages.products.stockHistory')}</h4>
                      {stockLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-[#2D5A27]" />
                        </div>
                      ) : !stockHistory?.history.length ? (
                        <p className="text-sm text-gray-500">{t('adminPages.products.noStockHistory')}</p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">{t('adminPages.products.histDate')}</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">{t('adminPages.products.histType')}</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-600">{t('adminPages.products.histKg')}</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-600">{t('adminPages.products.histBalance')}</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">{t('adminPages.products.histOrder')}</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">{t('adminPages.products.histReason')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {[...(stockHistory.history ?? [])].reverse().map((m) => (
                                <tr key={m.id}>
                                  <td className="px-3 py-2 text-gray-600">{formatDateEn(m.createdAt)}</td>
                                  <td className="px-3 py-2 text-gray-700">{m.type}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-gray-900">
                                    {m.quantityKg > 0 ? '+' : ''}
                                    {m.quantityKg.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-gray-900">
                                    {m.runningBalanceKg.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {m.orderNumber ? (
                                      <Link href="/admin/orders" className="text-[#2D5A27] hover:underline">
                                        {m.orderNumber}
                                      </Link>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">{m.reason ?? m.batchId ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <PremiumButton variant="secondary" onClick={closeModal} disabled={saving}>
                  {t('adminPages.products.cancel')}
                </PremiumButton>
                <PremiumButton onClick={saveProduct} disabled={saving || !form.name.trim() || !form.plannedQuantityKg}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('adminPages.products.save')}
                </PremiumButton>
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </AuthGuard>
  );
}

export default function ProductsManagementPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageInner />
    </Suspense>
  );
}
