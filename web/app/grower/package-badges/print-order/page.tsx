'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

/**
 * Print orders and physical returns are managed by the material supplier account, not the grower.
 * Supplier UI: /supplier/package-badges/print-order
 */
export default function GrowerPackageBadgesPrintOrderInfoPage() {
  const { t } = useTranslation();
  const growerNavItems = useGrowerNavItems();

  return (
    <AuthGuard
      requiredRoles={['GROWER', 'FARMER', 'PARTNER', 'ADMIN', 'SUPER_ADMIN']}
      redirectTo="/login/producer"
    >
      <SidebarLayout title={t('grower.packageBadges.printOrderInfoTitle')} navItems={growerNavItems}>
        <GrowerPageShell>
          <GrowerPageHeader
            title={t('grower.packageBadges.printOrderInfoTitle')}
            description={t('grower.packageBadges.printOrderMoved')}
          />
          <p className="text-sm text-gray-600">
            <Link
              href="/grower/package-badges"
              className="font-medium text-[#2D5A27] underline-offset-2 hover:underline"
            >
              {t('grower.packageBadges.printOrderBack')}
            </Link>
          </p>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
