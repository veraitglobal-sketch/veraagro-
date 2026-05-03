'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI, parcelsAPI, batchesAPI } from '@/lib/api';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { MapPin, Plus, Clock, CheckCircle, Loader2, QrCode } from 'lucide-react';
import Link from 'next/link';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { growerApiErrorOrT } from '@/lib/grower-api-error';

const DEFAULT_POLYGON = [
  { lat: 44.7866, lng: 20.4489 },
  { lat: 44.7876, lng: 20.4499 },
  { lat: 44.7886, lng: 20.4509 },
  { lat: 44.7866, lng: 20.4489 },
];

interface Parcel {
  id: string;
  cropType?: string | null;
  status: string;
  approvedAt: string | null;
  estateId: string;
  /** Set when admin approves — used in /plot/{code} for retail */
  publicCode?: string | null;
}

interface Estate {
  id: string;
  name: string;
  parcels?: Parcel[];
}

/** Aligned with POST /batches parcel gate (approvedAt or ACTIVE/CERTIFIED). */
function parcelEligibleForBatch(p: Parcel): boolean {
  if (p.approvedAt) return true;
  const s = String(p.status ?? '').toUpperCase();
  return s === 'ACTIVE' || s === 'CERTIFIED';
}

export default function GrowerFieldsPage() {
  const { t } = useTranslation();
  const growerNavItems = useGrowerNavItems();
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingParcel, setAddingParcel] = useState<string | null>(null);
  const [newParcelCrop, setNewParcelCrop] = useState('');
  const [formBatchParcel, setFormBatchParcel] = useState<{ estateId: string; parcelId: string; estateName: string; cropType?: string } | null>(null);
  const [batchForm, setBatchForm] = useState({ productName: '', quantity: 50, unit: 'kg', harvestDate: new Date().toISOString().split('T')[0] });
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [newEstateName, setNewEstateName] = useState('');
  const [addingEstate, setAddingEstate] = useState(false);
  const [plotQr, setPlotQr] = useState<{
    parcelId: string;
    publicCode: string;
    publicUrl: string;
    qrCodeDataUrl: string;
  } | null>(null);
  const [plotQrLoading, setPlotQrLoading] = useState(false);
  const [plotQrErr, setPlotQrErr] = useState<string | null>(null);

  useEffect(() => {
    loadEstates();
  }, []);

  /** Deep-link from dashboard / legacy /producer/estates/:id → ?estate= */
  useEffect(() => {
    if (loading || typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('estate');
    if (!id) return;
    const el = document.getElementById(`grower-estate-${id}`);
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [loading, estates]);

  const loadEstates = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await estatesAPI.getAll();
      const estatesWithParcels: Estate[] = await Promise.all(
        (list || []).map(async (e: Estate) => {
          const parcels = await parcelsAPI.getByEstate(e.id).catch(() => []);
          return { ...e, parcels: parcels || [] };
        })
      );
      setEstates(estatesWithParcels);
    } catch (err: unknown) {
      setError(growerApiErrorOrT(err, t, 'growerPages.loadFieldsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddEstate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newEstateName.trim()) return;
    setAddingEstate(true);
    setError(null);
    try {
      await estatesAPI.create({ name: newEstateName.trim(), polygonCoordinates: DEFAULT_POLYGON });
      setNewEstateName('');
      await loadEstates();
    } catch (err: unknown) {
      setError(growerApiErrorOrT(err, t, 'growerPages.addFieldError'));
    } finally {
      setAddingEstate(false);
    }
  };

  const handleAddParcel = async (estateId: string) => {
    setAddingParcel(estateId);
    setError(null);
    try {
      await parcelsAPI.create(estateId, {
        polygonCoordinates: DEFAULT_POLYGON,
        cropType: newParcelCrop.trim() || undefined,
      });
      setNewParcelCrop('');
      await loadEstates();
    } catch (err: unknown) {
      setError(growerApiErrorOrT(err, t, 'growerPages.addParcelError'));
    } finally {
      setAddingParcel(null);
    }
  };

  const handleFormBatch = (estateId: string, parcelId: string, estateName: string, cropType?: string) => {
    setFormBatchParcel({ estateId, parcelId, estateName, cropType });
    setBatchForm({ productName: cropType || '', quantity: 50, unit: 'kg', harvestDate: new Date().toISOString().split('T')[0] });
    setBatchError(null);
  };

  const openStoreQr = async (parcelId: string) => {
    setPlotQrErr(null);
    setPlotQrLoading(true);
    try {
      const data = await parcelsAPI.getPlotQr(parcelId);
      setPlotQr({ parcelId, ...data });
      await loadEstates();
    } catch (err: unknown) {
      setPlotQrErr(growerApiErrorOrT(err, t, 'growerPages.plotQrError'));
    } finally {
      setPlotQrLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBatchParcel) return;
    setBatchError(null);
    setSubmittingBatch(true);
    try {
      const batch = await batchesAPI.create({
        estateId: formBatchParcel.estateId,
        parcelId: formBatchParcel.parcelId,
        productName: batchForm.productName.trim(),
        quantity: batchForm.quantity,
        unit: batchForm.unit,
        harvestDate: batchForm.harvestDate,
      });
      setFormBatchParcel(null);
      window.location.href = `/grower/batches`;
    } catch (err: unknown) {
      setBatchError(growerApiErrorOrT(err, t, 'growerPages.createBatchError'));
    } finally {
      setSubmittingBatch(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.nav.myFields')} navItems={growerNavItems}>
        <GrowerPageShell className="space-y-6">
          <GrowerPageHeader
            title={t('growerPages.fieldsParcels')}
            description={t('growerPages.fieldsHeaderDescription')}
          />

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-base text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
            </div>
          ) : estates.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-8">
              <p className="text-base text-gray-600 mb-4">{t('growerPages.noFieldsYet')}</p>
              <form onSubmit={handleAddEstate} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newEstateName}
                  onChange={(e) => setNewEstateName(e.target.value)}
                  placeholder={t('growerPages.fieldNamePlaceholder')}
                  className="px-3 py-3 border border-gray-300 rounded-lg w-56 text-base focus:ring-2 focus:ring-[#2D5A27]"
                />
                <button
                  type="submit"
                  disabled={addingEstate}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 px-5 py-3 bg-[#2D5A27] text-white text-base font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
                >
                  {addingEstate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {t('growerPages.addField')}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newEstateName}
                  onChange={(e) => setNewEstateName(e.target.value)}
                  placeholder={t('growerPages.placeholderNewField')}
                  className="px-3 py-3 border border-gray-300 rounded-lg w-48 min-w-[12rem] text-base focus:ring-2 focus:ring-[#2D5A27]"
                />
                <button
                  type="button"
                  onClick={() => handleAddEstate()}
                  disabled={addingEstate || !newEstateName.trim()}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 px-5 py-3 bg-[#2D5A27] text-white text-base font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
                >
                  {addingEstate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {t('growerPages.addField')}
                </button>
              </div>
              {estates.map((estate) => (
                <div
                  key={estate.id}
                  id={`grower-estate-${estate.id}`}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6 scroll-mt-24"
                >
                  <div className="flex items-center gap-2 text-[#2D5A27] mb-4">
                    <MapPin className="w-5 h-5" />
                    <h2 className="text-xl font-medium">{estate.name}</h2>
                  </div>

                  <div className="space-y-3 mb-4">
                    {(estate.parcels || []).length === 0 && (
                      <p className="text-base text-gray-500 font-light py-2">{t('growerPages.fieldsNoParcelsOnEstate')}</p>
                    )}
                    {(estate.parcels || []).map((parcel) => (
                      <div
                        key={parcel.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div>
                          <span className="font-medium text-base text-gray-900">
                            {parcel.cropType || t('growerPages.fieldParcel')}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">({parcel.id.slice(0, 8)}…)</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {parcelEligibleForBatch(parcel) ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-sm text-[#23471f] bg-[#f7faf6] px-2.5 py-1.5 rounded border border-[#2D5A27]/20">
                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />{' '}
                                {parcel.approvedAt ? t('growerPages.statusApproved') : t('growerPages.parcelEligibleBadge')}
                              </span>
                              {parcel.publicCode && (
                                <Link
                                  href={`/plot/${encodeURIComponent(parcel.publicCode)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-[44px] items-center text-sm font-medium text-gray-700 hover:text-[#2D5A27] underline px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 rounded"
                                >
                                  {t('growerPages.publicPlotPage')}
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => void openStoreQr(parcel.id)}
                                disabled={plotQrLoading}
                                className="inline-flex min-h-[44px] items-center gap-1.5 px-2 text-base font-medium text-gray-800 hover:text-[#2D5A27] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 rounded"
                                title={t('growerPages.fieldQrMapTitle')}
                              >
                                {plotQrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                                {t('growerPages.storeQr')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFormBatch(estate.id, parcel.id, estate.name, parcel.cropType || undefined)}
                                className="inline-flex min-h-[44px] items-center text-base font-medium text-[#2D5A27] hover:underline px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 rounded"
                              >
                                {t('growerPages.createBatch')}
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded">
                              <Clock className="w-3.5 h-3.5 shrink-0" /> {t('growerPages.statusPending')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={addingParcel === estate.id ? newParcelCrop : ''}
                      onChange={(e) => setNewParcelCrop(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddParcel(estate.id)}
                      placeholder={t('growerPages.placeholderCrop')}
                      className="px-3 py-3 border border-gray-300 rounded-lg text-base w-48 min-w-[12rem] focus:ring-2 focus:ring-[#2D5A27]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddParcel(estate.id)}
                      disabled={addingParcel !== null}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 px-5 py-3 bg-[#2D5A27] text-white text-base font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
                    >
                      {addingParcel === estate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {t('growerPages.addParcel')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal / panel: Form batch (only when parcel is approved) */}
          {plotQrErr && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-base text-red-700">{plotQrErr}</div>
          )}

          {plotQr && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
              onClick={() => setPlotQr(null)}
            >
              <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{t('growerPages.fieldQrTitle')}</h3>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{t('growerPages.fieldQrHint')}</p>
                <div className="flex justify-center p-2 bg-gray-50 rounded-lg mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={plotQr.qrCodeDataUrl} alt="Plot QR" className="w-48 h-48" />
                </div>
                <p className="text-sm font-mono text-center text-gray-600 break-all mb-2">{plotQr.publicCode}</p>
                <a
                  href={plotQr.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center text-base text-[#2D5A27] font-medium w-full text-center mb-4 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 rounded"
                >
                  {t('growerPages.openPublicPage')}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = plotQr.qrCodeDataUrl;
                    a.download = `bio-vera-plot-${plotQr.publicCode}.png`;
                    a.click();
                  }}
                  className="w-full min-h-[48px] py-3 bg-[#2D5A27] text-white rounded-lg text-base font-medium hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
                >
                  {t('growerPages.downloadPng')}
                </button>
                <button
                  type="button"
                  onClick={() => setPlotQr(null)}
                  className="w-full mt-2 min-h-[48px] py-3 text-gray-700 text-base font-medium hover:bg-gray-50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          )}

          {formBatchParcel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setFormBatchParcel(null)}>
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{t('growerPages.modalCreateBatch')}</h3>
                <p className="text-base text-gray-600 mb-4 leading-relaxed">
                  {t('growerPages.modalCreateBatchHint', { estateName: formBatchParcel.estateName })}
                </p>
                <form onSubmit={handleCreateBatch} className="space-y-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5">{t('growerPages.labelProduct')}</label>
                    <input
                      type="text"
                      value={batchForm.productName}
                      onChange={(e) => setBatchForm((f) => ({ ...f, productName: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#2D5A27]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-1.5">{t('growerPages.labelQuantity')}</label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={batchForm.quantity}
                        onChange={(e) => setBatchForm((f) => ({ ...f, quantity: Number(e.target.value) || 0 }))}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#2D5A27]"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-1.5">{t('growerPages.labelUnit')}</label>
                      <input
                        type="text"
                        value={batchForm.unit}
                        onChange={(e) => setBatchForm((f) => ({ ...f, unit: e.target.value }))}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#2D5A27]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5">{t('growerPages.labelHarvestDate')}</label>
                    <input
                      type="date"
                      value={batchForm.harvestDate}
                      onChange={(e) => setBatchForm((f) => ({ ...f, harvestDate: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#2D5A27]"
                    />
                  </div>
                  {batchError && <p className="text-base text-red-600">{batchError}</p>}
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setFormBatchParcel(null)}
                      className="flex-1 min-h-[48px] px-4 py-3 border border-gray-300 text-gray-800 text-base font-medium rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBatch}
                      className="flex-1 min-h-[48px] px-4 py-3 bg-[#2D5A27] text-white text-base font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
                    >
                      {submittingBatch ? t('growerPages.creating') : t('growerPages.createBatch')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
