'use client';

import { useState, useEffect, useCallback } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { getAdminNavItems } from '@/lib/admin-nav';
import Link from 'next/link';
import { commandControlAPI } from '@/lib/api';

type LiveMission = {
  id: string;
  missionNumber: string;
  status: string;
  pickupAddress: string;
  driverName: string;
};

type ViolationRow = {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  summary: string;
  timestamp: string;
};

export default function CommandControlPage() {
  const adminNavItems = getAdminNavItems();
  const [systemStatus, setSystemStatus] = useState({ paused: false });
  const [activeMissions, setActiveMissions] = useState<LiveMission[]>([]);
  const [violations, setViolations] = useState<ViolationRow[]>([]);
  const [trustSummary, setTrustSummary] = useState({ blocked: 0, atRisk: 0, healthy: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const d = await commandControlAPI.getDashboard();
      setSystemStatus({ paused: Boolean(d?.paused) });
      setActiveMissions(Array.isArray(d?.missions) ? d.missions : []);
      setViolations(Array.isArray(d?.violations) ? d.violations : []);
      if (d?.trustSummary) {
        setTrustSummary({
          blocked: d.trustSummary.blocked ?? 0,
          atRisk: d.trustSummary.atRisk ?? 0,
          healthy: d.trustSummary.healthy ?? 0,
        });
      }
    } catch (e: unknown) {
      console.error('Command control dashboard', e);
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handlePauseSystem = async () => {
    try {
      const reason = prompt('Enter reason for pausing system:');
      if (!reason) return;
      await commandControlAPI.pause(reason);
      setSystemStatus({ paused: true });
      await loadDashboard();
      alert('System paused successfully');
    } catch (error) {
      console.error('Error pausing system:', error);
      alert('Could not pause (Super Admin only, or check your network).');
    }
  };

  const handleResumeSystem = async () => {
    try {
      await commandControlAPI.resume();
      setSystemStatus({ paused: false });
      await loadDashboard();
      alert('System resumed successfully');
    } catch (error) {
      console.error('Error resuming system:', error);
      alert('Could not resume (Super Admin only, or check your network).');
    }
  };

  const handleReassignMission = async (missionId: string) => {
    const newDriverId = prompt('Enter new logistics partner user ID:');
    const reason = prompt('Enter reassignment reason:');
    if (!newDriverId || !reason) return;
    try {
      await commandControlAPI.reassign(missionId, newDriverId, reason);
      alert('Mission reassigned successfully');
      await loadDashboard();
    } catch (error) {
      console.error('Error reassigning mission:', error);
      alert('Reassignment failed. Check partner ID and permissions.');
    }
  };

  if (loading) {
    return (
      <SidebarLayout title="Command & Control" navItems={adminNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Command & Control" navItems={adminNavItems}>
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* System Status & Kill-Switch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg shadow-sm border p-4 sm:p-5 ${
            systemStatus.paused ? 'bg-red-50 border-red-200' : 'bg-[#2D5A27]/10 border-[#2D5A27]/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-0.5">System status</h2>
              <p
                className={`text-sm font-medium ${
                  systemStatus.paused ? 'text-red-700' : 'text-[#2D5A27]'
                }`}
              >
                {systemStatus.paused ? '⛔ PAUSED' : '✓ OPERATIONAL'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {systemStatus.paused ? (
                <button
                  type="button"
                  onClick={handleResumeSystem}
                  className="px-4 py-2 text-sm bg-[#2D5A27] text-white font-medium rounded-lg hover:bg-[#23471f] transition-colors"
                >
                  Resume
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseSystem}
                  className="px-4 py-2 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Pause
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-semibold text-gray-900">Live missions</h2>
            <div className="flex items-center gap-2 shrink-0">
              {activeMissions.length > 0 && (
                <span className="text-xs tabular-nums text-gray-500">{activeMissions.length} open</span>
              )}
              <Link
                href="/admin/missions"
                className="text-xs font-medium text-[#2D5A27] hover:underline"
              >
                All missions
              </Link>
            </div>
          </div>
          {activeMissions.length === 0 ? (
            <p className="text-sm text-gray-500">No open missions (pending through in-transit).</p>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-md divide-y divide-gray-100">
              {activeMissions.slice(0, 12).map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-start sm:items-center justify-between gap-2 px-2 py-2 sm:py-1.5 hover:bg-gray-50/80"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-medium text-gray-900 tabular-nums">
                        {mission.missionNumber}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded bg-blue-100 text-blue-800">
                        {mission.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate" title={`${mission.driverName} · ${mission.pickupAddress}`}>
                      {mission.driverName} · {mission.pickupAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReassignMission(mission.id)}
                    className="shrink-0 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                  >
                    Reassign
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-3">Non-compliant audit</h2>
          {violations.length === 0 ? (
            <p className="text-sm text-gray-500">No recent non-compliant rows in the audit log.</p>
          ) : (
            <div className="space-y-3">
              {violations.map((violation) => (
                <div
                  key={violation.id}
                  className="p-3 border-l-4 border-red-500 bg-red-50 rounded-md"
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {String(violation.type).replace(/_/g, ' ')}
                    </p>
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(violation.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {violation.entityType} · {violation.entityId}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{violation.summary}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-3 sm:px-4 sm:py-3"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Trust score (accounts with a record)</h2>
          <div className="flex flex-wrap items-stretch divide-x divide-gray-200 rounded-md bg-gray-50 border border-gray-100">
            <div className="flex-1 min-w-[4.5rem] px-2 py-2 text-center">
              <p className="text-lg sm:text-xl font-bold tabular-nums text-red-600 leading-none">{trustSummary.blocked}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">&lt;70</p>
            </div>
            <div className="flex-1 min-w-[4.5rem] px-2 py-2 text-center">
              <p className="text-lg sm:text-xl font-bold tabular-nums text-yellow-600 leading-none">{trustSummary.atRisk}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">70–79</p>
            </div>
            <div className="flex-1 min-w-[4.5rem] px-2 py-2 text-center">
              <p className="text-lg sm:text-xl font-bold tabular-nums text-[#2D5A27] leading-none">{trustSummary.healthy}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">≥80</p>
            </div>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
