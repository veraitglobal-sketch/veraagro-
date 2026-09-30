'use client';

import { useCallback, useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { PremiumButton, PremiumButtonLink, PremiumPageTitle } from '@/components/ui/Premium';
import { seedProductionAPI, type SeedApprovedProduct, type SeedInstructions } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { Loader2, Pencil, Plus, X } from 'lucide-react';

type ProductCategory = 'SEED' | 'FERTILIZER' | 'PLANT_PROTECTION' | 'PACKAGING' | 'OTHER';

type ProductForm = {
  category: ProductCategory;
  name: string;
  variety: string;
  cropType: string;
  manufacturer: string;
  description: string;
  unit: string;
  packSize: string;
  isBioVeraBrand: boolean;
  instructionsPdfUrl: string;
  videoUrl: string;
  instructions: SeedInstructions;
};

const INSTRUCTION_KEYS: (keyof SeedInstructions)[] = [
  'sowingTime',
  'spacingDepth',
  'seedRate',
  'soilTemperature',
  'irrigation',
  'firstSteps',
  'storage',
  'safety',
  'harvestWindow',
];

const EMPTY_INSTRUCTIONS: SeedInstructions = {
  sowingTime: '',
  spacingDepth: '',
  seedRate: '',
  soilTemperature: '',
  irrigation: '',
  firstSteps: '',
  storage: '',
  safety: '',
  harvestWindow: '',
};

const EMPTY_FORM: ProductForm = {
  category: 'SEED',
  name: '',
  variety: '',
  cropType: '',
  manufacturer: '',
  description: '',
  unit: 'bag',
  packSize: '',
  isBioVeraBrand: true,
  instructionsPdfUrl: '',
  videoUrl: '',
  instructions: { ...EMPTY_INSTRUCTIONS },
};

function statusClass(status: string): string {
  return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700';
}

export default function SeedApprovedProductsPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [products, setProducts] = useState<SeedApprovedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<'details' | 'instructions'>('details');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await seedProductionAPI.listApprovedProducts();
      setProducts(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTab('details');
    setModalOpen(true);
  };

  const openEdit = (p: SeedApprovedProduct) => {
    setEditingId(p.id);
    const instr = (p.instructions ?? {}) as SeedInstructions;
    setForm({
      category: (p.category as ProductCategory) || 'SEED',
      name: p.name,
      variety: p.variety ?? '',
      cropType: p.cropType ?? '',
      manufacturer: p.manufacturer ?? '',
      description: p.description ?? '',
      unit: p.unit,
      packSize: p.packSize ?? '',
      isBioVeraBrand: p.isBioVeraBrand,
      instructionsPdfUrl: p.instructionsPdfUrl ?? '',
      videoUrl: p.videoUrl ?? '',
      instructions: { ...EMPTY_INSTRUCTIONS, ...instr },
    });
    setTab('details');
    setModalOpen(true);
  };

  const buildBody = () => {
    const instructions: Record<string, string> = {};
    for (const key of INSTRUCTION_KEYS) {
      const val = form.instructions[key]?.trim();
      if (val) instructions[key] = val;
    }
    return {
      category: form.category,
      name: form.name.trim(),
      variety: form.variety.trim() || undefined,
      cropType: form.cropType.trim() || undefined,
      manufacturer: form.manufacturer.trim() || undefined,
      description: form.description.trim() || undefined,
      unit: form.unit.trim(),
      packSize: form.packSize.trim() || undefined,
      isBioVeraBrand: form.isBioVeraBrand,
      instructionsPdfUrl: form.instructionsPdfUrl.trim() || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      instructions: Object.keys(instructions).length > 0 ? instructions : undefined,
    };
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = buildBody();
      if (editingId) {
        await seedProductionAPI.updateApprovedProduct(editingId, body);
      } else {
        await seedProductionAPI.createApprovedProduct(body);
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const retire = async (id: string) => {
    if (!window.confirm(t('seedProduction.approvedProducts.retireConfirm'))) return;
    setActionId(id);
    setError(null);
    try {
      await seedProductionAPI.retireApprovedProduct(id);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('seedProduction.approvedProducts.title')} navItems={adminNavItems}>
        <div className="space-y-6">
          <PremiumPageTitle
            title={t('seedProduction.approvedProducts.title')}
            description={t('seedProduction.approvedProducts.subtitle')}
            right={
              <PremiumButton onClick={openCreate}>
                <Plus className="mr-2 inline h-4 w-4" />
                {t('seedProduction.approvedProducts.new')}
              </PremiumButton>
            }
          />

          <nav className="flex flex-wrap gap-2 text-sm">
            <PremiumButtonLink href="/admin/seed-production" variant="secondary">{t('seedProduction.nav.dashboard')}</PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/approved-products" variant="primary">{t('seedProduction.nav.approvedProducts')}</PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/producers" variant="secondary">{t('seedProduction.nav.producers')}</PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/lookup" variant="secondary">{t('seedProduction.nav.lookup')}</PremiumButtonLink>
          </nav>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('seedProduction.common.loading')}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-600">{t('seedProduction.approvedProducts.empty')}</p>
          ) : (
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.approvedProducts.name')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.approvedProducts.variety')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.approvedProducts.cropType')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.approvedProducts.packSize')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.approvedProducts.status')}</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">{t('seedProduction.common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3">{p.variety ?? '—'}</td>
                        <td className="px-4 py-3">{p.cropType ?? '—'}</td>
                        <td className="px-4 py-3">{p.packSize ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-3">
                          <button type="button" onClick={() => openEdit(p)} className="inline-flex items-center gap-1 text-[#2D5A27] hover:underline">
                            <Pencil className="h-4 w-4" />
                            {t('seedProduction.approvedProducts.edit')}
                          </button>
                          {p.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => retire(p.id)}
                              disabled={actionId === p.id}
                              className="text-red-700 hover:underline disabled:opacity-50"
                            >
                              {t('seedProduction.approvedProducts.retire')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" role="dialog" aria-modal="true">
            <div className="mb-10 w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {editingId ? t('seedProduction.approvedProducts.edit') : t('seedProduction.approvedProducts.new')}
                </h2>
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex border-b border-gray-200 px-6">
                <button
                  type="button"
                  onClick={() => setTab('details')}
                  className={`border-b-2 px-4 py-3 text-sm font-medium ${tab === 'details' ? 'border-[#2D5A27] text-[#2D5A27]' : 'border-transparent text-gray-600'}`}
                >
                  {t('seedProduction.approvedProducts.tabDetails')}
                </button>
                <button
                  type="button"
                  onClick={() => setTab('instructions')}
                  className={`border-b-2 px-4 py-3 text-sm font-medium ${tab === 'instructions' ? 'border-[#2D5A27] text-[#2D5A27]' : 'border-transparent text-gray-600'}`}
                >
                  {t('seedProduction.approvedProducts.tabInstructions')}
                </button>
              </div>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
                {tab === 'details' ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.category')}</span>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ProductCategory }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      >
                        <option value="SEED">{t('seedProduction.approvedProducts.categorySeed')}</option>
                        <option value="FERTILIZER">{t('seedProduction.approvedProducts.categoryFertilizer')}</option>
                        <option value="PLANT_PROTECTION">{t('seedProduction.approvedProducts.categoryPlantProtection')}</option>
                        <option value="PACKAGING">{t('seedProduction.approvedProducts.categoryPackaging')}</option>
                        <option value="OTHER">{t('seedProduction.approvedProducts.categoryOther')}</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.name')}</span>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.variety')}</span>
                        <input
                          value={form.variety}
                          onChange={(e) => setForm((f) => ({ ...f, variety: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.cropType')}</span>
                        <input
                          value={form.cropType}
                          onChange={(e) => setForm((f) => ({ ...f, cropType: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.manufacturer')}</span>
                      <input
                        value={form.manufacturer}
                        onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.description')}</span>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.unit')}</span>
                        <input
                          value={form.unit}
                          onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.packSize')}</span>
                        <input
                          value={form.packSize}
                          onChange={(e) => setForm((f) => ({ ...f, packSize: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                        />
                      </label>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isBioVeraBrand}
                        onChange={(e) => setForm((f) => ({ ...f, isBioVeraBrand: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-[#2D5A27] focus:ring-[#2D5A27]"
                      />
                      <span className="text-sm text-gray-700">{t('seedProduction.approvedProducts.isBioVeraBrand')}</span>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.instructionsPdfUrl')}</span>
                      <input
                        value={form.instructionsPdfUrl}
                        onChange={(e) => setForm((f) => ({ ...f, instructionsPdfUrl: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">{t('seedProduction.approvedProducts.videoUrl')}</span>
                      <input
                        value={form.videoUrl}
                        onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      />
                    </label>
                  </>
                ) : (
                  INSTRUCTION_KEYS.map((key) => (
                    <label key={key} className="block">
                      <span className="text-sm font-medium text-gray-700">{t(`seedProduction.approvedProducts.${key}`)}</span>
                      <textarea
                        rows={3}
                        value={form.instructions[key] ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            instructions: { ...f.instructions, [key]: e.target.value },
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                      />
                    </label>
                  ))
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <PremiumButton variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                  {t('seedProduction.approvedProducts.cancel')}
                </PremiumButton>
                <PremiumButton onClick={save} disabled={saving || !form.name.trim() || !form.unit.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.approvedProducts.save')}
                </PremiumButton>
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </AuthGuard>
  );
}
