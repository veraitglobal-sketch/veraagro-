'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { catalogAPI, estatesAPI, harvestAnnouncementsAPI, passportDocumentsAPI } from '@/lib/api';
import { growerApiErrorOrT } from '@/lib/grower-api-error';

type ProductRow = {
  id: string;
  name: string;
  variety: string | null;
  description: string | null;
  storageConditions: string | null;
  imageUrl: string | null;
  estateId: string | null;
  sourcePlantingId: string | null;
  plannedQuantityKg: number;
  status: string;
};

export default function GrowerCatalogPage() {
  const { t } = useTranslation();
  const nav = useGrowerNavItems();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [estates, setEstates] = useState<Array<{ id: string; name: string }>>([]);
  const [plantings, setPlantings] = useState<Array<{ id: string; cropType: string; estimatedDate: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'CERTIFICATE' | 'LAB_RESULT' | 'OTHER'>('CERTIFICATE');
  const [docIssuer, setDocIssuer] = useState('');
  const [docIssuedAt, setDocIssuedAt] = useState('');
  const [docExpiresAt, setDocExpiresAt] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docSaving, setDocSaving] = useState(false);
  const [docMsg, setDocMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    variety: '',
    description: '',
    storageConditions: '',
    estateId: '',
    sourcePlantingId: '',
    plannedQuantityKg: '100',
    imageUrl: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, e, plans] = await Promise.all([
        catalogAPI.listGrowerProducts(),
        estatesAPI.getAll(),
        harvestAnnouncementsAPI.getMine(),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      const estateRows = Array.isArray(e) ? e : [];
      setEstates(estateRows.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
      const plantingRows = (Array.isArray(plans) ? plans : []).filter(
        (x: { announcementType?: string }) => String(x.announcementType).toUpperCase() === 'PLANTING',
      );
      setPlantings(
        plantingRows.map((x: { id: string; cropType: string; estimatedDate: string }) => ({
          id: x.id,
          cropType: x.cropType,
          estimatedDate: x.estimatedDate,
        })),
      );
      if (!form.estateId && estateRows[0]?.id) setForm((f) => ({ ...f, estateId: estateRows[0].id }));
    } catch (err: unknown) {
      setError(growerApiErrorOrT(err, t, 'growerPages.catalogLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [form.estateId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      variety: '',
      description: '',
      storageConditions: '',
      estateId: estates[0]?.id ?? '',
      sourcePlantingId: '',
      plannedQuantityKg: '100',
      imageUrl: '',
    });
  };

  const save = async () => {
    if (!form.name.trim() || !form.estateId) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        variety: form.variety.trim(),
        description: form.description.trim(),
        storageConditions: form.storageConditions.trim(),
        estateId: form.estateId,
        sourcePlantingId: form.sourcePlantingId || (editingId ? null : undefined),
        plannedQuantityKg: Number(form.plannedQuantityKg),
        imageUrl: form.imageUrl.trim(),
      };
      if (editingId) await catalogAPI.updateGrowerProduct(editingId, body);
      else await catalogAPI.createGrowerProduct(body);
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(growerApiErrorOrT(err, t, 'growerPages.catalogSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async () => {
    if (!editingId || !docTitle.trim() || !docFile || !form.estateId) return;
    setDocSaving(true);
    setDocMsg(null);
    try {
      const fd = new FormData();
      fd.append('title', docTitle.trim());
      fd.append('docType', docType);
      fd.append('scope', 'PRODUCT');
      fd.append('estateId', form.estateId);
      fd.append('catalogProductId', editingId);
      fd.append('isPublic', '0');
      if (docIssuer.trim()) fd.append('issuer', docIssuer.trim());
      if (docIssuedAt) fd.append('issuedAt', docIssuedAt);
      if (docExpiresAt) fd.append('expiresAt', docExpiresAt);
      fd.append('file', docFile);
      await passportDocumentsAPI.uploadGrower(fd);
      setDocTitle('');
      setDocIssuer('');
      setDocIssuedAt('');
      setDocExpiresAt('');
      setDocFile(null);
      setDocMsg(t('growerPages.catalogDocUploaded', 'Document uploaded — admin review required before public display.'));
    } catch (err: unknown) {
      setDocMsg(growerApiErrorOrT(err, t, 'growerPages.catalogDocUploadFailed'));
    } finally {
      setDocSaving(false);
    }
  };

  const edit = (row: ProductRow) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      variety: row.variety ?? '',
      description: row.description ?? '',
      storageConditions: row.storageConditions ?? '',
      estateId: row.estateId ?? estates[0]?.id ?? '',
      sourcePlantingId: row.sourcePlantingId ?? '',
      plannedQuantityKg: String(row.plannedQuantityKg),
      imageUrl: row.imageUrl ?? '',
    });
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER', 'PARTNER']} redirectTo="/login/producer">
      <SidebarLayout title={t('growerPages.catalogTitle', 'Product catalog')} navItems={nav}>
        <GrowerPageShell className="space-y-6">
          <GrowerPageHeader
            title={t('growerPages.catalogTitle', 'Product catalog')}
            description={t('growerPages.catalogDescription', 'Enter product data once — linked to planting and reused in harvest, lots, and passport.')}
          />
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div> : null}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 max-w-xl">
            <h2 className="text-lg font-medium">{editingId ? t('growerPages.catalogEdit', 'Edit product') : t('growerPages.catalogNew', 'New product')}</h2>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" placeholder={t('growerPages.catalogName', 'Product name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" placeholder={t('growerPages.catalogVariety', 'Variety')} value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} />
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" rows={3} placeholder={t('growerPages.catalogDescription', 'Short description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" rows={2} placeholder={t('growerPages.catalogStorage', 'Storage conditions')} value={form.storageConditions} onChange={(e) => setForm({ ...form, storageConditions: e.target.value })} />
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" value={form.estateId} onChange={(e) => setForm({ ...form, estateId: e.target.value })}>
              {estates.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" value={form.sourcePlantingId} onChange={(e) => setForm({ ...form, sourcePlantingId: e.target.value })}>
              <option value="">{t('growerPages.catalogNoPlanting', 'No planting link')}</option>
              {plantings.map((p) => (
                <option key={p.id} value={p.id}>{p.cropType} · {p.estimatedDate.slice(0, 10)}</option>
              ))}
            </select>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" placeholder={t('growerPages.catalogImageUrl', 'Photo URL or base64')} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => void save()} className="min-h-[48px] rounded-lg bg-[#2D5A27] px-5 text-white hover:bg-[#23471f] disabled:opacity-50">
                {saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
              </button>
              {editingId ? (
                <button type="button" onClick={resetForm} className="min-h-[48px] rounded-lg border border-gray-300 px-5">{t('common.cancel', 'Cancel')}</button>
              ) : null}
            </div>
          </div>
          <div className="space-y-3">
            {loading ? <p>{t('common.loading', 'Loading…')}</p> : null}
            {products.map((row) => (
              <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex justify-between gap-4">
                <div>
                  <p className="font-medium">{row.name}{row.variety ? ` · ${row.variety}` : ''}</p>
                  <p className="text-sm text-gray-600">{row.description ?? t('growerPages.notRecorded', 'Not recorded')}</p>
                </div>
                <button type="button" onClick={() => edit(row)} className="text-sm text-[#2D5A27] hover:underline self-start">{t('common.edit', 'Edit')}</button>
              </div>
            ))}
          </div>
          {editingId ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 max-w-xl">
              <h2 className="text-lg font-medium">{t('growerPages.catalogDocuments', 'Product documents')}</h2>
              <p className="text-sm text-gray-600">{t('growerPages.catalogDocumentsLead', 'Certificates and lab results linked to this product. Public passport shows only reviewed documents.')}</p>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" placeholder={t('growerPages.catalogDocTitle', 'Document title')} value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" value={docType} onChange={(e) => setDocType(e.target.value as typeof docType)}>
                <option value="CERTIFICATE">{t('growerPages.catalogDocTypeCert', 'Certificate')}</option>
                <option value="LAB_RESULT">{t('growerPages.catalogDocTypeLab', 'Lab result')}</option>
                <option value="OTHER">{t('growerPages.catalogDocTypeOther', 'Other')}</option>
              </select>
              <input type="file" accept="application/pdf,image/*" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className="text-sm" />
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" placeholder={t('growerPages.catalogDocIssuer', 'Issuer (optional)')} value={docIssuer} onChange={(e) => setDocIssuer(e.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" value={docIssuedAt} onChange={(e) => setDocIssuedAt(e.target.value)} aria-label={t('growerPages.catalogDocIssued', 'Issued on')} />
                <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" value={docExpiresAt} onChange={(e) => setDocExpiresAt(e.target.value)} aria-label={t('growerPages.catalogDocExpires', 'Valid until')} />
              </div>
              {docMsg ? <p className="text-sm text-gray-700">{docMsg}</p> : null}
              <button type="button" disabled={docSaving || !docTitle.trim() || !docFile} onClick={() => void uploadDocument()} className="min-h-[48px] rounded-lg bg-[#2D5A27] px-5 text-white hover:bg-[#23471f] disabled:opacity-50">
                {docSaving ? t('common.saving', 'Saving…') : t('growerPages.catalogDocUpload', 'Upload document')}
              </button>
            </div>
          ) : null}
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
