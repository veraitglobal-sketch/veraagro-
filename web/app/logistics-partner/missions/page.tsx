'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { missionsAPI } from '@/lib/api';

const navItems = [
  { href: '/logistics-partner/dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/logistics-partner/missions', label: 'Missions', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { href: '/logistics-partner/handover', label: 'Loading Handover', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
];

const LOADING_STATUSES = ['READY_FOR_LOADING', 'ACCEPTED', 'IN_PROGRESS', 'ASSIGNED'];
const ACTIVE_STATUSES = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT', 'READY_FOR_LOADING'];

interface Mission {
  id: string;
  missionNumber: string;
  status: string;
  pickupAddress: string;
  batchId?: string | null;
  estimatedPickupTime?: string | null;
  batches?: { batchId?: string; productName?: string; quantity?: number } | null;
}

export default function LogisticsMissionsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    let cancelled = false;
    missionsAPI
      .getMyMissions()
      .then((data: Mission[]) => {
        if (!cancelled) setMissions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load missions');
          setMissions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.roles]);

  const acceptedMissions = missions.filter((m) => ACTIVE_STATUSES.includes(m.status));
  const availableMissions = missions.filter((m) => m.status === 'PENDING');

  const isLoadingStatus = (s: string) => LOADING_STATUSES.includes(s);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarLayout title="Missions" navItems={navItems}>
      <div className="space-y-6">
        {/* Accepted / Active Missions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivne misije</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : acceptedMissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No active missions.</p>
          ) : (
            <div className="space-y-4">
              {acceptedMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#2D5A27]/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900">{mission.missionNumber}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isLoadingStatus(mission.status) ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isLoadingStatus(mission.status) ? 'Loading' : 'In transit'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        <strong>{mission.pickupAddress}</strong> → Hamburg
                      </p>
                      {mission.batches?.batchId && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Batch {mission.batches.batchId}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={isLoadingStatus(mission.status) ? '/logistics-partner/handover' : '/logistics-partner/dashboard'}
                        className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f]"
                      >
                        {isLoadingStatus(mission.status) ? 'Handover' : 'Dashboard'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Available Missions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available missions</h2>
          {availableMissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No missions available right now.</p>
          ) : (
            <div className="space-y-4">
              {availableMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#2D5A27]/30 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs font-medium text-gray-500">Mission #{mission.missionNumber}</span>
                      <p className="text-sm text-gray-800 mt-1">
                        <strong>{mission.pickupAddress}</strong> → Hamburg
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {mission.estimatedPickupTime && (
                          <span>Pickup: {new Date(mission.estimatedPickupTime).toLocaleDateString('en-US')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href="/logistics-partner/missions"
                        className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f]"
                      >
                        Prihvati (Accept via app)
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
