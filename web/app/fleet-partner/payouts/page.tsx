'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useFleetPartnerNavItems } from '@/lib/fleet-partner-nav';

export default function PayoutTrackerPage() {
  const { t } = useTranslation();
  const navItems = useFleetPartnerNavItems();
  const [weeklyPayout] = useState({
    currentWeek: 1245,
    completedDeliveries: 8,
    pendingPayout: 320,
    nextPayoutDate: '2024-01-15',
  });

  const [monthlyData] = useState([
    { week: 'Week 1', earnings: 980, deliveries: 6 },
    { week: 'Week 2', earnings: 1120, deliveries: 7 },
    { week: 'Week 3', earnings: 1245, deliveries: 8 },
    { week: 'Week 4', earnings: 0, deliveries: 0 },
  ]);

  const [recentPayouts] = useState([
    { id: 'PAY-001', date: '2024-01-08', amount: 1120, deliveries: 7, status: 'paid' },
    { id: 'PAY-002', date: '2024-01-01', amount: 980, deliveries: 6, status: 'paid' },
    { id: 'PAY-003', date: '2023-12-25', amount: 850, deliveries: 5, status: 'paid' },
  ]);

  return (
    <SidebarLayout title={t('internalShell.titles.payoutTracker')} navItems={navItems}>
      <div className="space-y-6">
        {/* Current Week Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#2D5A27]/10 to-[#2D5A27]/20 rounded-lg shadow-sm border border-[#2D5A27]/30 p-6"
          >
            <p className="text-sm text-[#2D5A27] mb-1">This Week</p>
            <p className="text-3xl font-bold text-[#23471f]">€{weeklyPayout.currentWeek}</p>
            <p className="text-sm text-[#2D5A27] mt-1">{weeklyPayout.completedDeliveries} deliveries</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-500 mb-1">Pending Payout</p>
            <p className="text-3xl font-bold text-gray-900">€{weeklyPayout.pendingPayout}</p>
            <p className="text-sm text-gray-500 mt-1">Next: {new Date(weeklyPayout.nextPayoutDate).toLocaleDateString()}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-500 mb-1">Total This Month</p>
            <p className="text-3xl font-bold text-gray-900">€{monthlyData.reduce((sum, w) => sum + w.earnings, 0)}</p>
            <p className="text-sm text-gray-500 mt-1">{monthlyData.reduce((sum, w) => sum + w.deliveries, 0)} deliveries</p>
          </motion.div>
        </div>

        {/* Monthly Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(value: any) => [`€${value}`, 'Earnings']} />
              <Bar dataKey="earnings" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Payouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payouts</h2>
          <div className="space-y-3">
            {recentPayouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{payout.id}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(payout.date).toLocaleDateString()} • {payout.deliveries} deliveries
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">€{payout.amount}</p>
                  <span className="px-2 py-1 bg-[#2D5A27]/20 text-[#23471f] text-xs font-medium rounded-full">
                    {payout.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Payment Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-50 rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Payouts are processed every Monday</p>
            <p>• Payments are made via bank transfer</p>
            <p>• Minimum payout threshold: €100</p>
            <p>• All payments include VAT where applicable</p>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
