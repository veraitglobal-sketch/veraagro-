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
  BookOpen,
  NotebookPen,
  Smartphone,
  GraduationCap,
  Shield,
} from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { SiteLocale } from '@/i18n/config';
import { pathnameStartsWithLocale, siteLocaleFromLanguageTag, withLocalePrefix } from '@/lib/i18n-routing';

export type GrowerNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

/**
 * Full grower sidebar: same on every /grower/* page.
 * Order follows field workflow: dashboard → guide → parcels → plantings → materials →
 * batches (packed) → entry log → scan pallets → quality → compliance → education →
 * confidential partner plans (`web/content/partner-plans/*.md` reader under `/grower/confidential/plan/*`) → suppliers → transport → tracker → profile.
 * Parity: mobile stack route `/education` + deep links (`grower-web-href-to-mobile`). Confidential plans are web-only for now.
 */
export function buildGrowerNavItems(t: TFunction, locale: SiteLocale): GrowerNavItem[] {
  const p = (path: string) => withLocalePrefix(locale, path);
  return [
    { href: p('/grower'), label: t('grower.nav.dashboard'), icon: <Home className="w-5 h-5" /> },
    { href: p('/grower/season'), label: t('grower.nav.steps'), icon: <Sprout className="w-5 h-5" /> },
    { href: p('/grower/fields'), label: t('grower.nav.myFields'), icon: <MapPinned className="w-5 h-5" /> },
    { href: p('/grower/plantings'), label: t('grower.nav.myPlantings'), icon: <Leaf className="w-5 h-5" /> },
    { href: p('/grower/catalog'), label: t('grower.nav.productCatalog', { defaultValue: 'Product catalog' }), icon: <BookOpen className="w-5 h-5" /> },
    { href: p('/grower/materials'), label: t('grower.nav.materials'), icon: <Box className="w-5 h-5" /> },
    { href: p('/grower/batches'), label: t('grower.nav.myBatches'), icon: <Package className="w-5 h-5" /> },
    { href: p('/grower/orders'), label: t('grower.nav.ordersToPrepare', { defaultValue: 'Orders to prepare' }), icon: <ShoppingBag className="w-5 h-5" /> },
    { href: p('/grower/field-diary'), label: t('grower.nav.fieldDiary'), icon: <NotebookPen className="w-5 h-5" /> },
    /** Locale-free; do not use `withLocalePrefix` (see middleware — only /grower is rewritten under /sr). */
    { href: '/producer/field-entry', label: t('grower.nav.fieldCapture'), icon: <Smartphone className="w-5 h-5" /> },
    { href: p('/grower/package-badges/scan'), label: t('grower.nav.scanPallets'), icon: <ScanBarcode className="w-5 h-5" /> },
    { href: p('/grower/quality-entry'), label: t('grower.nav.qualityEntry'), icon: <CheckCircle className="w-5 h-5" /> },
    { href: p('/grower/compliance-photos'), label: t('grower.nav.compliancePhotos'), icon: <Camera className="w-5 h-5" /> },
    { href: p('/grower/education'), label: t('grower.nav.education'), icon: <GraduationCap className="w-5 h-5" /> },
    { href: p('/grower/app-guide'), label: t('grower.nav.appGuide'), icon: <Smartphone className="w-5 h-5" /> },
    { href: p('/grower/confidential'), label: t('grower.nav.confidential'), icon: <Shield className="w-5 h-5" /> },
    { href: p('/grower/where-to-buy'), label: t('grower.nav.suppliersAndOrders'), icon: <ShoppingBag className="w-5 h-5" /> },
    { href: p('/grower/missions/create'), label: t('grower.nav.requestTransport'), icon: <Truck className="w-5 h-5" /> },
    { href: p('/grower/portal'), label: t('grower.nav.missionTracker'), icon: <MapPin className="w-5 h-5" /> },
    { href: p('/grower/profile'), label: t('grower.nav.myProfile'), icon: <User className="w-5 h-5" /> },
  ];
}

export function useGrowerNavItems() {
  const pathname = usePathname() ?? '/';
  const { t, i18n } = useTranslation();
  const locale: SiteLocale =
    pathnameStartsWithLocale(pathname) ??
    siteLocaleFromLanguageTag(i18n.resolvedLanguage ?? i18n.language);
  return useMemo(() => buildGrowerNavItems(t, locale), [t, locale]);
}
