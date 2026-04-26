'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { adminAPI } from '@/lib/api';
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
} from 'lucide-react';
import { getAdminNavItems } from '@/lib/admin-nav';

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
}

export default function AdminDashboard() {
  const adminNavItems = getAdminNavItems();
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
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
        <SidebarLayout title="Admin Dashboard" navItems={adminNavItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
        <SidebarLayout title="Admin Dashboard" navItems={adminNavItems}>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  const pendingParcelApprovalCount = statistics?.parcels?.pendingApproval ?? 0;
  const pendingEstateSetupCount = statistics?.estates?.pendingSetup ?? 0;

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title="Admin Dashboard" navItems={adminNavItems}>
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {statistics?.users.total || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {statistics?.users.farmers || 0} farmers, {statistics?.users.buyers || 0} buyers
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orders Today</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {statistics?.orders.today || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    €{statistics?.orders.todayRevenue?.toFixed(2) || '0.00'} revenue
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Missions</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {statistics?.missions.active || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {statistics?.missions.total || 0} total
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Alerts</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {statistics?.security.pending || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {statistics?.security.total || 0} total
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estates</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {statistics?.estates?.total ?? 0}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {pendingEstateSetupCount} pending setup
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-[#2D5A27]" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Parcels</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {statistics?.parcels?.total ?? 0}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {statistics?.parcels?.pendingApproval ?? 0} awaiting approval
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-gray-500" />
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Manage Users</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Product Catalog</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/security"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">Security Alerts</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/admin/parcels-pending"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#2D5A27]" />
                  <span className="text-sm font-medium text-gray-900">Approve parcels</span>
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
                  <span className="text-sm font-medium text-gray-900">Estates / fields</span>
                  {pendingEstateSetupCount > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {pendingEstateSetupCount} setup
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
                  <span className="text-sm font-medium text-gray-900">Harvest plans</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Pending parcels + Recent Batches */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending parcels */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Parcels pending approval</h2>
                <Link href="/admin/parcels-pending" className="text-sm text-green-600 hover:text-green-700">
                  Approve all
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivities?.pendingParcels?.length > 0 ? (
                  recentActivities.pendingParcels.map((parcel: any) => (
                    <div key={parcel.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {parcel.estates?.name || 'Estate'} — {parcel.cropType || 'Parcel'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {parcel.estates?.users
                            ? `${parcel.estates.users.firstName} ${parcel.estates.users.lastName} (${parcel.estates.users.partnerCode})`
                            : 'Farmer'}
                        </p>
                      </div>
                      <Link
                        href="/admin/parcels-pending"
                        className="text-xs font-medium text-[#2D5A27] hover:underline"
                      >
                        Approve
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No parcels waiting for approval</p>
                )}
              </div>
            </div>

            {/* Recent Batches */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Batches</h2>
                <Link href="/admin/test-batch" className="text-sm text-green-600 hover:text-green-700">
                  Test batch
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivities?.recentBatches?.length > 0 ? (
                  recentActivities.recentBatches.map((batch: any) => (
                    <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{batch.batchId}</p>
                        <p className="text-xs text-gray-500">
                          {batch.estates?.name || '—'} · {batch.productName} · {batch.quantity} {batch.unit}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent batches</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <Link href="/admin/orders" className="text-sm text-green-600 hover:text-green-700">
                  View all
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
                  <p className="text-sm text-gray-500">No recent orders</p>
                )}
              </div>
            </div>

            {/* Recent Security Alerts */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Security Alerts</h2>
                <Link href="/admin/security" className="text-sm text-green-600 hover:text-green-700">
                  View all
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
                  <p className="text-sm text-gray-500">No recent alerts</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
