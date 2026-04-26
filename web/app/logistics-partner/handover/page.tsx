'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { missionsAPI } from '@/lib/api';
import { WEB_API_BASE } from '@/lib/api-base';

const navItems = [
  { href: '/logistics-partner/dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/logistics-partner/missions', label: 'Missions', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { href: '/logistics-partner/handover', label: 'Loading Handover', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
];

/** Statuses where handover (temp + photos) is not done yet. After handover, mission is READY_FOR_LOADING and leaves this list. */
const PENDING_HANDOVER_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS_PER_GROUP = 20;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

interface Mission {
  id: string;
  missionNumber: string;
  status: string;
  batchId?: string | null;
  batches?: { batchId?: string } | null;
}

export default function LogisticsHandoverPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<string>('');
  const [truckTemperature, setTruckTemperature] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [temperatureStatus, setTemperatureStatus] = useState<'valid' | 'invalid' | null>(null);
  const [palletPhotos, setPalletPhotos] = useState<string[]>([]);
  const [truckInteriorPhotos, setTruckInteriorPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login/producer');
      return;
    }
    const roles = user?.roles && Array.isArray(user.roles) ? user.roles : [];
    if (!roles.includes('LOGISTICS_PARTNER')) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  const refreshMissions = () => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    missionsAPI
      .getMyMissions()
      .then((data: Mission[]) => {
        const needHandover = (Array.isArray(data) ? data : []).filter((m) =>
          PENDING_HANDOVER_STATUSES.includes(m.status)
        );
        setMissions(needHandover);
      })
      .catch(() => setMissions([]));
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    let cancelled = false;
    setMissionsLoading(true);
    missionsAPI
      .getMyMissions()
      .then((data: Mission[]) => {
        if (!cancelled) {
          const needHandover = (Array.isArray(data) ? data : []).filter((m) =>
            PENDING_HANDOVER_STATUSES.includes(m.status)
          );
          setMissions(needHandover);
        }
      })
      .catch(() => {
        if (!cancelled) setMissions([]);
      })
      .finally(() => {
        if (!cancelled) setMissionsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.roles]);

  const STANDARD_TEMP_MIN = 2; // °C
  const STANDARD_TEMP_MAX = 8; // °C

  useEffect(() => {
    if (truckTemperature) {
      const temp = parseFloat(truckTemperature);
      if (temp >= STANDARD_TEMP_MIN && temp <= STANDARD_TEMP_MAX) {
        setTemperatureStatus('valid');
      } else {
        setTemperatureStatus('invalid');
      }
    } else {
      setTemperatureStatus(null);
    }
  }, [truckTemperature]);

  const addPhotoFiles = async (files: FileList | null, kind: 'pallet' | 'truck') => {
    setPhotoError(null);
    if (!files?.length) return;
    const current = kind === 'pallet' ? palletPhotos : truckInteriorPhotos;
    const setFn = kind === 'pallet' ? setPalletPhotos : setTruckInteriorPhotos;
    const next: string[] = [...current];
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      if (!f.type.startsWith('image/')) {
        setPhotoError('Only image files are allowed (JPEG, PNG, WebP).');
        return;
      }
      if (f.size > MAX_PHOTO_BYTES) {
        setPhotoError('Max 5MB per photo.');
        return;
      }
      if (next.length >= MAX_PHOTOS_PER_GROUP) {
        setPhotoError(`Max ${MAX_PHOTOS_PER_GROUP} photos per group.`);
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(f);
        next.push(dataUrl);
      } catch {
        setPhotoError('Could not read file.');
        return;
      }
    }
    setFn(next);
  };

  const removePhoto = (kind: 'pallet' | 'truck', index: number) => {
    const setFn = kind === 'pallet' ? setPalletPhotos : setTruckInteriorPhotos;
    setFn((prev) => prev.filter((_, j) => j !== index));
  };

  const handoverComplete =
    temperatureStatus === 'valid' && palletPhotos.length >= 1 && truckInteriorPhotos.length >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!selectedMission) {
      setError('Please select a mission');
      setSubmitting(false);
      return;
    }

    const temp = parseFloat(truckTemperature);
    if (temp < STANDARD_TEMP_MIN || temp > STANDARD_TEMP_MAX) {
      setError(
        `Truck temperature (${temp}°C) is outside standard range (${STANDARD_TEMP_MIN}°C - ${STANDARD_TEMP_MAX}°C). Loading is blocked. Please adjust temperature before proceeding.`
      );
      setSubmitting(false);
      return;
    }

    if (palletPhotos.length < 1) {
      setError('Add at least one pallet photo.');
      setSubmitting(false);
      return;
    }
    if (truckInteriorPhotos.length < 1) {
      setError('Add at least one inside-truck photo.');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/quality-entry/handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          missionId: selectedMission,
          insideTruckTemperature: temp,
          palletPhotos,
          truckInteriorPhotos,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete handover');
      }

      setSuccess(true);
      setPalletPhotos([]);
      setTruckInteriorPhotos([]);
      setTimeout(() => {
        setSelectedMission('');
        setTruckTemperature('');
        setNotes('');
        setSuccess(false);
        refreshMissions();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete handover');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarLayout title="Loading Handover" navItems={navItems}>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg"
        >
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Documentation before &quot;ready for shipment&quot;</p>
              <p className="text-sm text-blue-700 mt-1">
                Inside truck temperature ({STANDARD_TEMP_MIN}–{STANDARD_TEMP_MAX}°C), at least one photo of loaded pallets, and
                at least one photo of the truck interior are required. All of this is stored in the system; only then can the
                mission move to <strong>READY FOR LOADING</strong>.
              </p>
            </div>
          </div>
        </motion.div>

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
            className="p-4 bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg"
          >
            <p className="text-sm text-[#23471f]">
              ✓ Evidence saved. Loading can proceed.
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Logistics Handover</h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter the temperature and add photos of pallets and the truck interior. The handover is only complete when
            all three (temperature in range, pallet photos, inside-truck photos) are provided.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mission Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Mission *
              </label>
              <select
                value={selectedMission}
                onChange={(e) => setSelectedMission(e.target.value)}
                required
                disabled={missionsLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              >
                <option value="">{missionsLoading ? 'Loading...' : missions.length === 0 ? 'No missions awaiting handover' : '-- Select Mission --'}</option>
                {missions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.missionNumber} - Batch {mission.batches?.batchId || mission.batchId || '—'}
                  </option>
                ))}
              </select>
            </div>

            {/* Inside Truck Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inside Truck Temperature (°C) *
              </label>
              <input
                type="number"
                value={truckTemperature}
                onChange={(e) => setTruckTemperature(e.target.value)}
                required
                min="-10"
                max="15"
                step="0.1"
                className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:border-transparent ${
                  temperatureStatus === 'valid'
                    ? 'border-[#2D5A27] bg-[#2D5A27]/10 focus:ring-[#2D5A27]'
                    : temperatureStatus === 'invalid'
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-[#2D5A27]'
                }`}
                placeholder="e.g., 4.5"
              />
              {truckTemperature && (
                <div className="mt-2">
                  {temperatureStatus === 'valid' ? (
                    <p className="text-sm text-[#2D5A27] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Temperature is within standard range ({STANDARD_TEMP_MIN}°C - {STANDARD_TEMP_MAX}°C)
                    </p>
                  ) : temperatureStatus === 'invalid' ? (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Temperature is outside standard range. Loading is blocked. Please adjust temperature.
                    </p>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Standard range: {STANDARD_TEMP_MIN}°C - {STANDARD_TEMP_MAX}°C
              </p>
            </div>

            {/* Pallet photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pallet photos *
              </label>
              <p className="text-xs text-gray-500 mb-2">At least one; up to {MAX_PHOTOS_PER_GROUP} (max 5MB per file)</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-[#2D5A27]/10 file:text-[#2D5A27]"
                onChange={(e) => void addPhotoFiles(e.target.files, 'pallet')}
              />
              {palletPhotos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {palletPhotos.map((src, index) => (
                    <div key={`p-${index}`} className="relative w-20 h-20 rounded border border-gray-200 overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto('pallet', index)}
                        className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1 rounded-bl"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inside truck photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inside the truck *
              </label>
              <p className="text-xs text-gray-500 mb-2">At least one; up to {MAX_PHOTOS_PER_GROUP} (max 5MB per file)</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-[#2D5A27]/10 file:text-[#2D5A27]"
                onChange={(e) => void addPhotoFiles(e.target.files, 'truck')}
              />
              {truckInteriorPhotos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {truckInteriorPhotos.map((src, index) => (
                    <div key={`t-${index}`} className="relative w-20 h-20 rounded border border-gray-200 overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto('truck', index)}
                        className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1 rounded-bl"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {photoError && <p className="text-sm text-amber-700">{photoError}</p>}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                placeholder="Any additional information..."
              />
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={submitting || !handoverComplete}
                className="w-full px-6 py-3 bg-[#2D5A27] text-white font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Saving…' : 'Finish loading handover'}
              </button>
              {temperatureStatus === 'invalid' && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Cannot proceed: Temperature must be within standard range
                </p>
              )}
              {temperatureStatus === 'valid' && (palletPhotos.length < 1 || truckInteriorPhotos.length < 1) && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Add pallet and inside-truck photos to finish.
                </p>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
