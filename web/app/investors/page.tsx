'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/investors', label: 'Overview', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { href: '/investors/impact', label: 'Impact Metrics', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
  { href: '/investors/growth', label: 'Growth Charts', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
];

export default function InvestorsPage() {
  const [impactData] = useState({
    wasteReduction: 1250, // tons
    co2Savings: 3200, // tons
    farmersConnected: 450,
    routesOptimized: 1200,
  });

  const growthData = [
    { month: 'Jan', batches: 120, revenue: 45000 },
    { month: 'Feb', batches: 145, revenue: 52000 },
    { month: 'Mar', batches: 180, revenue: 68000 },
    { month: 'Apr', batches: 210, revenue: 79000 },
    { month: 'May', batches: 250, revenue: 95000 },
    { month: 'Jun', batches: 290, revenue: 110000 },
  ];

  const wasteReductionData = [
    { month: 'Jan', waste: 180, saved: 45 },
    { month: 'Feb', waste: 165, saved: 52 },
    { month: 'Mar', waste: 150, saved: 68 },
    { month: 'Apr', waste: 140, saved: 79 },
    { month: 'May', waste: 130, saved: 95 },
    { month: 'Jun', waste: 125, saved: 110 },
  ];

  return (
    <SidebarLayout title="Investor Dashboard" navItems={navItems}>
      <div className="space-y-6">
        {/* Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6"
          >
            <p className="text-sm text-green-700 mb-2">Waste Reduction</p>
            <p className="text-3xl font-bold text-green-900">{impactData.wasteReduction.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">tons saved</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6"
          >
            <p className="text-sm text-blue-700 mb-2">CO₂ Savings</p>
            <p className="text-3xl font-bold text-blue-900">{impactData.co2Savings.toLocaleString()}</p>
            <p className="text-sm text-blue-600 mt-1">tons CO₂</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6"
          >
            <p className="text-sm text-purple-700 mb-2">Farmers Connected</p>
            <p className="text-3xl font-bold text-purple-900">{impactData.farmersConnected}</p>
            <p className="text-sm text-purple-600 mt-1">active growers</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-sm border border-orange-200 p-6"
          >
            <p className="text-sm text-orange-700 mb-2">Routes Optimized</p>
            <p className="text-3xl font-bold text-orange-900">{impactData.routesOptimized.toLocaleString()}</p>
            <p className="text-sm text-orange-600 mt-1">this year</p>
          </motion.div>
        </div>

        {/* Growth Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="batches" stroke="#16a34a" strokeWidth={2} name="Batches" />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue (€)" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Waste Reduction Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Waste Reduction Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={wasteReductionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="waste" fill="#ef4444" name="Waste (tons)" />
              <Bar dataKey="saved" fill="#16a34a" name="Saved (tons)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Average Delivery Time</p>
              <p className="text-2xl font-semibold text-gray-900">14.2 hours</p>
              <p className="text-xs text-green-600 mt-1">↓ 23% improvement</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Customer Satisfaction</p>
              <p className="text-2xl font-semibold text-gray-900">4.8/5.0</p>
              <p className="text-xs text-green-600 mt-1">↑ 0.3 points</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Cold Chain Compliance</p>
              <p className="text-2xl font-semibold text-gray-900">98.5%</p>
              <p className="text-xs text-green-600 mt-1">↑ 2.1% improvement</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Revenue Growth (YoY)</p>
              <p className="text-2xl font-semibold text-gray-900">+142%</p>
              <p className="text-xs text-green-600 mt-1">↑ €65K increase</p>
            </div>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
