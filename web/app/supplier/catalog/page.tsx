'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';
import { ImageUp, Plus, Pencil, Trash2, X, Barcode, Package } from 'lucide-react';

type Item = Awaited<ReturnType<typeof b2bSupplierPortalAPI.getMyCatalog>>[number];
type BarcodeRow = Awaited<ReturnType<typeof b2bSupplierPortalAPI.getMyMaterialBarcodes>>[number];

export default function SupplierCatalogPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [barcodes, setBarcodes] = useState<BarcodeRow[]>([]);
  const [barSaving, setBarSaving] = useState(false);
  const [barForm, setBarForm] = useState({ barcode: '', catalogItemId: '', lotNumber: '', note: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      const [c, b] = await Promise.all([
        b2bSupplierPortalAPI.getMyCatalog(),
        b2bSupplierPortalAPI.getMyMaterialBarcodes().catch(() => [] as BarcodeRow[]),
      ]);
      setItems(c);
      setBarcodes(Array.isArray(b) ? b : []);
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return url;
    });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const resetForm = () => {
    setForm({ name: '', description: '', unit: 'bag', listPrice: '', sku: '' });
    setEditingId(null);
    setImageFile(null);
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
        const created = (await b2bSupplierPortalAPI.createCatalogItem({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          unit: form.unit.trim() || 'unit',
          listPrice: listPrice,
          sku: form.sku.trim() || undefined,
        })) as { id: string };
        if (imageFile) {
          await b2bSupplierPortalAPI.uploadCatalogItemImage(created.id, imageFile);
        }
      }
      resetForm();
      await load();
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (it: Item) => {
    setEditingId(it.id);
    setImageFile(null);
    setForm({
      name: it.name,
      description: it.description || '',
      unit: it.unit,
      listPrice: it.listPrice != null ? String(it.listPrice) : '',
      sku: it.sku || '',
    });
  };

  const onImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (editingId) {
      setSaving(true);
      setErr(null);
      try {
        await b2bSupplierPortalAPI.uploadCatalogItemImage(editingId, f);
        await load();
      } catch (err: unknown) {
        setErr(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      } finally {
        setSaving(false);
      }
    } else {
      setImageFile(f);
    }
  };

  const clearCatalogImage = async () => {
    if (editingId) {
      setSaving(true);
      setErr(null);
      try {
        await b2bSupplierPortalAPI.deleteCatalogItemImage(editingId);
        await load();
      } catch (err: unknown) {
        setErr(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      } finally {
        setSaving(false);
      }
    } else {
      setImageFile(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this line from your catalog?')) return;
    setErr(null);
    try {
      await b2bSupplierPortalAPI.deleteCatalogItem(id);
      if (editingId === id) resetForm();
      await load();
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    }
  };

  const onRegisterBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barForm.barcode.trim()) return;
    setBarSaving(true);
    setErr(null);
    try {
      await b2bSupplierPortalAPI.registerMaterialBarcode({
        barcode: barForm.barcode.trim(),
        catalogItemId: barForm.catalogItemId || undefined,
        lotNumber: barForm.lotNumber.trim() || undefined,
        note: barForm.note.trim() || undefined,
      });
      setBarForm({ barcode: '', catalogItemId: '', lotNumber: '', note: '' });
      await load();
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setBarSaving(false);
    }
  };

  const markBarcodeSold = async (id: string) => {
    if (!confirm('Mark this unit as SOLD? Growers can still verify the barcode in the system.')) return;
    setBarSaving(true);
    setErr(null);
    try {
      await b2bSupplierPortalAPI.updateMaterialBarcode(id, { status: 'SOLD' });
      await load();
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setBarSaving(false);
    }
  };

  const voidBarcode = async (id: string) => {
    if (!confirm('Void this barcode? It will no longer be accepted in field apps.')) return;
    setBarSaving(true);
    setErr(null);
    try {
      await b2bSupplierPortalAPI.updateMaterialBarcode(id, { status: 'VOID' });
      await load();
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setBarSaving(false);
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

        <div className="rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 p-4 sm:p-5 mb-8">
          <h2 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-2">
            <Barcode className="h-4 w-4 text-[#2D5A27]" />
            Physical unit barcodes
          </h2>
          <p className="text-xs text-gray-600 font-light mb-4">
            When you <strong>receive</strong> stock, register each scannable code (EAN, Code 128, etc.) — it becomes
            unique in Bio Vera. When you <strong>sell</strong>, mark the row as SOLD (optional: link a grower or order
            later from the API). Grower scanners can then resolve your codes even if the product is not on the global
            whitelist.
          </p>
          <form onSubmit={onRegisterBarcode} className="space-y-3 mb-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2 text-xs text-gray-600">
                Barcode (from label) *
                <input
                  className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                  value={barForm.barcode}
                  onChange={(e) => setBarForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="Scan or type — must be unique"
                  required
                />
              </label>
              <label className="block text-xs text-gray-600 sm:col-span-2">
                <span className="inline-flex items-center gap-1">
                  <Package className="h-3 w-3" /> Link to catalog line (optional)
                </span>
                <select
                  className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={barForm.catalogItemId}
                  onChange={(e) => setBarForm((f) => ({ ...f, catalogItemId: e.target.value }))}
                >
                  <option value="">— Not linked —</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-gray-600">
                Lot / batch
                <input
                  className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={barForm.lotNumber}
                  onChange={(e) => setBarForm((f) => ({ ...f, lotNumber: e.target.value }))}
                />
              </label>
              <label className="block text-xs text-gray-600 sm:col-span-2">
                Note (e.g. supplier invoice ref.)
                <input
                  className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={barForm.note}
                  onChange={(e) => setBarForm((f) => ({ ...f, note: e.target.value }))}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={barSaving}
              className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-light rounded-md hover:bg-[#23471f] disabled:opacity-50"
            >
              {barSaving ? 'Saving…' : 'Register received unit'}
            </button>
          </form>
          {barcodes.length > 0 && (
            <div className="border-t border-[#2D5A27]/20 pt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Recent units</p>
              <ul className="space-y-2 max-h-60 overflow-y-auto text-xs">
                {barcodes.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded border border-white/50 bg-white/60 px-3 py-2"
                  >
                    <div>
                      <span className="font-mono text-gray-900">{b.barcode}</span>
                      <span className="ml-2 text-gray-500">
                        {b.status}
                        {b.catalogItem && ` · ${b.catalogItem.name}`}
                        {b.lotNumber && ` · lot ${b.lotNumber}`}
                      </span>
                    </div>
                    {b.status === 'IN_STOCK' && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => void markBarcodeSold(b.id)}
                          disabled={barSaving}
                          className="px-2 py-1 rounded bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
                        >
                          Mark sold
                        </button>
                        <button
                          type="button"
                          onClick={() => void voidBarcode(b.id)}
                          disabled={barSaving}
                          className="px-2 py-1 rounded text-red-700 hover:bg-red-50"
                        >
                          Void
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

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
            <div className="sm:col-span-2 rounded-md border border-dashed border-gray-200 bg-gray-50/80 p-3">
              <p className="text-xs font-medium text-gray-700">Product photo</p>
              <p className="text-xs text-gray-500 font-light mt-0.5">
                Optional — e.g. seed bags or inputs. JPEG, PNG, or WebP. Shown on your public store and dashboard
                window.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                  {editingId ? (
                    items.find((x) => x.id === editingId)?.imageUrl ? (
                      <img
                        src={items.find((x) => x.id === editingId)!.imageUrl!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400 font-light p-1 text-center">
                        No photo
                      </div>
                    )
                  ) : imagePreview ? (
                    <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400 font-light p-1 text-center">
                      No photo
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#2D5A27]/30 bg-white px-3 py-2 text-sm text-[#2D5A27] hover:bg-[#2D5A27]/5">
                    <ImageUp className="h-4 w-4 shrink-0" />
                    {editingId ? 'Change image' : 'Choose image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={onImageSelected}
                    />
                  </label>
                  {((editingId && items.find((x) => x.id === editingId)?.imageUrl) || (!editingId && imageFile)) && (
                    <button
                      type="button"
                      onClick={() => void clearCatalogImage()}
                      className="inline-flex items-center gap-1 self-start text-xs text-red-600 hover:underline"
                    >
                      <X className="h-3 w-3" />
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>
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
                <div className="flex gap-3 min-w-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                    {it.imageUrl ? (
                      <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#2D5A27]/15">
                        <ImageUp className="h-5 w-5" strokeWidth={1.25} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                  <p className="font-medium text-gray-900">{it.name}</p>
                  {it.description && <p className="text-xs text-gray-500 font-light mt-0.5">{it.description}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {it.unit}
                    {it.listPrice != null && ` · ${it.listPrice}`}
                    {it.sku && ` · SKU ${it.sku}`}
                    {!it.isActive && ' · (inactive)'}
                  </p>
                  </div>
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
