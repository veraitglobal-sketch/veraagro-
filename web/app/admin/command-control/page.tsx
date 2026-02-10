'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { getAdminNavItems } from '@/lib/admin-nav';

export default function CommandControlPage() {
  const adminNavItems = getAdminNavItems();
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState({ paused: false });
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
    fetchActiveMissions();
    fetchViolations();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/command-control/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  const fetchActiveMissions = async () => {
    // Mock data for now
    setActiveMissions([
      { id: 'M-001', driver: 'Hans Logistics', status: 'in_transit', delay: 5, location: 'Hamburg' },
      { id: 'M-002', driver: 'Berlin Express', status: 'in_transit', delay: 0, location: 'Berlin' },
    ]);
    setLoading(false);
  };

  const fetchViolations = async () => {
    // Mock data for now
    setViolations([
      { id: 'V-001', type: 'route_deviation', mission: 'M-001', driver: 'Hans Logistics', deviation: '2.5km', timestamp: new Date() },
      { id: 'V-002', type: 'late_arrival', mission: 'M-003', driver: 'Munich Delivery', delay: '18 mins', timestamp: new Date() },
    ]);
  };

  const handlePauseSystem = async () => {
    try {
      const token = localStorage.getItem('token');
      const reason = prompt('Enter reason for pausing system:');
      if (!reason) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/command-control/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        setSystemStatus({ paused: true });
        alert('System paused successfully');
      }
    } catch (error) {
      console.error('Error pausing system:', error);
    }
  };

  const handleResumeSystem = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/command-control/resume`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSystemStatus({ paused: false });
        alert('System resumed successfully');
      }
    } catch (error) {
      console.error('Error resuming system:', error);
    }
  };

  const handleReassignMission = async (missionId: string) => {
    const newDriverId = prompt('Enter new driver ID:');
    const reason = prompt('Enter reassignment reason:');
    if (!newDriverId || !reason) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/command-control/reassign/${missionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newDriverId, reason }),
      });

      if (response.ok) {
        alert('Mission reassigned successfully');
        fetchActiveMissions();
      }
    } catch (error) {
      console.error('Error reassigning mission:', error);
    }
  };

  if (loading) {
    return (
        <SidebarLayout title="Command & Control" navItems={adminNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
        <SidebarLayout title="Command & Control" navItems={adminNavItems}>
      <div className="space-y-6">
        {/* System Status & Kill-Switch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg shadow-sm border p-6 ${
            systemStatus.paused
              ? 'bg-red-50 border-red-200'
              : 'bg-[#2D5A27]/10 border-[#2D5A27]/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">System Status</h2>
              <p className={`text-sm font-medium ${
                systemStatus.paused ? 'text-red-700' : 'text-[#2D5A27]'
              }`}>
                {systemStatus.paused ? '⛔ PAUSED' : '✓ OPERATIONAL'}
              </p>
            </div>
            <div className="flex gap-3">
              {systemStatus.paused ? (
                <button
                  onClick={handleResumeSystem}
                  className="px-6 py-3 bg-[#2D5A27] text-white font-medium rounded-lg hover:bg-[#23471f] transition-colors"
                >
                  Resume System
                </button>
              ) : (
                <button
                  onClick={handlePauseSystem}
                  className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  ⛔ Pause System
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Active Missions with Live Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Missions</h2>
          <div className="space-y-3">
            {activeMissions.map((mission) => (
              <div
                key={mission.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-gray-900">Mission {mission.id}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      mission.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mission.status}
                    </span>
                    {mission.delay > 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        {mission.delay} min delay
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Driver: {mission.driver} • Location: {mission.location}</p>
                </div>
                <button
                  onClick={() => handleReassignMission(mission.id)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reassign
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Violations & Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Violations</h2>
          <div className="space-y-3">
            {violations.map((violation) => (
              <div
                key={violation.id}
                className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{violation.type.replace('_', ' ').toUpperCase()}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(violation.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  Mission: {violation.mission} • Driver: {violation.driver}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {violation.type === 'route_deviation' && `Deviation: ${violation.deviation}`}
                  {violation.type === 'late_arrival' && `Delay: ${violation.delay}`}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trust Score Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Partners Blocked</p>
              <p className="text-2xl font-bold text-red-600">3</p>
              <p className="text-xs text-gray-500 mt-1">Score &lt; 70</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">At Risk</p>
              <p className="text-2xl font-bold text-yellow-600">7</p>
              <p className="text-xs text-gray-500 mt-1">Score 70-80</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Healthy</p>
              <p className="text-2xl font-bold text-[#2D5A27]">42</p>
              <p className="text-xs text-gray-500 mt-1">Score &gt; 80</p>
            </div>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
