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
} from 'lucide-react';
import { ReactNode } from 'react';

export type GrowerNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

/**
 * Full grower sidebar: same on every /grower/* page.
 * Order = season path (1 → end): dashboard, guide, field setup, supply, lots, quality & compliance, transport, tracking, profile.
 */
export const growerNavItems: GrowerNavItem[] = [
  { href: '/grower', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { href: '/grower/season', label: 'Steps', icon: <Sprout className="w-5 h-5" /> },
  { href: '/grower/fields', label: 'My fields', icon: <MapPinned className="w-5 h-5" /> },
  { href: '/grower/materials', label: 'Materials', icon: <Box className="w-5 h-5" /> },
  { href: '/grower/where-to-buy', label: 'Suppliers & orders', icon: <ShoppingBag className="w-5 h-5" /> },
  { href: '/grower/batches', label: 'My batches', icon: <Package className="w-5 h-5" /> },
  { href: '/grower/quality-entry', label: 'Quality entry', icon: <CheckCircle className="w-5 h-5" /> },
  { href: '/grower/compliance-photos', label: 'Compliance photos', icon: <Camera className="w-5 h-5" /> },
  { href: '/grower/missions/create', label: 'Request transport', icon: <Truck className="w-5 h-5" /> },
  { href: '/grower/portal', label: 'Mission tracker', icon: <MapPin className="w-5 h-5" /> },
  { href: '/grower/profile', label: 'My profile', icon: <User className="w-5 h-5" /> },
];
