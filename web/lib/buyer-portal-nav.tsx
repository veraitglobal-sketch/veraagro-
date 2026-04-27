'use client';

import { ShoppingCart, FileText, Building2, Truck, BarChart3 } from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export function buildBuyerPortalNavItems(t: TFunction): { href: string; label: string; icon: ReactNode }[] {
  return [
    { href: '/buyer-portal/dashboard', label: t('buyerPortalNav.dashboard'), icon: <DashboardIcon /> },
    { href: '/buyer-portal/orders', label: t('buyerPortalNav.orders'), icon: <ShoppingCart className="w-5 h-5" /> },
    { href: '/buyer-portal/invoices', label: t('buyerPortalNav.invoices'), icon: <FileText className="w-5 h-5" /> },
    { href: '/buyer-portal/deliveries', label: t('buyerPortalNav.deliveries'), icon: <Truck className="w-5 h-5" /> },
    { href: '/buyer-portal/analytics', label: t('buyerPortalNav.analytics'), icon: <BarChart3 className="w-5 h-5" /> },
    { href: '/buyer-portal/profile', label: t('buyerPortalNav.companyProfile'), icon: <Building2 className="w-5 h-5" /> },
  ];
}

export function useBuyerPortalNavItems() {
  const { t, i18n } = useTranslation();
  return useMemo(() => buildBuyerPortalNavItems(t), [t, i18n.language]);
}
