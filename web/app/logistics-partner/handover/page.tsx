'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { missionsAPI } from '@/lib/api';
import { WEB_API_BASE } from '@/lib/api-base';
import { useLogisticsPartnerNavItems } from '@/lib/logistics-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/image-compression';

/** Statuses where handover (temp + photos) is not done yet. After handover, mission is READY_FOR_LOADING and leaves this list. */
const PENDING_HANDOVER_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS_PER_GROUP = 20;

function readFileAsDataUrl(file: File, readFailedMessage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error(readFailedMessage));
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
  const { t } = useTranslation();
  const navItems = useLogisticsPartnerNavItems();
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
      .getMyMissions('logistics')
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
      .getMyMissions('logistics')
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
        setPhotoError(t('logisticsPages.handoverPhotoOnlyImages'));
        return;
      }
      if (f.size > MAX_PHOTO_BYTES) {
        setPhotoError(t('logisticsPages.handoverPhotoMaxFile'));
        return;
      }
      if (next.length >= MAX_PHOTOS_PER_GROUP) {
        setPhotoError(t('logisticsPages.handoverPhotoMaxGroup', { max: MAX_PHOTOS_PER_GROUP }));
        return;
      }
      try {
        const compressed = await compressImage(f, {
          maxWidth: 1920,
          maxHeight: 1920,
          maxSizeMB: 1.75,
          quality: 0.82,
          useWebWorker: true,
        });
        const dataUrl = await readFileAsDataUrl(compressed, t('logisticsPages.handoverPhotoReadFailed'));
        next.push(dataUrl);
      } catch {
        setPhotoError(t('logisticsPages.handoverPhotoReadFailed'));
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
      setError(t('logisticsPages.handoverErrSelectMission'));
      setSubmitting(false);
      return;
    }

    const temp = parseFloat(truckTemperature);
    if (temp < STANDARD_TEMP_MIN || temp > STANDARD_TEMP_MAX) {
      setError(
        t('logisticsPages.handoverErrTempRange', {
          temp,
          min: STANDARD_TEMP_MIN,
          max: STANDARD_TEMP_MAX,
        }),
      );
      setSubmitting(false);
      return;
    }

    if (palletPhotos.length < 1) {
      setError(t('logisticsPages.handoverErrPalletPhoto'));
      setSubmitting(false);
      return;
    }
    if (truckInteriorPhotos.length < 1) {
      setError(t('logisticsPages.handoverErrTruckPhoto'));
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
        let msg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          const m = errorData?.message;
          msg = Array.isArray(m) ? m.join(' ') : (m || errorData?.error || msg);
        } catch {
          const bodyText = await response.text();
          if (bodyText?.trim()) msg = bodyText.slice(0, 500);
        }
        throw new Error(msg);
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
      setError(err.message || t('logisticsPages.handoverErrComplete'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <SidebarLayout title={t('logisticsPages.loadingHandover')} navItems={navItems}>
        <GrowerPageShell>
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2D5A27]" aria-hidden />
          </div>
        </GrowerPageShell>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={t('logisticsPages.loadingHandover')} navItems={navItems}>
      <GrowerPageShell className="space-y-6">
        <GrowerPageHeader
          title={t('logisticsPages.handoverHeaderTitle')}
          description={t('logisticsPages.handoverHeaderDescription')}
        />

        <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
          <p className="font-semibold text-amber-950">{t('logisticsPages.handoverChainTitle')}</p>
          <p className="mt-1 leading-relaxed">
            {t('logisticsPages.handoverChainBody', {
              min: STANDARD_TEMP_MIN,
              max: STANDARD_TEMP_MAX,
            })}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{t('common.error')}</p>
            <p className="mt-1 text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/10 p-4">
            <p className="text-sm text-[#23471f]">{t('logisticsPages.handoverEvidenceSaved')}</p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">{t('logisticsPages.handoverFormTitle')}</h2>
          <p className="mb-6 text-sm text-gray-600">{t('logisticsPages.handoverFormLead')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mission Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('logisticsPages.handoverSelectMission')}
              </label>
              <select
                value={selectedMission}
                onChange={(e) => setSelectedMission(e.target.value)}
                required
                disabled={missionsLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              >
                <option value="">
                  {missionsLoading
                    ? t('logisticsPages.handoverMissionsLoading')
                    : missions.length === 0
                      ? t('logisticsPages.handoverMissionsEmpty')
                      : t('logisticsPages.handoverMissionPickPlaceholder')}
                </option>
                {missions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {t('logisticsPages.handoverMissionOption', {
                      missionNumber: mission.missionNumber,
                      batchId: mission.batches?.batchId || mission.batchId || t('common.emDash'),
                    })}
                  </option>
                ))}
              </select>
            </div>

            {/* Inside Truck Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('logisticsPages.handoverTruckTempLabel')}
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
                placeholder={t('logisticsPages.handoverTempPlaceholder')}
              />
              {truckTemperature && (
                <div className="mt-2">
                  {temperatureStatus === 'valid' ? (
                    <p className="text-sm text-[#2D5A27] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('logisticsPages.handoverTempValid', {
                        min: STANDARD_TEMP_MIN,
                        max: STANDARD_TEMP_MAX,
                      })}
                    </p>
                  ) : temperatureStatus === 'invalid' ? (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t('logisticsPages.handoverTempInvalid')}
                    </p>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {t('logisticsPages.handoverTempRangeHint', {
                  min: STANDARD_TEMP_MIN,
                  max: STANDARD_TEMP_MAX,
                })}
              </p>
            </div>

            {/* Pallet photos */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                {t('logisticsPages.handoverPalletPhotosTitle')}
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                {t('logisticsPages.handoverPalletPhotosHint', { max: MAX_PHOTOS_PER_GROUP })}
              </p>
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full cursor-pointer text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#2D5A27] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#23471f]"
                  onChange={(e) => void addPhotoFiles(e.target.files, 'pallet')}
                />
              </div>
              {palletPhotos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {palletPhotos.map((src, index) => (
                    <div key={`p-${index}`} className="relative w-20 h-20 rounded border border-gray-200 overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto('pallet', index)}
                        className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1 rounded-bl"
                        aria-label={t('logisticsPages.handoverRemovePhotoAria')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inside truck photos */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                {t('logisticsPages.handoverTruckPhotosTitle')}
              </h3>
              <p className="mb-3 text-xs text-gray-500">
                {t('logisticsPages.handoverTruckPhotosHint', { max: MAX_PHOTOS_PER_GROUP })}
              </p>
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full cursor-pointer text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#2D5A27] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#23471f]"
                  onChange={(e) => void addPhotoFiles(e.target.files, 'truck')}
                />
              </div>
              {truckInteriorPhotos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {truckInteriorPhotos.map((src, index) => (
                    <div key={`t-${index}`} className="relative w-20 h-20 rounded border border-gray-200 overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto('truck', index)}
                        className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1 rounded-bl"
                        aria-label={t('logisticsPages.handoverRemovePhotoAria')}
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
                {t('logisticsPages.handoverNotesLabel')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                placeholder={t('logisticsPages.handoverNotesPlaceholder')}
              />
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={submitting || !handoverComplete}
                className="w-full px-6 py-3 bg-[#2D5A27] text-white font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? t('logisticsPages.handoverSubmitSaving') : t('logisticsPages.handoverSubmit')}
              </button>
              {temperatureStatus === 'invalid' && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  {t('logisticsPages.handoverBlockedByTemp')}
                </p>
              )}
              {temperatureStatus === 'valid' && (palletPhotos.length < 1 || truckInteriorPhotos.length < 1) && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {t('logisticsPages.handoverNeedPhotos')}
                </p>
              )}
            </div>
          </form>
        </div>
      </GrowerPageShell>
    </SidebarLayout>
  );
}
