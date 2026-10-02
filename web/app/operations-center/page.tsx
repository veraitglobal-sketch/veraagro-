'use client';

import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import { useTranslation } from 'react-i18next';

const navItems = [
  {
    href: '/operations-center',
    label: 'Overview',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

export default function OperationsCenterPage() {
  const { t } = useTranslation();

  return (
    <SidebarLayout title={t('internalShell.titles.globalOperations')} navItems={navItems}>
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 sm:p-10 text-center shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('internalDemo.opsEmptyTitle')}</h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">{t('internalDemo.opsEmptyBody')}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link
              href="/admin"
              className="inline-flex min-h-[48px] items-center rounded-lg bg-[#2D5A27] px-5 text-sm font-medium text-white hover:bg-[#23471f]"
            >
              {t('internalDemo.opsCtaAdmin')}
            </Link>
            <Link
              href="/logistics-partner/dashboard"
              className="inline-flex min-h-[48px] items-center rounded-lg border border-gray-300 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('internalDemo.opsCtaLogistics')}
            </Link>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
