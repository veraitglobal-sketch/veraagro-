'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import AssignedAgentCard from '@/components/AssignedAgentCard';
import { b2bSupplierPortalAPI, usersAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import type { CommercialAgentPublic } from '@/lib/auth';
import SupplierStorefrontSection from '../SupplierStorefrontSection';

export default function SupplierDashboardPage() {
  const { t } = useTranslation();
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [threadsCount, setThreadsCount] = useState<number | null>(null);
  const [catalogCount, setCatalogCount] = useState<number | null>(null);
  const [catalogWindowItems, setCatalogWindowItems] = useState<
    Array<{ id: string; name: string; imageUrl: string | null }>
  >([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<CommercialAgentPublic | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const [orders, threads, prof, me, cat] = await Promise.all([
          b2bSupplierPortalAPI.getIncomingOrders().catch(() => []),
          b2bSupplierPortalAPI.getMyThreads().catch(() => []),
          b2bSupplierPortalAPI.getMyProfile().catch(() => null),
          usersAPI.getMe().catch(() => null),
          b2bSupplierPortalAPI.getMyCatalog().catch(() => []),
        ]);
        setOrdersCount(Array.isArray(orders) ? orders.length : 0);
        setThreadsCount(Array.isArray(threads) ? threads.length : 0);
        setProfile(prof);
        if (Array.isArray(cat)) {
          setCatalogCount(cat.length);
          const active = cat.filter((row: { isActive?: boolean }) => row.isActive !== false);
          const withPhotosFirst = [...active].sort((a, b) => {
            const ai = a.imageUrl ? 1 : 0;
            const bi = b.imageUrl ? 1 : 0;
            return bi - ai;
          });
          setCatalogWindowItems(
            withPhotosFirst.slice(0, 3).map((row: { id: string; name: string; imageUrl?: string | null }) => ({
              id: row.id,
              name: row.name,
              imageUrl: row.imageUrl ?? null,
            })),
          );
        } else {
          setCatalogCount(0);
          setCatalogWindowItems([]);
        }
        if (me && typeof me === 'object' && 'assignedCommercialAgent' in me) {
          setAssignedAgent(
            (me as { assignedCommercialAgent?: CommercialAgentPublic | null }).assignedCommercialAgent ?? null,
          );
        } else {
          setAssignedAgent(null);
        }
      } catch (e: unknown) {
        setErr(apiErrorOrT(e, t, 'supplier.dashboard.loadError'));
      }
    })();
  }, [t]);

  const name = (profile?.businessName as string) || t('supplier.dashboard.defaultStoreName');
  const city = typeof profile?.city === 'string' ? profile.city : undefined;
  const country = typeof profile?.country === 'string' ? profile.country : undefined;
  const mapApproved = typeof profile?.mapApproved === 'boolean' ? profile.mapApproved : undefined;

  return (
    <AuthGuard
      requiredRoles={['MATERIAL_SUPPLIER']}
      redirectTo="/login?returnTo=%2Fsupplier%2Fdashboard"
    >
      {err && <p className="text-sm text-red-600 mb-4">{err}</p>}

      {assignedAgent !== undefined && <AssignedAgentCard agent={assignedAgent} className="mb-6" />}

      <SupplierStorefrontSection
        storeName={name}
        city={city}
        country={country}
        mapApproved={mapApproved}
        ordersCount={ordersCount}
        threadsCount={threadsCount}
        catalogCount={catalogCount}
        catalogWindowItems={catalogWindowItems}
      />
    </AuthGuard>
  );
}
