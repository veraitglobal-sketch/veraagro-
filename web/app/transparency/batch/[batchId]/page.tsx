'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin,
  Camera,
  Leaf,
  QrCode,
  Calendar,
  Package,
  Thermometer,
  Clock,
  CheckCircle,
  Truck,
  Warehouse,
  Sprout,
} from 'lucide-react';
import Image from 'next/image';
import { WEB_API_BASE } from '@/lib/api-base';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';

export default function DeepDivePage() {
  const { t } = useTranslation();
  const params = useParams();
  const batchId = params.batchId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (batchId) {
      loadDeepDiveData();
    }
  }, [batchId]);

  const loadDeepDiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${WEB_API_BASE}/vera-transparency/batch/${batchId}/deep-dive`);
      if (!response.ok) {
        throw new Error('Failed to load batch data');
      }
      const result = await response.json();
      setData(result);
    } catch (err: unknown) {
      console.error('Error loading deep dive data:', err);
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batch information...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Batch not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vera Transparency - Deep Dive</h1>
              <p className="text-sm text-gray-600 mt-1">Batch ID: {data.batchId}</p>
            </div>
            <div className="flex items-center gap-3">
              {data.qrCode?.qrCodeUrl && (
                <div className="text-center">
                  <img src={data.qrCode.qrCodeUrl} alt="QR Code" className="w-16 h-16 mx-auto" />
                  <p className="text-xs text-gray-500 mt-1">Scan QR</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Variety Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white"
          >
            <div className="flex items-center gap-3">
              <Leaf className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-90">Variety</p>
                <p className="text-2xl font-bold">{data.variety.display}</p>
                {data.variety.organic && (
                  <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                    Certified Organic
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Farm Location
              </h2>
              {data.farm.location.center ? (
                <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${data.farm.location.center.lat},${data.farm.location.center.lng}&zoom=15`}
                    allowFullScreen
                  />
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{data.farm.name}</p>
                    <p className="text-xs text-gray-600">
                      {data.farm.farmer?.name || 'Vera Partner'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Map not available</p>
                </div>
              )}
            </motion.div>

            {/* Farm Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sprout className="w-5 h-5" />
                Farm Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Farm Name</p>
                  <p className="text-base font-semibold text-gray-900">{data.farm.name}</p>
                </div>
                {data.farm.farmer && (
                  <div>
                    <p className="text-sm text-gray-600">Farmer</p>
                    <p className="text-base font-semibold text-gray-900">{data.farm.farmer.name}</p>
                    <p className="text-xs text-gray-500">Code: {data.farm.farmer.code}</p>
                  </div>
                )}
                {data.traceability.seed && (
                  <div>
                    <p className="text-sm text-gray-600">Seed</p>
                    <p className="text-base font-semibold text-gray-900">
                      {data.traceability.seed.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Serial: {data.traceability.seed.serialNumber}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Harvest Date</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(data.traceability.harvestDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="text-base font-semibold text-gray-900">
                    {data.traceability.quantity} {data.traceability.unit}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Photo Gallery */}
          {data.photos.all.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Photo Gallery
                </h2>
                {data.photos.recent.length > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {data.photos.recent.length} new in last hour
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.photos.all.map((photo: any) => (
                  <div
                    key={photo.id}
                    className="relative h-48 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
                    onClick={() => setSelectedPhoto(photo.url)}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.type}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {photo.isRecent && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                      <p className="text-xs font-medium">{photo.type}</p>
                      <p className="text-xs opacity-80">
                        {new Date(photo.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Journey Timeline */}
          {data.traceability.timeline && data.traceability.timeline.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Journey Timeline
              </h2>
              <div className="space-y-4">
                {data.traceability.timeline.map((stage: any, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        stage.stage === 'Harvested' ? 'bg-green-100 text-green-600' :
                        stage.stage === 'Packed' ? 'bg-blue-100 text-blue-600' :
                        stage.stage === 'In Hub' ? 'bg-purple-100 text-purple-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {stage.stage === 'Harvested' ? <Sprout className="w-5 h-5" /> :
                         stage.stage === 'Packed' ? <Package className="w-5 h-5" /> :
                         stage.stage === 'In Hub' ? <Warehouse className="w-5 h-5" /> :
                         <Truck className="w-5 h-5" />}
                      </div>
                      {index < data.traceability.timeline.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold text-gray-900">{stage.stage}</p>
                      <p className="text-sm text-gray-600">{stage.location}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(stage.date).toLocaleString()}
                      </p>
                      {stage.details?.farmer && (
                        <p className="text-xs text-gray-500 mt-1">
                          Farmer: {stage.details.farmer}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Temperature & Freshness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.traceability.freshness && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Freshness Tracking
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Harvested</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(data.traceability.freshness.harvestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Shelf Life</p>
                    <p className="text-base font-semibold text-gray-900">
                      {Math.round(data.traceability.freshness.remaining / 24)} days remaining
                    </p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(data.traceability.freshness.remaining / data.traceability.freshness.shelfLife) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expires</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(data.traceability.freshness.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {data.traceability.temperature && data.traceability.temperature.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  Temperature Log
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.traceability.temperature.slice(0, 10).map((log: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.temperature}°C
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <span className="text-2xl">×</span>
            </button>
            <Image
              src={selectedPhoto}
              alt="Product photo"
              width={1200}
              height={800}
              className="rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
