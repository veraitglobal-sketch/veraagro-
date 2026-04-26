'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { missionsAPI } from '@/lib/api';
import { WEB_API_BASE } from '@/lib/api-base';

const navItems = [
  { href: '/logistics-partner/dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/logistics-partner/missions', label: 'Missions', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { href: '/logistics-partner/handover', label: 'Loading Handover', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
];

const LOADING_STATUSES = ['READY_FOR_LOADING', 'ACCEPTED', 'IN_PROGRESS', 'ASSIGNED'];

interface Mission {
  id: string;
  missionNumber: string;
  status: string;
  batchId?: string | null;
  batches?: { batchId?: string } | null;
}

export default function LogisticsHandoverPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<string>('');
  const [truckTemperature, setTruckTemperature] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [temperatureStatus, setTemperatureStatus] = useState<'valid' | 'invalid' | null>(null);

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
        if (!cancelled) {
          const needHandover = (Array.isArray(data) ? data : []).filter((m) =>
            LOADING_STATUSES.includes(m.status)
          );
          setMissions(needHandover);
        }
      })
      .catch(() => {
        if (!cancelled) setMissions([]);
      })
      .finally(() => {
        if (!cancelled) setMissionsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.roles]);

  const STANDARD_TEMP_MIN = 2; // °C
  const STANDARD_TEMP_MAX = 8; // °C

  useEffect(() => {
    if (truckTemperature) {
      const temp = parseFloat(truckTemperature);
      if (temp >= STANDARD_TEMP_MIN && temp <= STANDARD_TEMP_MAX) {
        setTemperatureStatus('valid');
      } else {
        setTemperatureStatus('invalid');
      }
    } else {
      setTemperatureStatus(null);
    }
  }, [truckTemperature]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!selectedMission) {
      setError('Please select a mission');
      setSubmitting(false);
      return;
    }

    const temp = parseFloat(truckTemperature);
    if (temp < STANDARD_TEMP_MIN || temp > STANDARD_TEMP_MAX) {
      setError(
        `Truck temperature (${temp}°C) is outside standard range (${STANDARD_TEMP_MIN}°C - ${STANDARD_TEMP_MAX}°C). Loading is blocked. Please adjust temperature before proceeding.`
      );
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/quality-entry/handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          missionId: selectedMission,
          insideTruckTemperature: temp,
          notes: notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete handover');
      }

      setSuccess(true);
      setTimeout(() => {
        setSelectedMission('');
        setTruckTemperature('');
        setNotes('');
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete handover');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarLayout title="Loading Handover" navItems={navItems}>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg"
        >
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Temperature Standard</p>
              <p className="text-sm text-blue-700 mt-1">
                Truck temperature must be between {STANDARD_TEMP_MIN}°C and {STANDARD_TEMP_MAX}°C before loading can proceed.
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-[#2D5A27]/10 border border-[#2D5A27]/30 rounded-lg"
          >
            <p className="text-sm text-[#23471f]">
              ✓ Truck temperature verified. Loading can proceed.
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Logistics Handover</h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter the inside truck temperature before loading. Loading will be blocked if temperature is outside standard range.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mission Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Mission *
              </label>
              <select
                value={selectedMission}
                onChange={(e) => setSelectedMission(e.target.value)}
                required
                disabled={missionsLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              >
                <option value="">{missionsLoading ? 'Loading...' : missions.length === 0 ? 'No missions awaiting handover' : '-- Select Mission --'}</option>
                {missions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.missionNumber} - Batch {mission.batches?.batchId || mission.batchId || '—'}
                  </option>
                ))}
              </select>
            </div>

            {/* Inside Truck Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inside Truck Temperature (°C) *
              </label>
              <input
                type="number"
                value={truckTemperature}
                onChange={(e) => setTruckTemperature(e.target.value)}
                required
                min="-10"
                max="15"
                step="0.1"
                className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:border-transparent ${
                  temperatureStatus === 'valid'
                    ? 'border-[#2D5A27] bg-[#2D5A27]/10 focus:ring-[#2D5A27]'
                    : temperatureStatus === 'invalid'
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-[#2D5A27]'
                }`}
                placeholder="e.g., 4.5"
              />
              {truckTemperature && (
                <div className="mt-2">
                  {temperatureStatus === 'valid' ? (
                    <p className="text-sm text-[#2D5A27] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Temperature is within standard range ({STANDARD_TEMP_MIN}°C - {STANDARD_TEMP_MAX}°C)
                    </p>
                  ) : temperatureStatus === 'invalid' ? (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Temperature is outside standard range. Loading is blocked. Please adjust temperature.
                    </p>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Standard range: {STANDARD_TEMP_MIN}°C - {STANDARD_TEMP_MAX}°C
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                placeholder="Any additional information..."
              />
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={submitting || temperatureStatus !== 'valid'}
                className="w-full px-6 py-3 bg-[#2D5A27] text-white font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Verifying...' : 'Verify Temperature & Proceed'}
              </button>
              {temperatureStatus === 'invalid' && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Cannot proceed: Temperature must be within standard range
                </p>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
