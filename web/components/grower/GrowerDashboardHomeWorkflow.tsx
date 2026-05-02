'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import {
  ListOrdered,
  MapPin,
  Leaf,
  ClipboardList,
  Box,
  CheckCircle2,
  ShieldAlert,
  Award,
  Package,
  Truck,
  MapPinned,
  QrCode,
  ShoppingBag,
  Camera,
  FilePlus,
  Image as ImageIcon,
  ClipboardCheck,
} from 'lucide-react';

type EssentialItem = {
  href: string;
  titleKey: string;
  descKey: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  iconClass: string;
  bgClass: string;
};

/**
 * Same flow as mobile `FarmerHomeSection`: instructions → parcels → … → logistics → “Also”.
 * Parity with `mobile/features/grower/dashboard/FarmerHomeSection.tsx`.
 */
export default function GrowerDashboardHomeWorkflow() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const essentials: EssentialItem[] = [
    {
      href: loc('/grower/season'),
      titleKey: 'grower.dashboard.workflow.instructionsTitle',
      descKey: 'grower.dashboard.workflow.instructionsDesc',
      icon: ListOrdered,
      iconClass: 'text-[#2D5A27]',
      bgClass: 'bg-[#2D5A27]/10',
    },
    {
      href: loc('/grower/fields'),
      titleKey: 'grower.dashboard.workflow.parcelsTitle',
      descKey: 'grower.dashboard.workflow.parcelsDesc',
      icon: MapPin,
      iconClass: 'text-[#2D5A27]',
      bgClass: 'bg-[#2D5A27]/10',
    },
    {
      href: loc('/grower/plantings'),
      titleKey: 'grower.dashboard.workflow.plantingsTitle',
      descKey: 'grower.dashboard.workflow.plantingsDesc',
      icon: Leaf,
      iconClass: 'text-[#2D5A27]',
      bgClass: 'bg-[#2D5A27]/10',
    },
    {
      href: loc('/grower/field-diary'),
      titleKey: 'grower.dashboard.workflow.diaryTitle',
      descKey: 'grower.dashboard.workflow.diaryDesc',
      icon: ClipboardList,
      iconClass: 'text-[#2D5A27]',
      bgClass: 'bg-[#2D5A27]/10',
    },
    {
      href: loc('/grower/materials'),
      titleKey: 'grower.dashboard.workflow.materialsTitle',
      descKey: 'grower.dashboard.workflow.materialsDesc',
      icon: Box,
      iconClass: 'text-[#2D5A27]',
      bgClass: 'bg-[#2D5A27]/10',
    },
    {
      href: loc('/grower/materials'),
      titleKey: 'grower.dashboard.workflow.allowedTitle',
      descKey: 'grower.dashboard.workflow.allowedDesc',
      icon: CheckCircle2,
      iconClass: 'text-green-700',
      bgClass: 'bg-green-50',
    },
    {
      href: loc('/grower/season'),
      titleKey: 'grower.dashboard.workflow.bannedTitle',
      descKey: 'grower.dashboard.workflow.bannedDesc',
      icon: ShieldAlert,
      iconClass: 'text-red-700',
      bgClass: 'bg-red-50',
    },
    {
      href: loc('/grower/profile'),
      titleKey: 'grower.dashboard.workflow.certsTitle',
      descKey: 'grower.dashboard.workflow.certsDesc',
      icon: Award,
      iconClass: 'text-sky-800',
      bgClass: 'bg-sky-50',
    },
  ];

  const logistics = [
    {
      href: loc('/grower/batches'),
      titleKey: 'grower.dashboard.workflow.logisticsBatches',
      icon: Package,
    },
    {
      href: loc('/grower/missions/create'),
      titleKey: 'grower.dashboard.workflow.logisticsTransport',
      icon: Truck,
    },
    {
      href: loc('/grower/portal'),
      titleKey: 'grower.dashboard.workflow.logisticsMissions',
      icon: MapPinned,
    },
    {
      href: loc('/grower/package-badges/scan'),
      titleKey: 'grower.dashboard.workflow.logisticsBadges',
      icon: QrCode,
    },
  ] as const;

  const also = [
    {
      href: loc('/grower/where-to-buy'),
      titleKey: 'grower.dashboard.workflow.alsoPartnerOrders',
      icon: ShoppingBag,
    },
    {
      href: loc('/grower/batches'),
      titleKey: 'grower.dashboard.workflow.alsoProducts',
      icon: Package,
    },
    {
      href: '/producer/field-entry',
      titleKey: 'grower.dashboard.workflow.alsoScan',
      icon: Camera,
    },
    {
      href: loc('/grower/plantings'),
      titleKey: 'grower.dashboard.workflow.alsoHarvest',
      icon: FilePlus,
    },
    {
      href: loc('/grower/compliance-photos'),
      titleKey: 'grower.dashboard.workflow.alsoPhotos',
      icon: ImageIcon,
    },
    {
      href: loc('/grower/quality-entry'),
      titleKey: 'grower.dashboard.workflow.alsoQuality',
      icon: ClipboardCheck,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t('grower.dashboard.workflow.blockTitle')}</h2>
        <p className="text-base text-gray-700 font-light mt-1.5 mb-4 leading-relaxed max-w-3xl">
          {t('grower.dashboard.workflow.blockHint')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {essentials.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.titleKey}
                href={item.href}
                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-[1.125rem] min-h-[5.25rem] hover:border-[#2D5A27]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/45 focus-visible:ring-offset-2"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gray-100 ${item.bgClass}`}
                >
                  <Icon className={`h-7 w-7 ${item.iconClass}`} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-gray-900 leading-snug">{t(item.titleKey)}</p>
                  <p className="text-base text-gray-700 font-light mt-1 leading-snug">{t(item.descKey)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t('grower.dashboard.workflow.logisticsBlockTitle')}</h2>
        <p className="text-base text-gray-700 font-light mt-1.5 mb-4 leading-relaxed max-w-3xl">
          {t('grower.dashboard.workflow.logisticsBlockHint')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {logistics.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.titleKey}
                href={item.href}
                className="flex min-h-[3.25rem] items-center gap-2 rounded-lg border border-gray-200 bg-[#2D5A27]/5 px-4 py-4 hover:bg-[#2D5A27]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/45 focus-visible:ring-offset-2"
              >
                <Icon className="h-5 w-5 text-[#2D5A27] shrink-0" strokeWidth={1.75} />
                <span className="text-base font-semibold text-gray-900">{t(item.titleKey)}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3">{t('grower.dashboard.workflow.alsoBlock')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {also.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.titleKey}
                href={item.href}
                className="flex min-h-[3.25rem] items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-4 hover:border-[#2D5A27]/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2"
              >
                <Icon className="h-5 w-5 text-gray-700 shrink-0" strokeWidth={1.5} />
                <span className="text-base font-medium text-gray-900">{t(item.titleKey)}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
