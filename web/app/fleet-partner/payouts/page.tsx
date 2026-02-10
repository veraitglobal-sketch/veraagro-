'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const navItems = [
  { href: '/fleet-partner', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/fleet-partner/missions', label: 'Mission Board', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { href: '/fleet-partner/deliveries', label: 'Active Deliveries', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: '/fleet-partner/payouts', label: 'Payout Tracker', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: '/fleet-partner/profile', label: 'Company Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
];

export default function PayoutTrackerPage() {
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
    <SidebarLayout title="Payout Tracker" navItems={navItems}>
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
