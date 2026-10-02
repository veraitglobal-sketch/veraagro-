'use client';

import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import { useTranslation } from 'react-i18next';

const navItems = [
  {
    href: '/hub-manager',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
];

export default function HubManagerPage() {
  const { t } = useTranslation();

  return (
    <SidebarLayout title={t('internalShell.titles.hubManager')} navItems={navItems}>
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 sm:p-10 text-center shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('internalDemo.hubEmptyTitle')}</h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">{t('internalDemo.hubEmptyBody')}</p>
          <Link
            href="/logistics-partner/dashboard"
            className="inline-flex min-h-[48px] items-center rounded-lg bg-[#2D5A27] px-5 text-sm font-medium text-white hover:bg-[#23471f]"
          >
            {t('internalDemo.hubCtaLogistics')}
          </Link>
        </div>
      </div>
    </SidebarLayout>
  );
}
