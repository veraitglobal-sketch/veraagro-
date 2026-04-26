'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { WEB_API_BASE } from '@/lib/api-base';

interface CertificateData {
  qrId: string;
  batch: {
    batchId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
    status: string;
    isCompromised: boolean;
  };
  origin: {
    farmName: string;
    ownerName: string;
    gpsLocation: any;
    address: string;
  };
  timeline: {
    harvested: string;
    verified: string | null;
    loaded: string | null;
  };
  coldChainProof: {
    temperatureData: Array<{
      timestamp: string;
      temperature: number;
      location: any;
    }>;
    minTemp: number;
    maxTemp: number;
    avgTemp: number;
    isWithinRange: boolean;
  };
  sustainability: {
    totalDistanceKm: string;
    sustainabilityScore: string;
    route: any;
  };
  freshness: {
    timestampHarvested: string;
    remainingShelfLifeHours: number;
    expiresAt: string;
    isExpired: boolean;
  } | null;
}

export default function CertificatePage() {
  const params = useParams();
  const qrId = params.qrId as string;
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificateData();
  }, [qrId]);

  const fetchCertificateData = async () => {
    try {
      const response = await fetch(`${WEB_API_BASE}/qr/certificate/${qrId}`);
      if (!response.ok) {
        throw new Error('Certificate not found');
      }
      const certificateData = await response.json();
      setData(certificateData);
    } catch (err: any) {
      setError(err.message || 'Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Certificate Not Found</h1>
          <p className="text-gray-600">{error || 'The certificate you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">Freshness Certificate</h1>
              <p className="text-sm text-gray-500">Batch ID: {data.batch.batchId}</p>
            </div>
            {data.batch.isCompromised ? (
              <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-2">
                <p className="text-red-800 font-medium text-sm">⚠️ Compromised</p>
              </div>
            ) : (
              <div className="bg-[#2D5A27]/20 border border-[#2D5A27]/40 rounded-lg px-4 py-2">
                <p className="text-[#23471f] font-medium text-sm">✓ Verified</p>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-lg font-medium text-gray-900 mb-1">{data.batch.productName}</p>
            <p className="text-sm text-gray-600">
              {data.batch.quantity} {data.batch.unit} • Harvested: {formatDate(data.batch.harvestDate)}
            </p>
          </div>
        </motion.div>

        {/* Origin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-4">Origin</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">Farm Name</p>
              <p className="text-gray-900 font-medium">{data.origin.farmName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Owner</p>
              <p className="text-gray-900">{data.origin.ownerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">GPS Location</p>
              <p className="text-gray-900 font-mono text-sm">
                {Array.isArray(data.origin.gpsLocation) && data.origin.gpsLocation.length > 0
                  ? `${data.origin.gpsLocation[0].lat}, ${data.origin.gpsLocation[0].lng}`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-4">Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-[#2D5A27] rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Harvested</p>
                <p className="text-gray-900 font-medium">{formatDate(data.timeline.harvested)}</p>
              </div>
            </div>
            {data.timeline.verified && (
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Verified by Coordinator</p>
                  <p className="text-gray-900 font-medium">{formatDate(data.timeline.verified)}</p>
                </div>
              </div>
            )}
            {data.timeline.loaded && (
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Loaded into Truck</p>
                  <p className="text-gray-900 font-medium">{formatDate(data.timeline.loaded)}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cold Chain Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-4">Cold Chain Proof</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Temperature Range: 2°C - 8°C</span>
              <span className={`text-sm font-medium ${
                data.coldChainProof.isWithinRange ? 'text-[#2D5A27]' : 'text-red-600'
              }`}>
                {data.coldChainProof.isWithinRange ? '✓ Within Range' : '⚠️ Out of Range'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Min</p>
                <p className="text-lg font-medium text-gray-900">{data.coldChainProof.minTemp.toFixed(1)}°C</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Avg</p>
                <p className="text-lg font-medium text-gray-900">{data.coldChainProof.avgTemp.toFixed(1)}°C</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Max</p>
                <p className="text-lg font-medium text-gray-900">{data.coldChainProof.maxTemp.toFixed(1)}C</p>
              </div>
            </div>
          </div>

          {/* Temperature Graph */}
          {data.coldChainProof.temperatureData.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3">Temperature During Journey</p>
              <div className="h-32 bg-gray-50 rounded-lg p-4 flex items-end justify-between gap-1">
                {data.coldChainProof.temperatureData.map((point, index) => {
                  const height = ((point.temperature - 0) / 15) * 100; // Scale 0-15°C to 0-100%
                  const isInRange = point.temperature >= 2 && point.temperature <= 8;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center"
                      style={{ height: '100%' }}
                    >
                      <div
                        className={`w-full rounded-t ${
                          isInRange ? 'bg-[#2D5A27]' : 'bg-red-500'
                        }`}
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`${point.temperature.toFixed(1)}°C at ${formatTime(point.timestamp)}`}
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Start</span>
                <span>End</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sustainability Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-4">Sustainability Score</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Distance Traveled</p>
              <p className="text-3xl font-light text-gray-900">{data.sustainability.totalDistanceKm} km</p>
              <p className="text-xs text-gray-500 mt-1">The shorter, the better</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Sustainability Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-light text-gray-900">{data.sustainability.sustainabilityScore}</p>
                <span className="text-gray-500">/ 100</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#2D5A27] h-2 rounded-full"
                  style={{ width: `${data.sustainability.sustainabilityScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Freshness */}
        {data.freshness && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
          >
            <h2 className="text-xl font-medium text-gray-900 mb-4">Freshness</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Harvested</p>
                <p className="text-gray-900">{formatDate(data.freshness.timestampHarvested)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Remaining Shelf Life</p>
                <p className="text-gray-900 font-medium">
                  {data.freshness.remainingShelfLifeHours > 0
                    ? `${Math.round(data.freshness.remainingShelfLifeHours)} hours`
                    : 'Expired'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Expires At</p>
                <p className={`font-medium ${
                  data.freshness.isExpired ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatDate(data.freshness.expiresAt)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          <p>Bio Vera Traceability System</p>
          <p className="mt-1">This certificate is cryptographically verified and immutable</p>
        </motion.div>
      </div>
    </div>
  );
}
