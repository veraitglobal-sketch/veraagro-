'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/fleet-partner', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/fleet-partner/missions', label: 'Mission Board', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { href: '/fleet-partner/deliveries', label: 'Active Deliveries', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: '/fleet-partner/payouts', label: 'Payout Tracker', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: '/fleet-partner/profile', label: 'Company Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
];

export default function CompanyProfilePage() {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Hans Logistics',
    contactPerson: 'John Miller',
    email: 'hans@hanslogistics.de',
    phone: '+49 40 12345678',
    address: 'Hamburg, Germany',
    taxId: 'DE123456789',
  });

  const [fleet, setFleet] = useState([
    { id: 1, vehicleNumber: 'VAN-001', type: 'Refrigerated van', licensePlate: 'HH-AB 123', status: 'Active' },
    { id: 2, vehicleNumber: 'VAN-002', type: 'Refrigerated van', licensePlate: 'HH-CD 456', status: 'Active' },
    { id: 3, vehicleNumber: 'VAN-003', type: 'Refrigerated van', licensePlate: 'HH-EF 789', status: 'Active' },
    { id: 4, vehicleNumber: 'VAN-004', type: 'Refrigerated van', licensePlate: 'HH-GH 012', status: 'Active' },
    { id: 5, vehicleNumber: 'VAN-005', type: 'Refrigerated van', licensePlate: 'HH-IJ 345', status: 'Active' },
  ]);

  const [isEditing, setIsEditing] = useState(false);

  return (
    <SidebarLayout title="Company Profile" navItems={navItems}>
      <div className="space-y-6">
        {/* Company Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Edit'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{companyInfo.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              {isEditing ? (
                <input
                  type="text"
                  value={companyInfo.contactPerson}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{companyInfo.contactPerson}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{companyInfo.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{companyInfo.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{companyInfo.address}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
              {isEditing ? (
                <input
                  type="text"
                  value={companyInfo.taxId}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{companyInfo.taxId}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Fleet Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Fleet Registration</h2>
            <button className="px-4 py-2 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors">
              Add Vehicle
            </button>
          </div>
          <div className="space-y-3">
            {fleet.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{vehicle.vehicleNumber}</p>
                  <p className="text-sm text-gray-500">
                    {vehicle.type} • {vehicle.licensePlate}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  vehicle.status === 'Active'
                    ? 'bg-[#2D5A27]/20 text-[#23471f]'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {vehicle.status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Total Fleet:</strong> {fleet.length} {fleet[0]?.type || 'Vehicles'}
            </p>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
