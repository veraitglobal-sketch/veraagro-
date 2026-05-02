'use client';

import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import type { TFunction } from 'i18next';
import SidebarLayout from '@/components/SidebarLayout';
import { missionsAPI, batchesAPI } from '@/lib/api';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { WEB_API_BASE } from '@/lib/api-base';
import { growerApiErrorOrT } from '@/lib/grower-api-error';
import { motion } from 'framer-motion';
import { MapPin, Package, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

/** Shown when POST /missions fails — localized wrapper + technical detail when present */
function formatMissionCreateError(error: unknown, t: TFunction): string {
  const e = error as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: unknown };
  };
  if (!e?.response) {
    const code = e?.code;
    const msg = e?.message || t('grower.missionCreate.errRequestFailed');
    if (code === 'ERR_NETWORK' || msg === 'Network Error') {
      return [
        t('grower.missionCreate.errBrowserCouldNotReachApi'),
        t('grower.missionCreate.errTriedBaseUrl', { base: WEB_API_BASE }),
        t('grower.missionCreate.errDetail', { detail: msg }),
      ].join('\n\n');
    }
    return t('grower.missionCreate.errNoResponseFromServer', {
      codePart: code ? t('grower.missionCreate.errCodePart', { code: String(code) }) : '',
      msg,
    });
  }
  const status = e.response.status;
  const data = e.response.data as Record<string, unknown> | string | undefined;
  const prefix = `HTTP ${status}`;

  let body = '';
  if (typeof data === 'string' && data.trim().length) {
    body = data.length > 500 ? `${data.slice(0, 500)}…` : data;
  } else if (data && typeof data === 'object') {
    const raw = data.message;
    const base = Array.isArray(raw) ? raw.join(' ') : (raw as string | undefined);
    const dbg =
      data.debug && typeof data.debug === 'object' && data.debug !== null && 'message' in data.debug
        ? String((data.debug as { message?: string }).message)
        : '';
    const joined = [base, dbg].filter((s) => s && String(s).trim().length).join('\n\n');
    if (joined) {
      body = joined;
    } else {
      try {
        body = JSON.stringify(data, null, 2);
      } catch {
        body = t('grower.missionCreate.errCouldNotReadBody');
      }
    }
  }
  if (!body) {
    body = t('grower.missionCreate.errEmptyBody');
  }
  return `${prefix}\n\n${body}`;
}

interface Batch {
  id: string;
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  status: string;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 5 * 60_000,
  timeout: 18_000,
};

const btnPrimary =
  'inline-flex items-center gap-2 px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#23471f] transition-colors disabled:bg-gray-400';
const btnPrimaryLg =
  'px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-[#2D5A27] text-white hover:bg-[#23471f]';
const inputFocus = 'focus:ring-2 focus:ring-[#2D5A27]/50 focus:border-[#2D5A27]';

export default function CreateMissionPage() {
  const { t } = useTranslation();
  const navItems = useGrowerNavItems();
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [batchLoadError, setBatchLoadError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [formData, setFormData] = useState({
    batchId: '',
    pickupAddress: '',
    pickupLat: '',
    pickupLng: '',
    destinationCity: '',
    destinationAddress: '',
    loadInstructions: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [complianceForBatch, setComplianceForBatch] = useState<{
    complete: boolean;
    missingPhotoTypes: string[];
    stickerRollId: string | null;
  } | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [lineage, setLineage] = useState<{
    coordFrom: 'none' | 'browser-gps' | 'typed';
    addressFrom: 'none' | 'nominatim' | 'placeholder' | 'typed';
  }>({ coordFrom: 'none', addressFrom: 'none' });
  const [addressMissingHouseNo, setAddressMissingHouseNo] = useState(false);

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    setFormData((prev) => {
      if (!prev.batchId) return prev;
      if (batches.some((b) => b.id === prev.batchId)) return prev;
      return { ...prev, batchId: '' };
    });
  }, [batches]);

  useEffect(() => {
    if (!formData.batchId) {
      setComplianceForBatch(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setComplianceLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${WEB_API_BASE}/material-control/compliance-status/${formData.batchId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          if (!cancelled) setComplianceForBatch(null);
          return;
        }
        const data = (await res.json()) as {
          complete: boolean;
          missingPhotoTypes: string[];
          stickerRollId: string | null;
        };
        if (!cancelled) setComplianceForBatch(data);
      } catch {
        if (!cancelled) setComplianceForBatch(null);
      } finally {
        if (!cancelled) setComplianceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.batchId]);

  const loadBatches = async () => {
    try {
      setBatchLoadError(null);
      setBatchesLoading(true);
      const allBatches = await batchesAPI.getMyBatches();
      const readyBatches = allBatches.filter(
        (b: { status?: string }) => b.status === 'PACKED' || b.status === 'QUALITY_VERIFIED'
      );
      setBatches(readyBatches);
    } catch (error: unknown) {
      console.error('Error loading batches:', error);
      setBatchLoadError(growerApiErrorOrT(error, t, 'grower.missionCreate.errLoadBatches'));
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationHint(t('grower.missionCreate.geoNotSupported'));
      return;
    }

    setLocationHint(null);
    setLocationLoading(true);
    setAddressLookupLoading(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLineage((p) => ({ ...p, coordFrom: 'browser-gps' }));
        setFormData((prev) => ({
          ...prev,
          pickupLat: lat.toString(),
          pickupLng: lng.toString(),
        }));
        setLocationLoading(false);
        void reverseGeocode(lat, lng);
      },
      (error) => {
        console.error('Error getting location:', error);
        const code =
          error && typeof error === 'object' && 'code' in error ? (error as GeolocationPositionError).code : 0;
        setLocationHint(code === 1 ? t('grower.missionCreate.geoDenied') : t('grower.missionCreate.geoTimeout'));
        setLocationLoading(false);
      },
      GEO_OPTIONS
    );
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setAddressLookupLoading(true);
    setLocationHint(null);
    setAddressMissingHouseNo(false);
    try {
      const response = await fetch(
        `/api/reverse-geocode?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`
      );
      const data = (await response.json()) as {
        displayName?: string | null;
        hasHouseNumber?: boolean;
        error?: string;
      };
      if (data.displayName) {
        setLineage((p) => ({ ...p, addressFrom: 'nominatim' }));
        if (data.hasHouseNumber === false) {
          setAddressMissingHouseNo(true);
        }
        setFormData((prev) => ({
          ...prev,
          pickupAddress: data.displayName as string,
          pickupLat: prev.pickupLat || String(lat),
          pickupLng: prev.pickupLng || String(lng),
        }));
        return;
      }
      setLineage((p) => ({ ...p, addressFrom: 'placeholder' }));
      setFormData((prev) => ({
        ...prev,
        pickupAddress:
          prev.pickupAddress.trim() ||
          t('grower.missionCreate.geoPlaceholderAddress', {
            lat: lat.toFixed(5),
            lng: lng.toFixed(5),
          }),
        pickupLat: prev.pickupLat || String(lat),
        pickupLng: prev.pickupLng || String(lng),
      }));
      setLocationHint(t('grower.missionCreate.geoLookupNoName'));
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setLineage((p) => ({ ...p, addressFrom: 'placeholder' }));
      setFormData((prev) => ({
        ...prev,
        pickupAddress:
          prev.pickupAddress.trim() ||
          t('grower.missionCreate.geoPlaceholderAddress', {
            lat: lat.toFixed(5),
            lng: lng.toFixed(5),
          }),
        pickupLat: prev.pickupLat || String(lat),
        pickupLng: prev.pickupLng || String(lng),
      }));
      setLocationHint(t('grower.missionCreate.geoLookupFailed'));
    } finally {
      setAddressLookupLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.batchId) {
      newErrors.batchId = t('grower.missionCreate.valSelectBatch');
    }

    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = t('grower.missionCreate.valPickupAddress');
    }

    if (!formData.pickupLat || !formData.pickupLng) {
      newErrors.location = t('grower.missionCreate.valLocation');
    } else {
      const la = parseFloat(formData.pickupLat);
      const ln = parseFloat(formData.pickupLng);
      if (!Number.isFinite(la) || !Number.isFinite(ln)) {
        newErrors.location = t('grower.missionCreate.valLatLngNumbers');
      } else if (Math.abs(la) > 90 || Math.abs(ln) > 180) {
        newErrors.location = t('grower.missionCreate.valLatLngRange');
      }
    }

    if (!formData.destinationCity.trim()) {
      newErrors.destinationCity = t('grower.missionCreate.valDestinationCity');
    }
    if (!formData.destinationAddress.trim() || formData.destinationAddress.trim().length < 5) {
      newErrors.destinationAddress = t('grower.missionCreate.valDestinationAddress');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});
      setSubmitError(null);

      const missionData = {
        batchId: formData.batchId || undefined,
        pickupLocation: {
          lat: parseFloat(formData.pickupLat),
          lng: parseFloat(formData.pickupLng),
          address: formData.pickupAddress,
        },
        pickupAddress: formData.pickupAddress,
        destinationCity: formData.destinationCity.trim(),
        destinationAddress: formData.destinationAddress.trim(),
        loadInstructions: formData.loadInstructions.trim() || undefined,
      };

      await missionsAPI.create(missionData);

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/grower/portal';
      }, 2000);
    } catch (error: unknown) {
      console.error('Error creating mission:', error);
      setSubmitError(formatMissionCreateError(error, t));
    } finally {
      setSubmitting(false);
    }
  };

  if (batchesLoading) {
    return (
      <SidebarLayout title={t('grower.nav.requestTransport')} navItems={navItems}>
        <GrowerPageShell>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2D5A27]" />
          </div>
        </GrowerPageShell>
      </SidebarLayout>
    );
  }

  if (success) {
    return (
      <SidebarLayout title={t('grower.nav.requestTransport')} navItems={navItems}>
        <GrowerPageShell className="space-y-6">
          <GrowerPageHeader
            title={t('growerPages.requestTransport')}
            description={t('grower.missionCreate.headerDescSuccess')}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm"
          >
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-[#2D5A27]" />
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">{t('grower.missionCreate.successTitle')}</h2>
            <p className="mb-4 text-gray-600">{t('grower.missionCreate.successBody')}</p>
            <p className="text-base text-gray-500">
              <Trans
                i18nKey="grower.missionCreate.successRedirect"
                components={[
                  <Link key="portal" href="/grower/portal" className="font-semibold text-[#2D5A27] underline" />,
                ]}
              />
            </p>
          </motion.div>
        </GrowerPageShell>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={t('grower.nav.requestTransport')} navItems={navItems}>
      <GrowerPageShell className="space-y-6">
        <GrowerPageHeader
          title={t('growerPages.requestTransport')}
          description={t('grower.missionCreate.headerDescForm')}
        />
        {batchLoadError && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-950"
            role="alert"
          >
            <p className="font-medium">{t('grower.missionCreate.errLoadBatches')}</p>
            <p className="mt-1">{batchLoadError}</p>
            <button
              type="button"
              onClick={() => void loadBatches()}
              className="mt-3 text-sm font-medium text-[#2D5A27] underline"
            >
              {t('growerPages.retry')}
            </button>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6"
        >
          <p className="text-base text-gray-600 mb-3 leading-relaxed">
            <strong>{t('grower.missionCreate.introBeforeLabel')}</strong> {t('grower.missionCreate.introBeforeStatuses')}{' '}
            (
            <Link href="/grower/batches" className="text-[#2D5A27] font-medium underline">
              {t('grower.nav.myBatches')}
            </Link>
            ) →{' '}
            <Link href="/grower/quality-entry" className="text-[#2D5A27] font-medium underline">
              {t('grower.nav.qualityEntry')}
            </Link>{' '}
            {t('grower.missionCreate.introIfRequired')} →{' '}
            <Link href="/grower/compliance-photos" className="text-[#2D5A27] font-medium underline">
              {t('grower.nav.compliancePhotos')}
            </Link>{' '}
            {t('grower.missionCreate.introAfterCompliance')}
          </p>
          <p className="text-base text-gray-600 mb-6 leading-relaxed">
            {t('grower.missionCreate.introChooseLead')}{' '}
            <Link href="/grower/materials" className="text-[#2D5A27] font-medium underline">
              {t('grower.nav.materials')}
            </Link>{' '}
            {t('grower.missionCreate.introIfNeedSupplies')}
          </p>
          <p className="text-base text-gray-500 mb-6 border-l-2 border-gray-200 pl-3">
            <strong>{t('grower.missionCreate.introAfterLabel')}</strong> {t('grower.missionCreate.introAfterBody')}{' '}
            <Link href="/grower/portal" className="text-[#2D5A27] font-medium underline">
              {t('grower.nav.missionTracker')}
            </Link>{' '}
            {t('grower.missionCreate.introAfterTail')}
          </p>

          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-slate-800">
            <p className="font-medium text-slate-900">{t('grower.missionCreate.splitOrderTitle')}</p>
            <p className="mt-1.5 leading-relaxed">{t('grower.missionCreate.splitOrderBody')}</p>
          </div>

          {submitError && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-900"
              role="alert"
            >
              <p className="font-medium">{t('grower.missionCreate.submitErrorTitle')}</p>
              <p className="mt-1 whitespace-pre-wrap">{submitError}</p>
              {/compliance|photo|packaging|crate|materials|Non-standard|Missing balance|label roll/i.test(
                submitError
              ) && (
                <p className="mt-3 text-xs text-red-800/90">
                  <Trans
                    i18nKey="grower.missionCreate.submitErrorFooter"
                    components={{
                      compliance: <Link href="/grower/compliance-photos" className="font-semibold text-[#2D5A27] underline" />,
                      materials: <Link href="/grower/materials" className="font-semibold text-[#2D5A27] underline" />,
                      suppliers: <Link href="/grower/where-to-buy" className="font-semibold text-[#2D5A27] underline" />,
                      contact: <Link href="/contact" className="font-semibold text-[#2D5A27] underline" />,
                    }}
                  />
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                {t('grower.missionCreate.labelSelectBatch')}{' '}
                {batches.length === 0 && <span className="text-red-500">{t('grower.missionCreate.noReadyBatches')}</span>}
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                required
                disabled={batches.length === 0}
                className={`w-full px-4 py-2 border rounded-lg ${inputFocus} focus:border-transparent ${
                  errors.batchId ? 'border-red-500' : 'border-gray-300'
                } ${batches.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">{t('grower.missionCreate.selectBatchPlaceholder')}</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchId} - {batch.productName} ({batch.quantity} {batch.unit})
                  </option>
                ))}
              </select>
              {errors.batchId && <p className="text-red-500 text-xs mt-1">{errors.batchId}</p>}
              {batches.length === 0 && (
                <p className="text-base text-gray-500 mt-2">{t('grower.missionCreate.needPackedOrVerified')}</p>
              )}
              {formData.batchId && (
                <div className="mt-3 rounded-lg border px-3 py-2 text-base">
                  {complianceLoading ? (
                    <p className="text-gray-600">{t('grower.missionCreate.complianceChecking')}</p>
                  ) : complianceForBatch?.complete ? (
                    <p className="text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>
                        {t('grower.missionCreate.complianceOk')}
                        {complianceForBatch.stickerRollId ? (
                          <>
                            {' '}
                            (<span className="font-mono">{complianceForBatch.stickerRollId}</span>)
                          </>
                        ) : null}
                        .
                      </span>
                    </p>
                  ) : complianceForBatch ? (
                    <div className="text-amber-900">
                      <p className="font-medium">{t('grower.missionCreate.complianceIncomplete')}</p>
                      {complianceForBatch.missingPhotoTypes?.length > 0 && (
                        <p className="mt-1">
                          {t('grower.missionCreate.complianceMissingPhotos')}{' '}
                          <strong>{complianceForBatch.missingPhotoTypes.join(', ')}</strong>
                        </p>
                      )}
                      {!complianceForBatch.stickerRollId &&
                        complianceForBatch.missingPhotoTypes?.length === 0 && (
                          <p className="mt-1">{t('grower.missionCreate.complianceNoRoll')}</p>
                        )}
                      <p className="mt-2">
                        <Link href="/grower/compliance-photos" className="font-semibold text-[#2D5A27] underline">
                          {t('grower.missionCreate.complianceOpenLink')}
                        </Link>{' '}
                        {t('grower.missionCreate.complianceOpenTail')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-600">{t('grower.missionCreate.complianceLoadFailed')}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">{t('grower.missionCreate.pickupLocation')}</label>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading || addressLookupLoading}
                  className={`${btnPrimary} disabled:bg-gray-400`}
                >
                  {locationLoading || addressLookupLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {locationLoading
                    ? t('grower.missionCreate.gpsGetting')
                    : addressLookupLoading
                      ? t('grower.missionCreate.gpsLookupAddress')
                      : t('grower.missionCreate.gpsUseCurrent')}
                </button>
              </div>
              {locationHint && (
                <p className="text-base text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
                  {locationHint}
                </p>
              )}
              <p className="text-xs text-gray-500 mb-2">{t('grower.missionCreate.manualCoordsHint')}</p>
              <div className="mb-3 rounded-md border border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-700">{t('grower.missionCreate.lineageTitle')}</p>
                <p>
                  <span className="text-gray-500">{t('grower.missionCreate.lineageCoordLabel')}</span>{' '}
                  {lineage.coordFrom === 'browser-gps' && t('grower.missionCreate.lineageCoordGps')}
                  {lineage.coordFrom === 'typed' && t('grower.missionCreate.lineageCoordTyped')}
                  {lineage.coordFrom === 'none' && t('grower.missionCreate.lineageCoordNone')}
                </p>
                <p>
                  <span className="text-gray-500">{t('grower.missionCreate.lineageAddrLabel')}</span>{' '}
                  {lineage.addressFrom === 'nominatim' && t('grower.missionCreate.lineageAddrNominatim')}
                  {lineage.addressFrom === 'placeholder' && t('grower.missionCreate.lineageAddrPlaceholder')}
                  {lineage.addressFrom === 'typed' && t('grower.missionCreate.lineageAddrTyped')}
                  {lineage.addressFrom === 'none' && t('grower.missionCreate.lineageAddrNone')}
                </p>
                <details className="pt-1 text-gray-500">
                  <summary className="cursor-pointer text-[#2D5A27]">{t('grower.missionCreate.lineageDevSummary')}</summary>
                  <p className="mt-1 pl-0">{t('grower.missionCreate.lineageDevBody')}</p>
                </details>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('grower.missionCreate.latLabel')}</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.pickupLat}
                    onChange={(e) => {
                      setLineage((p) => ({ ...p, coordFrom: 'typed' }));
                      setFormData({ ...formData, pickupLat: e.target.value });
                    }}
                    placeholder={t('grower.missionCreate.latPlaceholder')}
                    className={`w-full px-3 py-2 border rounded-lg ${inputFocus} ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">{t('grower.missionCreate.lngLabel')}</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.pickupLng}
                    onChange={(e) => {
                      setLineage((p) => ({ ...p, coordFrom: 'typed' }));
                      setFormData({ ...formData, pickupLng: e.target.value });
                    }}
                    placeholder={t('grower.missionCreate.lngPlaceholder')}
                    className={`w-full px-3 py-2 border rounded-lg ${inputFocus} ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
              {errors.location && <p className="text-red-500 text-xs mb-2">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">{t('grower.missionCreate.pickupAddressLabel')}</label>
              <textarea
                value={formData.pickupAddress}
                onChange={(e) => {
                  setLineage((p) => ({ ...p, addressFrom: 'typed' }));
                  setAddressMissingHouseNo(false);
                  setFormData({ ...formData, pickupAddress: e.target.value });
                }}
                placeholder={t('grower.missionCreate.pickupAddressPlaceholder')}
                rows={3}
                required
                className={`w-full px-4 py-2 border rounded-lg ${inputFocus} focus:border-transparent ${
                  errors.pickupAddress ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.pickupAddress && <p className="text-red-500 text-xs mt-1">{errors.pickupAddress}</p>}
              {addressMissingHouseNo && (
                <p className="text-base text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
                  {t('grower.missionCreate.houseNumberHint')}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-[#2D5A27]/20 bg-[#f7faf6] p-4 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">{t('grower.missionCreate.deliverySectionTitle')}</h3>
              <p className="text-xs text-gray-600">{t('grower.missionCreate.deliverySectionHint')}</p>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">{t('grower.missionCreate.destinationCityLabel')}</label>
                <input
                  type="text"
                  value={formData.destinationCity}
                  onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                  placeholder={t('grower.missionCreate.destinationCityPlaceholder')}
                  className={`w-full px-4 py-2 border rounded-lg ${inputFocus} ${
                    errors.destinationCity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.destinationCity && <p className="text-red-500 text-xs mt-1">{errors.destinationCity}</p>}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">{t('grower.missionCreate.destinationAddressLabel')}</label>
                <textarea
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                  placeholder={t('grower.missionCreate.destinationAddressPlaceholder')}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg ${inputFocus} ${
                    errors.destinationAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.destinationAddress && (
                  <p className="text-red-500 text-xs mt-1">{errors.destinationAddress}</p>
                )}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  {t('grower.missionCreate.loadInstructionsLabel')}
                </label>
                <textarea
                  value={formData.loadInstructions}
                  onChange={(e) => setFormData({ ...formData, loadInstructions: e.target.value })}
                  placeholder={t('grower.missionCreate.loadInstructionsPlaceholder')}
                  rows={2}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${inputFocus}`}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('grower.missionCreate.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting || batches.length === 0}
                className={`${btnPrimaryLg} ${
                  submitting || batches.length === 0 ? 'bg-gray-400 text-white cursor-not-allowed hover:bg-gray-400' : ''
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('grower.missionCreate.creating')}
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    {t('grower.missionCreate.submitCta')}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </GrowerPageShell>
    </SidebarLayout>
  );
}
