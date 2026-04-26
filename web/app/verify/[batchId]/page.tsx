'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { formatFarmerIdentity, getFirstName, extractRegion } from '@/lib/farmer-utils';
import { BlockchainVerification } from '@/components/BlockchainVerification';
import { WEB_API_BASE } from '@/lib/api-base';

interface VerificationData {
  batch: {
    batchId: string;
    estateId?: string;
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
    location?: string;
  };
  timeline: {
    harvested: string;
    verified: string | null;
    loaded: string | null;
    arrived: string | null;
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
  farmer: {
    name: string;
    bio: string;
    photo: string | null;
    generation: string | null;
  } | null;
  transit: {
    vehicleId: string;
    vehicleNumber: string;
    travelTimeHours: number;
  } | null;
}

export default function VerifyPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationData();
  }, [batchId]);

  const fetchVerificationData = async () => {
    try {
      // Use the verify endpoint which supports both batchId and QR ID format
      const response = await fetch(`${WEB_API_BASE}/qr/verify/${batchId}`);
      
      if (!response.ok) {
        throw new Error('Product verification not found');
      }
      
      const certificateData = await response.json();
      
      // Transform data for consumer view with privacy protection
      const mission = certificateData.missions?.[0];
      
      // Privacy protection: Extract only first name and region
      const firstName = getFirstName(certificateData.farmer?.name || certificateData.origin?.ownerName || 'Farmer');
      const region = extractRegion(certificateData.origin?.address, certificateData.origin?.location);
      const farmerIdentity = formatFarmerIdentity(
        firstName,
        undefined, // No lastName for privacy
        certificateData.origin?.address,
        certificateData.origin?.location
      );
      
      const verificationData: VerificationData = {
        ...certificateData,
        origin: {
          ...certificateData.origin,
          ownerName: farmerIdentity, // Formatted: "Marko, Arilje Region"
          address: region, // Only region, no exact address
          gpsLocation: undefined, // No GPS for privacy
        },
        farmer: certificateData.farmer ? {
          name: farmerIdentity, // Formatted identity
          bio: `Grown by ${firstName}, 3rd generation grower`,
          photo: certificateData.farmer.photo || null,
          generation: certificateData.farmer.generation || '3rd',
        } : {
          name: farmerIdentity,
          bio: `Grown by ${firstName}, 3rd generation grower`,
          photo: null,
          generation: '3rd',
        },
        transit: mission?.vehicle ? {
          vehicleId: mission.vehicle.id || '',
          vehicleNumber: mission.vehicle.vehicleNumber || '',
          travelTimeHours: certificateData.timeline.loaded && certificateData.timeline.arrived
            ? (new Date(certificateData.timeline.arrived).getTime() - new Date(certificateData.timeline.loaded).getTime()) / (1000 * 60 * 60)
            : 0,
        } : null,
        timeline: {
          ...certificateData.timeline,
          arrived: certificateData.timeline.arrived || (mission?.deliveredAt ? new Date(mission.deliveredAt).toISOString() : new Date().toISOString()),
        },
      };
      
      setData(verificationData);
    } catch (err: any) {
      setError(err.message || 'Failed to load verification data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-3 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying product...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verification Not Found</h1>
          <p className="text-gray-600">{error || 'This product could not be verified.'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Prepare chart data
  const chartData = data.coldChainProof.temperatureData.map((point, index) => ({
    time: index,
    temperature: point.temperature,
    timestamp: formatTime(point.timestamp),
  }));

  // Calculate field to shelf time
  const fieldToShelfHours = data.timeline.arrived && data.timeline.harvested
    ? Math.round((new Date(data.timeline.arrived).getTime() - new Date(data.timeline.harvested).getTime()) / (1000 * 60 * 60))
    : 0;

  const isPerfectColdChain = data.coldChainProof.isWithinRange && 
    data.coldChainProof.minTemp >= 2 && 
    data.coldChainProof.maxTemp <= 6;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-green-100 sticky top-0 z-10 shadow-sm"
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Bio Vera</h1>
                <p className="text-xs text-gray-500">Verified Freshness</p>
              </div>
            </div>
            {isPerfectColdChain && (
              <div className="bg-green-100 border border-green-300 rounded-full px-3 py-1">
                <p className="text-xs font-medium text-green-800">Perfect Cold Chain</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">{data.batch.productName}</h2>
              <p className="text-sm text-gray-500">Batch: {data.batch.batchId}</p>
            </div>
            {data.batch.isCompromised ? (
              <div className="bg-red-100 border border-red-300 rounded-lg px-3 py-1">
                <p className="text-xs font-medium text-red-800">⚠️ Compromised</p>
              </div>
            ) : (
              <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-1">
                <p className="text-xs font-medium text-green-800">✓ Verified</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{data.batch.quantity} {data.batch.unit}</span>
            <span>•</span>
            <span>Harvested {formatDate(data.batch.harvestDate)}</span>
          </div>
          {data.batch.estateId && (
            <div className="mt-6">
              <BlockchainVerification
                batchId={data.batch.batchId}
                estateId={data.batch.estateId}
                harvestDate={typeof data.batch.harvestDate === 'string' ? data.batch.harvestDate : new Date(data.batch.harvestDate).toISOString()}
                productType={data.batch.productName}
              />
            </div>
          )}
        </motion.div>

        {/* Live Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">The Journey</h3>
          <div className="space-y-6">
            {/* Harvested */}
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
              </div>
              <div className="flex-1 pb-6">
                <p className="text-xs text-gray-500 mb-1">Harvested</p>
                <p className="text-sm font-semibold text-gray-900 mb-1">{formatDateTime(data.timeline.harvested)}</p>
                <p className="text-sm text-gray-600">{data.origin.farmName}</p>
                <p className="text-xs text-gray-500 mt-1">{data.origin.ownerName}</p>
              </div>
            </div>

            {/* Field Verified */}
            {data.timeline.verified && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-6">
                  <p className="text-xs text-gray-500 mb-1">Field Verified</p>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{formatDateTime(data.timeline.verified)}</p>
                  <p className="text-sm text-gray-600">Coordinator approved batch quality</p>
                </div>
              </div>
            )}

            {/* Transit */}
            {data.timeline.loaded && data.transit && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-6">
                  <p className="text-xs text-gray-500 mb-1">In Transit</p>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{formatDateTime(data.timeline.loaded)}</p>
                  <p className="text-sm text-gray-600">Frigo-Truck {data.transit.vehicleNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">Travel time: {data.transit.travelTimeHours.toFixed(1)} hours</p>
                </div>
              </div>
            )}

            {/* Arrival */}
            {data.timeline.arrived && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Arrived at Store</p>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{formatDateTime(data.timeline.arrived)}</p>
                  <p className="text-sm text-gray-600">Ready for purchase</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cold Chain Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cold Chain</h3>
            {isPerfectColdChain && (
              <div className="bg-green-100 border border-green-300 rounded-full px-3 py-1">
                <p className="text-xs font-medium text-green-800">✓ Perfect</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">Temperature during transit (Safety Zone: 2°C - 6°C)</p>
          
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    label={{ value: 'Time', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 10 } }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    label={{ value: '°C', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 10 } }}
                    domain={[0, 12]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px' }}
                    formatter={(value: any) => [`${value}°C`, 'Temperature']}
                    labelFormatter={(label) => `Time: ${chartData[parseInt(label)]?.timestamp || label}`}
                  />
                  <ReferenceArea y1={2} y2={6} fill="#dcfce7" fillOpacity={0.3} stroke="#16a34a" strokeDasharray="2 2" />
                  <ReferenceLine y={2} stroke="#16a34a" strokeDasharray="2 2" label={{ value: "Min", position: "right", fill: '#16a34a', fontSize: 10 }} />
                  <ReferenceLine y={6} stroke="#16a34a" strokeDasharray="2 2" label={{ value: "Max", position: "right", fill: '#16a34a', fontSize: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke={isPerfectColdChain ? "#16a34a" : "#ef4444"} 
                    strokeWidth={2}
                    dot={{ fill: isPerfectColdChain ? "#16a34a" : "#ef4444", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">No temperature data available</p>
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Min</p>
              <p className="text-lg font-semibold text-gray-900">{data.coldChainProof.minTemp.toFixed(1)}°C</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Avg</p>
              <p className="text-lg font-semibold text-gray-900">{data.coldChainProof.avgTemp.toFixed(1)}°C</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Max</p>
              <p className="text-lg font-semibold text-gray-900">{data.coldChainProof.maxTemp.toFixed(1)}°C</p>
            </div>
          </div>
        </motion.div>

        {/* Farmer Profile */}
        {data.farmer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            {/* VERA PRODUCER Brand Prefix */}
            <p className="text-[10px] font-light tracking-[0.2em] text-gray-400 uppercase mb-3">
              VERA PRODUCER
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grown By</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {data.farmer.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" strokeWidth={1} />
                  <p className="text-base font-semibold text-gray-900">{data.farmer.name}</p>
                </div>
                <p className="text-sm text-gray-600">{data.farmer.bio}</p>
                {data.origin.location && (
                  <p className="text-xs font-light tracking-[0.15em] text-gray-500 uppercase mt-2">
                    {data.origin.location}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sustainability Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-sm border border-green-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Freshness</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Field to Shelf</p>
              <p className="text-2xl font-bold text-green-700">{fieldToShelfHours} hours</p>
            </div>
            {data.freshness && (
              <div className="flex items-center justify-between pt-4 border-t border-green-200">
                <p className="text-sm text-gray-700">Remaining Shelf Life</p>
                <p className={`text-lg font-semibold ${
                  data.freshness.isExpired ? 'text-red-600' : 'text-green-700'
                }`}>
                  {data.freshness.remainingShelfLifeHours > 0
                    ? `${Math.round(data.freshness.remainingShelfLifeHours)} hours`
                    : 'Expired'}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-green-200">
              <p className="text-sm text-gray-700">Distance Traveled</p>
              <p className="text-lg font-semibold text-green-700">{data.sustainability.totalDistanceKm} km</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6"
        >
          <p className="text-xs text-gray-500">Bio Vera Traceability System</p>
          <p className="text-xs text-gray-400 mt-1">Cryptographically verified • Immutable record</p>
        </motion.div>
      </div>
    </div>
  );
}
