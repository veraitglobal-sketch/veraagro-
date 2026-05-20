'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { adminAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowRight,
  MapPin,
  CheckCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAdminNavItems } from '@/lib/admin-nav';
import { formatDateEn } from '@/lib/en-locale-dates';
import { useTranslation } from 'react-i18next';

interface Statistics {
  users: {
    total: number;
    farmers: number;
    buyers: number;
  };
  orders: {
    total: number;
    today: number;
    todayRevenue: number;
  };
  missions: {
    total: number;
    active: number;
  };
  batches: {
    total: number;
  };
  security: {
    total: number;
    pending: number;
  };
  estates?: {
    total: number;
    pendingSetup?: number;
  };
  parcels?: {
    total: number;
    pendingApproval: number;
  };
  growerModeration?: {
    transportAwaitingApproval: number;
    recentGrowthPhotos: number;
    activePlantings: number;
  };
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recentActivities, setRecentActivities] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stats, activities] = await Promise.all([
        adminAPI.getStatistics(),
        adminAPI.getRecentActivities(5),
      ]);
      setStatistics(stats);
      setRecentActivities(activities);
    } catch (err: unknown) {
      console.error('Error loading dashboard data:', err);
      setError(apiErrorOrT(err, t, 'adminPages.dashboard.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
        <SidebarLayout title={t('adminPages.titles.main')} navItems={adminNavItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('adminPages.dashboard.loading')}</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
        <SidebarLayout title={t('adminPages.titles.main')} navItems={adminNavItems}>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  const pendingParcelApprovalCount = statistics?.parcels?.pendingApproval ?? 0;
  const pendingEstateSetupCount = statistics?.estates?.pendingSetup ?? 0;
  const growerModerationCount =
    (statistics?.growerModeration?.transportAwaitingApproval ?? 0) +
    (statistics?.growerModeration?.recentGrowthPhotos ?? 0);

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.main')} navItems={adminNavItems}>
        <div className="space-y-4 sm:space-y-5">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('adminPages.dashboard.totalUsers')}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0.5">
                    {statistics?.users.total || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('adminPages.dashboard.farmersBuyers', {
                      farmers: statistics?.users.farmers || 0,
                      buyers: statistics?.users.buyers || 0,
                    })}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('adminPages.dashboard.ordersToday')}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0.5">
                    {statistics?.orders.today || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('adminPages.dashboard.revenue', {
                      amount: statistics?.orders.todayRevenue?.toFixed(2) || '0.00',
                    })}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('adminPages.dashboard.activeMissions')}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0.5">
                    {statistics?.missions.active || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('adminPages.dashboard.totalMissions', { count: statistics?.missions.total || 0 })}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('adminPages.dashboard.pendingAlerts')}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0.5">
                    {statistics?.security.pending || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('adminPages.dashboard.totalAlerts', { count: statistics?.security.total || 0 })}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('adminPages.dashboard.statEstates')}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0.5">
                    {statistics?.estates?.total ?? 0}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {t('adminPages.dashboard.pendingSetup', { count: pendingEstateSetupCount })}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-[#2D5A27]" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('adminPages.dashboard.statParcels')}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0.5">
                    {statistics?.parcels?.total ?? 0}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {t('adminPages.dashboard.awaitingApproval', { count: statistics?.parcels?.pendingApproval ?? 0 })}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-gray-500" />
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">{t('adminPages.dashboard.quickActions')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">{t('adminPages.dashboard.manageUsers')}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">{t('adminPages.dashboard.productCatalog')}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/operations"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-[#2D5A27]" />
                  <span className="text-sm font-medium text-gray-900">{t('adminPages.dashboard.stockVsOrders')}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/security"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">{t('adminPages.dashboard.securityAlerts')}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/parcels-pending"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#2D5A27]" />
                  <span className="text-sm font-medium text-gray-900">{t('adminPages.dashboard.approveParcels')}</span>
                  {pendingParcelApprovalCount > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {pendingParcelApprovalCount}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/estates"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#2D5A27]" />
                  <span className="text-sm font-medium text-gray-900">{t('adminPages.dashboard.estatesFields')}</span>
                  {pendingEstateSetupCount > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {t('adminPages.dashboard.setupBadge', { count: pendingEstateSetupCount })}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/harvest-plans"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#2D5A27]" />
                  <span className="text-sm font-medium text-gray-900">{t('adminPages.dashboard.harvestPlans')}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/grower-control"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[#2D5A27]" />
                  <span className="text-sm font-medium text-gray-900">{t('adminPages.dashboard.growerControl')}</span>
                  {growerModerationCount > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {t('adminPages.dashboard.growerControlBadge', { count: growerModerationCount })}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Live: pending parcels + recent batches (compact) */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <h2 className="text-base font-semibold text-gray-900">{t('adminPages.dashboard.live')}</h2>
              <p className="text-xs text-gray-500">{t('adminPages.dashboard.liveSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-800">{t('adminPages.dashboard.statParcels')}</span>
                  <Link href="/admin/parcels-pending" className="text-xs text-[#2D5A27] font-medium hover:underline">
                    {t('adminPages.dashboard.openQueue')}
                  </Link>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-amber-100/80 rounded-md bg-amber-50/50">
                  {recentActivities?.pendingParcels?.length > 0 ? (
                    recentActivities.pendingParcels.slice(0, 5).map((parcel: any) => (
                      <div
                        key={parcel.id}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs border-b border-amber-100/60 last:border-0"
                      >
                        <span className="text-gray-900 truncate" title={`${parcel.estates?.name} — ${parcel.cropType}`}>
                          {parcel.estates?.name || t('adminPages.dashboard.estateFallback')} · {parcel.cropType || t('adminPages.dashboard.parcelFallback')}
                        </span>
                        <Link href="/admin/parcels-pending" className="shrink-0 text-[#2D5A27] font-medium hover:underline">
                          →
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 px-2 py-2">{t('adminPages.dashboard.nonePending')}</p>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-600">{t('adminPages.dashboard.batches')}</span>
                  <Link href="/admin/test-batch" className="text-xs text-[#2D5A27] font-medium hover:underline">
                    {t('adminPages.dashboard.testLink')}
                  </Link>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-100 rounded-md bg-gray-50/80">
                  {recentActivities?.recentBatches?.length > 0 ? (
                    recentActivities.recentBatches.slice(0, 5).map((batch: any) => (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs border-b border-gray-100 last:border-0"
                      >
                        <span className="text-gray-900 font-medium tabular-nums truncate">{batch.batchId}</span>
                        <span className="shrink-0 text-gray-500">
                          {batch.harvestDate ? formatDateEn(batch.harvestDate) : '—'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 px-2 py-2">{t('adminPages.dashboard.noRecentBatches')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">{t('adminPages.dashboard.recentOrders')}</h2>
                <Link href="/admin/orders" className="text-sm text-green-600 hover:text-green-700">
                  {t('adminPages.dashboard.viewAll')}
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivities?.orders?.length > 0 ? (
                  recentActivities.orders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {order.users?.firstName} {order.users?.lastName}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">{t('adminPages.dashboard.noRecentOrders')}</p>
                )}
              </div>
            </div>

            {/* Recent Security Alerts */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">{t('adminPages.dashboard.recentSecurityAlerts')}</h2>
                <Link href="/admin/security" className="text-sm text-green-600 hover:text-green-700">
                  {t('adminPages.dashboard.viewAll')}
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivities?.alerts?.length > 0 ? (
                  recentActivities.alerts.map((alert: any) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.type}</p>
                        <p className="text-xs text-gray-500">
                          {alert.users?.firstName} {alert.users?.lastName}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">{t('adminPages.dashboard.noRecentAlerts')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
