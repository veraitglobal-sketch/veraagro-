'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/fleet-partner', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/fleet-partner/missions', label: 'Mission Board', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { href: '/fleet-partner/deliveries', label: 'Active Deliveries', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: '/fleet-partner/payouts', label: 'Payout Tracker', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: '/fleet-partner/profile', label: 'Company Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
];

export default function MissionBoardPage() {
  const [availableMissions] = useState([
    {
      id: 'LD-001',
      pickup: 'Hamburg Grossmarkt Gate 2',
      delivery: '3 Rewe locations',
      pallets: 4,
      distance: '45 km',
      payout: 180,
      status: 'available',
      estimatedTime: '2.5 hours',
      truckArrival: '2024-01-10T15:30:00',
      readyTime: '2024-01-10T16:30:00',
    },
    {
      id: 'LD-002',
      pickup: 'Munich Hub Dock 3',
      delivery: '2 Edeka stores',
      pallets: 3,
      distance: '32 km',
      payout: 145,
      status: 'available',
      estimatedTime: '2 hours',
      truckArrival: '2024-01-10T17:00:00',
      readyTime: '2024-01-10T18:00:00',
    },
    {
      id: 'LD-003',
      pickup: 'Berlin Hub Gate 1',
      delivery: '4 Rewe locations',
      pallets: 6,
      distance: '58 km',
      payout: 240,
      status: 'alert', // Truck arriving soon
      estimatedTime: '3 hours',
      truckArrival: '2024-01-10T14:00:00',
      readyTime: '2024-01-10T15:00:00',
    },
  ]);

  const [acceptedMissions] = useState([
    {
      id: 'LD-004',
      pickup: 'Frankfurt Hub Dock 2',
      delivery: '2 Rewe stores',
      pallets: 3,
      distance: '28 km',
      payout: 135,
      status: 'accepted',
      acceptedAt: '2024-01-10T12:00:00',
    },
  ]);

  const handleAcceptMission = (missionId: string) => {
    alert(`Mission ${missionId} accepted! Please have your van ready at the loading dock.`);
  };

  const getTimeUntilArrival = (arrivalTime: string) => {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diff = arrival.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff < 0) return 'Arrived';
    if (hours < 1) return `${minutes} minutes`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <SidebarLayout title="Mission Board" navItems={navItems}>
      <div className="space-y-6">
        {/* Real-Time Alerts */}
        {availableMissions.filter(m => m.status === 'alert').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Truck Arriving Soon</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Have your vans ready at the loading dock. Truck will arrive in approximately 1 hour.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Available Missions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Local Drops</h2>
          <div className="space-y-4">
            {availableMissions.map((mission) => (
              <div
                key={mission.id}
                className={`border rounded-lg p-4 transition-all ${
                  mission.status === 'alert'
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">Mission #{mission.id}</span>
                      {mission.status === 'alert' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Truck Arriving Soon
                        </span>
                      )}
                      {mission.status === 'available' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Available
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700"><strong>Pickup:</strong> {mission.pickup}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-700"><strong>Deliver:</strong> {mission.delivery}</span>
                      </div>
                      {mission.status === 'alert' && (
                        <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                          <strong>Truck Arrival:</strong> {getTimeUntilArrival(mission.truckArrival)} • 
                          <strong> Be Ready:</strong> {new Date(mission.readyTime).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">€{mission.payout}</p>
                    <p className="text-xs text-gray-500">Payout</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{mission.pallets} pallets</span>
                    <span>•</span>
                    <span>{mission.distance}</span>
                    <span>•</span>
                    <span>{mission.estimatedTime}</span>
                  </div>
                  <button
                    onClick={() => handleAcceptMission(mission.id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Accept Mission
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Accepted Missions */}
        {acceptedMissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accepted Missions</h2>
            <div className="space-y-4">
              {acceptedMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500">Mission #{mission.id}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Accepted
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        <strong>Pickup:</strong> {mission.pickup} • <strong>Deliver:</strong> {mission.delivery}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Accepted: {new Date(mission.acceptedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">€{mission.payout}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </SidebarLayout>
  );
}
