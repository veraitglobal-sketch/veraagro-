'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { formatDateEn } from '@/lib/en-locale-dates';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useFleetPartnerNavItems } from '@/lib/fleet-partner-nav';

export default function FleetPartnerPage() {
  const { t } = useTranslation();
  const navItems = useFleetPartnerNavItems();
  const [companyProfile] = useState({
    name: 'Hans Logistics',
    fleetSize: 5,
    vehicleType: 'Refrigerated vans',
    status: 'Active',
  });

  const [alerts] = useState([
    {
      id: 1,
      type: 'assignment',
      message: 'Truck T-456 arriving at European Hub in 1 hour',
      timestamp: new Date(),
      missionId: 'M-2024-001',
    },
  ]);

  const [availableMissions] = useState([
    {
      id: 'LD-001',
      pickup: 'European Distribution Hub',
      delivery: '3 Rewe locations',
      pallets: 4,
      distance: '45 km',
      payout: 180,
      status: 'available',
      estimatedTime: '2.5 hours',
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
    },
  ]);

  const [activeDeliveries] = useState([
    {
      id: 'DLV-001',
      missionId: 'LD-001',
      pickup: 'European Distribution Hub',
      delivery: ['Rewe Store A', 'Rewe Store B', 'Rewe Store C'],
      status: 'in_transit',
      progress: 2,
      total: 3,
    },
  ]);

  const [weeklyPayout] = useState({
    currentWeek: 1245,
    completedDeliveries: 8,
    pendingPayout: 320,
    nextPayoutDate: '2024-01-15',
  });

  return (
    <SidebarLayout title={t('internalShell.titles.fleetDashboard')} navItems={navItems}>
      <div className="space-y-6">
        {/* Company Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{companyProfile.name}</h2>
              <p className="text-gray-700">
                {companyProfile.fleetSize} {companyProfile.vehicleType}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
                {companyProfile.status}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Real-Time Alerts */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">New Assignment Alert</h3>
                <p className="mt-1 text-sm text-yellow-700">{alerts[0].message}</p>
                <button className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900">
                  View Mission →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">Available Missions</p>
            <p className="text-2xl font-semibold text-gray-900">{availableMissions.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">Active Deliveries</p>
            <p className="text-2xl font-semibold text-gray-900">{activeDeliveries.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <p className="text-sm text-gray-500 mb-1">This Week's Earnings</p>
            <p className="text-2xl font-semibold text-green-600">€{weeklyPayout.currentWeek}</p>
          </motion.div>
        </div>

        {/* Available Missions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Available Local Drops</h2>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">
              View All →
            </button>
          </div>
          <div className="space-y-4">
            {availableMissions.map((mission) => (
              <div
                key={mission.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">Mission #{mission.id}</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Available
                      </span>
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
                  <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                    Accept Mission
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Deliveries</h2>
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <div key={delivery.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">Delivery #{delivery.id}</p>
                      <p className="text-sm text-gray-500">Mission: {delivery.missionId}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      In Transit
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Pickup:</strong> {delivery.pickup}
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600"><strong>Deliveries:</strong></p>
                      {delivery.delivery.map((loc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className={`w-2 h-2 rounded-full ${
                            idx < delivery.progress ? 'bg-green-500' : idx === delivery.progress ? 'bg-blue-500' : 'bg-gray-300'
                          }`}></span>
                          <span>{loc}</span>
                          {idx < delivery.progress && (
                            <span className="text-green-600 text-xs">✓ Delivered</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <button className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                      Complete Delivery & Upload POD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Payout Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout Tracker</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">This Week</p>
              <p className="text-2xl font-bold text-gray-900">€{weeklyPayout.currentWeek}</p>
              <p className="text-xs text-gray-500 mt-1">{weeklyPayout.completedDeliveries} completed deliveries</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Pending Payout</p>
              <p className="text-2xl font-bold text-green-600">€{weeklyPayout.pendingPayout}</p>
              <p className="text-xs text-gray-500 mt-1">Next payout: {formatDateEn(weeklyPayout.nextPayoutDate)}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
