'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { buyersAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';

export default function SuppliersPage() {
  const { t } = useTranslation();
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await buyersAPI.getSuppliers();
      setPartners(data);
    } catch (err: unknown) {
      console.error('Error loading partners:', err);
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter((partner) =>
    partner.estateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.farmer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.farmer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSuccessRate = (partner: any) => {
    if (partner.totalOrders === 0) return 0;
    return Math.round((partner.completedOrders / partner.totalOrders) * 100);
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['BUYER']}>
        <SidebarLayout title={t('buyerPortalPages.suppliers')} navItems={buyerPortalNavItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading Vera Partners...</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRoles={['BUYER']}>
        <SidebarLayout title={t('buyerPortalPages.suppliers')} navItems={buyerPortalNavItems}>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title={t('buyerPortalPages.suppliers')} navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-green-200/50 pb-6">
            <h1 className="text-2xl font-light text-gray-900">Vera Partners</h1>
            <p className="text-sm text-gray-600 mt-2 font-light">Browse and connect with verified farmers</p>
          </div>

          {/* Search and Filters */}
          <div className="border-b border-green-200/50 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search Vera Partners by farm name or farmer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
                />
                <Users className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" strokeWidth={1} />
              </div>
              <div className="text-sm text-gray-600 font-light">
                {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Vera Partners Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner, index) => (
              <div
                key={partner.estateId}
                className="border-b border-green-200/50 pb-6 hover:border-green-300/50 transition-colors cursor-pointer"
                onClick={() => setSelectedPartner(partner)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-light text-gray-900 mb-1">
                      {partner.estateName || 'Unknown Farm'}
                    </h3>
                    <p className="text-sm text-gray-600 font-light">
                      {partner.farmer?.firstName} {partner.farmer?.lastName}
                    </p>
                    <p className="text-xs text-green-600/80 mt-1 font-light">✓ Vera Partner</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(getSuccessRate(partner) / 20)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* New Partner Badge */}
                {!partner.hasOrdered && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-light border border-green-200/50 text-green-600/80">
                      New Partner
                    </span>
                  </div>
                )}

                {/* Performance Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-light">
                      <Package className="w-4 h-4" strokeWidth={1} />
                      <span>Total Orders</span>
                    </div>
                    <span className="font-light text-gray-900">
                      {partner.totalOrders > 0 ? partner.totalOrders : 'No orders yet'}
                    </span>
                  </div>
                  {partner.totalOrders > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-light">
                        <CheckCircle className="w-4 h-4 text-green-600/60" strokeWidth={1} />
                        <span>Completed</span>
                      </div>
                      <span className="font-light text-gray-900">
                        {partner.completedOrders} ({getSuccessRate(partner)}%)
                      </span>
                    </div>
                  )}
                  {partner.totalOrders > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-light">
                          <DollarSign className="w-4 h-4" strokeWidth={1} />
                          <span>Total Spent</span>
                        </div>
                        <span className="font-light text-gray-900">
                          €{partner.totalSpent?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-light">
                          <TrendingUp className="w-4 h-4" strokeWidth={1} />
                          <span>Avg Order Value</span>
                        </div>
                        <span className="font-light text-gray-900">
                          €{partner.averageOrderValue?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </>
                  )}
                  {partner.totalOrders === 0 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 font-light">No orders yet</p>
                    </div>
                  )}
                </div>

                {partner.lastOrderDate && (
                  <div className="pt-3 border-t border-gray-200/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-light">
                      <Calendar className="w-3 h-3" strokeWidth={1} />
                      <span>
                        Last order: {new Date(partner.lastOrderDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredPartners.length === 0 && (
            <div className="text-center py-12 border-b border-green-200/50">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1} />
              <p className="text-gray-600 mb-2 font-light">No Vera Partners found</p>
              <p className="text-sm text-gray-500 font-light">
                {searchTerm ? 'Try adjusting your search terms' : 'No active Vera Partners available at the moment'}
              </p>
            </div>
          )}

          {/* Partner Detail Modal */}
          {selectedPartner && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6 border-b border-gray-200/50 pb-4">
                    <div>
                      <h2 className="text-2xl font-light text-gray-900 mb-2">
                        {selectedPartner.estateName || 'Unknown Farm'}
                      </h2>
                      <p className="text-gray-600 font-light">
                        {selectedPartner.farmer?.firstName} {selectedPartner.farmer?.lastName}
                      </p>
                      <p className="text-sm text-green-600/80 font-light mt-1">✓ Vera Partner - Under Contract</p>
                    </div>
                    <button
                      onClick={() => setSelectedPartner(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" strokeWidth={1} />
                    </button>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-6 border-b border-gray-200/50 pb-6">
                    <h3 className="text-lg font-light text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      {selectedPartner.farmer?.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400" strokeWidth={1} />
                          <span className="text-gray-700 font-light">{selectedPartner.farmer.email}</span>
                        </div>
                      )}
                      {selectedPartner.farmer?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" strokeWidth={1} />
                          <span className="text-gray-700 font-light">{selectedPartner.farmer.phone}</span>
                        </div>
                      )}
                      {selectedPartner.farmer?.partnerCode && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-light text-gray-600">Partner Code:</span>
                          <span className="text-gray-700 font-light">{selectedPartner.farmer.partnerCode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="mb-6 border-b border-gray-200/50 pb-6">
                    <h3 className="text-lg font-light text-gray-900 mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-b border-green-200/50 pb-4">
                        <p className="text-sm text-gray-600 mb-1 font-light">Total Orders</p>
                        <p className="text-2xl font-light text-gray-900">
                          {selectedPartner.totalOrders}
                        </p>
                      </div>
                      <div className="border-b border-green-200/50 pb-4">
                        <p className="text-sm text-gray-600 mb-1 font-light">Success Rate</p>
                        <p className="text-2xl font-light text-gray-900">
                          {getSuccessRate(selectedPartner)}%
                        </p>
                      </div>
                      <div className="border-b border-green-200/50 pb-4">
                        <p className="text-sm text-gray-600 mb-1 font-light">Total Spent</p>
                        <p className="text-2xl font-light text-gray-900">
                          €{selectedPartner.totalSpent?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="border-b border-green-200/50 pb-4">
                        <p className="text-sm text-gray-600 mb-1 font-light">Avg Order Value</p>
                        <p className="text-2xl font-light text-gray-900">
                          €{selectedPartner.averageOrderValue?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors">
                      Place Order
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-light hover:border-green-200/50 transition-colors">
                      View Orders
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
