'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { buyersAPI } from '@/lib/api';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await buyersAPI.getAnalytics(
        dateRange.startDate || undefined,
        dateRange.endDate || undefined
      );
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    loadAnalytics();
  };

  const exportToCSV = () => {
    if (!analytics) return;

    const csvData = [
      ['Analytics Report', ''],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Spending by Month', ''],
      ['Month', 'Amount', 'Count'],
      ...analytics.spendingByMonth.map((item: any) => [
        item.month,
        item.amount,
        item.count,
      ]),
      [''],
      ['Spending by Product', ''],
      ['Product', 'Amount', 'Quantity'],
      ...analytics.spendingByProduct.map((item: any) => [
        item.productName,
        item._sum?.totalAmount || 0,
        item._sum?.quantity || 0,
      ]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['BUYER']}>
        <SidebarLayout title={t('buyerPortalPages.analytics')} navItems={buyerPortalNavItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRoles={['BUYER']}>
        <SidebarLayout title={t('buyerPortalPages.analytics')} navItems={buyerPortalNavItems}>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  // Prepare chart data
  const spendingByMonthData = analytics?.spendingByMonth?.map((item: any) => ({
    month: item.month,
    amount: item.amount || 0,
    count: item.count || 0,
  })) || [];

  const spendingByProductData = analytics?.spendingByProduct
    ?.slice(0, 10)
    .map((item: any) => ({
      name: item.productName || 'Unknown',
      amount: item._sum?.totalAmount || 0,
      quantity: item._sum?.quantity || 0,
    })) || [];

  const spendingBySupplierData = analytics?.spendingBySupplier
    ?.slice(0, 5)
    .map((item: any) => ({
      name: `Partner ${item.estateId?.slice(0, 8)}`,
      amount: item._sum?.totalAmount || 0,
      count: item._count || 0,
    })) || [];

  const totalSpent = spendingByMonthData.reduce((sum: number, item: any) => sum + item.amount, 0);
  const totalOrders = analytics?.orders?.length || 0;
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title={t('buyerPortalPages.analytics')} navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-green-200/50 pb-6">
            <h1 className="text-2xl font-light text-gray-900">{t('buyerPortalPages.analytics')}</h1>
            <p className="text-sm text-gray-600 mt-2 font-light">View detailed analytics and export reports</p>
          </div>

          {/* Date Range Filter */}
          <div className="border-b border-green-200/50 pb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" strokeWidth={1} />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleDateRangeChange}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors"
                  >
                    Apply Filter
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-light hover:border-green-200/50 transition-colors"
                    title="Export to CSV"
                  >
                    <Download className="w-5 h-5" strokeWidth={1} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-green-200/50 pb-8">
            <div className="border-b border-green-200/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Total Spent</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    €{totalSpent.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-green-600/60" strokeWidth={1} />
              </div>
            </div>

            <div className="border-b border-green-200/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Total Orders</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    {totalOrders}
                  </p>
                </div>
                <Package className="w-6 h-6 text-green-600/60" strokeWidth={1} />
              </div>
            </div>

            <div className="border-b border-green-200/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-light text-gray-900 mt-2">
                    €{averageOrderValue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-600/60" strokeWidth={1} />
              </div>
            </div>

            <div className="border-b border-green-200/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-light text-gray-600">Date Range</p>
                  <p className="text-sm font-light text-gray-900 mt-2">
                    {dateRange.startDate && dateRange.endDate
                      ? `${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}`
                      : 'All Time'}
                  </p>
                </div>
                <Calendar className="w-6 h-6 text-green-600/60" strokeWidth={1} />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-b border-green-200/50 pb-8">
            {/* Spending by Month */}
            <div className="border-b border-green-200/50 pb-6">
              <h3 className="text-lg font-light text-gray-900 mb-6">Spending by Month</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendingByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => {
                      const date = new Date(value + '-01');
                      return date.toLocaleDateString('en-US', { month: 'short' });
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [`€${Number(value).toFixed(2)}`, 'Amount']}
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

            {/* Spending by Product */}
            <div className="border-b border-green-200/50 pb-6">
              <h3 className="text-lg font-light text-gray-900 mb-6">Top Products by Spending</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingByProductData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [`€${Number(value).toFixed(2)}`, 'Amount']}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#10b981" name="Amount Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spending by Vera Partners */}
          {spendingBySupplierData.length > 0 && (
            <div className="border-b border-green-200/50 pb-8">
              <h3 className="text-lg font-light text-gray-900 mb-6">Spending by Vera Partners</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={spendingBySupplierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {spendingBySupplierData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `€${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
