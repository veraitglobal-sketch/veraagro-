'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type Item = Awaited<ReturnType<typeof b2bSupplierPortalAPI.getMyCatalog>>[number];

export default function SupplierCatalogPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    unit: 'bag',
    listPrice: '',
    sku: '',
  });

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setItems(await b2bSupplierPortalAPI.getMyCatalog());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm({ name: '', description: '', unit: 'bag', listPrice: '', sku: '' });
    setEditingId(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const listPrice = form.listPrice.trim() ? parseFloat(form.listPrice) : undefined;
      if (form.listPrice.trim() && Number.isNaN(listPrice!)) {
        setErr('List price must be a number');
        setSaving(false);
        return;
      }
      if (editingId) {
        await b2bSupplierPortalAPI.updateCatalogItem(editingId, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          unit: form.unit.trim() || 'unit',
          listPrice: listPrice,
          sku: form.sku.trim() || undefined,
        });
      } else {
        await b2bSupplierPortalAPI.createCatalogItem({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          unit: form.unit.trim() || 'unit',
          listPrice: listPrice,
          sku: form.sku.trim() || undefined,
        });
      }
      resetForm();
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (it: Item) => {
    setEditingId(it.id);
    setForm({
      name: it.name,
      description: it.description || '',
      unit: it.unit,
      listPrice: it.listPrice != null ? String(it.listPrice) : '',
      sku: it.sku || '',
    });
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this line from your catalog?')) return;
    setErr(null);
    try {
      await b2bSupplierPortalAPI.deleteCatalogItem(id);
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <AuthGuard
      requiredRoles={['MATERIAL_SUPPLIER']}
      redirectTo="/login?returnTo=%2Fsupplier%2Fcatalog"
    >
      <div className="max-w-3xl">
        <h1 className="text-2xl font-light text-gray-900">Store catalog</h1>
        <p className="text-sm text-gray-600 font-light mt-1 mb-6">
          Reference products and prices for growers (shown on your public store profile). Grower orders can still
          use free text — this list helps everyone align on names and units.
        </p>

        {err && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
        )}

        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm mb-8"
        >
          <h2 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#2D5A27]" />
            {editingId ? 'Edit line' : 'Add product line'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block sm:col-span-2 text-xs text-gray-600">
              Name *
              <input
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Organic tomato seed – variety X"
              />
            </label>
            <label className="block sm:col-span-2 text-xs text-gray-600">
              Description
              <textarea
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-light"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </label>
            <label className="block text-xs text-gray-600">
              Unit
              <input
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="bag, L, kg"
              />
            </label>
            <label className="block text-xs text-gray-600">
              Reference list price
              <input
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.listPrice}
                onChange={(e) => setForm((f) => ({ ...f, listPrice: e.target.value }))}
                inputMode="decimal"
                placeholder="optional"
              />
            </label>
            <label className="block sm:col-span-2 text-xs text-gray-600">
              SKU / internal code
              <input
                className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="optional"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-light rounded-md hover:bg-[#23471f] disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Add to catalog'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Current lines</h2>
        {loading ? (
          <p className="text-sm text-gray-500 font-light">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 font-light border border-dashed border-gray-200 rounded-lg p-6 text-center">
            No products yet. Add your first line above.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{it.name}</p>
                  {it.description && <p className="text-xs text-gray-500 font-light mt-0.5">{it.description}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {it.unit}
                    {it.listPrice != null && ` · ${it.listPrice}`}
                    {it.sku && ` · SKU ${it.sku}`}
                    {!it.isActive && ' · (inactive)'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(it)}
                    className="p-2 text-[#2D5A27] hover:bg-[#2D5A27]/5 rounded-md"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(it.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AuthGuard>
  );
}
