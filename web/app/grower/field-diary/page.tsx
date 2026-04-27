'use client';

import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

export default function GrowerFieldDiaryPage() {
  const { t } = useTranslation();
  const nav = useGrowerNavItems();
  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.nav.fieldDiary')} navItems={nav}>
        <GrowerPageShell>
          <GrowerPageHeader
            title={t('grower.placeholders.fieldDiaryTitle')}
            description={t('grower.placeholders.fieldDiaryBody')}
          />
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
