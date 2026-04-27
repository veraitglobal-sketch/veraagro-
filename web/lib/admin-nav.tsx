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
  Store,
  Inbox,
  Layers,
} from 'lucide-react';
import { ReactNode } from 'react';
import type { SidebarNavGroup } from '@/components/SidebarLayout';
import locale from '@/locales/en.json';

/** Admin navigation — English copy from `locales/en.json` (`adminNav`) for future i18n. */
const labels = locale.adminNav;

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

export function getAdminNavItems() {
  return [
    { 
      href: '/admin', 
      label: labels.dashboard, 
      icon: <DashboardIcon /> 
    },
    { 
      href: '/admin/users', 
      label: labels.users, 
      icon: <Users className="w-5 h-5" /> 
    },
    { 
      href: '/admin/partner-applications', 
      label: labels.partnerApplications, 
      icon: <Inbox className="w-5 h-5" /> 
    },
    { 
      href: '/admin/supplier-stores', 
      label: labels.supplierStores, 
      icon: <Store className="w-5 h-5" /> 
    },
    { 
      href: '/admin/supplier-growers', 
      label: labels.supplierFarmers, 
      icon: <MessageCircle className="w-5 h-5" /> 
    },
    { 
      href: '/admin/products', 
      label: labels.products, 
      icon: <Package className="w-5 h-5" /> 
    },
    { 
      href: '/admin/orders', 
      label: labels.orders, 
      icon: <ShoppingCart className="w-5 h-5" /> 
    },
    { 
      href: '/admin/operations', 
      label: labels.supplySnapshot, 
      icon: <Layers className="w-5 h-5" /> 
    },
    { 
      href: '/admin/missions', 
      label: labels.missions, 
      icon: <Activity className="w-5 h-5" /> 
    },
    { 
      href: '/admin/security', 
      label: labels.security, 
      icon: <AlertTriangle className="w-5 h-5" /> 
    },
    { 
      href: '/admin/market-prices', 
      label: labels.marketPrices, 
      icon: <MarketPricesIcon /> 
    },
    { 
      href: '/admin/standards', 
      label: labels.standards, 
      icon: <StandardsIcon /> 
    },
    { 
      href: '/admin/haccp', 
      label: labels.haccp, 
      icon: <ClipboardCheck className="w-5 h-5" /> 
    },
    { 
      href: '/admin/vera-insights', 
      label: labels.veraInsights, 
      icon: <TrendingUp className="w-5 h-5" /> 
    },
    { 
      href: '/admin/command-control', 
      label: labels.commandControl, 
      icon: <CommandControlIcon /> 
    },
    { 
      href: '/admin/estates', 
      label: labels.estates, 
      icon: <MapPin className="w-5 h-5" /> 
    },
    { 
      href: '/admin/ai-conversations', 
      label: labels.aiConversations, 
      icon: <MessageCircle className="w-5 h-5" /> 
    },
    { 
      href: '/admin/test-batch', 
      label: labels.testBatch, 
      icon: <Package className="w-5 h-5" /> 
    },
    { 
      href: '/admin/njiva-blockchain', 
      label: labels.fieldBlockchain, 
      icon: <MapPin className="w-5 h-5" /> 
    },
    { 
      href: '/admin/parcels-pending', 
      label: labels.parcelsPending, 
      icon: <MapPin className="w-5 h-5" /> 
    },
    { 
      href: '/admin/harvest-plans', 
      label: labels.harvestPlans, 
      icon: <CalendarRange className="w-5 h-5" /> 
    },
  ];
}

/** Dashboard `/admin/statistics` shape (subset) for Grower ops badges */
export type AdminDashStats = {
  parcels?: { total?: number; pendingApproval?: number };
  estates?: { total?: number; pendingSetup?: number };
  batches?: { total?: number };
};

/**
 * Shortcuts + counts for grower-related admin work (shown below main admin nav).
 */
export function getAdminGrowerOpsGroup(stats: AdminDashStats | null): SidebarNavGroup {
  const t = labels;
  const pa = stats?.parcels?.pendingApproval;
  const es = stats?.estates?.pendingSetup;
  const batchTotal = stats?.batches?.total;
  return {
    title: t.growerOps,
    items: [
      {
        href: '/admin/parcels-pending',
        label: t.goParcelsPending,
        icon: <MapPin className="w-5 h-5 flex-shrink-0" />,
        badge: pa != null && pa > 0 ? pa : undefined,
      },
      {
        href: '/admin/estates',
        label: t.goEstates,
        icon: <MapPin className="w-5 h-5 flex-shrink-0 opacity-80" />,
        badge: es != null && es > 0 ? es : undefined,
      },
      {
        href: '/admin/harvest-plans',
        label: t.goHarvestPlans,
        icon: <CalendarRange className="w-5 h-5 flex-shrink-0" />,
      },
      {
        href: '/admin/haccp',
        label: t.goHaccp,
        icon: <ClipboardCheck className="w-5 h-5 flex-shrink-0" />,
      },
      {
        href: '/admin',
        label: t.goBatchesPlatform,
        icon: <Package className="w-5 h-5 flex-shrink-0" />,
        badge: batchTotal != null && batchTotal > 0 ? batchTotal : undefined,
      },
    ],
  };
}
