'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { WEB_API_BASE } from '@/lib/api-base';
import { usersAPI } from '@/lib/api';
import AssignedAgentCard from '@/components/AssignedAgentCard';
import { Truck } from 'lucide-react';
import { missionStatusBadgeClass } from '@/lib/mission-ui';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import type { CommercialAgentPublic } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import { growerApiErrorOrT } from '@/lib/grower-api-error';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });


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
  pickupDriverPerson?: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    photoUrl?: string | null;
  } | null;
  pickupAtFarm?: {
    recorded: boolean;
    recordedAt: string | null;
    badgePhotoUrl: string | null;
    driverSignatureUrl: string | null;
  };
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

function missionStatusLabel(t: (k: string) => string, raw: string) {
  const u = (raw || '').toUpperCase().replace(/\s+/g, '_');
  const key = `growerPages.missionStatus_${u}`;
  const tr = t(key);
  if (tr !== key) return tr;
  return raw.replace(/_/g, ' ');
}

/** User-facing text from JSON error bodies (string or NestJS validation array). */
function portalJsonErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const m = (data as { message?: unknown }).message;
  if (typeof m === 'string' && m.trim()) return m.trim();
  if (Array.isArray(m)) {
    const joined = m
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter(Boolean)
      .join(' ');
    if (joined) return joined;
  }
  return fallback;
}

export default function GrowerPortalPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const navItems = useGrowerNavItems();
  const { toasts, success, removeToast } = useToast();

  const formatLocale = (iso: string | null | undefined, dateOnly?: boolean) => {
    if (iso == null) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const tag = dateIntlLocaleFromLanguageTag(i18n.language);
    return dateOnly
      ? d.toLocaleDateString(tag, { dateStyle: 'medium' })
      : d.toLocaleString(tag, { dateStyle: 'short', timeStyle: 'short' });
  };
  const deepLinkApplied = useRef(false);
  const [assignedAgent, setAssignedAgent] = useState<CommercialAgentPublic | null | undefined>(undefined);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
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
          const msg = portalJsonErrorMessage(
            missionsData,
            t('growerPages.portalCouldNotLoadMissions', { status: String(missionsRes.status) }),
          );
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
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        setListError(growerApiErrorOrT(err, t, 'growerPages.portalNetworkError'));
        setMissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBatch, t]);

  const handleMissionSelect = useCallback(async (missionId: string) => {
    setSelectedMissionId(missionId);
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
    setSelectedMissionId(mid);
    void handleMissionSelect(mid);
    window.history.replaceState(null, '', loc('/grower/portal'));
  }, [missions, handleMissionSelect, loc]);

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
      <>
        <SidebarLayout title={t('grower.nav.missionTracker')} navItems={navItems}>
          <GrowerPageShell>
            <div className="flex h-64 items-center justify-center text-gray-500">{t('growerPages.portalLoading')}</div>
          </GrowerPageShell>
        </SidebarLayout>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  return (
    <>
    <SidebarLayout title={t('grower.nav.missionTracker')} navItems={navItems}>
      <GrowerPageShell className="space-y-6">
        <GrowerPageHeader title={t('grower.nav.missionTracker')} description={t('growerPages.portalPageDescription')} />
        {assignedAgent !== undefined && <AssignedAgentCard agent={assignedAgent} className="mb-0" />}

        <div className="rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 px-4 py-3 text-base text-gray-700">
          <p className="font-medium text-gray-900">{t('growerPages.portalWhatIsTitle')}</p>
          <p className="mt-1 text-gray-600 font-light leading-relaxed">
            <Trans
              i18nKey="growerPages.portalWhatIsBody"
              components={[
                <strong key="0" className="font-semibold text-gray-900" />,
                <Link key="1" href={loc('/grower/missions/create')} className="text-[#2D5A27] underline font-medium" />,
              ]}
            />
          </p>
        </div>

        {/* Mission Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900">{t('growerPages.portalActiveMissionsTitle')}</h2>
          <p className="text-base text-gray-500 mt-1 mb-4 font-light">{t('growerPages.portalActiveMissionsLead')}</p>

          {listError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-base text-red-800">
              {listError}
            </div>
          )}

          <div className="space-y-3 min-h-[8rem]">
            {missions.length > 0 ? (
              missions.map((mission) => (
                <button
                  key={mission.missionId}
                  type="button"
                  onClick={() => void handleMissionSelect(mission.missionId)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedMissionId === mission.missionId
                      ? 'border-[#2D5A27] bg-[#f7faf6]'
                      : 'border-gray-200 hover:border-[#2D5A27]/35'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{mission.missionNumber}</p>
                      <p className="text-base text-gray-600">
                        {mission.productName} • {mission.quantity} {mission.unit}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('growerPages.portalCurrentStep', { milestone: mission.currentMilestone })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${missionStatusBadgeClass(
                          mission.status,
                        )}`}
                        title={t('growerPages.missionPipelineHint')}
                      >
                        {missionStatusLabel(t, String(mission.status || ''))}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : !listError ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center">
                <Truck className="h-10 w-10 text-gray-300 mb-3" strokeWidth={1.25} />
                <p className="text-gray-900 font-medium">{t('growerPages.portalNoMissionsTitle')}</p>
                <p className="text-base text-gray-600 mt-2 max-w-md font-light">{t('growerPages.portalNoMissionsBody')}</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={loc('/grower/missions/create')}
                    className="inline-flex items-center gap-2 rounded-md bg-[#2D5A27] px-4 py-2 text-base font-medium text-white hover:bg-[#234a20]"
                  >
                    <Truck className="h-4 w-4" />
                    {t('grower.nav.requestTransport')}
                  </Link>
                  <Link
                    href={loc('/grower/batches')}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('grower.nav.myBatches')}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {selectedMissionId &&
          (() => {
            const sm = missions.find((m) => m.missionId === selectedMissionId);
            if (!sm) return null;
            const person = sm.pickupDriverPerson;
            const proof = sm.pickupAtFarm;
            const name =
              person &&
              [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
            return (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900">{t('growerPages.portalPickupTitle')}</h2>
                <p className="mt-1 text-base text-gray-600 font-light">{t('growerPages.portalPickupIntro')}</p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {t('growerPages.portalPickupLogisticsCompany')}
                    </p>
                    <p className="mt-1 text-base text-gray-900">{sm.driver}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {t('growerPages.portalPickupDriverHeading')}
                    </p>
                    {!name ? (
                      <p className="mt-1 text-sm text-amber-900">{t('growerPages.portalPickupNoDriver')}</p>
                    ) : (
                      <div className="mt-2 flex gap-3">
                        {person?.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={person.photoUrl}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-full border border-gray-200 object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 text-sm text-gray-800">
                          <p className="font-semibold text-gray-900">{name}</p>
                          {person?.email ? (
                            <p className="mt-0.5 truncate">
                              <a
                                href={`mailto:${person.email}`}
                                className="text-[#2D5A27] underline underline-offset-2"
                              >
                                {person.email}
                              </a>
                            </p>
                          ) : null}
                          {person?.phone ? <p className="mt-0.5">{person.phone}</p> : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <p className="text-sm font-semibold text-gray-900">{t('growerPages.portalPickupProofTitle')}</p>
                  {!proof?.recorded ? (
                    <p className="mt-2 text-base text-gray-600 font-light">
                      {t('growerPages.portalPickupProofPending')}
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {proof.recordedAt ? (
                        <p className="text-xs text-gray-500">{formatLocale(proof.recordedAt)}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-6">
                        {proof.badgePhotoUrl ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{t('growerPages.portalPickupBadge')}</p>
                            <a
                              href={proof.badgePhotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={proof.badgePhotoUrl}
                                alt=""
                                className="max-h-40 max-w-full rounded-lg border border-gray-200 object-contain"
                              />
                            </a>
                          </div>
                        ) : null}
                        {proof.driverSignatureUrl ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{t('growerPages.portalPickupSignature')}</p>
                            <a
                              href={proof.driverSignatureUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={proof.driverSignatureUrl}
                                alt=""
                                className="max-h-28 max-w-full rounded-lg border border-gray-200 bg-white object-contain"
                              />
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}

        {/* Journey Map */}
        {journeyMap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('growerPages.portalJourneyTitle')}</h2>
            
            {/* Milestones */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                {journeyMap.milestones.map((milestone, index) => (
                  <div key={index} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        milestone.status === 'completed' ? 'bg-[#2D5A27] text-white' :
                        milestone.status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {milestone.status === 'completed' ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-base font-bold">{index + 1}</span>
                        )}
                      </div>
                      <p className={`text-xs font-medium text-center ${
                        milestone.status === 'completed' ? 'text-[#2D5A27]' :
                        milestone.status === 'in_progress' ? 'text-blue-600' :
                        'text-gray-500'
                      }`}>
                        {milestone.name}
                      </p>
                      {milestone.timestamp && (
                        <p className="text-xs text-gray-500 mt-1">{formatLocale(milestone.timestamp)}</p>
                      )}
                    </div>
                    {index < journeyMap.milestones.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        milestone.status === 'completed' ? 'bg-[#2D5A27]' : 'bg-gray-200'
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
                          <p className="font-medium">{t('growerPages.portalMapPoint', { n: index + 1 })}</p>
                          <p className="text-base text-gray-600">{point.address || t('growerPages.portalInTransit')}</p>
                          <p className="text-xs text-gray-500">{formatLocale(point.timestamp)}</p>
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
                <p className="text-base font-medium text-blue-900">📦 Live ETA</p>
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
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('growerPages.portalFeedbackTitle')}</h2>
            
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
                    <p className="text-base text-gray-600">
                      ({t('growerPages.portalRating', { count: consumerFeedback.totalRatings })})
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
                        <p className="text-xs text-gray-500">{formatLocale(rating.createdAt, true)}</p>
                      </div>
                      {rating.comment && (
                        <p className="text-base text-gray-700 mt-2">"{rating.comment}"</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {t('growerPages.portalOrder', { order: rating.orderNumber })}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Excellence Certificate */}
                {consumerFeedback.hasExcellenceCertificate && consumerFeedback.certificate && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-yellow-50 to-[#f7faf6] border-2 border-yellow-400 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{t('growerPages.portalCertTitle')}</h3>
                      <p className="text-base text-gray-600 mb-4">
                        {t('growerPages.portalCertBody', { estate: consumerFeedback.certificate.estateName })}
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => {
                            if (!consumerFeedback.certificate) return;
                            if (typeof window === 'undefined') return;
                            const origin = window.location?.origin || '';
                            if (navigator.share) {
                              navigator.share({
                                title: t('growerPages.portalCertTitle'),
                                text: consumerFeedback.certificate.socialMediaText,
                                url: origin + consumerFeedback.certificate.shareableUrl,
                              });
                            } else if (navigator.clipboard) {
                              void navigator.clipboard.writeText(consumerFeedback.certificate.socialMediaText);
                              success(t('grower.profilePage.alertCertCopied'));
                            }
                          }}
                          className="px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#23471f] transition-colors"
                        >
                          {t('growerPages.portalShareCert')}
                        </button>
                        {consumerFeedback.certificate && (
                          <a
                            href={consumerFeedback.certificate.shareableUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {t('growerPages.portalViewCert')}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 font-light">{t('growerPages.portalNoFeedback')}</p>
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
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('growerPages.portalFinancialTitle')}</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-base text-gray-600 mb-1">{t('growerPages.portalPaymentStatus')}</p>
                <p className={`text-lg font-bold ${
                  financialStatus.paymentStatus === 'PROCESSING' ? 'text-[#2D5A27]' :
                  financialStatus.paymentStatus === 'AWAITING_APPROVAL' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {financialStatus.paymentStatusMessage}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-base text-gray-600 mb-1">{t('growerPages.portalTotalAmount')}</p>
                  <p className="text-lg font-bold text-gray-900">
                    €{financialStatus.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-base text-gray-600 mb-1">{t('growerPages.portalPaid')}</p>
                  <p className="text-lg font-bold text-[#2D5A27]">
                    €{financialStatus.paidAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-base text-gray-600 mb-1">{t('growerPages.portalPending')}</p>
                  <p className="text-lg font-bold text-yellow-600">
                    €{financialStatus.pendingAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </GrowerPageShell>
    </SidebarLayout>
    <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
