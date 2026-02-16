'use client';

import { 
  Users,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Activity,
  DollarSign,
  Shield,
  BarChart3,
  MapPin,
  MessageCircle,
  ClipboardCheck,
} from 'lucide-react';
import { ReactNode } from 'react';

// Localization for admin navigation items
const navLabels = {
  en: {
    dashboard: 'Dashboard',
    users: 'Users',
    products: 'Products',
    orders: 'Orders',
    missions: 'Missions',
    security: 'Security Alerts',
    marketPrices: 'Market Prices',
    standards: 'Bio Vera Standards',
    haccp: 'HACCP Monitoring',
    veraInsights: 'Vera Insights',
    commandControl: 'Command & Control',
    estates: 'Estate Approval',
    aiConversations: 'AI Conversations',
  },
  de: {
    dashboard: 'Dashboard',
    users: 'Benutzer',
    products: 'Produkte',
    orders: 'Bestellungen',
    missions: 'Missionen',
    security: 'Sicherheitswarnungen',
    marketPrices: 'Marktpreise',
    standards: 'Bio Vera Standards',
    haccp: 'HACCP-Überwachung',
    veraInsights: 'Vera Einblicke',
    commandControl: 'Befehls- und Kontrollzentrale',
    estates: 'Grundstücksgenehmigung',
    aiConversations: 'KI-Konversationen',
  },
};

// English localization only
function getCurrentLanguage(): 'en' {
  return 'en';
}

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

// Function to get navigation items with localization
export function getAdminNavItems(_language?: 'en') {
  const labels = navLabels.en;

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
  ];
}
