'use client';

import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const dashIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);
const boardIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);
export type FleetPartnerNavItem = { href: string; label: string; icon: ReactNode };

export function buildFleetPartnerNavItems(t: TFunction): FleetPartnerNavItem[] {
  return [
    { href: '/fleet-partner', label: t('nav.dashboard'), icon: dashIcon },
    { href: '/fleet-partner/missions', label: t('internalShell.titles.missionBoard'), icon: boardIcon },
  ];
}

export function useFleetPartnerNavItems() {
  const { t, i18n } = useTranslation();
  return useMemo(() => buildFleetPartnerNavItems(t), [t, i18n.language]);
}
