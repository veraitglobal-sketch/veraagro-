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

export default function LogisticsDashboardPage() {
  const [partnerProfile] = useState({
    name: 'TransBalkan Logistics',
    vehicles: 3,
    status: 'Active',
  });

  const [activeTours] = useState([
    {
      id: 'TOUR-2024-042',
      missionNumber: 'M-2024-001',
      batchId: 'BATCH-2024-001',
      pickup: 'Skopje Farm Hub, North Macedonia',
      destination: 'European Distribution Hub, Hamburg',
      status: 'in_transit',
      statusLabel: 'U putu',
      progress: 65,
      temperature: '4.2°C',
      temperatureOk: true,
      eta: '2024-01-10T18:30:00',
      pallets: 12,
      distance: '1,450 km',
    },
    {
      id: 'TOUR-2024-041',
      missionNumber: 'M-2024-002',
      batchId: 'BATCH-2024-002',
      pickup: 'Belgrade Logistics Center',
      destination: 'Hamburg Retail Hub',
      status: 'loading',
      statusLabel: 'Utovar',
      progress: 0,
      temperature: '5.1°C',
      temperatureOk: true,
      eta: '2024-01-11T14:00:00',
      pallets: 8,
      distance: '1,320 km',
    },
    {
      id: 'TOUR-2024-040',
      missionNumber: 'M-2024-003',
      batchId: 'BATCH-2024-003',
      pickup: 'Sofia Cold Store, Bulgaria',
      destination: 'European Distribution Hub, Hamburg',
      status: 'at_delivery',
      statusLabel: 'Isporuka',
      progress: 95,
      temperature: '3.8°C',
      temperatureOk: true,
      eta: '2024-01-10T16:00:00',
      pallets: 6,
      distance: '1,680 km',
    },
  ]);

  const [weeklyStats] = useState({
    completedTours: 5,
    activeTours: 3,
    earnings: 2840,
    nextPayout: '2024-01-15',
  });

  const getStatusStyles = (status: string) => {
    switch (status) {
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

  const formatEta = (eta: string) => {
    const d = new Date(eta);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SidebarLayout title="Logistics Dashboard" navItems={navItems}>
      <div className="space-y-6">
        {/* Partner Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#2D5A27]/10 to-[#2D5A27]/5 rounded-lg shadow-sm border border-[#2D5A27]/20 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{partnerProfile.name}</h2>
              <p className="text-gray-700">
                {partnerProfile.vehicles} vozila • Cold chain transport
              </p>
            </div>
            <span className="px-3 py-1 bg-[#2D5A27] text-white text-sm font-medium rounded-full">
              {partnerProfile.status}
            </span>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">Aktivne ture</p>
            <p className="text-2xl font-semibold text-[#2D5A27]">{weeklyStats.activeTours}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">Završene ove nedelje</p>
            <p className="text-2xl font-semibold text-gray-900">{weeklyStats.completedTours}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">Zarada (nedelja)</p>
            <p className="text-2xl font-semibold text-[#2D5A27]">€{weeklyStats.earnings.toLocaleString()}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">Sledeća isplata</p>
            <p className="text-2xl font-semibold text-gray-900">
              {new Date(weeklyStats.nextPayout).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            </p>
          </motion.div>
        </div>

        {/* Active Tours - Main Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Aktivne ture</h2>
            <Link
              href="/logistics-partner/missions"
              className="text-sm text-[#2D5A27] hover:text-[#23471f] font-medium"
            >
              Sve misije →
            </Link>
          </div>

          {activeTours.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <p className="font-medium">Nema aktivnih tura</p>
              <p className="text-sm mt-1">Nove ture će se pojaviti u tabu Missions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTours.map((tour) => (
                <div
                  key={tour.id}
                  className="border border-gray-200 rounded-lg p-5 hover:border-[#2D5A27]/30 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{tour.id}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles(tour.status)}`}>
                          {tour.statusLabel}
                        </span>
                        <span className="text-xs text-gray-500">Batch {tour.batchId}</span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-[#2D5A27] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Pickup</p>
                            <p className="text-gray-800">{tour.pickup}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <div>
                            <p className="text-xs text-gray-500">Destinacija</p>
                            <p className="text-gray-800">{tour.destination}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2">
                        <span>{tour.pallets} paleta</span>
                        <span>•</span>
                        <span>{tour.distance}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {tour.temperatureOk ? (
                            <span className="text-[#2D5A27]">✓ {tour.temperature}</span>
                          ) : (
                            <span className="text-red-600">⚠ {tour.temperature}</span>
                          )}
                        </span>
                      </div>

                      {tour.status === 'in_transit' || tour.status === 'at_delivery' ? (
                        <div className="pt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Napredak</span>
                            <span>{tour.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2D5A27] rounded-full transition-all"
                              style={{ width: `${tour.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end lg:text-right">
                      <div>
                        <p className="text-xs text-gray-500">ETA</p>
                        <p className="font-medium text-gray-900">{formatEta(tour.eta)}</p>
                      </div>
                      {tour.status === 'loading' ? (
                        <Link
                          href="/logistics-partner/handover"
                          className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors text-center"
                        >
                          Loading Handover
                        </Link>
                      ) : (
                        <Link
                          href={`/track/${tour.batchId}`}
                          className="px-4 py-2 border border-[#2D5A27] text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/10 transition-colors text-center"
                        >
                          Praćenje
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Handover Reminder */}
        {activeTours.some((t) => t.status === 'loading') && (
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
                <p className="text-sm font-medium text-amber-800">Utovar u toku</p>
                <p className="text-sm text-amber-700 mt-1">
                  Jedna ili više tura čeka verifikaciju temperature. Proverite temperaturu kamiona i završite Loading Handover.
                </p>
                <Link
                  href="/logistics-partner/handover"
                  className="inline-block mt-2 text-sm font-medium text-amber-800 hover:text-amber-900"
                >
                  Idi na Loading Handover →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </SidebarLayout>
  );
}
