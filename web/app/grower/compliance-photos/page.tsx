'use client';

import { useState, useEffect, useRef } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { growerNavItems } from '@/lib/grower-nav';
import { batchesAPI } from '@/lib/api';
import { WEB_API_BASE } from '@/lib/api-base';
import Link from 'next/link';

const navItems = growerNavItems;

const REQUIRED_PHOTOS = [
  { type: 'PUNNETS', label: 'Punnets with Bio Vera Logo', description: 'Show our logo on the crates' },
  { type: 'LABELING', label: 'Labeling Close-up', description: 'Close-up of our official sticker with QR code' },
  { type: 'PALLETIZATION', label: 'Palletization', description: 'Showing our specific protective film is used' },
];

function messageFromApiPayload(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const m = (data as { message?: unknown }).message;
  if (Array.isArray(m)) return m.filter(Boolean).join(' ');
  if (typeof m === 'string') return m;
  return 'Request failed';
}

export default function CompliancePhotosPage() {
  const { user } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [stickerRollId, setStickerRollId] = useState<string>('');
  const [photos, setPhotos] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setFileInputRef = (index: number) => (el: HTMLInputElement | null) => {
    fileInputRefs.current[index] = el;
  };

  const [batches, setBatches] = useState<{ id: string; batchId: string; productName: string; quantity: number; unit?: string }[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await batchesAPI.getAll();
        const list = Array.isArray(data) ? data : [];
        setBatches(
          list.map((b: any) => ({
            id: b.id,
            batchId: b.batchId,
            productName: b.productName,
            quantity: b.quantity,
            unit: b.unit,
          })),
        );
      } catch {
        setBatches([]);
      } finally {
        setBatchesLoading(false);
      }
    })();
  }, []);

  const handlePhotoUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Photo size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotos((prev) => ({ ...prev, [type]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleVerifySticker = async () => {
    if (!selectedBatch || !stickerRollId) {
      setError('Please select a batch and enter sticker roll ID');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${WEB_API_BASE}/material-control/verify-sticker`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            stickerRollId,
            batchId: selectedBatch,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(messageFromApiPayload(errorData) || 'Failed to verify sticker roll');
      }

      setSuccess('Sticker roll verified successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(null);

    // Verify all photos are uploaded
    const missingPhotos = REQUIRED_PHOTOS.filter((photo) => !photos[photo.type]);
    if (missingPhotos.length > 0) {
      setError(`Please upload all required photos: ${missingPhotos.map((p) => p.label).join(', ')}`);
      setUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${WEB_API_BASE}/material-control/compliance-photos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            batchId: selectedBatch,
            stickerRollId,
            photos: REQUIRED_PHOTOS.map((photo) => photos[photo.type]),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(messageFromApiPayload(errorData) || 'Failed to upload compliance photos');
      }

      setSuccess('Compliance photos uploaded successfully! Your batch is now ready for pickup.');
      // Reset form
      setPhotos({});
      setStickerRollId('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SidebarLayout title="Compliance Photos" navItems={navItems}>
      <div className="space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-sm text-green-800">{success}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo-Verification Checklist</h2>
            <p className="text-sm text-gray-600 mb-6">
              Upload 3 compliance photos before activating &apos;Ready for Pickup&apos; status.
            </p>

            <div className="mb-6 rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 p-4 text-sm text-gray-800">
              <p className="font-medium text-gray-900 mb-2">Where do I find Sticker Roll ID?</p>
              <p className="mb-2">
                The ID is the <strong>serial number of your official Bio Vera label roll</strong> — it is created in the system when you{' '}
                <strong>order label rolls</strong> from the platform (e.g.{' '}
                <Link href="/grower/materials" className="text-[#2D5A27] font-medium underline">
                  Materials
                </Link>
                ). It usually looks like <code className="rounded bg-white px-1 py-0.5 text-xs">LABEL-ROLL-…</code>, and may also appear on the roll packaging or supplier paperwork.
              </p>
              <p className="text-gray-700">
                You must enter the exact ID that was <strong>sold to your account</strong>. A random number will not verify — order a label roll first, then use the ID from that purchase.
              </p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch *
              </label>
              {batchesLoading ? (
                <p className="text-sm text-gray-500">Loading batches…</p>
              ) : batches.length === 0 ? (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
                  No batches yet.{' '}
                  <Link href="/grower/batches" className="text-[#2D5A27] font-medium underline">
                    Create a batch
                  </Link>{' '}
                  for an approved parcel first.
                </p>
              ) : (
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">-- Select Batch --</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchId} — {batch.productName} ({batch.quantity} {batch.unit || 'kg'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sticker Roll ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sticker Roll ID *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={stickerRollId}
                  onChange={(e) => setStickerRollId(e.target.value)}
                  placeholder="Enter or scan Label Roll ID"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleVerifySticker}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Verify
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Every roll of Bio Vera labels has a unique ID. Enter or scan it, then click Verify. The system checks that this roll was issued to you when you ordered materials.
              </p>
            </div>

            {/* Compliance Photos */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Required Compliance Photos</h3>
              <div className="space-y-4">
                {REQUIRED_PHOTOS.map((photo, index) => (
                  <div key={photo.type} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {photo.label} *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{photo.description}</p>
                    <div className="relative">
                      <input
                        ref={setFileInputRef(index)}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(photo.type, e)}
                        className="hidden"
                        id={`photo-${photo.type}`}
                      />
                      <label
                        htmlFor={`photo-${photo.type}`}
                        className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors text-center"
                      >
                        {photos[photo.type] ? (
                          <div className="space-y-2">
                            <img
                              src={photos[photo.type]}
                              alt={photo.label}
                              className="w-full h-48 object-cover rounded mt-2"
                            />
                            <p className="text-sm text-green-600">Photo uploaded</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-500">Click to upload</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={uploading || !selectedBatch || !stickerRollId || Object.keys(photos).length !== REQUIRED_PHOTOS.length}
                className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Compliance Photos'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
