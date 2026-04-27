'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { buyersAPI, ordersAPI, deliveriesAPI, invoicesAPI } from '@/lib/api';
import { getBuyerInvoiceDisplayStatus } from '@/lib/invoice-payment-status';
import {
  ShoppingCart,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown,
  Plus,
  RefreshCw,
  Bell,
  AlertCircle,
  Activity,
  FileText,
  Download,
  Zap,
  BarChart3,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Shield, HelpCircle, Mail } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';
import {
  formatDateEn,
  formatMonthYearLongEnFromYearMonth,
  formatMonthYearShortEnFromYearMonth,
} from '@/lib/en-locale-dates';

export default function BuyerDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const router = useRouter();
  const [statistics, setStatistics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<any[]>([]);
  const [latestInvoices, setLatestInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stats, orders, deliveries, invoices] = await Promise.all([
        buyersAPI.getStatistics(),
        ordersAPI.getAll(),
        deliveriesAPI.getBuyerDeliveries().catch(() => []),
        invoicesAPI.getAll().catch(() => []),
      ]);
      setStatistics(stats);
      setRecentOrders(orders.slice(0, 5));
      const activeDeliveries = Array.isArray(deliveries)
        ? deliveries
            .filter((d: any) => !['CANCELLED', 'COMPLETED', 'CONFIRMED'].includes(d.status))
            .sort((a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
            .slice(0, 8)
        : [];
      setUpcomingDeliveries(activeDeliveries);
      const invoiceList = Array.isArray(invoices) ? invoices : [];
      const transformed = invoiceList.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        orderNumber: inv.orders?.orderNumber || inv.invoiceData?.orderNumber || 'N/A',
        date: new Date(inv.generatedAt || inv.createdAt),
        amount: inv.orders?.totalAmount ?? inv.invoiceData?.total ?? 0,
        status: getBuyerInvoiceDisplayStatus(inv.orders),
      }));
      setLatestInvoices(transformed.sort((a: any, b: any) => b.date.getTime() - a.date.getTime()).slice(0, 5));
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return { icon: <ArrowUp className="w-4 h-4 text-[#2D5A27]" />, color: 'text-[#2D5A27]' };
    } else if (current < previous) {
      return { icon: <ArrowDown className="w-4 h-4 text-red-600" />, color: 'text-red-600' };
    }
    return { icon: null, color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['BUYER']}>
        <SidebarLayout title={t('buyerPortalPages.dashboard')} navItems={buyerPortalNavItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRoles={['BUYER']}>
        <SidebarLayout title={t('buyerPortalPages.dashboard')} navItems={buyerPortalNavItems}>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  const spendingData = statistics?.spendingTrend || [];
  const topProductsData = statistics?.topProducts?.map((p: any) => ({
    name: p.productName,
    quantity: p.totalQuantity,
  })) || [];

  return (
    <AuthGuard requiredRoles={['BUYER']}>
        <SidebarLayout title={t('buyerPortalPages.dashboard')} navItems={buyerPortalNavItems}>
        <div className="space-y-10">
          {/* Welcome + Trust */}
          <div className="border-b border-[#2D5A27]/20/50 pb-6">
            <h2 className="text-xl font-light text-gray-900 mb-1">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            </h2>
            <p className="text-sm text-gray-600 font-light mb-4">
              Your Bio Vera B2B procurement dashboard — orders, deliveries and spending at a glance.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500 font-light">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#2D5A27]/70" strokeWidth={1.5} />
                Secure B2B buyer access
              </span>
              <span>·</span>
              <span>Certified supply chain</span>
              <span>·</span>
              <span>Your data protected</span>
            </div>
          </div>

          {/* Action required / Alerts */}
          {((latestInvoices.filter((i: any) => i.status === 'PENDING').length > 0) || upcomingDeliveries.length > 0) && (
            <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
                Action required
              </h3>
              <ul className="space-y-2 text-sm font-light">
                {latestInvoices.filter((i: any) => i.status === 'PENDING').length > 0 && (
                  <li>
                    <Link
                      href="/buyer-portal/invoices?status=PENDING"
                      className="text-[#2D5A27] hover:underline flex items-center gap-1.5"
                    >
                      {latestInvoices.filter((i: any) => i.status === 'PENDING').length} invoice(s) pending payment
                      <span className="text-xs">→ Invoices</span>
                    </Link>
                  </li>
                )}
                {upcomingDeliveries.length > 0 && (
                  <li>
                    <Link
                      href="/buyer-portal/deliveries"
                      className="text-[#2D5A27] hover:underline flex items-center gap-1.5"
                    >
                      {upcomingDeliveries.length} active delivery(ies) — track or confirm on arrival
                      <span className="text-xs">→ Deliveries</span>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Quick actions: Pre-order, Direct orders, Invoices, Deliveries, Analytics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              href="/pre-order-2026"
              className="flex items-center gap-4 p-4 rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/10/50 hover:bg-[#2D5A27]/10 hover:border-[#2D5A27]/40 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2D5A27]/10 flex-shrink-0">
                <FileText className="h-6 w-6 text-[#2D5A27]" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">Pre-order 2026</p>
                <p className="text-sm text-gray-600 font-light">Plan quantities for the season</p>
              </div>
            </Link>
            <Link
              href="/buyer-portal/trade-panel"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                <ShoppingCart className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">Direct orders</p>
                <p className="text-sm text-gray-600 font-light">Place an order now</p>
              </div>
            </Link>
            <Link
              href="/buyer-portal/invoices"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">Invoices</p>
                <p className="text-sm text-gray-600 font-light">View and download</p>
              </div>
            </Link>
            <Link
              href="/buyer-portal/deliveries"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                <Package className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">Deliveries</p>
                <p className="text-sm text-gray-600 font-light">Track your orders</p>
              </div>
            </Link>
            <Link
              href="/buyer-portal/analytics"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-600 font-light">Reports & insights</p>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="border-b border-[#2D5A27]/20/50 pb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-light text-gray-900 mb-2">Business Overview</h1>
                <p className="text-sm text-gray-600 font-light">
                  Comprehensive insights into your procurement operations and supplier relationships
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-light hover:border-[#2D5A27]/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1} />
                Refresh Data
              </button>
            </div>
            
            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-b border-[#2D5A27]/20/50 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-light text-gray-500 uppercase tracking-wide mb-1">Service status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#2D5A27]/100 rounded-full"></div>
                      <p className="text-sm font-light text-gray-900">All Systems Operational</p>
                    </div>
                  </div>
                  <Activity className="w-5 h-5 text-[#2D5A27]/60" strokeWidth={1} />
                </div>
              </div>
              <div className="border-b border-[#2D5A27]/20/50 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-light text-gray-500 uppercase tracking-wide mb-1">Open orders</p>
                    <p className="text-sm font-light text-gray-900">
                      {recentOrders.filter((o: any) => o.status === 'PENDING').length}
                    </p>
                  </div>
                  <Package className="w-5 h-5 text-[#2D5A27]/60" strokeWidth={1} />
                </div>
              </div>
              <div className="border-b border-[#2D5A27]/20/50 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-light text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
                    <p className="text-sm font-light text-gray-900">
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 text-[#2D5A27]/60" strokeWidth={1} />
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-b border-[#2D5A27]/20/50 pb-8">
            <div className="border-b border-[#2D5A27]/20/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Total Orders</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    {statistics?.orders.total || 0}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <p className="text-xs text-gray-500 font-light">
                      {statistics?.orders.thisMonth || 0} this month
                    </p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500 font-light">
                      {statistics?.orders.thisWeek || 0} this week
                    </p>
                  </div>
                </div>
                <ShoppingCart className="w-6 h-6 text-[#2D5A27]/60" strokeWidth={1} />
              </div>
            </div>

            <div className="border-b border-[#2D5A27]/20/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Total Spent</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    €{statistics?.spending.total?.toFixed(2) || '0.00'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <p className="text-xs text-gray-500 font-light">
                      €{statistics?.spending.thisMonth?.toFixed(2) || '0.00'} this month
                    </p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500 font-light">
                      €{statistics?.spending.thisWeek?.toFixed(2) || '0.00'} this week
                    </p>
                  </div>
                </div>
                <DollarSign className="w-6 h-6 text-[#2D5A27]/60" strokeWidth={1} />
              </div>
            </div>

            <div className="border-b border-[#2D5A27]/20/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Active Orders</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    {statistics?.orders.active || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 font-light">
                    {statistics?.orders.pending || 0} pending
                  </p>
                </div>
                <Package className="w-6 h-6 text-[#2D5A27]/60" strokeWidth={1} />
              </div>
            </div>

            <div className="border-b border-[#2D5A27]/20/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    €{statistics?.spending.average?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 font-light">
                    {statistics?.orders.completed || 0} completed
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-[#2D5A27]/60" strokeWidth={1} />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-b border-[#2D5A27]/20/50 pb-8">
            {/* Spending Trend */}
            <div className="border-b border-[#2D5A27]/20/50 pb-6">
              <h3 className="text-lg font-light text-gray-900 mb-6">Spending Trend</h3>
              <p className="text-sm text-gray-600 mb-4 font-light">Last 6 months</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => formatMonthYearShortEnFromYearMonth(String(value))}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`€${Number(value).toFixed(2)}`, 'Spent']}
                    labelFormatter={(label) => {
                      const date = new Date(label + '-01');
                      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Amount Spent"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div className="border-b border-[#2D5A27]/20/50 pb-6">
              <h3 className="text-lg font-light text-gray-900 mb-6">Top Products</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="border-b border-[#2D5A27]/20/50 pb-8">
            <div className="border-b border-[#2D5A27]/20/50 pb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-light text-gray-900">Recent Orders</h3>
                <Link href="/buyer-portal/orders" className="text-sm font-light text-[#2D5A27]/80 hover:text-[#2D5A27]">
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between pb-4 border-b border-gray-200/50">
                    <div>
                      <p className="text-sm font-light text-gray-900">
                        {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500 font-light">
                        {order.productName} • {order.quantity} {order.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-light text-gray-900">
                        €{order.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                      <span className={`text-xs px-2 py-1 border ${
                        order.status === 'COMPLETED' ? 'border-[#2D5A27]/20/50 text-[#2D5A27]/80' :
                        order.status === 'PENDING' ? 'border-yellow-200/50 text-yellow-600/80' :
                        'border-gray-200/50 text-gray-600/80'
                      } font-light`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4 font-light">No recent orders</p>
                )}
              </div>
            </div>
          </div>

          {/* Pending Orders & Upcoming Deliveries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-b border-[#2D5A27]/20/50 pb-8">
            {/* Pending Orders */}
            <div className="border-b border-[#2D5A27]/20/50 pb-6">
              <h3 className="text-lg font-light text-gray-900 mb-6">Pending Orders</h3>
              <div className="space-y-4">
                {recentOrders
                  .filter((order: any) => order.status === 'PENDING')
                  .slice(0, 5)
                  .map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between pb-4 border-b border-yellow-200/50">
                      <div>
                        <p className="text-sm font-light text-gray-900">
                          {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-500 font-light">
                          {order.productName} • {order.quantity} {order.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-light text-gray-900">
                          €{order.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                        <span className="text-xs px-2 py-1 border border-yellow-200/50 text-yellow-600/80 font-light">
                          PENDING
                        </span>
                      </div>
                    </div>
                  ))}
                {recentOrders.filter((order: any) => order.status === 'PENDING').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4 font-light">No pending orders</p>
                )}
              </div>
            </div>

            {/* Upcoming Deliveries (from API) */}
            <div className="border-b border-[#2D5A27]/20/50 pb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-light text-gray-900">Upcoming Deliveries</h3>
                <Link href="/buyer-portal/deliveries" className="text-sm font-light text-[#2D5A27]/80 hover:text-[#2D5A27]">
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingDeliveries.slice(0, 5).map((delivery: any) => (
                  <div key={delivery.id} className="flex items-center justify-between pb-4 border-b border-gray-200/50">
                    <div>
                      <p className="text-sm font-light text-gray-900">
                        {delivery.deliveryNumber || delivery.orders?.orderNumber || `#${delivery.id?.slice(0, 8) || '—'}`}
                      </p>
                      <p className="text-xs text-gray-500 font-light">
                        {delivery.orders?.productName || 'Delivery'} • {delivery.orders?.quantity ?? '—'} {delivery.orders?.unit || ''}
                      </p>
                      {(delivery.estimatedDeliveryDate || delivery.assignedAt || delivery.updatedAt) && (
                        <p className="text-xs text-gray-400 mt-1 font-light">
                          {delivery.estimatedDeliveryDate
                            ? `ETA: ${formatDateEn(delivery.estimatedDeliveryDate)}`
                            : `Updated: ${formatDateEn(delivery.updatedAt || delivery.assignedAt)}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 border font-light ${
                        delivery.status === 'IN_TRANSIT' ? 'border-[#2D5A27]/20/50 text-[#2D5A27]/80' :
                        delivery.status === 'PICKED_UP' ? 'border-blue-200/50 text-blue-600/80' :
                        'border-gray-200/50 text-gray-600/80'
                      }`}>
                        {delivery.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
                {upcomingDeliveries.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4 font-light">No upcoming deliveries</p>
                )}
              </div>
            </div>
          </div>

          {/* Latest invoices */}
          <div className="border-b border-[#2D5A27]/20/50 pb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-light text-gray-900">Latest Invoices</h3>
              <Link href="/buyer-portal/invoices" className="text-sm font-light text-[#2D5A27]/80 hover:text-[#2D5A27]">
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {latestInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between pb-4 border-b border-gray-200/50">
                  <div>
                    <p className="text-sm font-light text-gray-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500 font-light">
                      Order {inv.orderNumber} · {formatDateEn(inv.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-light text-gray-900">€{Number(inv.amount).toFixed(2)}</span>
                    <span
                      className={`text-xs px-2 py-1 border font-light ${
                        inv.status === 'PAID'
                          ? 'border-[#2D5A27]/20/50 text-[#2D5A27]/80'
                          : inv.status === 'REFUNDED'
                            ? 'border-gray-200/50 text-gray-600/80'
                            : 'border-amber-200/50 text-amber-600/80'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const blob = await invoicesAPI.download(inv.id);
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${inv.invoiceNumber}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="p-1.5 text-gray-500 hover:text-[#2D5A27] transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
              {latestInvoices.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4 font-light">No invoices yet</p>
              )}
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="border-b border-[#2D5A27]/20/50 pb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-light text-gray-900">Recent Activity</h3>
              <button
                onClick={() => router.push('/buyer-portal/history')}
                className="text-sm font-light text-[#2D5A27]/80 hover:text-[#2D5A27] transition-colors"
              >
                View All →
              </button>
            </div>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between pb-4 border-b border-gray-200/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        order.status === 'COMPLETED' ? 'bg-[#2D5A27]/60' :
                        order.status === 'PENDING' ? 'bg-yellow-600/60' :
                        'bg-gray-600/60'
                      }`} />
                      <div>
                        <p className="text-sm font-light text-gray-900">
                          {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-500 font-light">
                          {order.productName} • {formatDateEn(order.createdAt || Date.now())}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-light text-gray-900">
                        €{order.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                      <span className={`text-xs px-2 py-1 border font-light ${
                        order.status === 'COMPLETED' ? 'border-[#2D5A27]/20/50 text-[#2D5A27]/80' :
                        order.status === 'PENDING' ? 'border-yellow-200/50 text-yellow-600/80' :
                        'border-gray-200/50 text-gray-600/80'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 font-light">No recent activity</p>
              )}
            </div>
          </div>

          {/* Resources & Support */}
          <div className="border-b border-[#2D5A27]/20/50 pb-8">
            <h3 className="text-lg font-light text-gray-900 mb-4">Resources & support</h3>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/for-buyers#how-we-operate"
                className="inline-flex items-center gap-2 text-sm font-light text-gray-700 hover:text-[#23471f] transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-[#2D5A27]/70" strokeWidth={1.5} />
                How we operate
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-sm font-light text-gray-700 hover:text-[#23471f] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#2D5A27]/70" strokeWidth={1.5} />
                Contact
              </Link>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
