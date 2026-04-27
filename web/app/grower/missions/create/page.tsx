'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import { missionsAPI, batchesAPI } from '@/lib/api';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { WEB_API_BASE } from '@/lib/api-base';
import { motion } from 'framer-motion';
import { MapPin, Package, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

/** Shown when POST /missions fails so we see status, message, and non-JSON bodies (e.g. 502 HTML). */
function formatMissionCreateError(error: unknown): string {
  const e = error as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: unknown };
  };
  if (!e?.response) {
    const code = e?.code;
    const msg = e?.message || 'Request failed';
    if (code === 'ERR_NETWORK' || msg === 'Network Error') {
      return [
        'The browser could not reach the API (network / CORS / wrong URL).',
        `Tried base URL from config (see also Network tab for the real URL): ${WEB_API_BASE}`,
        `Error: ${msg}`,
      ].join('\n\n');
    }
    return `No response from server${code ? ` (${code})` : ''}. ${msg}`;
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
        body = 'Could not read error body';
      }
    }
  }
  if (!body) {
    body =
      'Empty or unreadable error body — open DevTools → Network, click the /missions request, and read the Response; the real reason is also in API server logs.';
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

export default function CreateMissionPage() {
  const { t } = useTranslation();
  const navItems = useGrowerNavItems();
  /** Initial batch list only (do not conflate with GPS) */
  const [batchesLoading, setBatchesLoading] = useState(true);
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
    /** Used to group partial loads (e.g. 200 kg + 500 kg) on one truck to the same city */
    destinationCity: '',
    /** Full drop-off: hub, buyer DC, wholesale market gate, etc. */
    destinationAddress: '',
    /** Pallets, time window, dock — optional */
    loadInstructions: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  /** API message when mission is blocked (materials + compliance) */
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [complianceForBatch, setComplianceForBatch] = useState<{
    complete: boolean;
    missingPhotoTypes: string[];
    stickerRollId: string | null;
  } | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  /**
   * Track where the user last set values from — helps debug "where does this come from?"
   * Coords are never loaded from the estate/batch in DB; they are only browser GPS or manual.
   */
  const [lineage, setLineage] = useState<{
    coordFrom: 'none' | 'browser-gps' | 'typed';
    addressFrom: 'none' | 'nominatim' | 'placeholder' | 'typed';
  }>({ coordFrom: 'none', addressFrom: 'none' });
  /** Nominatim often has no house number in OpenStreetMap at this pin — show hint */
  const [addressMissingHouseNo, setAddressMissingHouseNo] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  // After filtering to PACKED / QUALITY_VERIFIED, clear selection if that lot is no longer in the list
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
    (async () => {
      setComplianceLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${WEB_API_BASE}/material-control/compliance-status/${formData.batchId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
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
      setBatchesLoading(true);
      // Get batches that are ready for transport (PACKED status)
      const allBatches = await batchesAPI.getMyBatches();
      const readyBatches = allBatches.filter((b: any) => 
        b.status === 'PACKED' || b.status === 'QUALITY_VERIFIED'
      );
      setBatches(readyBatches);
    } catch (error) {
      console.error('Error loading batches:', error);
      alert('Failed to load batches');
    } finally {
      setBatchesLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
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
        const code = error && typeof error === 'object' && 'code' in error ? (error as GeolocationPositionError).code : 0;
        const msg =
          code === 1
            ? 'Location permission was denied. Allow location for this site or enter coordinates and address below.'
            : 'Could not get GPS before timeout. Enter latitude, longitude, and address manually.';
        setLocationHint(msg);
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
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[Request transport] Address from Nominatim (OSM) for', lat, lng, {
            hasHouseNumber: data.hasHouseNumber,
          });
        }
        return;
      }
      setLineage((p) => ({ ...p, addressFrom: 'placeholder' }));
      setFormData((prev) => ({
        ...prev,
        pickupAddress:
          prev.pickupAddress.trim() ||
          `Near ${lat.toFixed(5)}, ${lng.toFixed(5)} — add farm name, street, and city`,
        pickupLat: prev.pickupLat || String(lat),
        pickupLng: prev.pickupLng || String(lng),
      }));
      setLocationHint('Address lookup did not return a name. We filled a placeholder — please edit the address.');
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setLineage((p) => ({ ...p, addressFrom: 'placeholder' }));
      setFormData((prev) => ({
        ...prev,
        pickupAddress:
          prev.pickupAddress.trim() ||
          `Near ${lat.toFixed(5)}, ${lng.toFixed(5)} — add farm name, street, and city`,
        pickupLat: prev.pickupLat || String(lat),
        pickupLng: prev.pickupLng || String(lng),
      }));
      setLocationHint('Address lookup failed. You can still submit — please type the full pickup address.');
    } finally {
      setAddressLookupLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.batchId) {
      newErrors.batchId = 'Please select a batch';
    }

    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Please enter pickup address';
    }

    if (!formData.pickupLat || !formData.pickupLng) {
      newErrors.location = 'Please get your location or enter coordinates manually';
    } else {
      const la = parseFloat(formData.pickupLat);
      const ln = parseFloat(formData.pickupLng);
      if (!Number.isFinite(la) || !Number.isFinite(ln)) {
        newErrors.location = 'Latitude and longitude must be valid numbers';
      } else if (Math.abs(la) > 90 || Math.abs(ln) > 180) {
        newErrors.location = 'Coordinates are out of range (lat ±90, lng ±180)';
      }
    }

    if (!formData.destinationCity.trim()) {
      newErrors.destinationCity = 'Enter destination city or region (for dispatch to combine loads)';
    }
    if (!formData.destinationAddress.trim() || formData.destinationAddress.trim().length < 5) {
      newErrors.destinationAddress = 'Enter full delivery address (buyer, hub, market, dock)';
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

      const mission = await missionsAPI.create(missionData);

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/grower/portal';
      }, 2000);
    } catch (error: unknown) {
      console.error('Error creating mission:', error);
      setSubmitError(formatMissionCreateError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (batchesLoading) {
    return (
      <SidebarLayout title={t('grower.nav.requestTransport')} navItems={navItems}>
        <GrowerPageShell>
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
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
            description="Your request was sent. You can follow the run in Mission tracker."
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm"
          >
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">Transport request received</h2>
            <p className="mb-4 text-gray-600">
              Your request is <strong>queued for dispatch</strong>. BioVera operations assigns a cold-chain driver; you
              can track the run below as soon as it is assigned.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to{' '}
              <Link href="/grower/portal" className="font-semibold text-[#2D5A27] underline">
                Mission tracker
              </Link>{' '}
              (same as sidebar: /grower/portal)…
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
          description="Pick a ready batch, pickup location, and delivery. Prerequisites: quality entry and compliance complete for the lot."
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            <strong>Before this page:</strong> batch in <strong>PACKED</strong> or <strong>QUALITY_VERIFIED</strong> (
            <Link href="/grower/batches" className="text-[#2D5A27] font-medium underline">
              My batches
            </Link>
            ) →{' '}
            <Link href="/grower/quality-entry" className="text-[#2D5A27] font-medium underline">
              Quality entry
            </Link>{' '}
            if required →{' '}
            <Link href="/grower/compliance-photos" className="text-[#2D5A27] font-medium underline">
              Compliance photos
            </Link>{' '}
            + label roll complete. Then pick the lot below.
          </p>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Choose a <strong>ready batch</strong>, <strong>pickup</strong> (GPS or coordinates), and full <strong>drop-off</strong>{' '}
            details. The request is sent to <strong>BioVera operations</strong> (admin panel) — they assign a driver when
            ready; until then the mission shows as <strong>pending</strong>. Order stock on{' '}
            <Link href="/grower/materials" className="text-[#2D5A27] font-medium underline">
              Materials
            </Link>{' '}
            if you still need crates or labels.
          </p>
          <p className="text-sm text-gray-500 mb-6 border-l-2 border-gray-200 pl-3">
            <strong>After transport:</strong> when the request is created successfully, the app takes you to{' '}
            <Link href="/grower/portal" className="text-[#2D5A27] font-medium underline">
              Mission tracker
            </Link>{' '}
            to follow the run (map, status, logistics).
          </p>

          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800">
            <p className="font-medium text-slate-900">Split order (e.g. 800 kg + 200 kg, two farms, same day)</p>
            <p className="mt-1.5 leading-relaxed">
              One mission = <strong>one batch</strong> and <strong>one pickup</strong>. You cannot attach two grower lots to a
              single mission. Each farm that supplies part of a buyer line creates <strong>their own</strong> transport
              request for <strong>their</strong> batch. Use the <strong>same</strong> destination city and full delivery
              address on both, and in <strong>Load / dock instructions</strong> write the same purchase reference (e.g. “Order
              #… — 800 kg, leg 1/2, morning window”) and (“… 200 kg, leg 2/2”) so logistics and the driver see two related
              runs. They may be assigned to one truck (two stops) or two vehicles—operations decide.
            </p>
          </div>

          {submitError && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              role="alert"
            >
              <p className="font-medium">Could not create transport</p>
              <p className="mt-1 whitespace-pre-wrap">{submitError}</p>
              {/compliance|photo|packaging|crate|materials|Non-standard|Missing balance|label roll/i.test(
                submitError
              ) && (
                <p className="mt-3 text-xs text-red-800/90">
                  Add photos:{' '}
                  <Link href="/grower/compliance-photos" className="font-semibold text-[#2D5A27] underline">
                    Compliance photos
                  </Link>
                  . Order crates / stock:{' '}
                  <Link href="/grower/materials" className="font-semibold text-[#2D5A27] underline">
                    Materials
                  </Link>
                  . Message your material partner:{' '}
                  <Link href="/grower/where-to-buy" className="font-semibold text-[#2D5A27] underline">
                    Suppliers &amp; orders
                  </Link>
                  . Still stuck:{' '}
                  <Link href="/contact" className="font-semibold text-[#2D5A27] underline">
                    Contact
                  </Link>
                  .
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch * {batches.length === 0 && <span className="text-red-500">(No ready batches available)</span>}
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                required
                disabled={batches.length === 0}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.batchId ? 'border-red-500' : 'border-gray-300'
                } ${batches.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">-- Select Batch --</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchId} - {batch.productName} ({batch.quantity} {batch.unit})
                  </option>
                ))}
              </select>
              {errors.batchId && <p className="text-red-500 text-xs mt-1">{errors.batchId}</p>}
              {batches.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  You need to have batches with status "PACKED" or "QUALITY_VERIFIED" to request transport.
                </p>
              )}
              {formData.batchId && (
                <div className="mt-3 rounded-lg border px-3 py-2 text-sm">
                  {complianceLoading ? (
                    <p className="text-gray-600">Checking compliance for this lot…</p>
                  ) : complianceForBatch?.complete ? (
                    <p className="text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>
                        Compliance and label roll are on file for this lot
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
                      <p className="font-medium">Compliance not complete for this lot</p>
                      {complianceForBatch.missingPhotoTypes?.length > 0 && (
                        <p className="mt-1">
                          Missing photo types: <strong>{complianceForBatch.missingPhotoTypes.join(', ')}</strong>
                        </p>
                      )}
                      {!complianceForBatch.stickerRollId &&
                        complianceForBatch.missingPhotoTypes?.length === 0 && (
                          <p className="mt-1">Label roll is not linked to this lot in the system yet.</p>
                        )}
                      <p className="mt-2">
                        <Link href="/grower/compliance-photos" className="font-semibold text-[#2D5A27] underline">
                          Open Compliance photos
                        </Link>{' '}
                        and submit all three photos plus the sticker roll ID, then return here.
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-600">Could not load compliance status. You can still try to submit.</p>
                  )}
                </div>
              )}
            </div>

            {/* Pickup Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location *
              </label>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading || addressLookupLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {locationLoading || addressLookupLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {locationLoading
                    ? 'Getting GPS...'
                    : addressLookupLoading
                      ? 'Looking up address...'
                      : 'Use my current location'}
                </button>
              </div>
              {locationHint && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
                  {locationHint}
                </p>
              )}
              <p className="text-xs text-gray-500 mb-2">Or type lat/lng and address manually—no need to use GPS.</p>
              <div className="mb-3 rounded-md border border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-700">Data source (not from your batch in the database)</p>
                <p>
                  <span className="text-gray-500">Coordinates:</span>{' '}
                  {lineage.coordFrom === 'browser-gps' && 'last set from this browser’s GPS (WGS-84).'}
                  {lineage.coordFrom === 'typed' && 'you typed (or edited) the numbers in the fields.'}
                  {lineage.coordFrom === 'none' && 'not set yet. Use the button or type lat/lng.'}
                </p>
                <p>
                  <span className="text-gray-500">Address:</span>{' '}
                  {lineage.addressFrom === 'nominatim' && 'from OpenStreetMap (Nominatim) after GPS. Street + number only if that point exists in the map data — not 100% from GPS.'}
                  {lineage.addressFrom === 'placeholder' && 'a temporary line we filled when the geocoder had no name — you should fix it to the real farm gate if needed.'}
                  {lineage.addressFrom === 'typed' && 'you typed in the box (or last edit was by you).'}
                  {lineage.addressFrom === 'none' && 'not set from lookup yet — add it yourself for the driver.'}
                </p>
                <details className="pt-1 text-gray-500">
                  <summary className="cursor-pointer text-[#2D5A27]">How to double-check in the browser</summary>
                  <p className="mt-1 pl-0">
                    Open <strong>DevTools</strong> (F12) → <strong>Network</strong> → after clicking the green button, look for
                    the request to <code className="text-gray-800">/api/reverse-geocode</code> — that is the address lookup.
                    The mission send goes to your API <code className="text-gray-800">POST /missions</code> (see axios in Network).
                  </p>
                </details>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.pickupLat}
                    onChange={(e) => {
                      setLineage((p) => ({ ...p, coordFrom: 'typed' }));
                      setFormData({ ...formData, pickupLat: e.target.value });
                    }}
                    placeholder="e.g., 44.7866"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.pickupLng}
                    onChange={(e) => {
                      setLineage((p) => ({ ...p, coordFrom: 'typed' }));
                      setFormData({ ...formData, pickupLng: e.target.value });
                    }}
                    placeholder="e.g., 20.4489"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
              {errors.location && <p className="text-red-500 text-xs mb-2">{errors.location}</p>}
            </div>

            {/* Pickup Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Address *
              </label>
              <textarea
                value={formData.pickupAddress}
                onChange={(e) => {
                  setLineage((p) => ({ ...p, addressFrom: 'typed' }));
                  setAddressMissingHouseNo(false);
                  setFormData({ ...formData, pickupAddress: e.target.value });
                }}
                placeholder="Enter full pickup address (e.g., Farm Name, Street, City, Country)"
                rows={3}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.pickupAddress ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.pickupAddress && <p className="text-red-500 text-xs mt-1">{errors.pickupAddress}</p>}
              {addressMissingHouseNo && (
                <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
                  <strong>House or gate number not in the address.</strong> The public map (OpenStreetMap) often has no
                  building number at your GPS point. Add the exact street and number, or a farm / gate name, so the
                  driver knows where to stop.
                </p>
              )}
            </div>

            {/* Delivery / drop-off — required for routing and load planning */}
            <div className="rounded-lg border border-[#2D5A27]/20 bg-[#f7faf6] p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Where this load is going (delivery)</h3>
              <p className="text-xs text-gray-600">
                Operations and drivers need a <strong>clear drop-off</strong>. If several small lots go to the{' '}
                <strong>same city</strong>, you can use the same spelling so dispatch can assign the <strong>same
                driver</strong> to both missions (one truck, two stops) when they are ready.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination city / region *</label>
                <input
                  type="text"
                  value={formData.destinationCity}
                  onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                  placeholder="e.g. Hamburg, Berlin, Munich"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.destinationCity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.destinationCity && <p className="text-red-500 text-xs mt-1">{errors.destinationCity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full delivery address *</label>
                <textarea
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                  placeholder="Company or hub name, street, gate, city, country — as agreed for handover"
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.destinationAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.destinationAddress && (
                  <p className="text-red-500 text-xs mt-1">{errors.destinationAddress}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loading / delivery notes (optional)
                </label>
                <textarea
                  value={formData.loadInstructions}
                  onChange={(e) => setFormData({ ...formData, loadInstructions: e.target.value })}
                  placeholder="E.g. 2 Euro pallets, delivery 06:00–10:00, cold dock B — anything the loader should know"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || batches.length === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  submitting || batches.length === 0
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
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
