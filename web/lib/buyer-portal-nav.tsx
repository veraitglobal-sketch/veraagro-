'use client';

import { ShoppingCart, FileText, Building2, Truck, BarChart3 } from 'lucide-react';
import { ReactNode, createElement } from 'react';

// Buyer portal nav labels (English only for web UI)
const navLabels = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  preOrder2026: 'Pre-order 2026',
  directOrders: 'Direct orders',
  invoices: 'Invoices',
  deliveries: 'Deliveries',
  analytics: 'Analytics',
  companyProfile: 'Company Profile',
};

// Dashboard icon component - returns JSX element
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

// Function to get navigation items with localization
export function getBuyerPortalNavItems(_language?: 'en') {
  const labels = navLabels;

  return [
    { href: '/buyer-portal/dashboard', label: labels.dashboard, icon: <DashboardIcon /> },
    { href: '/buyer-portal/orders', label: labels.orders, icon: <ShoppingCart className="w-5 h-5" /> },
    { href: '/buyer-portal/invoices', label: labels.invoices, icon: <FileText className="w-5 h-5" /> },
    { href: '/buyer-portal/deliveries', label: labels.deliveries, icon: <Truck className="w-5 h-5" /> },
    { href: '/buyer-portal/analytics', label: labels.analytics, icon: <BarChart3 className="w-5 h-5" /> },
    { href: '/buyer-portal/profile', label: labels.companyProfile, icon: <Building2 className="w-5 h-5" /> },
  ];
}

// Note: buyerPortalNavItems should be called inside components, not at module level
// This prevents JSX elements from being evaluated at module load time
