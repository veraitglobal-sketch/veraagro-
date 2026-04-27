'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI, parcelsAPI, batchesAPI } from '@/lib/api';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { MapPin, Package, FileText, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_POLYGON = [
  { lat: 44.7866, lng: 20.4489 },
  { lat: 44.7876, lng: 20.4499 },
  { lat: 44.7886, lng: 20.4509 },
  { lat: 44.7866, lng: 20.4489 },
];

type Step = 'field' | 'entry' | 'result';

export default function FieldBlockchainPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [step, setStep] = useState<Step>('field');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldForm, setFieldForm] = useState({ name: '' });
  const [createdEstate, setCreatedEstate] = useState<{ id: string; name: string } | null>(null);
  const [parcel, setParcel] = useState({ cropType: 'Raspberry' });
  const [createdParcel, setCreatedParcel] = useState<{ id: string; cropType?: string } | null>(null);
  const [batchForm, setBatchForm] = useState({
    productName: 'Organic raspberry',
    quantity: 50,
    unit: 'kg',
    harvestDate: new Date().toISOString().split('T')[0],
  });
  const [createdBatch, setCreatedBatch] = useState<{
    batchId: string;
    id: string;
    blockchainTxHash?: string;
    blockchainRegisteredAt?: string;
  } | null>(null);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fieldForm.name.trim()) {
      setError('Enter a field name.');
      return;
    }
    try {
      setSubmitting(true);
      const estate = await estatesAPI.create({
        name: fieldForm.name.trim(),
        polygonCoordinates: DEFAULT_POLYGON,
      });
      setCreatedEstate({ id: estate.id, name: estate.name || fieldForm.name.trim() });
      setStep('entry');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create field.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddParcel = async () => {
    if (!createdEstate) return;
    setError(null);
    try {
      setSubmitting(true);
      const p = await parcelsAPI.create(createdEstate.id, {
        polygonCoordinates: DEFAULT_POLYGON,
        cropType: parcel.cropType || undefined,
      });
      setCreatedParcel({ id: p.id, cropType: p.cropType || undefined });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create parcel.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!createdEstate) return;
    if (!batchForm.productName.trim()) {
      setError('Enter a product name.');
      return;
    }
    try {
      setSubmitting(true);
      const batch = await batchesAPI.create({
        estateId: createdEstate.id,
        productName: batchForm.productName.trim(),
        quantity: batchForm.quantity,
        unit: batchForm.unit,
        harvestDate: batchForm.harvestDate,
      });
      setCreatedBatch({
        batchId: batch.batchId,
        id: batch.id,
        blockchainTxHash: batch.blockchainTxHash,
        blockchainRegisteredAt: batch.blockchainRegisteredAt,
      });
      setStep('result');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create batch.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep('field');
    setCreatedEstate(null);
    setCreatedParcel(null);
    setCreatedBatch(null);
    setError(null);
    setFieldForm({ name: '' });
    setParcel({ cropType: 'Raspberry' });
    setBatchForm({
      productName: 'Organic raspberry',
      quantity: 50,
      unit: 'kg',
      harvestDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'GROWER']}>
      <SidebarLayout title={t('adminPages.titles.fieldBlockchain')} navItems={adminNavItems}>
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Field, harvest entry, and blockchain result</h1>
            <p className="text-sm text-gray-600 mt-1">
              Step 1: create a field (estate). Step 2: optionally add a parcel. Step 3: create a harvest batch. The batch is registered on chain; then open the passport or verify page to see the result.
            </p>
          </div>

          {/* Step 1: create field */}
          {step === 'field' && (
            <form onSubmit={handleCreateField} className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#2D5A27] mb-4">
                <MapPin className="w-5 h-5" />
                <h2 className="text-lg font-medium">1. Create field</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field name *</label>
                <input
                  type="text"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ name: e.target.value })}
                  placeholder="e.g. North field 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {submitting ? 'Creating…' : 'Create field'}
              </button>
            </form>
          )}

          {/* Step 2: optional parcel + batch */}
          {step === 'entry' && createdEstate && (
            <>
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-2 text-[#2D5A27] mb-2">
                  <MapPin className="w-5 h-5" />
                  <h2 className="text-lg font-medium">Field created</h2>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>{createdEstate.name}</strong> (ID: {createdEstate.id.slice(0, 8)}…)
                </p>
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">Parcel (optional)</label>
                  <input
                    type="text"
                    value={parcel.cropType}
                    onChange={(e) => setParcel({ cropType: e.target.value })}
                    placeholder="e.g. Raspberry"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                  />
                  <button
                    type="button"
                    onClick={handleAddParcel}
                    disabled={submitting}
                    className="px-3 py-2 border border-[#2D5A27] text-[#2D5A27] text-sm rounded-lg hover:bg-[#2D5A27]/5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add parcel'}
                  </button>
                </div>
                {createdParcel && (
                  <p className="text-sm text-green-700">Parcel created ({createdParcel.cropType || '—'}).</p>
                )}
              </div>

              <form onSubmit={handleCreateBatch} className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-2 text-[#2D5A27] mb-4">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-medium">2. Batch (harvest)</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                  <input
                    type="text"
                    value={batchForm.productName}
                    onChange={(e) => setBatchForm((u) => ({ ...u, productName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
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
                      onChange={(e) => setBatchForm((u) => ({ ...u, quantity: Number(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <input
                      type="text"
                      value={batchForm.unit}
                      onChange={(e) => setBatchForm((u) => ({ ...u, unit: e.target.value }))}
                      placeholder="kg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harvest date *</label>
                  <input
                    type="date"
                    value={batchForm.harvestDate}
                    onChange={(e) => setBatchForm((u) => ({ ...u, harvestDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  {submitting ? 'Creating batch and registering on chain…' : 'Create batch and register on chain'}
                </button>
              </form>
            </>
          )}

          {/* Step 3: on-chain result */}
          {step === 'result' && createdBatch && (
            <div className="bg-green-50 border border-[#2D5A27]/30 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#2D5A27]">
                <CheckCircle className="w-6 h-6" />
                <h2 className="text-xl font-medium">On-chain result</h2>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Batch ID:</strong> {createdBatch.batchId}
              </p>
              {createdBatch.blockchainTxHash ? (
                <p className="text-sm text-gray-700">
                  <strong>Blockchain:</strong> Batch was registered on chain (tx saved). You can open verification and product journey on the pages below.
                </p>
              ) : (
                <p className="text-sm text-amber-700">
                  Blockchain is not configured or registration failed. The batch was still created; you can open passport/verify.
                </p>
              )}
              <p className="text-sm text-gray-600">
                Open the passport or verify page to see data and on-chain proof (same as when scanning a batch QR):
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/passport/${createdBatch.batchId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#2D5A27]/40 text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Passport (journey + chain)
                </Link>
                <Link
                  href={`/verify/${createdBatch.batchId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#2D5A27]/40 text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify (proof + chain)
                </Link>
              </div>
              <button
                type="button"
                onClick={resetFlow}
                className="mt-4 text-sm text-gray-600 hover:text-[#2D5A27] underline"
              >
                Start a new field and entry
              </button>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
