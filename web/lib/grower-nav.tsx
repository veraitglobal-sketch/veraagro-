'use client';

import {
  Home,
  Inbox,
  MapPin,
  MapPinned,
  Package,
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
 * Full grower sidebar: same on every /grower/* page for consistent navigation.
 */
export const growerNavItems: GrowerNavItem[] = [
  { href: '/grower', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { href: '/grower/portal', label: 'Mission Tracker', icon: <MapPin className="w-5 h-5" /> },
  { href: '/grower/missions/create', label: 'Request Transport', icon: <Truck className="w-5 h-5" /> },
  { href: '/grower/batches', label: 'My Batches', icon: <Package className="w-5 h-5" /> },
  { href: '/grower/fields', label: 'My Fields', icon: <MapPinned className="w-5 h-5" /> },
  { href: '/grower/season', label: 'Steps', icon: <Sprout className="w-5 h-5" /> },
  { href: '/grower/where-to-buy', label: 'Where to buy', icon: <ShoppingBag className="w-5 h-5" /> },
  { href: '/grower/partner-orders', label: 'Partner orders', icon: <Inbox className="w-5 h-5" /> },
  { href: '/grower/materials', label: 'Materials', icon: <Package className="w-5 h-5" /> },
  { href: '/grower/quality-entry', label: 'Quality Entry', icon: <CheckCircle className="w-5 h-5" /> },
  { href: '/grower/compliance-photos', label: 'Compliance Photos', icon: <Camera className="w-5 h-5" /> },
  { href: '/grower/profile', label: 'My Profile', icon: <User className="w-5 h-5" /> },
];
