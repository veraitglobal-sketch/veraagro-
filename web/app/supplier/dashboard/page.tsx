'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import AssignedAgentCard from '@/components/AssignedAgentCard';
import { b2bSupplierPortalAPI, usersAPI } from '@/lib/api';
import type { CommercialAgentPublic } from '@/lib/auth';

export default function SupplierDashboardPage() {
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [threadsCount, setThreadsCount] = useState<number | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<CommercialAgentPublic | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const [orders, threads, prof, me] = await Promise.all([
          b2bSupplierPortalAPI.getIncomingOrders().catch(() => []),
          b2bSupplierPortalAPI.getMyThreads().catch(() => []),
          b2bSupplierPortalAPI.getMyProfile().catch(() => null),
          usersAPI.getMe().catch(() => null),
        ]);
        setOrdersCount(Array.isArray(orders) ? orders.length : 0);
        setThreadsCount(Array.isArray(threads) ? threads.length : 0);
        setProfile(prof);
        if (me && typeof me === 'object' && 'assignedCommercialAgent' in me) {
          setAssignedAgent(
            (me as { assignedCommercialAgent?: CommercialAgentPublic | null }).assignedCommercialAgent ?? null,
          );
        } else {
          setAssignedAgent(null);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Could not load');
      }
    })();
  }, []);

  const name = (profile?.businessName as string) || 'Your store';

  return (
    <AuthGuard requiredRoles={['MATERIAL_SUPPLIER']} redirectTo="/login">
      <h1 className="text-2xl font-light text-gray-900 mb-1">{name}</h1>
      <p className="text-sm text-gray-600 mb-4">Grower direct orders and messages to your partner store</p>
      {assignedAgent !== undefined && <AssignedAgentCard agent={assignedAgent} className="mb-6" />}
      {err && <p className="text-sm text-red-600 mb-4">{err}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/supplier/orders"
          className="block p-5 bg-white border border-gray-200 rounded-lg hover:border-[#2D5A27]/30 transition-colors"
        >
          <h2 className="text-sm font-medium text-gray-900">Orders from growers</h2>
          <p className="text-2xl font-light text-[#2D5A27] mt-1">{ordersCount === null ? '—' : ordersCount}</p>
          <p className="text-xs text-gray-500 mt-2">View and update status (pending, confirmed, fulfilled)</p>
        </Link>
        <Link
          href="/supplier/messages"
          className="block p-5 bg-white border border-gray-200 rounded-lg hover:border-[#2D5A27]/30 transition-colors"
        >
          <h2 className="text-sm font-medium text-gray-900">Messages</h2>
          <p className="text-2xl font-light text-[#2D5A27] mt-1">{threadsCount === null ? '—' : threadsCount}</p>
          <p className="text-xs text-gray-500 mt-2">Conversations with growers</p>
        </Link>
      </div>
      <p className="text-xs text-gray-500 mt-8">
        Your store appears on the grower map when the team has approved the location. For profile or address
        changes, contact Bio Vera support.
      </p>
    </AuthGuard>
  );
}
