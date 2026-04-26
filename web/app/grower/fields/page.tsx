'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI, parcelsAPI, batchesAPI } from '@/lib/api';
import { growerNavItems } from '@/lib/grower-nav';
import { MapPin, Plus, Clock, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
}

interface Estate {
  id: string;
  name: string;
  parcels?: Parcel[];
}

export default function GrowerFieldsPage() {
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

  useEffect(() => {
    loadEstates();
  }, []);

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
    } catch (err: any) {
      setError(err.message || 'Failed to load fields');
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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add field');
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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add parcel');
    } finally {
      setAddingParcel(null);
    }
  };

  const handleFormBatch = (estateId: string, parcelId: string, estateName: string, cropType?: string) => {
    setFormBatchParcel({ estateId, parcelId, estateName, cropType });
    setBatchForm({ productName: cropType || '', quantity: 50, unit: 'kg', harvestDate: new Date().toISOString().split('T')[0] });
    setBatchError(null);
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
    } catch (err: any) {
      setBatchError(err.response?.data?.message || err.message || 'Failed to create batch');
    } finally {
      setSubmittingBatch(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title="My Fields" navItems={growerNavItems}>
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="mb-6">
            <h1 className="text-3xl font-light text-gray-900">My fields &amp; parcels</h1>
            <p className="text-sm text-gray-600 mt-1">Add parcels here. Admin must approve before batches and field work.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2D5A27]" />
            </div>
          ) : estates.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
              <p className="text-gray-600 mb-4">You have no fields yet. Add your first one.</p>
              <form onSubmit={handleAddEstate} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newEstateName}
                  onChange={(e) => setNewEstateName(e.target.value)}
                  placeholder="Field name"
                  className="px-3 py-2 border border-gray-300 rounded-lg w-56 focus:ring-2 focus:ring-[#2D5A27]"
                />
                <button
                  type="submit"
                  disabled={addingEstate}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50"
                >
                  {addingEstate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add field
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newEstateName}
                  onChange={(e) => setNewEstateName(e.target.value)}
                  placeholder="New field name"
                  className="px-3 py-2 border border-gray-300 rounded-lg w-48 text-sm focus:ring-2 focus:ring-[#2D5A27]"
                />
                <button
                  type="button"
                  onClick={() => handleAddEstate()}
                  disabled={addingEstate || !newEstateName.trim()}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50"
                >
                  {addingEstate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add field
                </button>
              </div>
              {estates.map((estate) => (
                <div key={estate.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-2 text-[#2D5A27] mb-4">
                    <MapPin className="w-5 h-5" />
                    <h2 className="text-lg font-medium">{estate.name}</h2>
                  </div>

                  <div className="space-y-3 mb-4">
                    {(estate.parcels || []).map((parcel) => (
                      <div
                        key={parcel.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{parcel.cropType || 'Parcel'}</span>
                          <span className="ml-2 text-xs text-gray-500">({parcel.id.slice(0, 8)}…)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {parcel.approvedAt ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                <CheckCircle className="w-3 h-3" /> Approved
                              </span>
                              <button
                                type="button"
                                onClick={() => handleFormBatch(estate.id, parcel.id, estate.name, parcel.cropType || undefined)}
                                className="text-sm font-medium text-[#2D5A27] hover:underline"
                              >
                                Create batch
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                              <Clock className="w-3 h-3" /> Pending approval
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
                      placeholder="Crop type (e.g. Raspberry)"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-[#2D5A27]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddParcel(estate.id)}
                      disabled={addingParcel !== null}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50"
                    >
                      {addingParcel === estate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add parcel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal / panel: Form batch (only when parcel is approved) */}
          {formBatchParcel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setFormBatchParcel(null)}>
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Create batch</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Field: {formBatchParcel.estateName}. The parcel is approved; enter harvest details.
                </p>
                <form onSubmit={handleCreateBatch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                    <input
                      type="text"
                      value={batchForm.productName}
                      onChange={(e) => setBatchForm((f) => ({ ...f, productName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={batchForm.quantity}
                        onChange={(e) => setBatchForm((f) => ({ ...f, quantity: Number(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                      <input
                        type="text"
                        value={batchForm.unit}
                        onChange={(e) => setBatchForm((f) => ({ ...f, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harvest date *</label>
                    <input
                      type="date"
                      value={batchForm.harvestDate}
                      onChange={(e) => setBatchForm((f) => ({ ...f, harvestDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]"
                    />
                  </div>
                  {batchError && <p className="text-sm text-red-600">{batchError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFormBatchParcel(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBatch}
                      className="flex-1 px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#23471f] disabled:opacity-50"
                    >
                      {submittingBatch ? 'Creating…' : 'Create batch'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
