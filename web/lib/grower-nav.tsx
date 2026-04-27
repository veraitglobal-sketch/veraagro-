'use client';

import {
  Home,
  MapPin,
  MapPinned,
  Package,
  Box,
  Sprout,
  CheckCircle,
  Truck,
  User,
  Camera,
  ShoppingBag,
  QrCode,
  ScanBarcode,
  Factory,
} from 'lucide-react';
import { ReactNode } from 'react';
import { en } from '@/lib/messages';

export type GrowerNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const nav = en.grower.nav;

/**
 * Full grower sidebar: same on every /grower/* page (14 items).
 * Matches the “Steps” page order; that page uses 12 numbered cards by splitting a few topics (e.g. approval, field work).
 * Parity: data from `shared/lib/grower-journey.ts` → mobile `lib/grower-journey-data.ts` (tab bar + stack routes).
 */
export const growerNavItems: GrowerNavItem[] = [
  { href: '/grower', label: nav.dashboard, icon: <Home className="w-5 h-5" /> },
  { href: '/grower/season', label: nav.steps, icon: <Sprout className="w-5 h-5" /> },
  { href: '/grower/fields', label: nav.myFields, icon: <MapPinned className="w-5 h-5" /> },
  { href: '/grower/materials', label: nav.materials, icon: <Box className="w-5 h-5" /> },
  { href: '/grower/where-to-buy', label: nav.suppliersAndOrders, icon: <ShoppingBag className="w-5 h-5" /> },
  { href: '/grower/batches', label: nav.myBatches, icon: <Package className="w-5 h-5" /> },
  { href: '/grower/package-badges', label: nav.packageBadges, icon: <QrCode className="w-5 h-5" /> },
  { href: '/grower/package-badges/scan', label: nav.scanPackageBadges, icon: <ScanBarcode className="w-5 h-5" /> },
  { href: '/grower/package-badges/print-order', label: nav.printOrderNav, icon: <Factory className="w-5 h-5" /> },
  { href: '/grower/quality-entry', label: nav.qualityEntry, icon: <CheckCircle className="w-5 h-5" /> },
  { href: '/grower/compliance-photos', label: nav.compliancePhotos, icon: <Camera className="w-5 h-5" /> },
  { href: '/grower/missions/create', label: nav.requestTransport, icon: <Truck className="w-5 h-5" /> },
  { href: '/grower/portal', label: nav.missionTracker, icon: <MapPin className="w-5 h-5" /> },
  { href: '/grower/profile', label: nav.myProfile, icon: <User className="w-5 h-5" /> },
];
