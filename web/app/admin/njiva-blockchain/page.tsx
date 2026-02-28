'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI, parcelsAPI, batchesAPI } from '@/lib/api';
import { getAdminNavItems } from '@/lib/admin-nav';
import { MapPin, Package, FileText, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_POLYGON = [
  { lat: 44.7866, lng: 20.4489 },
  { lat: 44.7876, lng: 20.4499 },
  { lat: 44.7886, lng: 20.4509 },
  { lat: 44.7866, lng: 20.4489 },
];

type Step = 'njiva' | 'unos' | 'result';

export default function NjivaBlockchainPage() {
  const adminNavItems = getAdminNavItems();
  const [step, setStep] = useState<Step>('njiva');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [njiva, setNjiva] = useState({ name: '' });
  const [createdEstate, setCreatedEstate] = useState<{ id: string; name: string } | null>(null);
  const [parcel, setParcel] = useState({ cropType: 'Malina' });
  const [createdParcel, setCreatedParcel] = useState<{ id: string; cropType?: string } | null>(null);
  const [unos, setUnos] = useState({
    productName: 'Organska malina',
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

  const handleCreateNjiva = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!njiva.name.trim()) {
      setError('Unesite naziv njive.');
      return;
    }
    try {
      setSubmitting(true);
      const estate = await estatesAPI.create({
        name: njiva.name.trim(),
        polygonCoordinates: DEFAULT_POLYGON,
      });
      setCreatedEstate({ id: estate.id, name: estate.name || njiva.name.trim() });
      setStep('unos');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Greška pri kreiranju njive.');
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
      setError(err.response?.data?.message || err.message || 'Greška pri kreiranju parcele.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!createdEstate) return;
    if (!unos.productName.trim()) {
      setError('Unesite naziv proizvoda.');
      return;
    }
    try {
      setSubmitting(true);
      const batch = await batchesAPI.create({
        estateId: createdEstate.id,
        productName: unos.productName.trim(),
        quantity: unos.quantity,
        unit: unos.unit,
        harvestDate: unos.harvestDate,
      });
      setCreatedBatch({
        batchId: batch.batchId,
        id: batch.id,
        blockchainTxHash: batch.blockchainTxHash,
        blockchainRegisteredAt: batch.blockchainRegisteredAt,
      });
      setStep('result');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Greška pri kreiranju batch-a (unos).');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep('njiva');
    setCreatedEstate(null);
    setCreatedParcel(null);
    setCreatedBatch(null);
    setError(null);
    setNjiva({ name: '' });
    setParcel({ cropType: 'Malina' });
    setUnos({
      productName: 'Organska malina',
      quantity: 50,
      unit: 'kg',
      harvestDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'GROWER']}>
      <SidebarLayout title="Njiva → Unos → Blockchain" navItems={adminNavItems}>
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Njiva, unos i rezultat na blockchainu</h1>
            <p className="text-sm text-gray-600 mt-1">
              Korak 1: kreiraj njivu (estate). Korak 2: opciono dodaj parcelu. Korak 3: unesi batch (berba). Batch se automatski registruje na blockchainu; na kraju vidi rezultat na passport / verify stranici.
            </p>
          </div>

          {/* Step 1: Kreiranje njive */}
          {step === 'njiva' && (
            <form onSubmit={handleCreateNjiva} className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#2D5A27] mb-4">
                <MapPin className="w-5 h-5" />
                <h2 className="text-lg font-medium">1. Kreiraj njivu</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naziv njive *</label>
                <input
                  type="text"
                  value={njiva.name}
                  onChange={(e) => setNjiva({ name: e.target.value })}
                  placeholder="npr. Moja njiva 1"
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
                {submitting ? 'Kreiranje…' : 'Kreiraj njivu'}
              </button>
            </form>
          )}

          {/* Step 2: Parcela (opciono) + Unos batch-a */}
          {step === 'unos' && createdEstate && (
            <>
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-2 text-[#2D5A27] mb-2">
                  <MapPin className="w-5 h-5" />
                  <h2 className="text-lg font-medium">Njiva kreirana</h2>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>{createdEstate.name}</strong> (ID: {createdEstate.id.slice(0, 8)}…)
                </p>
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">Parcula (opciono)</label>
                  <input
                    type="text"
                    value={parcel.cropType}
                    onChange={(e) => setParcel({ cropType: e.target.value })}
                    placeholder="npr. Malina"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                  />
                  <button
                    type="button"
                    onClick={handleAddParcel}
                    disabled={submitting}
                    className="px-3 py-2 border border-[#2D5A27] text-[#2D5A27] text-sm rounded-lg hover:bg-[#2D5A27]/5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dodaj parcelu'}
                  </button>
                </div>
                {createdParcel && (
                  <p className="text-sm text-green-700">Parcula kreirana ({createdParcel.cropType || '—'}).</p>
                )}
              </div>

              <form onSubmit={handleCreateBatch} className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-2 text-[#2D5A27] mb-4">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-medium">2. Unos – batch (berba)</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proizvod *</label>
                  <input
                    type="text"
                    value={unos.productName}
                    onChange={(e) => setUnos((u) => ({ ...u, productName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Količina *</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={unos.quantity}
                      onChange={(e) => setUnos((u) => ({ ...u, quantity: Number(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jedinica *</label>
                    <input
                      type="text"
                      value={unos.unit}
                      onChange={(e) => setUnos((u) => ({ ...u, unit: e.target.value }))}
                      placeholder="kg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datum berbe *</label>
                  <input
                    type="date"
                    value={unos.harvestDate}
                    onChange={(e) => setUnos((u) => ({ ...u, harvestDate: e.target.value }))}
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
                  {submitting ? 'Kreiranje batch-a i registracija na blockchainu…' : 'Kreiraj batch (unos) i vidi na blockchainu'}
                </button>
              </form>
            </>
          )}

          {/* Step 3: Rezultat na blockchainu */}
          {step === 'result' && createdBatch && (
            <div className="bg-green-50 border border-[#2D5A27]/30 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#2D5A27]">
                <CheckCircle className="w-6 h-6" />
                <h2 className="text-xl font-medium">Rezultat na blockchainu</h2>
              </div>
              <p className="text-sm text-gray-700">
                <strong>Batch ID:</strong> {createdBatch.batchId}
              </p>
              {createdBatch.blockchainTxHash ? (
                <p className="text-sm text-gray-700">
                  <strong>Blockchain:</strong> Batch je registrovan na lanacu (tx sačuvan). Možeš videti verifikaciju i putanju proizvoda na stranicama ispod.
                </p>
              ) : (
                <p className="text-sm text-amber-700">
                  Blockchain nije konfigurisan ili registracija nije uspela. Batch je ipak kreiran; možeš otvoriti passport/verify.
                </p>
              )}
              <p className="text-sm text-gray-600">
                Otvori passport ili verify stranicu da vidiš podatke i blockchain verifikaciju (isto kao pri skeniranju QR batch-a):
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/passport/${createdBatch.batchId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#2D5A27]/40 text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Passport (putanja + blockchain)
                </Link>
                <Link
                  href={`/verify/${createdBatch.batchId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#2D5A27]/40 text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify (verifikacija + blockchain)
                </Link>
              </div>
              <button
                type="button"
                onClick={resetFlow}
                className="mt-4 text-sm text-gray-600 hover:text-[#2D5A27] underline"
              >
                Kreiraj novu njivu i novi unos
              </button>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
