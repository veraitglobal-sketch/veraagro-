'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useFleetPartnerNavItems } from '@/lib/fleet-partner-nav';

export default function CompanyProfilePage() {
  const { t } = useTranslation();
  const navItems = useFleetPartnerNavItems();
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
    <SidebarLayout title={t('internalShell.titles.companyProfile')} navItems={navItems}>
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
