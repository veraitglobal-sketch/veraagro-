'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { WEB_API_BASE } from '@/lib/api-base';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';

const homeIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

interface BatchHistoryData {
  batch: {
    id: string;
    batchId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
    status: string;
  };
  origin: {
    estate: {
      name: string;
      owner: {
        name: string;
        email: string;
        phone: string;
      };
    };
    parcel: {
      cropType: string;
      plantingDate: string;
    } | null;
    harvestedBy: {
      name: string;
      email: string;
      phone: string;
    } | null;
  };
  farmerEntry: {
    weatherAtHarvest: {
      temperature: number;
      humidity: number;
      cloudCover: string;
    };
    preCoolingStartTime: string;
    visualGradePhotos: string[];
    standardConfirmation: boolean;
    confirmedAt: string;
  } | null;
  logistics: Array<{
    missionNumber: string;
    logisticsPartner: {
      name: string;
      email: string;
      phone: string;
    } | null;
    vehicle: {
      vehicleNumber: string;
      licensePlate: string;
      type: string;
    } | null;
    handover: {
      insideTruckTemperature: number;
      verifiedAt: string;
      palletPhotoCount: number;
      truckInteriorPhotoCount: number;
    } | null;
    pickupLocation: any;
    pickupAddress: string;
    requestedAt: string;
    pickedUpAt: string | null;
    completedAt: string | null;
    temperatureLogs: Array<{
      temperature: number;
      timestamp: string;
      location: any;
    }>;
    borderWaitTimes: Array<{
      borderName: string | null;
      borderArrivalTime: string;
      borderExitTime: string;
      waitTimeMinutes: number;
      notes: string | null;
    }>;
  }>;
  distributorArrivals: Array<{
    hubName: string;
    arrivalTime: string;
    temperatureAtArrival: number;
    visualState: string;
    notes: string | null;
    photos: string[];
    recordedBy: {
      name: string;
      email: string;
    };
  }>;
  freshness: {
    timestampHarvested: string;
    shelfLifeHours: number;
    remainingShelfLifeHours: number;
    expiresAt: string;
    isExpired: boolean;
  } | null;
  timeline: Array<{
    type: string;
    timestamp: string;
    actor: string;
    description: string;
    data?: any;
    location?: string;
  }>;
  complianceScore: number;
}

export default function BatchHistoryPage() {
  const { t } = useTranslation();
  const params = useParams();
  const batchId = params.batchId as string;
  const { user } = useAuth();
  const navItems = [{ href: '/', label: t('nav.home'), icon: homeIcon }];
  const [data, setData] = useState<BatchHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${WEB_API_BASE}/batch-history/batch/${batchId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch batch history');
        }

        const historyData = await response.json();
        setData(historyData);
      } catch (err: unknown) {
        setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      fetchHistory();
    }
  }, [batchId, t]);

  if (loading) {
    return (
      <SidebarLayout title={t('internalShell.titles.batchHistory')} navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !data) {
    return (
      <SidebarLayout title={t('internalShell.titles.batchHistory')} navItems={navItems}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error || t('internalShell.batchHistoryNotFound')}</p>
        </div>
      </SidebarLayout>
    );
  }

  // Prepare temperature chart data
  const temperatureData = data.logistics.flatMap((mission) =>
    mission.temperatureLogs.map((log) => ({
      time: new Date(log.timestamp).toLocaleString(),
      temperature: log.temperature,
      mission: mission.missionNumber,
    }))
  );

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-[#2D5A27]';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 90) return 'bg-[#2D5A27]/20 text-[#23471f]';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <SidebarLayout
      title={t('internalShell.batchHistoryNamed', { batchId: data.batch.batchId })}
      navItems={navItems}
    >
      <div className="space-y-6">
        {/* Header with Compliance Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.batch.batchId}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {data.batch.productName} • {data.batch.quantity} {data.batch.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Compliance Score</p>
              <div className={`text-3xl font-bold ${getComplianceColor(data.complianceScore)}`}>
                {data.complianceScore}%
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getComplianceBadge(data.complianceScore)}`}>
                {data.complianceScore >= 90 ? 'Excellent' : data.complianceScore >= 70 ? 'Good' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Origin Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Origin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Estate</p>
              <p className="font-medium text-gray-900">{data.origin.estate.name}</p>
              <p className="text-sm text-gray-600 mt-1">Owner: {data.origin.estate.owner.name}</p>
            </div>
            {data.origin.parcel && (
              <div>
                <p className="text-sm text-gray-600">Parcel</p>
                <p className="font-medium text-gray-900">{data.origin.parcel.cropType}</p>
              </div>
            )}
            {data.origin.harvestedBy && (
              <div>
                <p className="text-sm text-gray-600">Harvested By</p>
                <p className="font-medium text-gray-900">{data.origin.harvestedBy.name}</p>
                <p className="text-sm text-gray-600">{data.origin.harvestedBy.phone}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Farmer Entry */}
        {data.farmerEntry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Farmer Entry</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Weather at Harvest</p>
                <p className="font-medium text-gray-900">
                  {data.farmerEntry.weatherAtHarvest.temperature}°C
                </p>
                <p className="text-sm text-gray-600">
                  Humidity: {data.farmerEntry.weatherAtHarvest.humidity}% • {data.farmerEntry.weatherAtHarvest.cloudCover}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pre-cooling Start</p>
                <p className="font-medium text-gray-900">
                  {new Date(data.farmerEntry.preCoolingStartTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Standard Confirmation</p>
                <p className="font-medium text-gray-900">
                  {data.farmerEntry.standardConfirmation ? (
                    <span className="text-[#2D5A27]">✓ Confirmed</span>
                  ) : (
                    <span className="text-red-600">✗ Not Confirmed</span>
                  )}
                </p>
              </div>
            </div>
            {data.farmerEntry.visualGradePhotos.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Visual Grade Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {data.farmerEntry.visualGradePhotos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Grade photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Logistics Information */}
        {data.logistics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logistics</h2>
            {data.logistics.map((mission, index) => (
              <div key={index} className="mb-6 last:mb-0 border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                <div className="mb-4">
                  <p className="font-medium text-gray-900">{mission.missionNumber}</p>
                  {mission.logisticsPartner && (
                    <p className="text-sm text-gray-600">
                      Driver: {mission.logisticsPartner.name} • {mission.logisticsPartner.phone}
                    </p>
                  )}
                  {mission.vehicle && (
                    <p className="text-sm text-gray-600">
                      Vehicle: {mission.vehicle.vehicleNumber} ({mission.vehicle.licensePlate})
                    </p>
                  )}
                </div>

                {mission.handover && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">Truck temperature & loading photos</p>
                    <p className="text-lg font-bold text-blue-600">
                      {mission.handover.insideTruckTemperature}°C
                    </p>
                    <p className="text-xs text-blue-800 mt-1">
                      Pallet photos: {mission.handover.palletPhotoCount} · Inside truck:{' '}
                      {mission.handover.truckInteriorPhotoCount}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Verified: {new Date(mission.handover.verifiedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {mission.borderWaitTimes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Border Crossings</p>
                    {mission.borderWaitTimes.map((border, borderIndex) => (
                      <div key={borderIndex} className="p-3 bg-gray-50 rounded-lg mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {border.borderName || 'Border Crossing'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Arrival: {new Date(border.borderArrivalTime).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          Exit: {new Date(border.borderExitTime).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          Wait Time: {border.waitTimeMinutes} minutes
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p>Pickup: {new Date(mission.requestedAt).toLocaleString()}</p>
                  {mission.pickedUpAt && (
                    <p>Picked Up: {new Date(mission.pickedUpAt).toLocaleString()}</p>
                  )}
                  {mission.completedAt && (
                    <p>Delivered: {new Date(mission.completedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Temperature Chart */}
        {temperatureData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Temperature Log</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#2D5A27"
                  strokeWidth={2}
                  name="Temperature"
                />
                <Line
                  type="monotone"
                  dataKey={() => 2}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  name="Min (2°C)"
                />
                <Line
                  type="monotone"
                  dataKey={() => 8}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  name="Max (8°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Distributor Arrivals */}
        {data.distributorArrivals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Distributor Arrivals</h2>
            {data.distributorArrivals.map((arrival, index) => (
              <div key={index} className="mb-4 last:mb-0 border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{arrival.hubName}</p>
                    <p className="text-sm text-gray-600">
                      Arrived: {new Date(arrival.arrivalTime).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Recorded by: {arrival.recordedBy.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Temperature</p>
                    <p className={`text-lg font-bold ${
                      arrival.temperatureAtArrival >= 2 && arrival.temperatureAtArrival <= 8
                        ? 'text-[#2D5A27]'
                        : 'text-red-600'
                    }`}>
                      {arrival.temperatureAtArrival}°C
                    </p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                      arrival.visualState === 'EXCELLENT' ? 'bg-[#2D5A27]/20 text-[#23471f]' :
                      arrival.visualState === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                      arrival.visualState === 'ACCEPTABLE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {arrival.visualState}
                    </span>
                  </div>
                </div>
                {arrival.notes && (
                  <p className="text-sm text-gray-600 mt-2">{arrival.notes}</p>
                )}
                {arrival.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {arrival.photos.map((photo, photoIndex) => (
                      <img
                        key={photoIndex}
                        src={photo}
                        alt={`Arrival photo ${photoIndex + 1}`}
                        className="w-full h-24 object-cover rounded border border-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chain of Custody Timeline</h2>
          <div className="space-y-4">
            {data.timeline.map((event, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#2D5A27] mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{event.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">By: {event.actor}</p>
                  {event.location && (
                    <p className="text-sm text-gray-600">Location: {event.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
