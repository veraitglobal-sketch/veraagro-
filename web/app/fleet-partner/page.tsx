'use client';

import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import { useTranslation } from 'react-i18next';
import { useFleetPartnerNavItems } from '@/lib/fleet-partner-nav';

export default function FleetPartnerPage() {
  const { t } = useTranslation();
  const navItems = useFleetPartnerNavItems();

  return (
    <SidebarLayout title={t('internalShell.titles.fleetDashboard')} navItems={navItems}>
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 sm:p-10 text-center shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('internalDemo.fleetEmptyTitle')}</h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">{t('internalDemo.fleetEmptyBody')}</p>
          <Link
            href="/logistics-partner/dashboard"
            className="inline-flex min-h-[48px] items-center rounded-lg bg-[#2D5A27] px-5 text-sm font-medium text-white hover:bg-[#23471f]"
          >
            {t('internalDemo.fleetCtaLogistics')}
          </Link>
        </div>
      </div>
    </SidebarLayout>
  );
}
