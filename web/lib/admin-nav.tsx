'use client';

import {
  Users,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Activity,
  MapPin,
  MessageCircle,
  ClipboardCheck,
  CalendarRange,
  ShieldCheck,
  Store,
  Inbox,
  Layers,
  PieChart,
  Sprout,
} from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { SidebarNavGroup } from '@/components/SidebarLayout';
import i18n from '@/i18n/config';

// Dashboard icon component
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

// Market Prices icon component
const MarketPricesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Standards icon component
const StandardsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Command Control icon component
const CommandControlIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export function buildAdminNavItems(t: TFunction) {
  return [
    { href: '/admin', label: t('adminNav.dashboard'), icon: <DashboardIcon /> },
    { href: '/admin/users', label: t('adminNav.users'), icon: <Users className="w-5 h-5" /> },
    { href: '/admin/partner-applications', label: t('adminNav.partnerApplications'), icon: <Inbox className="w-5 h-5" /> },
    { href: '/admin/supplier-stores', label: t('adminNav.supplierStores'), icon: <Store className="w-5 h-5" /> },
    { href: '/admin/supplier-growers', label: t('adminNav.supplierFarmers'), icon: <MessageCircle className="w-5 h-5" /> },
    { href: '/admin/supply', label: t('adminNav.supply'), icon: <Layers className="w-5 h-5" /> },
    { href: '/admin/products', label: t('adminNav.products'), icon: <Package className="w-5 h-5" /> },
    { href: '/admin/seed-production', label: t('adminNav.seedProduction'), icon: <Sprout className="w-5 h-5" /> },
    { href: '/admin/returns', label: t('returnFlow.title'), icon: <Package className="w-5 h-5" /> },
    { href: '/admin/dispatch', label: t('dispatchFlow.title'), icon: <Package className="w-5 h-5" /> },
    { href: '/admin/delivery-issues', label: t('deliveryReview.title'), icon: <AlertTriangle className="w-5 h-5" /> },
    { href: '/admin/passport-reports', label: t('adminNav.passportReports', { defaultValue: 'Passport reports' }), icon: <AlertTriangle className="w-5 h-5" /> },
    { href: '/admin/passport-documents', label: t('adminNav.passportDocuments', { defaultValue: 'Passport documents' }), icon: <ClipboardCheck className="w-5 h-5" /> },
    { href: '/admin/orders', label: t('adminNav.orders'), icon: <ShoppingCart className="w-5 h-5" /> },
    { href: '/admin/pre-orders', label: t('adminNav.preOrders'), icon: <ShoppingCart className="w-5 h-5" /> },
    { href: '/admin/finance-overview', label: t('adminNav.financeOverview'), icon: <PieChart className="w-5 h-5" /> },
    { href: '/admin/operations', label: t('adminNav.supplySnapshot'), icon: <Layers className="w-5 h-5" /> },
    { href: '/admin/missions', label: t('adminNav.missions'), icon: <Activity className="w-5 h-5" /> },
    { href: '/admin/security', label: t('adminNav.security'), icon: <AlertTriangle className="w-5 h-5" /> },
    { href: '/admin/market-prices', label: t('adminNav.marketPrices'), icon: <MarketPricesIcon /> },
    { href: '/admin/standards', label: t('adminNav.standards'), icon: <StandardsIcon /> },
    { href: '/admin/haccp', label: t('adminNav.haccp'), icon: <ClipboardCheck className="w-5 h-5" /> },
    { href: '/admin/vera-insights', label: t('adminNav.veraInsights'), icon: <TrendingUp className="w-5 h-5" /> },
    { href: '/admin/command-control', label: t('adminNav.commandControl'), icon: <CommandControlIcon /> },
    { href: '/admin/estates', label: t('adminNav.estates'), icon: <MapPin className="w-5 h-5" /> },
    { href: '/admin/ai-conversations', label: t('adminNav.aiConversations'), icon: <MessageCircle className="w-5 h-5" /> },
    { href: '/admin/test-batch', label: t('adminNav.testBatch'), icon: <Package className="w-5 h-5" /> },
    { href: '/admin/field-blockchain', label: t('adminNav.fieldBlockchain'), icon: <MapPin className="w-5 h-5" /> },
    { href: '/admin/parcels-pending', label: t('adminNav.parcelsPending'), icon: <MapPin className="w-5 h-5" /> },
    { href: '/admin/harvest-plans', label: t('adminNav.harvestPlans'), icon: <CalendarRange className="w-5 h-5" /> },
  ];
}

export function useAdminNavItems() {
  const { t, i18n } = useTranslation();
  return useMemo(() => buildAdminNavItems(t), [t, i18n.language]);
}

/** Non-hook fallback (e.g. rare server paths); uses current i18n language. */
export function getAdminNavItems() {
  return buildAdminNavItems(i18n.t.bind(i18n));
}

/** Dashboard `/admin/statistics` shape (subset) for Grower ops badges */
export type AdminDashStats = {
  parcels?: { total?: number; pendingApproval?: number };
  estates?: { total?: number; pendingSetup?: number };
  batches?: { total?: number };
  growerModeration?: {
    transportAwaitingApproval?: number;
    recentGrowthPhotos?: number;
    activePlantings?: number;
  };
};

/**
 * Shortcuts + counts for grower-related admin work (shown below main admin nav).
 */
export function buildAdminGrowerOpsGroup(t: TFunction, stats: AdminDashStats | null): SidebarNavGroup {
  const pa = stats?.parcels?.pendingApproval;
  const es = stats?.estates?.pendingSetup;
  const batchTotal = stats?.batches?.total;
  const gm = stats?.growerModeration;
  const moderationQueue =
    (gm?.transportAwaitingApproval ?? 0) + (gm?.recentGrowthPhotos ?? 0);
  return {
    title: t('adminNav.growerOps'),
    items: [
      {
        href: '/admin/grower-control',
        label: t('adminNav.goGrowerControl'),
        icon: <ShieldCheck className="w-5 h-5 flex-shrink-0" />,
        badge: moderationQueue > 0 ? moderationQueue : undefined,
      },
      {
        href: '/admin/parcels-pending',
        label: t('adminNav.goParcelsPending'),
        icon: <MapPin className="w-5 h-5 flex-shrink-0" />,
        badge: pa != null && pa > 0 ? pa : undefined,
      },
      {
        href: '/admin/estates',
        label: t('adminNav.goEstates'),
        icon: <MapPin className="w-5 h-5 flex-shrink-0 opacity-80" />,
        badge: es != null && es > 0 ? es : undefined,
      },
      {
        href: '/admin/harvest-plans',
        label: t('adminNav.goHarvestPlans'),
        icon: <CalendarRange className="w-5 h-5 flex-shrink-0" />,
      },
      {
        href: '/admin/haccp',
        label: t('adminNav.goHaccp'),
        icon: <ClipboardCheck className="w-5 h-5 flex-shrink-0" />,
      },
      {
        href: '/admin',
        label: t('adminNav.goBatchesPlatform'),
        icon: <Package className="w-5 h-5 flex-shrink-0" />,
        badge: batchTotal != null && batchTotal > 0 ? batchTotal : undefined,
      },
    ],
  };
}

export function useAdminGrowerOpsGroup(stats: AdminDashStats | null) {
  const { t, i18n } = useTranslation();
  return useMemo(() => buildAdminGrowerOpsGroup(t, stats), [t, i18n.language, stats]);
}

export function getAdminGrowerOpsGroup(stats: AdminDashStats | null) {
  return buildAdminGrowerOpsGroup(i18n.t.bind(i18n), stats);
}
