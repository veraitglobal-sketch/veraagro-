'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { Package, Plus } from 'lucide-react';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';

export default function ProductsManagementPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.products')} navItems={adminNavItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-gray-900">{t('adminPages.products.heading')}</h1>
              <p className="text-sm text-gray-600 mt-1">{t('adminPages.products.subtitle')}</p>
            </div>
            <button
              disabled
              className="px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-lg cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('adminPages.products.addProduct')}
            </button>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('adminPages.products.empty')}</p>
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
