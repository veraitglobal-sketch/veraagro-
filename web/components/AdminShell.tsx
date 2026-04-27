'use client';

import { ReactNode, useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useAdminNavItems, useAdminGrowerOpsGroup, type AdminDashStats } from '@/lib/admin-nav';
import { adminAPI } from '@/lib/api';

type Props = {
  title: string;
  children: ReactNode;
};

/**
 * Admin layout: main nav + “Grower ops” block with live counts from GET /admin/statistics.
 */
export default function AdminShell({ title, children }: Props) {
  const [stats, setStats] = useState<AdminDashStats | null>(null);
  const adminNavItems = useAdminNavItems();
  const growerOps = useAdminGrowerOpsGroup(stats);

  useEffect(() => {
    adminAPI
      .getStatistics()
      .then((s) => setStats(s as AdminDashStats))
      .catch(() => setStats({}));
  }, []);

  const navGroups = [growerOps];

  return (
    <SidebarLayout title={title} navItems={adminNavItems} navGroups={navGroups}>
      {children}
    </SidebarLayout>
  );
}
