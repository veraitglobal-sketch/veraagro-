'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { missionsAPI, batchesAPI } from '@/lib/api';
import { growerNavItems } from '@/lib/grower-nav';
import { motion } from 'framer-motion';
import { MapPin, Package, Loader2, CheckCircle } from 'lucide-react';

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

export default function CreateMissionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          pickupLat: position.coords.latitude.toString(),
          pickupLng: position.coords.longitude.toString(),
        });
        setLoading(false);
        // Try to reverse geocode to get address
        reverseGeocode(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get your location. Please enter it manually.');
        setLoading(false);
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using OpenStreetMap Nominatim API (free, no key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'BioVera App',
          },
        }
      );
      const data = await response.json();
      if (data.display_name) {
        setFormData({
          ...formData,
          pickupAddress: data.display_name,
          pickupLat: lat.toString(),
          pickupLng: lng.toString(),
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
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
      alert(msg || 'Failed to create mission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && batches.length === 0) {
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
          <p className="text-sm text-gray-600 mb-6">
            Request transport for your packed batch. The system will automatically find the nearest available logistics partner.
          </p>

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
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                className="mb-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                <MapPin className="w-4 h-4" />
                {loading ? 'Getting Location...' : 'Use My Current Location'}
              </button>

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
