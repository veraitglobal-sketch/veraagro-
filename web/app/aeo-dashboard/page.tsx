'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { WEB_API_BASE } from '@/lib/api-base';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';

interface VehicleData {
  vehicle: {
    id: string;
    vehicleNumber: string;
    licensePlate: string;
    type: string;
    tempRange: {
      min: number;
      max: number;
    };
  };
  sealStatus: {
    isSealed: boolean;
    sealedAt: string;
    sealId: string;
    isIntact: boolean;
  };
  batches: Array<{
    batchId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
    origin: {
      farmName: string;
      ownerName: string;
      gpsLocation: any;
    };
    freshness: {
      timestampHarvested: string;
      expiresAt: string;
      remainingHours: number;
    } | null;
    temperatureHistory: Array<{
      timestamp: string;
      temperature: number;
      isWithinRange: boolean;
    }>;
    digitalPassports: Array<{
      id: string;
      passportHash: string;
      status: string;
      generatedAt: string;
      exportData: any;
    }>;
    mission: {
      id: string;
      missionNumber: string;
      status: string;
      pickupLocation: any;
      pickedUpAt: string | null;
    };
    qualityStatus: any;
  }>;
  summary: {
    totalBatches: number;
    totalWeight: number;
    temperatureRange: {
      min: number;
      max: number;
      avg: number;
    };
    allSealsIntact: boolean;
  };
}

export default function AeoDashboardPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [vehicleId, setVehicleId] = useState('');
  const [data, setData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect or show login
    }
  }, [isAuthenticated]);

  const fetchVehicleData = async () => {
    if (!vehicleId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${WEB_API_BASE}/aeo/vehicle/${vehicleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch vehicle data');
      }

      const vehicleData = await response.json();
      setData(vehicleData);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const userRoles = user?.roles && Array.isArray(user.roles) ? user.roles : [];
  if (!isAuthenticated || (!userRoles.includes('SUPER_ADMIN') && !userRoles.includes('COORDINATOR'))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to authorized personnel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/logo1.png" 
                alt="Bio Vera" 
                width={56} 
                height={20} 
                className="h-4 w-auto"
              />
            </Link>
            <div className="text-sm text-gray-600">
              AEO Export Dashboard
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Search Vehicle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-light text-gray-900 mb-4">Vehicle Inspection</h1>
          <div className="flex gap-4">
            <input
              type="text"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              placeholder="Enter Vehicle ID or License Plate"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
            />
            <button
              onClick={fetchVehicleData}
              disabled={loading || !vehicleId}
              className="px-6 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Vehicle Data */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Vehicle Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Vehicle Information</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vehicle Number</p>
                  <p className="text-gray-900 font-medium">{data.vehicle.vehicleNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">License Plate</p>
                  <p className="text-gray-900 font-medium">{data.vehicle.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Temperature Range</p>
                  <p className="text-gray-900 font-medium">
                    {data.vehicle.tempRange.min}°C - {data.vehicle.tempRange.max}°C
                  </p>
                </div>
              </div>
            </div>

            {/* Seal Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Seal Status</h2>
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${
                  data.sealStatus.isIntact ? 'bg-[#2D5A27]' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="text-gray-900 font-medium">
                    {data.sealStatus.isIntact ? 'Seal Intact' : 'Seal Compromised'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Seal ID: {data.sealStatus.sealId} • Sealed: {formatDate(data.sealStatus.sealedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Summary</h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Batches</p>
                  <p className="text-2xl font-light text-gray-900">{data.summary.totalBatches}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Weight</p>
                  <p className="text-2xl font-light text-gray-900">{data.summary.totalWeight.toFixed(2)} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Temperature Range</p>
                  <p className="text-2xl font-light text-gray-900">
                    {data.summary.temperatureRange.min.toFixed(1)}°C - {data.summary.temperatureRange.max.toFixed(1)}°C
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Compliance</p>
                  <p className={`text-2xl font-light ${
                    data.summary.allSealsIntact ? 'text-[#2D5A27]' : 'text-red-600'
                  }`}>
                    {data.summary.allSealsIntact ? '✓ Compliant' : '✗ Non-Compliant'}
                  </p>
                </div>
              </div>
            </div>

            {/* Batches */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Batches in Vehicle</h2>
              <div className="space-y-6">
                {data.batches.map((batch, index) => (
                  <motion.div
                    key={batch.batchId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{batch.productName}</h3>
                        <p className="text-sm text-gray-500">Batch ID: {batch.batchId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="text-lg font-medium text-gray-900">
                          {batch.quantity} {batch.unit}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Origin</p>
                        <p className="text-gray-900 font-medium">{batch.origin.farmName}</p>
                        <p className="text-sm text-gray-600">{batch.origin.ownerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Harvest Date</p>
                        <p className="text-gray-900">{formatDate(batch.harvestDate)}</p>
                      </div>
                    </div>

                    {/* Temperature History */}
                    {batch.temperatureHistory.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Temperature History</p>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-end justify-between gap-1 h-20">
                            {batch.temperatureHistory.map((point, idx) => {
                              const height = ((point.temperature - 0) / 15) * 100;
                              return (
                                <div
                                  key={idx}
                                  className="flex-1 flex flex-col items-center"
                                  style={{ height: '100%' }}
                                >
                                  <div
                                    className={`w-full rounded-t ${
                                      point.isWithinRange ? 'bg-[#2D5A27]' : 'bg-red-500'
                                    }`}
                                    style={{ height: `${height}%`, minHeight: '4px' }}
                                    title={`${point.temperature.toFixed(1)}°C`}
                                  ></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Digital Passports */}
                    {batch.digitalPassports.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Digital Phytosanitary Certificates</p>
                        <div className="space-y-2">
                          {batch.digitalPassports.map((passport) => (
                            <div
                              key={passport.id}
                              className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Certificate #{passport.id.slice(0, 8)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Hash: {passport.passportHash.slice(0, 16)}...
                                </p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                passport.status === 'VERIFIED' ? 'bg-[#2D5A27]/20 text-[#23471f]' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {passport.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
