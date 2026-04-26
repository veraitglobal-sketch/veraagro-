'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { missionsAPI, batchesAPI } from '@/lib/api';
import { growerNavItems } from '@/lib/grower-nav';
import { motion } from 'framer-motion';
import { MapPin, Package, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const navItems = growerNavItems;

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
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  /** API message when mission is blocked (materials + compliance) */
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

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
    try {
      const response = await fetch(
        `/api/reverse-geocode?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`
      );
      const data = (await response.json()) as { displayName?: string | null; error?: string };
      if (data.displayName) {
        setFormData((prev) => ({
          ...prev,
          pickupAddress: data.displayName as string,
          pickupLat: prev.pickupLat || String(lat),
          pickupLng: prev.pickupLng || String(lng),
        }));
        return;
      }
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
      };

      const mission = await missionsAPI.create(missionData);

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/grower/portal';
      }, 2000);
    } catch (error: any) {
      console.error('Error creating mission:', error);
      const raw = error?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(' ') : raw;
      setSubmitError((msg as string) || 'Failed to create mission');
    } finally {
      setSubmitting(false);
    }
  };

  if (batchesLoading) {
    return (
      <SidebarLayout title="Request Transport" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </SidebarLayout>
    );
  }

  if (success) {
    return (
      <SidebarLayout title="Request Transport" navItems={navItems}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mission Created Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your transport request has been submitted. A logistics partner will be assigned automatically.
          </p>
          <p className="text-sm text-gray-500">Redirecting to Mission Tracker...</p>
        </motion.div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Request Transport" navItems={navItems}>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Transport Mission</h2>
          <p className="text-sm text-gray-600 mb-4">
            Request transport for your packed batch. The system will automatically find the nearest available logistics
            partner.
          </p>
          <div className="mb-6 rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 px-4 py-3 text-sm text-gray-800">
            <p className="font-medium text-[#23471f] mb-1">Before this request is accepted, Bio Vera checks:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
              <li>
                <Link href="/grower/compliance-photos" className="text-[#2D5A27] font-medium underline-offset-2 hover:underline">
                  Compliance photos
                </Link>{' '}
                — for <strong>this batch</strong>, all three: PUNNETS, LABELING, PALLETIZATION.
              </li>
              <li>
                <Link href="/grower/materials" className="text-[#2D5A27] font-medium underline-offset-2 hover:underline">
                  Materials
                </Link>{' '}
                — enough Bio Vera crate balance (about one crate per 10 kg of product).
              </li>
            </ul>
          </div>

          {submitError && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              role="alert"
            >
              <p className="font-medium">Could not create transport</p>
              <p className="mt-1 whitespace-pre-wrap">{submitError}</p>
              <p className="mt-3 text-xs text-red-800/90">
                Add photos:{' '}
                <Link href="/grower/compliance-photos" className="font-semibold text-[#2D5A27] underline">
                  Compliance photos
                </Link>
                . Order crates:{' '}
                <Link href="/grower/materials" className="font-semibold text-[#2D5A27] underline">
                  Materials
                </Link>
                .
              </p>
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
              <p className="text-xs text-gray-500 mb-2">
                If GPS is slow, enter latitude and longitude and the address yourself — the form does not require
                using the button.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.pickupLat}
                    onChange={(e) => setFormData({ ...formData, pickupLat: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, pickupLng: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                placeholder="Enter full pickup address (e.g., Farm Name, Street, City, Country)"
                rows={3}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.pickupAddress ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.pickupAddress && <p className="text-red-500 text-xs mt-1">{errors.pickupAddress}</p>}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Request Transport
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
