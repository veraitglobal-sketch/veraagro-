'use client';

import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  FileText, 
  Users, 
  TrendingUp,
  Building2,
  Truck,
} from 'lucide-react';
import { ReactNode, createElement } from 'react';

// Localization for navigation items
const navLabels = {
  en: {
    dashboard: 'Dashboard',
    veraTrade: 'Vera Trade',
    availableProducts: 'Available Products',
    myOrders: 'My Orders',
    invoices: 'Invoices',
    deliveries: 'Deliveries',
    veraPartners: 'Vera Partners',
    analytics: 'Analytics',
    companyProfile: 'Company Profile',
  },
  sr: {
    dashboard: 'Kontrolna Tabla',
    veraTrade: 'Vera Trade',
    availableProducts: 'Dostupni Proizvodi',
    myOrders: 'Moje Porudžbine',
    invoices: 'Računi',
    deliveries: 'Dostave',
    veraPartners: 'Vera Partneri',
    analytics: 'Analitika',
    companyProfile: 'Profil Kompanije',
  },
  de: {
    dashboard: 'Dashboard',
    veraTrade: 'Vera Trade',
    availableProducts: 'Verfügbare Produkte',
    myOrders: 'Meine Bestellungen',
    invoices: 'Rechnungen',
    deliveries: 'Lieferungen',
    veraPartners: 'Vera Partner',
    analytics: 'Analytik',
    companyProfile: 'Firmenprofil',
  },
};

// Helper function to get current language (defaults to 'en')
// You can integrate this with a proper i18n library later
function getCurrentLanguage(): 'en' | 'sr' | 'de' {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('language');
  return (stored === 'sr' || stored === 'de') ? stored : 'en';
}

// Dashboard icon component - returns JSX element
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

// Function to get navigation items with localization
export function getBuyerPortalNavItems(language?: 'en' | 'sr' | 'de') {
  const lang = language || getCurrentLanguage();
  const labels = navLabels[lang];

  return [
    { 
      href: '/buyer-portal/dashboard', 
      label: labels.dashboard, 
      icon: <DashboardIcon /> 
    },
    { 
      href: '/buyer-portal/trade-panel', 
      label: labels.veraTrade, 
      icon: <BarChart3 className="w-5 h-5" /> 
    },
    { 
      href: '/buyer-portal/inventory', 
      label: labels.availableProducts, 
      icon: <Package className="w-5 h-5" /> 
    },
    { 
      href: '/buyer-portal/orders', 
      label: labels.myOrders, 
      icon: <ShoppingCart className="w-5 h-5" /> 
    },
    { 
      href: '/buyer-portal/invoices', 
      label: labels.invoices, 
      icon: <FileText className="w-5 h-5" /> 
    },
    { 
      href: '/buyer-portal/deliveries', 
      label: labels.deliveries, 
      icon: <Truck className="w-5 h-5" /> 
    },
    { 
      href: '/buyer-portal/suppliers', 
      label: labels.veraPartners, 
      icon: <Users className="w-5 h-5" /> 
    },
    { 
      href: '/buyer-portal/analytics', 
      label: labels.analytics, 
      icon: <TrendingUp className="w-5 h-5" /> 
    },
    { 
      href: '/buyer-portal/profile', 
      label: labels.companyProfile, 
      icon: <Building2 className="w-5 h-5" /> 
    },
  ];
}

// Note: buyerPortalNavItems should be called inside components, not at module level
// This prevents JSX elements from being evaluated at module load time
