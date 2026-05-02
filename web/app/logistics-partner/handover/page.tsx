'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { missionsAPI, logisticsDriversAPI } from '@/lib/api';
import { WEB_API_BASE } from '@/lib/api-base';
import { useLogisticsPartnerNavItems } from '@/lib/logistics-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/image-compression';

/** Statuses where handover (temp + photos) is not done yet. After handover, mission is READY_FOR_LOADING and leaves this list. */
const PENDING_HANDOVER_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS_PER_GROUP = 20;
const SIG_W = 480;
const SIG_H = 160;

/** Parse temperature from inputs like "5,2" or "5.2" (common in sr-RS locales). */
function parseLocaleTemperature(raw: string): number {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.');
  return parseFloat(normalized);
}

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
  assigned_logistics_driver?: { id: string } | null;
}

type LogisticsDriverRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
};

function getSigPos(
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  if ('touches' in e && e.touches[0]) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  }
  const me = e as React.MouseEvent<HTMLCanvasElement>;
  return {
    x: (me.clientX - rect.left) * scaleX,
    y: (me.clientY - rect.top) * scaleY,
  };
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
  const [drivers, setDrivers] = useState<LogisticsDriverRow[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedPickupDriverId, setSelectedPickupDriverId] = useState('');
  const [badgePhotoDataUrl, setBadgePhotoDataUrl] = useState<string | null>(null);
  const [signatureDirty, setSignatureDirty] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigDrawing = useRef(false);
  const sigHasInk = useRef(false);

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

  useEffect(() => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    let cancelled = false;
    setDriversLoading(true);
    logisticsDriversAPI
      .list()
      .then((data: LogisticsDriverRow[]) => {
        if (!cancelled) setDrivers(Array.isArray(data) ? data.filter((d) => d.isActive) : []);
      })
      .catch(() => {
        if (!cancelled) setDrivers([]);
      })
      .finally(() => {
        if (!cancelled) setDriversLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.roles]);

  const initSigCanvas = () => {
    const c = sigCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SIG_W, SIG_H);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    initSigCanvas();
  }, [success, selectedMission]);

  useEffect(() => {
    if (!selectedMission) {
      setSelectedPickupDriverId('');
      return;
    }
    const m = missions.find((x) => x.id === selectedMission);
    setSelectedPickupDriverId(m?.assigned_logistics_driver?.id ?? '');
  }, [selectedMission, missions]);

  useEffect(() => {
    setBadgePhotoDataUrl(null);
    setSignatureDirty(false);
    sigHasInk.current = false;
  }, [selectedMission]);

  const STANDARD_TEMP_MIN = 2; // °C
  const STANDARD_TEMP_MAX = 8; // °C

  useEffect(() => {
    if (truckTemperature) {
      const temp = parseLocaleTemperature(truckTemperature);
      if (!Number.isFinite(temp)) {
        setTemperatureStatus('invalid');
      } else if (temp >= STANDARD_TEMP_MIN && temp <= STANDARD_TEMP_MAX) {
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
          maxWidth: 1600,
          maxHeight: 1600,
          maxSizeMB: 1.1,
          quality: 0.8,
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

  const onBadgeFile = async (files: FileList | null) => {
    setPhotoError(null);
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setPhotoError(t('logisticsPages.handoverPhotoOnlyImages'));
      return;
    }
    try {
      const compressed = await compressImage(f, {
        maxWidth: 1600,
        maxHeight: 1600,
        maxSizeMB: 1.1,
        quality: 0.8,
        useWebWorker: true,
      });
      const dataUrl = await readFileAsDataUrl(compressed, t('logisticsPages.handoverPhotoReadFailed'));
      setBadgePhotoDataUrl(dataUrl);
    } catch {
      setPhotoError(t('logisticsPages.handoverPhotoReadFailed'));
    }
  };

  const startSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const c = sigCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    sigDrawing.current = true;
    sigHasInk.current = true;
    setSignatureDirty(true);
    const p = getSigPos(e, c);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const moveSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!sigDrawing.current) return;
    const c = sigCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const p = getSigPos(e, c);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const endSig = () => {
    sigDrawing.current = false;
  };

  const clearSignature = () => {
    sigHasInk.current = false;
    setSignatureDirty(false);
    initSigCanvas();
  };

  const handoverComplete =
    temperatureStatus === 'valid' &&
    palletPhotos.length >= 1 &&
    truckInteriorPhotos.length >= 1 &&
    Boolean(selectedPickupDriverId) &&
    Boolean(badgePhotoDataUrl) &&
    signatureDirty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!selectedMission) {
      setError(t('logisticsPages.handoverErrSelectMission'));
      setSubmitting(false);
      return;
    }

    const temp = parseLocaleTemperature(truckTemperature);
    if (!Number.isFinite(temp) || temp < STANDARD_TEMP_MIN || temp > STANDARD_TEMP_MAX) {
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

    if (!selectedPickupDriverId?.trim()) {
      setError(t('logisticsPages.handoverErrPickupDriver'));
      setSubmitting(false);
      return;
    }
    if (!badgePhotoDataUrl?.trim()) {
      setError(t('logisticsPages.handoverErrBadge'));
      setSubmitting(false);
      return;
    }
    const sigCanvas = sigCanvasRef.current;
    if (!sigCanvas || !signatureDirty) {
      setError(t('logisticsPages.handoverErrDriverSignature'));
      setSubmitting(false);
      return;
    }
    let pickupDriverSignatureDataUrl: string;
    try {
      pickupDriverSignatureDataUrl = sigCanvas.toDataURL('image/jpeg', 0.82);
    } catch {
      setError(t('logisticsPages.handoverErrDriverSignature'));
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
          pickupDriverId: selectedPickupDriverId.trim(),
          pickupBadgePhoto: badgePhotoDataUrl,
          pickupDriverSignatureDataUrl,
          pickupDriverSignature: pickupDriverSignatureDataUrl,
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
      setBadgePhotoDataUrl(null);
      setSignatureDirty(false);
      sigHasInk.current = false;
      setTimeout(() => {
        setSelectedMission('');
        setTruckTemperature('');
        setNotes('');
        setSelectedPickupDriverId('');
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

            {/* Pickup driver, badge, signature — before photos so it is not missed */}
            <div className="rounded-lg border border-gray-200 border-l-4 border-l-[#2D5A27] bg-[#f7faf6] p-4 space-y-6">
              <h3 className="text-base font-semibold text-gray-900">
                {t('logisticsPages.handoverPickupSectionTitle')}
              </h3>
              <p className="text-xs text-gray-600">{t('logisticsPages.handoverPickupSectionLead')}</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('logisticsPages.handoverPickupDriverLabel')}
                </label>
                <p className="text-xs text-gray-500 mb-2">{t('logisticsPages.handoverPickupDriverHint')}</p>
                <select
                  value={selectedPickupDriverId}
                  onChange={(e) => setSelectedPickupDriverId(e.target.value)}
                  required
                  disabled={driversLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent bg-white"
                >
                  <option value="">
                    {driversLoading
                      ? t('logisticsPages.driversLoading')
                      : drivers.length === 0
                        ? t('logisticsPages.handoverPickupDriverNoDrivers')
                        : t('logisticsPages.handoverPickupDriverPlaceholder')}
                  </option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {[d.firstName, d.lastName].filter(Boolean).join(' ')}
                      {d.phone ? ` · ${d.phone}` : ''}
                    </option>
                  ))}
                </select>
                {drivers.length === 0 && !driversLoading && (
                  <p className="mt-2 text-sm text-amber-900">
                    <a href="/logistics-partner/drivers" className="font-medium text-[#2D5A27] underline">
                      {t('logisticsPages.handoverPickupDriverAddLink')}
                    </a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('logisticsPages.handoverBadgeTitle')}
                </label>
                <p className="text-xs text-gray-500 mb-2">{t('logisticsPages.handoverBadgeHint')}</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="block w-full cursor-pointer text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#2D5A27] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#23471f]"
                  onChange={(e) => void onBadgeFile(e.target.files)}
                />
                {badgePhotoDataUrl && (
                  <div className="mt-3">
                    <img
                      src={badgePhotoDataUrl}
                      alt=""
                      className="max-h-40 rounded-lg border border-gray-200 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setBadgePhotoDataUrl(null)}
                      className="mt-2 text-sm text-red-700 underline"
                    >
                      {t('logisticsPages.handoverBadgeRemove')}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('logisticsPages.handoverDriverSigTitle')}
                </label>
                <p className="text-xs text-gray-500 mb-2">{t('logisticsPages.handoverDriverSigHint')}</p>
                <div className="rounded-lg border border-gray-300 bg-white overflow-hidden touch-none max-w-lg">
                  <canvas
                    ref={sigCanvasRef}
                    width={SIG_W}
                    height={SIG_H}
                    className="w-full h-[120px] cursor-crosshair"
                    onMouseDown={startSig}
                    onMouseMove={moveSig}
                    onMouseUp={endSig}
                    onMouseLeave={endSig}
                    onTouchStart={startSig}
                    onTouchMove={moveSig}
                    onTouchEnd={endSig}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="mt-2 text-sm text-gray-700 underline"
                >
                  {t('logisticsPages.handoverDriverSigClear')}
                </button>
              </div>
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
              {temperatureStatus === 'valid' &&
                (palletPhotos.length < 1 ||
                  truckInteriorPhotos.length < 1 ||
                  !selectedPickupDriverId ||
                  !badgePhotoDataUrl ||
                  !signatureDirty) && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {palletPhotos.length < 1 || truckInteriorPhotos.length < 1
                    ? t('logisticsPages.handoverNeedPhotos')
                    : t('logisticsPages.handoverNeedPickupProof')}
                </p>
              )}
            </div>
          </form>
        </div>
      </GrowerPageShell>
    </SidebarLayout>
  );
}
