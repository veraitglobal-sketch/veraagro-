'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

export default function GrowerPlantingsPage() {
  const { t } = useTranslation();
  const nav = useGrowerNavItems();
  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.nav.myPlantings')} navItems={nav}>
        <GrowerPageShell>
          <GrowerPageHeader
            title={t('grower.placeholders.plantingsTitle')}
            description={t('grower.placeholders.plantingsBody')}
          />
          <p className="mt-4">
            <Link href="/grower/fields" className="text-[#2D5A27] font-medium underline">
              {t('grower.placeholders.openParcels')}
            </Link>
          </p>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
