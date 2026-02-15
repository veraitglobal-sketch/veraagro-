'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';

const navItems = [
  { href: '/logistics-partner/dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/logistics-partner/missions', label: 'Missions', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { href: '/logistics-partner/handover', label: 'Loading Handover', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
];

export default function LogisticsMissionsPage() {
  const [acceptedMissions] = useState([
    {
      id: 'M-2024-001',
      batchId: 'BATCH-2024-001',
      pickup: 'Skopje Farm Hub, North Macedonia',
      destination: 'European Distribution Hub, Hamburg',
      status: 'in_transit',
      pallets: 12,
      distance: '1,450 km',
      payout: 1850,
    },
    {
      id: 'M-2024-002',
      batchId: 'BATCH-2024-002',
      pickup: 'Belgrade Logistics Center',
      destination: 'Hamburg Retail Hub',
      status: 'loading',
      pallets: 8,
      distance: '1,320 km',
      payout: 1420,
    },
  ]);

  const [availableMissions] = useState([
    {
      id: 'M-2024-004',
      pickup: 'Zagreb Cold Store, Croatia',
      destination: 'European Distribution Hub, Hamburg',
      pallets: 10,
      distance: '1,020 km',
      payout: 1580,
      pickupDate: '2024-01-12',
    },
    {
      id: 'M-2024-005',
      pickup: 'Bucharest Hub, Romania',
      destination: 'Hamburg Retail Hub',
      pallets: 6,
      distance: '1,580 km',
      payout: 1340,
      pickupDate: '2024-01-13',
    },
  ]);

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
          {acceptedMissions.length === 0 ? (
            <p className="text-gray-500 text-sm">Nema aktivnih misija.</p>
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
                        <span className="text-sm font-semibold text-gray-900">{mission.id}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          mission.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {mission.status === 'in_transit' ? 'U putu' : 'Utovar'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        <strong>{mission.pickup}</strong> → {mission.destination}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>{mission.pallets} paleta</span>
                        <span>•</span>
                        <span>{mission.distance}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-[#2D5A27]">€{mission.payout}</p>
                      <Link
                        href={mission.status === 'loading' ? '/logistics-partner/handover' : '/logistics-partner/dashboard'}
                        className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f]"
                      >
                        {mission.status === 'loading' ? 'Handover' : 'Dashboard'}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dostupne misije</h2>
          {availableMissions.length === 0 ? (
            <p className="text-gray-500 text-sm">Trenutno nema dostupnih misija.</p>
          ) : (
            <div className="space-y-4">
              {availableMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#2D5A27]/30 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs font-medium text-gray-500">Mission #{mission.id}</span>
                      <p className="text-sm text-gray-800 mt-1">
                        <strong>{mission.pickup}</strong> → {mission.destination}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>{mission.pallets} paleta</span>
                        <span>•</span>
                        <span>{mission.distance}</span>
                        <span>•</span>
                        <span>Pickup: {new Date(mission.pickupDate).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-[#2D5A27]">€{mission.payout}</p>
                      <button className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f]">
                        Prihvati
                      </button>
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
