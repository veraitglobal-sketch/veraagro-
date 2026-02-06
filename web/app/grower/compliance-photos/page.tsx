'use client';

import { useState, useEffect, useRef } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/grower', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/grower/portal', label: 'Mission Tracker', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
  { href: '/grower/batches', label: 'My Batches', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { href: '/grower/materials', label: 'Materials', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { href: '/grower/quality-entry', label: 'Quality Entry', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: '/grower/compliance-photos', label: 'Compliance Photos', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

const REQUIRED_PHOTOS = [
  { type: 'PUNNETS', label: 'Punnets with Bio Vera Logo', description: 'Show our logo on the crates' },
  { type: 'LABELING', label: 'Labeling Close-up', description: 'Close-up of our official sticker with QR code' },
  { type: 'PALLETIZATION', label: 'Palletization', description: 'Showing our specific protective film is used' },
];

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

  // Mock batches - in production, fetch from API
  const [batches] = useState([
    { id: 'BATCH-001', batchId: 'BATCH-2024-001', productName: 'Raspberry', quantity: 500 },
    { id: 'BATCH-002', batchId: 'BATCH-2024-002', productName: 'Blackberry', quantity: 300 },
  ]);

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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/material-control/verify-sticker`,
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify sticker roll');
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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/material-control/compliance-photos`,
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload compliance photos');
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
            Upload 3 compliance photos before activating 'Ready for Pickup' status.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch *
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">-- Select Batch --</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchId} - {batch.productName} ({batch.quantity} kg)
                  </option>
                ))}
              </select>
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
                Every roll of Bio Vera labels has a unique ID. Enter the ID to verify it was sold to you.
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
