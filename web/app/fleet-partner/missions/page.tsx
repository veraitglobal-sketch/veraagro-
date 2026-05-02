'use client';

import { useState } from 'react';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useFleetPartnerNavItems } from '@/lib/fleet-partner-nav';

/** Set `true` to show sample rows for layout review only. Default `false` = real empty states + CTAs. */
const USE_FLEET_MISSION_DEMO_DATA = false;

type DemoMission = {
  id: string;
  pickup: string;
  delivery: string;
  pallets: number;
  distance: string;
  payout: number;
  status: 'available' | 'alert' | 'accepted';
  estimatedTime: string;
  truckArrival: string;
  readyTime: string;
  acceptedAt?: string;
};

const DEMO_AVAILABLE: DemoMission[] = [
  {
    id: 'LD-001',
    pickup: 'European Distribution Hub',
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
    status: 'alert',
    estimatedTime: '3 hours',
    truckArrival: '2024-01-10T14:00:00',
    readyTime: '2024-01-10T15:00:00',
  },
];

const DEMO_ACCEPTED: DemoMission[] = [
  {
    id: 'LD-004',
    pickup: 'Frankfurt Hub Dock 2',
    delivery: '2 Rewe stores',
    pallets: 3,
    distance: '28 km',
    payout: 135,
    status: 'accepted',
    estimatedTime: '',
    truckArrival: '',
    readyTime: '',
    acceptedAt: '2024-01-10T12:00:00',
  },
];

function getTimeUntilArrival(arrivalTime: string, t: (k: string, o?: Record<string, unknown>) => string) {
  const now = new Date();
  const arrival = new Date(arrivalTime);
  const diff = arrival.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diff < 0) return t('fleetPartnerPages.timeArrived');
  if (hours < 1) return t('fleetPartnerPages.timeMinutes', { count: minutes });
  return t('fleetPartnerPages.timeHoursMinutes', { hours, minutes });
}

export default function MissionBoardPage() {
  const { t } = useTranslation();
  const navItems = useFleetPartnerNavItems();
  const [availableMissions] = useState<DemoMission[]>(() =>
    USE_FLEET_MISSION_DEMO_DATA ? DEMO_AVAILABLE : [],
  );
  const [acceptedMissions] = useState<DemoMission[]>(() =>
    USE_FLEET_MISSION_DEMO_DATA ? DEMO_ACCEPTED : [],
  );

  const handleAcceptMission = (missionId: string) => {
    window.alert(t('fleetPartnerPages.acceptStubMessage', { id: missionId }));
  };

  const allQuiet = availableMissions.length === 0 && acceptedMissions.length === 0;
  const showAlertBanner = availableMissions.some((m) => m.status === 'alert');

  const emptyCtaBlock = (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2">
      <Link
        href="/fleet-partner"
        className="text-sm font-medium text-[#2D5A27] underline underline-offset-2"
      >
        {t('fleetPartnerPages.missionsCtaDashboard')}
      </Link>
      <Link
        href="/fleet-partner/deliveries"
        className="text-sm font-medium text-[#2D5A27] underline underline-offset-2"
      >
        {t('fleetPartnerPages.missionsCtaDeliveries')}
      </Link>
      <Link
        href="/fleet-partner/profile"
        className="text-sm font-medium text-[#2D5A27] underline underline-offset-2"
      >
        {t('fleetPartnerPages.missionsCtaProfile')}
      </Link>
    </div>
  );

  return (
    <SidebarLayout title={t('internalShell.titles.missionBoard')} navItems={navItems}>
      <div className="space-y-6">
        {USE_FLEET_MISSION_DEMO_DATA && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950">
            {t('fleetPartnerPages.missionsDemoNote')}
          </div>
        )}

        {showAlertBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">{t('fleetPartnerPages.alertTitle')}</h3>
                <p className="mt-1 text-sm text-yellow-700">{t('fleetPartnerPages.alertBody')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {allQuiet ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center space-y-4">
            <p className="text-gray-800 font-medium">{t('fleetPartnerPages.missionsAllQuietTitle')}</p>
            <p className="text-sm text-gray-600 max-w-lg mx-auto">{t('fleetPartnerPages.missionsAllQuietHint')}</p>
            {emptyCtaBlock}
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('fleetPartnerPages.missionsAvailableTitle')}
              </h2>
              {availableMissions.length === 0 ? (
                <div className="text-sm text-gray-600 py-8 text-center space-y-2">
                  <p className="font-medium text-gray-800">{t('fleetPartnerPages.missionsEmptyAvailableTitle')}</p>
                  <p className="text-gray-500">{t('fleetPartnerPages.missionsEmptyAvailableHint')}</p>
                </div>
              ) : (
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
                            <span className="text-xs font-medium text-gray-500">
                              {t('fleetPartnerPages.missionLabel', { id: mission.id })}
                            </span>
                            {mission.status === 'alert' && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                {t('fleetPartnerPages.badgeTruckSoon')}
                              </span>
                            )}
                            {mission.status === 'available' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                {t('fleetPartnerPages.badgeAvailable')}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-700">
                                <strong>{t('fleetPartnerPages.pickup')}</strong> {mission.pickup}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="text-gray-700">
                                <strong>{t('fleetPartnerPages.deliver')}</strong> {mission.delivery}
                              </span>
                            </div>
                            {mission.status === 'alert' && mission.truckArrival && (
                              <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                                <strong>{t('fleetPartnerPages.truckArrivalEta')}</strong>{' '}
                                {getTimeUntilArrival(mission.truckArrival, t)} •{' '}
                                <strong>{t('fleetPartnerPages.beReady')}</strong>{' '}
                                {new Date(mission.readyTime).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">€{mission.payout}</p>
                          <p className="text-xs text-gray-500">{t('fleetPartnerPages.payout')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{t('fleetPartnerPages.palletsUnit', { count: mission.pallets })}</span>
                          <span>•</span>
                          <span>{mission.distance}</span>
                          <span>•</span>
                          <span>{mission.estimatedTime}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAcceptMission(mission.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {t('fleetPartnerPages.acceptMission')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {acceptedMissions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('fleetPartnerPages.missionsAcceptedTitle')}
                </h2>
                <div className="space-y-4">
                  {acceptedMissions.map((mission) => (
                    <div key={mission.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-500">
                              {t('fleetPartnerPages.missionLabel', { id: mission.id })}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {t('fleetPartnerPages.badgeAccepted')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            <strong>{t('fleetPartnerPages.pickup')}</strong> {mission.pickup} •{' '}
                            <strong>{t('fleetPartnerPages.deliver')}</strong> {mission.delivery}
                          </p>
                          {mission.acceptedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(mission.acceptedAt).toLocaleString()}
                            </p>
                          )}
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
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
