'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import type { CommercialAgentPublic } from '@/lib/auth';
import { missionsAPI, usersAPI } from '@/lib/api';
import AssignedAgentCard from '@/components/AssignedAgentCard';
import { logisticsPartnerNavItems as navItems } from '@/lib/logistics-nav';

// Mission statuses that indicate loading / handover needed
const LOADING_STATUSES = ['READY_FOR_LOADING', 'ACCEPTED', 'IN_PROGRESS', 'ASSIGNED'];
const IN_TRANSIT_STATUSES = ['PICKED_UP', 'IN_TRANSIT'];

function mapMissionToUiStatus(status: string): 'loading' | 'in_transit' | 'at_delivery' | string {
  if (LOADING_STATUSES.includes(status)) return 'loading';
  if (IN_TRANSIT_STATUSES.includes(status)) return 'in_transit';
  return status;
}

function getStatusLabel(status: string): string {
  const ui = mapMissionToUiStatus(status);
  if (ui === 'loading') return 'Loading';
  if (ui === 'in_transit') return 'In transit';
  if (ui === 'at_delivery') return 'Delivery';
  return status.replace(/_/g, ' ');
}

function isActiveMission(status: string): boolean {
  return !['PENDING', 'COMPLETED', 'CANCELLED'].includes(status);
}

function getProgress(status: string): number {
  if (LOADING_STATUSES.includes(status)) return 0;
  if (status === 'PICKED_UP') return 50;
  if (status === 'IN_TRANSIT') return 75;
  if (status === 'COMPLETED') return 100;
  return 25;
}

interface Mission {
  id: string;
  missionNumber: string;
  status: string;
  pickupAddress: string;
  batchId?: string | null;
  estimatedPickupTime?: string | null;
  completedAt?: string | null;
  batches?: { batchId?: string; productName?: string; quantity?: number } | null;
}

export default function LogisticsDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<CommercialAgentPublic | null | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  // Auth guard
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login/producer');
      return;
    }
    const roles = user?.roles && Array.isArray(user.roles) ? user.roles : [];
    if (!roles.includes('LOGISTICS_PARTNER')) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch missions
  useEffect(() => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    let cancelled = false;
    missionsAPI
      .getMyMissions('logistics')
      .then((data: Mission[]) => {
        if (!cancelled) {
          setMissions(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load missions');
          setMissions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.roles]);

  const activeMissions = missions.filter((m) => isActiveMission(m.status));
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const completedThisWeek = missions.filter(
    (m) => m.status === 'COMPLETED' && m.completedAt && new Date(m.completedAt) >= weekStart
  ).length;

  const partnerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Logistics Partner' : 'Logistics Partner';

  const getStatusStyles = (status: string) => {
    const ui = mapMissionToUiStatus(status);
    switch (ui) {
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'loading':
        return 'bg-amber-100 text-amber-800';
      case 'at_delivery':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEta = (eta: string | null | undefined) => {
    if (!eta) return '—';
    const d = new Date(eta);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarLayout title="Logistics Dashboard" navItems={navItems}>
      <div className="space-y-6">
        {assignedAgent !== undefined && <AssignedAgentCard agent={assignedAgent} />}

        {/* Partner Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#2D5A27]/10 to-[#2D5A27]/5 rounded-lg shadow-sm border border-[#2D5A27]/20 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{partnerName}</h2>
              <p className="text-gray-700">Cold chain transport</p>
            </div>
            <span className="px-3 py-1 bg-[#2D5A27] text-white text-sm font-medium rounded-full">Active</span>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">Active tours</p>
            <p className="text-2xl font-semibold text-[#2D5A27]">{loading ? '—' : activeMissions.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">Completed this week</p>
            <p className="text-2xl font-semibold text-gray-900">{loading ? '—' : completedThisWeek}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">Total missions</p>
            <p className="text-2xl font-semibold text-gray-900">{loading ? '—' : missions.length}</p>
          </motion.div>
        </div>

        {/* Active Tours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active tours</h2>
            <Link
              href="/logistics-partner/missions"
              className="text-sm text-[#2D5A27] hover:text-[#23471f] font-medium"
            >
              All missions →
            </Link>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading missions...</div>
          ) : activeMissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <p className="font-medium">No active tours</p>
              <p className="text-sm mt-1">New tours will appear in the Missions tab</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeMissions.map((mission) => {
                const uiStatus = mapMissionToUiStatus(mission.status);
                const batchId = mission.batches?.batchId || mission.batchId || '—';
                return (
                  <div
                    key={mission.id}
                    className="border border-gray-200 rounded-lg p-5 hover:border-[#2D5A27]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">{mission.missionNumber}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles(mission.status)}`}>
                            {getStatusLabel(mission.status)}
                          </span>
                          <span className="text-xs text-gray-500">Batch {batchId}</span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-[#2D5A27] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                              <p className="text-xs text-gray-500">Pickup</p>
                              <p className="text-gray-800">{mission.pickupAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <div>
                              <p className="text-xs text-gray-500">Destination</p>
                              <p className="text-gray-800">Hamburg</p>
                            </div>
                          </div>
                        </div>

                        {(uiStatus === 'in_transit' || uiStatus === 'at_delivery') && (
                          <div className="pt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{getProgress(mission.status)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#2D5A27] rounded-full transition-all"
                                style={{ width: `${getProgress(mission.status)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end lg:text-right">
                        <div>
                          <p className="text-xs text-gray-500">ETA</p>
                          <p className="font-medium text-gray-900">{formatEta(mission.estimatedPickupTime)}</p>
                        </div>
                        {uiStatus === 'loading' ? (
                          <Link
                            href="/logistics-partner/handover"
                            className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors text-center"
                          >
                            Loading Handover
                          </Link>
                        ) : (
                          <Link
                            href={`/track/${batchId}`}
                            className="px-4 py-2 border border-[#2D5A27] text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/10 transition-colors text-center"
                          >
                            Track
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Handover Reminder */}
        {activeMissions.some((m) => mapMissionToUiStatus(m.status) === 'loading') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg"
          >
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Loading in progress</p>
                <p className="text-sm text-amber-700 mt-1">
                  One or more tours are waiting for temperature verification. Check the truck temperature and complete Loading Handover.
                </p>
                <Link
                  href="/logistics-partner/handover"
                  className="inline-block mt-2 text-sm font-medium text-amber-800 hover:text-amber-900"
                >
                  Go to Loading Handover →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </SidebarLayout>
  );
}
