'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { growerNavItems } from '@/lib/grower-nav';
import { WEB_API_BASE } from '@/lib/api-base';
import { usersAPI } from '@/lib/api';
import AssignedAgentCard from '@/components/AssignedAgentCard';
import { Truck } from 'lucide-react';
import { missionStatusBadgeClass } from '@/lib/mission-ui';
import type { CommercialAgentPublic } from '@/lib/auth';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

const navItems = growerNavItems;

interface MissionTracker {
  missionId: string;
  missionNumber: string;
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  currentMilestone: string;
  milestones: Array<{
    name: string;
    status: 'completed' | 'in_progress' | 'pending';
    timestamp: string | null;
    location: any;
    isCurrent: boolean;
  }>;
  driver: string;
  vehicle: string;
  requestedAt: string;
  pickedUpAt: string | null;
  completedAt: string | null;
}

interface JourneyMap {
  missionId: string;
  batchId: string;
  milestones: Array<{
    name: string;
    status: string;
    timestamp: string | null;
    location: any;
  }>;
  routePoints: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    address: string | null;
  }>;
  eta: string | null;
  currentStatus: string;
}

interface ConsumerFeedback {
  batchId: string;
  averageRating: number;
  totalRatings: number;
  ratings: Array<{
    id: string;
    score: number;
    comment: string | null;
    rater: {
      id: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
    orderNumber: string;
  }>;
  hasExcellenceCertificate: boolean;
  certificate: {
    certificateId: string;
    batchNumber: string;
    estateName: string;
    issuedAt: string;
    type: string;
    shareableUrl: string;
    socialMediaText: string;
  } | null;
}

interface FinancialStatus {
  batchId: string;
  paymentStatus: string;
  paymentStatusMessage: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  isDelivered: boolean;
  isApproved: boolean;
  deliveredAt: string | null;
}

export default function GrowerPortalPage() {
  const deepLinkApplied = useRef(false);
  const [assignedAgent, setAssignedAgent] = useState<CommercialAgentPublic | null | undefined>(undefined);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [missions, setMissions] = useState<MissionTracker[]>([]);
  const [journeyMap, setJourneyMap] = useState<JourneyMap | null>(null);
  const [consumerFeedback, setConsumerFeedback] = useState<ConsumerFeedback | null>(null);
  const [financialStatus, setFinancialStatus] = useState<FinancialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAssignedAgent(null);
      return;
    }
    usersAPI
      .getMe()
      .then((me: { assignedCommercialAgent?: CommercialAgentPublic | null }) => {
        setAssignedAgent(me?.assignedCommercialAgent ?? null);
      })
      .catch(() => setAssignedAgent(null));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setListError(null);
        const token = localStorage.getItem('token');
        const [missionsRes, feedbackRes, financialRes] = await Promise.all([
          fetch(
            `${WEB_API_BASE}/grower-portal/mission-tracker${selectedBatch ? `?batchId=${selectedBatch}` : ''}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          selectedBatch
            ? fetch(
                `${WEB_API_BASE}/grower-portal/consumer-feedback/${selectedBatch}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              )
            : Promise.resolve(null),
          selectedBatch
            ? fetch(
                `${WEB_API_BASE}/grower-portal/financial-status/${selectedBatch}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              )
            : Promise.resolve(null),
        ]);

        const missionsData = await missionsRes.json();
        if (!missionsRes.ok) {
          const msg =
            (missionsData && typeof missionsData.message === 'string' && missionsData.message) ||
            `Could not load missions (${missionsRes.status})`;
          setListError(msg);
          setMissions([]);
        } else {
          setMissions(Array.isArray(missionsData) ? missionsData : []);
        }

        if (selectedBatch && feedbackRes) {
          const feedbackData = await feedbackRes.json();
          setConsumerFeedback(feedbackData);
        }

        if (selectedBatch && financialRes) {
          const financialData = await financialRes.json();
          setFinancialStatus(financialData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setListError('Network error while loading missions. Check that the API is running and your connection.');
        setMissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBatch]);

  const handleMissionSelect = useCallback(async (missionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${WEB_API_BASE}/grower-portal/journey-map/${missionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setJourneyMap(data);
      if (data.batchId) {
        setSelectedBatch(data.batchId);
      }
    } catch (err) {
      console.error('Error fetching journey map:', err);
    }
  }, []);

  /** Open the mission from notification: /missions/:id or /grower/portal?missionId= */
  useEffect(() => {
    if (deepLinkApplied.current || typeof window === 'undefined' || missions.length === 0) return;
    const mid = new URLSearchParams(window.location.search).get('missionId');
    if (!mid) return;
    if (!missions.some((m) => m.missionId === mid)) return;
    deepLinkApplied.current = true;
    void handleMissionSelect(mid);
    window.history.replaceState(null, '', '/grower/portal');
  }, [missions, handleMissionSelect]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <SidebarLayout title="Mission Tracker" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Mission Tracker" navItems={navItems}>
      <div className="space-y-6">
        {assignedAgent !== undefined && <AssignedAgentCard agent={assignedAgent} className="mb-0" />}

        <div className="rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 px-4 py-3 text-sm text-gray-700">
          <p className="font-medium text-gray-900">What is this?</p>
          <p className="mt-1 text-gray-600">
            A <strong>mission</strong> is a transport run: when you request pickup (from{' '}
            <Link href="/grower/missions/create" className="text-[#2D5A27] underline font-medium">
              Request Transport
            </Link>
            ), logistics gets a job to collect your batch. Here you follow that job—status, route on the map, and
            after delivery you can see buyer feedback and payout-related info for the selected batch.
          </p>
        </div>

        {/* Mission Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900">Your active missions</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Open a mission to load the journey map and (when available) ratings and financial status for that batch.
          </p>

          {listError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {listError}
            </div>
          )}

          <div className="space-y-3 min-h-[8rem]">
            {missions.length > 0 ? (
              missions.map((mission) => (
                <button
                  key={mission.missionId}
                  type="button"
                  onClick={() => handleMissionSelect(mission.missionId)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedBatch === mission.batchId
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{mission.missionNumber}</p>
                      <p className="text-sm text-gray-600">
                        {mission.productName} • {mission.quantity} {mission.unit}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {mission.currentMilestone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${missionStatusBadgeClass(
                          mission.status,
                        )}`}
                        title="Mission status from logistics pipeline"
                      >
                        {String(mission.status || '').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : !listError ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center">
                <Truck className="h-10 w-10 text-gray-300 mb-3" strokeWidth={1.25} />
                <p className="text-gray-900 font-medium">No active missions yet</p>
                <p className="text-sm text-gray-600 mt-2 max-w-md">
                  When you mark a batch ready and request transport, the pickup job appears here so you can track
                  driver status and the route.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/grower/missions/create"
                    className="inline-flex items-center gap-2 rounded-md bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#234a20]"
                  >
                    <Truck className="h-4 w-4" />
                    Request transport
                  </Link>
                  <Link
                    href="/grower/batches"
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    My batches
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Journey Map */}
        {journeyMap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">The Journey Map</h2>
            
            {/* Milestones */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                {journeyMap.milestones.map((milestone, index) => (
                  <div key={index} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        milestone.status === 'completed' ? 'bg-green-500 text-white' :
                        milestone.status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {milestone.status === 'completed' ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      <p className={`text-xs font-medium text-center ${
                        milestone.status === 'completed' ? 'text-green-600' :
                        milestone.status === 'in_progress' ? 'text-blue-600' :
                        'text-gray-500'
                      }`}>
                        {milestone.name}
                      </p>
                      {milestone.timestamp && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(milestone.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {index < journeyMap.milestones.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        milestone.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            {journeyMap.routePoints.length > 0 && (
              <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  center={[journeyMap.routePoints[0].lat, journeyMap.routePoints[0].lng]}
                  zoom={6}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {journeyMap.routePoints.map((point, index) => (
                    <Marker key={index} position={[point.lat, point.lng]}>
                      <Popup>
                        <div>
                          <p className="font-medium">Point {index + 1}</p>
                          <p className="text-sm text-gray-600">{point.address || 'In Transit'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(point.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {journeyMap.routePoints.length > 1 && (
                    <Polyline
                      positions={journeyMap.routePoints.map((p) => [p.lat, p.lng])}
                      color="#16a34a"
                      weight={3}
                    />
                  )}
                </MapContainer>
              </div>
            )}

            {/* ETA */}
            {journeyMap.eta && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">📦 Live ETA</p>
                <p className="text-lg font-bold text-blue-600 mt-1">{journeyMap.eta}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Consumer Feedback */}
        {consumerFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How was my fruit?</h2>
            
            {consumerFeedback.totalRatings > 0 ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(consumerFeedback.averageRating))}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {consumerFeedback.averageRating.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ({consumerFeedback.totalRatings} {consumerFeedback.totalRatings === 1 ? 'rating' : 'ratings'})
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {consumerFeedback.ratings.map((rating) => (
                    <div key={rating.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {renderStars(rating.score)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {rating.comment && (
                        <p className="text-sm text-gray-700 mt-2">"{rating.comment}"</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Order: {rating.orderNumber}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Excellence Certificate */}
                {consumerFeedback.hasExcellenceCertificate && consumerFeedback.certificate && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-yellow-50 to-green-50 border-2 border-yellow-400 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Bio Vera Certificate of Excellence
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Your {consumerFeedback.certificate.estateName} batch received a perfect 5-star rating!
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => {
                            if (!consumerFeedback.certificate) return;
                            if (typeof window === 'undefined') return;
                            const origin = window.location?.origin || '';
                            if (navigator.share) {
                              navigator.share({
                                title: 'Bio Vera Certificate of Excellence',
                                text: consumerFeedback.certificate.socialMediaText,
                                url: origin + consumerFeedback.certificate.shareableUrl,
                              });
                            } else if (navigator.clipboard) {
                              navigator.clipboard.writeText(consumerFeedback.certificate.socialMediaText);
                              alert('Certificate text copied to clipboard!');
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Share Certificate
                        </button>
                        {consumerFeedback.certificate && (
                          <a
                            href={consumerFeedback.certificate.shareableUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            View Certificate
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No feedback yet. Check back after delivery!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Financial Status */}
        {financialStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Status</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                <p className={`text-lg font-bold ${
                  financialStatus.paymentStatus === 'PROCESSING' ? 'text-green-600' :
                  financialStatus.paymentStatus === 'AWAITING_APPROVAL' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {financialStatus.paymentStatusMessage}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900">
                    €{financialStatus.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Paid</p>
                  <p className="text-lg font-bold text-green-600">
                    €{financialStatus.paidAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-lg font-bold text-yellow-600">
                    €{financialStatus.pendingAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </SidebarLayout>
  );
}
