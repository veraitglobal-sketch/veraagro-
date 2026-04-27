'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { batchesAPI, estatesAPI } from '@/lib/api';
import { useAdminNavItems } from '@/lib/admin-nav';
import { Package, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminTestBatchPage() {
  const adminNavItems = useAdminNavItems();
  const [estates, setEstates] = useState<{ id: string; name?: string }[]>([]);
  const [loadingEstates, setLoadingEstates] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBatch, setCreatedBatch] = useState<{ batchId: string; id: string; blockchainTxHash?: string } | null>(null);

  const [form, setForm] = useState({
    estateId: '',
    productName: 'Test Organic Raspberries',
    quantity: 100,
    unit: 'kg',
    harvestDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    (async () => {
      try {
        setLoadingEstates(true);
        const list = await estatesAPI.getAll();
        setEstates(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0 && !form.estateId) {
          const first = list[0];
          setForm((f) => ({ ...f, estateId: first.id || first.estateId || '' }));
        }
      } catch {
        setEstates([]);
      } finally {
        setLoadingEstates(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedBatch(null);
    if (!form.estateId.trim()) {
      setError('Please select or enter an Estate ID.');
      return;
    }
    try {
      setSubmitting(true);
      const batch = await batchesAPI.create({
        estateId: form.estateId.trim(),
        productName: form.productName,
        quantity: form.quantity,
        unit: form.unit,
        harvestDate: form.harvestDate,
      });
      setCreatedBatch({
        batchId: batch.batchId,
        id: batch.id,
        blockchainTxHash: batch.blockchainTxHash,
      });
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title="Test batch" navItems={adminNavItems}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Create test batch</h1>
            <p className="text-sm text-gray-600 mt-1">
              Creates a batch and registers it on the blockchain (if configured). Use the links below to open the passport or verify page—blockchain verification appears there when you scan the batch QR.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6 max-w-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estate *</label>
              {loadingEstates ? (
                <p className="text-sm text-gray-500">Loading estates…</p>
              ) : estates.length > 0 ? (
                <select
                  value={form.estateId}
                  onChange={(e) => setForm((f) => ({ ...f, estateId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                  required
                >
                  <option value="">Select estate</option>
                  {estates.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name || e.id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.estateId}
                  onChange={(e) => setForm((f) => ({ ...f, estateId: e.target.value }))}
                  placeholder="Enter estate ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product name *</label>
              <input
                type="text"
                value={form.productName}
                onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
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
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="kg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harvest date *</label>
              <input
                type="date"
                value={form.harvestDate}
                onChange={(e) => setForm((f) => ({ ...f, harvestDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating…
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Create test batch
                </>
              )}
            </button>
          </form>

          {createdBatch && (
            <div className="bg-green-50 border border-[#2D5A27]/30 rounded-lg p-6 max-w-lg">
              <div className="flex items-center gap-2 text-[#2D5A27] mb-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Batch created</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Batch ID:</strong> {createdBatch.batchId}
              </p>
              {createdBatch.blockchainTxHash && (
                <p className="text-sm text-gray-700 mb-4">
                  <strong>Blockchain:</strong> Registered on chain (tx saved).
                </p>
              )}
              <p className="text-sm text-gray-600 mb-3">
                Open the passport or verify page to see blockchain verification (same view as when scanning the batch QR):
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/passport/${createdBatch.batchId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#2D5A27]/40 text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Passport
                </Link>
                <Link
                  href={`/verify/${createdBatch.batchId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#2D5A27]/40 text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify
                </Link>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
