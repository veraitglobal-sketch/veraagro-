'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

const navItems = [
  { href: '/operations-center', label: 'Overview', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { href: '/operations-center/sku-hub', label: 'SKU Standards', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { href: '/operations-center/distributors', label: 'Distributors', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { href: '/operations-center/routing', label: 'Routing Engine', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
  { href: '/operations-center/ledger', label: 'Guaranteed Sale', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { href: '/operations-center/financial', label: 'Financial Flow', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

export default function OperationsCenterPage() {
  const [distributors] = useState([
    { id: 'DEU-001', name: 'Hamburg Distribution Hub', country: 'Germany', city: 'Hamburg', lat: 53.5511, lng: 9.9937, importDuty: 4500, retailChains: ['Rewe', 'Edeka', 'Lidl'] },
    { id: 'AUT-001', name: 'Vienna Distribution Center', country: 'Austria', city: 'Vienna', lat: 48.2082, lng: 16.3738, importDuty: 3200, retailChains: ['Billa', 'Spar'] },
    { id: 'DEU-002', name: 'Munich Cross-Docking', country: 'Germany', city: 'Munich', lat: 48.1351, lng: 11.5820, importDuty: 2800, retailChains: ['Rewe', 'Aldi'] },
  ]);

  const [ledger] = useState({
    demand: 8500,
    supply: 9000,
    guaranteed: true,
    orders: [
      { retailer: 'Rewe Store A', quantity: 2000, status: 'CONFIRMED' },
      { retailer: 'Edeka Store B', quantity: 1500, status: 'CONFIRMED' },
    ],
    harvests: [
      { farmer: 'Farm Petrović', quantity: 5000, status: 'CONFIRMED' },
      { farmer: 'Farm Jovanović', quantity: 4000, status: 'CONFIRMED' },
    ],
  });

  const [financialFlow] = useState({
    steps: [
      { step: 'Farm', value: 8500, cost: 0, margin: 0 },
      { step: 'Logistics', value: 9775, cost: 1275, margin: 0 },
      { step: 'Import Duty', value: 11125, cost: 1350, margin: 0 },
      { step: 'Distributor', value: 12825, cost: 1700, margin: 1700 },
      { step: 'Retail', value: 15000, cost: 0, margin: 2175 },
    ],
    bioVeraMargin: 2175,
  });

  const [standardSkus] = useState([
    { skuCode: 'BIO-VERA-RASP-125G-PREM', name: 'Bio Vera Premium Raspberry 125g', packaging: 'Reusable Crate', film: 'Bio-degradable 15μm' },
    { skuCode: 'BIO-VERA-BLACK-250G-PREM', name: 'Bio Vera Premium Blackberry 250g', packaging: 'Reusable Crate', film: 'Bio-degradable 15μm' },
  ]);

  return (
    <SidebarLayout title="Global Operations Center" navItems={navItems}>
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6"
          >
            <p className="text-sm text-green-700 mb-1">Standard SKUs</p>
            <p className="text-3xl font-bold text-green-900">{standardSkus.length}</p>
            <p className="text-xs text-green-600 mt-1">Active products</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6"
          >
            <p className="text-sm text-blue-700 mb-1">Distributors</p>
            <p className="text-3xl font-bold text-blue-900">{distributors.length}</p>
            <p className="text-xs text-blue-600 mt-1">EU hubs</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6"
          >
            <p className="text-sm text-purple-700 mb-1">Guaranteed Sales</p>
            <p className="text-3xl font-bold text-purple-900">{ledger.guaranteed ? '100%' : '85%'}</p>
            <p className="text-xs text-purple-600 mt-1">Demand coverage</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-sm border border-orange-200 p-6"
          >
            <p className="text-sm text-orange-700 mb-1">Bio Vera Margin</p>
            <p className="text-3xl font-bold text-orange-900">€{financialFlow.bioVeraMargin.toLocaleString()}</p>
            <p className="text-xs text-orange-600 mt-1">Per batch avg</p>
          </motion.div>
        </div>

        {/* Distributor Import/Export Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Distributor Import/Export Network</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>Import Nodes</span>
              </div>
            </div>
          </div>
          <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
              center={[50.0, 10.0]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {distributors.map((dist) => (
                <Marker key={dist.id} position={[dist.lat, dist.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{dist.name}</p>
                      <p className="text-gray-600">{dist.city}, {dist.country}</p>
                      <p className="text-gray-500 mt-2">Import Duty: €{dist.importDuty.toLocaleString()}</p>
                      <p className="text-gray-500">Retail Chains: {dist.retailChains.join(', ')}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {distributors.map((dist) => (
              <div key={dist.id} className="p-4 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900 mb-2">{dist.name}</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Import Duty: €{dist.importDuty.toLocaleString()}</p>
                  <p>Retail Chains: {dist.retailChains.length}</p>
                  <p className="text-xs text-gray-500 mt-2">Sponsored Farmers: 2</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guaranteed Sale Ledger */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Guaranteed Sale Ledger</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Demand (Orders)</p>
                  <p className="text-2xl font-bold text-gray-900">{ledger.demand.toLocaleString()} kg</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Supply (Harvests)</p>
                  <p className="text-2xl font-bold text-green-600">{ledger.supply.toLocaleString()} kg</p>
                </div>
              </div>
              <div className={`p-4 rounded-lg border-2 ${
                ledger.guaranteed
                  ? 'bg-green-50 border-green-300'
                  : 'bg-yellow-50 border-yellow-300'
              }`}>
                <p className="text-sm font-medium mb-1">
                  {ledger.guaranteed ? '✓ All Demand Guaranteed' : '⚠ Demand Not Fully Covered'}
                </p>
                <p className="text-xs text-gray-600">
                  Surplus: {(ledger.supply - ledger.demand).toLocaleString()} kg
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Orders (Demand)</p>
                  {ledger.orders.map((order, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm mb-1">
                      <span className="text-gray-700">{order.retailer}</span>
                      <span className="font-medium text-gray-900">{order.quantity} kg</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Confirmed Harvests (Supply)</p>
                  {ledger.harvests.map((harvest, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded text-sm mb-1">
                      <span className="text-gray-700">{harvest.farmer}</span>
                      <span className="font-medium text-green-700">{harvest.quantity} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Financial Flow Visualizer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Flow (Value Added Chain)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financialFlow.steps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="step" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value: any) => `€${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#16a34a" name="Total Value" />
                <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                <Bar dataKey="margin" fill="#3b82f6" name="Margin" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">Bio Vera Net Margin</p>
                  <p className="text-xl font-bold text-green-700">€{financialFlow.bioVeraMargin.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Farmer receives: €8.50/kg</p>
                <p>• Logistics cost: €0.15/kg</p>
                <p>• Import duty: €0.30/kg</p>
                <p>• Distributor margin: €0.20/kg</p>
                <p>• Retail price: €12.00/kg</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Standard SKU Hub */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bio Vera Standard SKU Hub</h2>
          <div className="space-y-3">
            {standardSkus.map((sku) => (
              <div key={sku.skuCode} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{sku.name}</p>
                    <p className="text-sm text-gray-500">{sku.skuCode}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-gray-500">Packaging</p>
                    <p className="text-gray-900 font-medium">{sku.packaging}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Film</p>
                    <p className="text-gray-900 font-medium">{sku.film}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
