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
  ScanBarcode,
  Leaf,
  NotebookPen,
} from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

export type GrowerNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

/**
 * Full grower sidebar: same on every /grower/* page.
 * Order follows field workflow: dashboard → guide → parcels → plantings → materials →
 * batches (packed) → field diary → scan pallets → quality → compliance → suppliers →
 * transport → tracker → profile.
 * Parity: mobile grower tab bar + stack routes (align separately).
 */
export function buildGrowerNavItems(t: TFunction): GrowerNavItem[] {
  return [
    { href: '/grower', label: t('grower.nav.dashboard'), icon: <Home className="w-5 h-5" /> },
    { href: '/grower/season', label: t('grower.nav.steps'), icon: <Sprout className="w-5 h-5" /> },
    { href: '/grower/fields', label: t('grower.nav.myFields'), icon: <MapPinned className="w-5 h-5" /> },
    { href: '/grower/plantings', label: t('grower.nav.myPlantings'), icon: <Leaf className="w-5 h-5" /> },
    { href: '/grower/materials', label: t('grower.nav.materials'), icon: <Box className="w-5 h-5" /> },
    { href: '/grower/batches', label: t('grower.nav.myBatches'), icon: <Package className="w-5 h-5" /> },
    { href: '/grower/field-diary', label: t('grower.nav.fieldDiary'), icon: <NotebookPen className="w-5 h-5" /> },
    { href: '/grower/package-badges/scan', label: t('grower.nav.scanPallets'), icon: <ScanBarcode className="w-5 h-5" /> },
    { href: '/grower/quality-entry', label: t('grower.nav.qualityEntry'), icon: <CheckCircle className="w-5 h-5" /> },
    { href: '/grower/compliance-photos', label: t('grower.nav.compliancePhotos'), icon: <Camera className="w-5 h-5" /> },
    { href: '/grower/where-to-buy', label: t('grower.nav.suppliersAndOrders'), icon: <ShoppingBag className="w-5 h-5" /> },
    { href: '/grower/missions/create', label: t('grower.nav.requestTransport'), icon: <Truck className="w-5 h-5" /> },
    { href: '/grower/portal', label: t('grower.nav.missionTracker'), icon: <MapPin className="w-5 h-5" /> },
    { href: '/grower/profile', label: t('grower.nav.myProfile'), icon: <User className="w-5 h-5" /> },
  ];
}

export function useGrowerNavItems() {
  const { t, i18n } = useTranslation();
  return useMemo(() => buildGrowerNavItems(t), [t, i18n.language]);
}
