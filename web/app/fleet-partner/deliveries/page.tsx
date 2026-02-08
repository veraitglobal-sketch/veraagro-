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

export default function ActiveDeliveriesPage() {
  const [activeDeliveries] = useState([
    {
      id: 'DLV-001',
      missionId: 'LD-001',
      pickup: 'European Distribution Hub',
      delivery: [
        { location: 'Retail Store A', address: 'European Address 123', qrCode: 'QR-001', status: 'delivered', pod: true },
        { location: 'Retail Store B', address: 'European Address 456', qrCode: 'QR-002', status: 'in_transit', pod: false },
        { location: 'Retail Store C', address: 'European Address 789', qrCode: 'QR-003', status: 'pending', pod: false },
      ],
      vehicle: 'VAN-001',
      startedAt: '2024-01-10T14:30:00',
    },
  ]);

  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [showPODModal, setShowPODModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [qrScanned, setQrScanned] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const handleCompleteDelivery = (deliveryId: string, location: any) => {
    setSelectedDelivery(deliveryId);
    setSelectedLocation(location);
    setShowPODModal(true);
  };

  const handleQRScan = () => {
    // Simulate QR scan
    setQrScanned(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoUploaded(true);
    }
  };

  const handleSubmitPOD = () => {
    if (qrScanned && photoUploaded) {
      // Submit POD
      alert('Proof of Delivery submitted successfully!');
      setShowPODModal(false);
      setQrScanned(false);
      setPhotoUploaded(false);
    }
  };

  return (
    <SidebarLayout title="Active Deliveries" navItems={navItems}>
      <div className="space-y-6">
        {activeDeliveries.map((delivery) => (
          <motion.div
            key={delivery.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delivery #{delivery.id}</h3>
                <p className="text-sm text-gray-500">Mission: {delivery.missionId} • Vehicle: {delivery.vehicle}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                In Progress
              </span>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Pickup Location:</strong> {delivery.pickup}
              </p>
              <p className="text-xs text-gray-500">Started: {new Date(delivery.startedAt).toLocaleString()}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Delivery Locations</h4>
              {delivery.delivery.map((loc, idx) => (
                <div
                  key={idx}
                  className={`p-4 border rounded-lg ${
                    loc.status === 'delivered'
                      ? 'border-green-200 bg-green-50'
                      : loc.status === 'in_transit'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          loc.status === 'delivered'
                            ? 'bg-green-500'
                            : loc.status === 'in_transit'
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}></span>
                        <p className="font-medium text-gray-900">{loc.location}</p>
                        {loc.status === 'delivered' && (
                          <span className="text-green-600 text-xs">✓ Delivered</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{loc.address}</p>
                      <p className="text-xs text-gray-500 mt-1">QR Code: {loc.qrCode}</p>
                    </div>
                  </div>
                  {loc.status !== 'delivered' && (
                    <button
                      onClick={() => handleCompleteDelivery(delivery.id, loc)}
                      className="w-full mt-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Complete Delivery & Upload POD
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* POD Modal */}
        {showPODModal && selectedLocation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Proof of Delivery</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Location: {selectedLocation.location}</p>
                  <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                </div>

                {/* QR Code Scan */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan QR Code at Location
                  </label>
                  <button
                    onClick={handleQRScan}
                    className={`w-full px-4 py-3 rounded-lg border-2 border-dashed transition-colors ${
                      qrScanned
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-green-500'
                    }`}
                  >
                    {qrScanned ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        QR Code Scanned: {selectedLocation.qrCode}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Tap to Scan QR Code
                      </div>
                    )}
                  </button>
                </div>

                {/* Photo Upload */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Delivery Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`block w-full px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                      photoUploaded
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-green-500'
                    }`}
                  >
                    {photoUploaded ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Photo Uploaded
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Tap to Upload Photo
                      </div>
                    )}
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPODModal(false);
                      setQrScanned(false);
                      setPhotoUploaded(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPOD}
                    disabled={!qrScanned || !photoUploaded}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit POD
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
