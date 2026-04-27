'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { deliveriesAPI } from '@/lib/api';
import { Truck, MapPin, Calendar, Package, Clock, CheckCircle, XCircle, Eye, QrCode, Search, Filter, RefreshCw, FileDown } from 'lucide-react';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';

export default function DeliveriesPage() {
  const { t } = useTranslation();
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const errorRef = useRef<string | null>(null);
  errorRef.current = error;

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(() => {
      if (!errorRef.current) loadDeliveries();
    }, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveriesAPI.getBuyerDeliveries(statusFilter !== 'all' ? statusFilter : undefined);
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const isNetworkError =
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error' ||
        (err?.isAxiosError && !err?.response);
      const message = isNetworkError
        ? 'Cannot reach server. Check your connection and that the backend is running (e.g. NEXT_PUBLIC_API_URL).'
        : err?.response?.data?.message || err?.message || 'Failed to load deliveries';
      setError(message);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600/60" strokeWidth={1} />;
      case 'IN_TRANSIT':
        return <Truck className="w-4 h-4 text-yellow-600/60" strokeWidth={1} />;
      case 'PICKED_UP':
        return <Package className="w-4 h-4 text-blue-600/60" strokeWidth={1} />;
      case 'ASSIGNED':
        return <Clock className="w-4 h-4 text-gray-600/60" strokeWidth={1} />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600/60" strokeWidth={1} />;
      default:
        return <Clock className="w-4 h-4 text-gray-600/60" strokeWidth={1} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'border-green-200/50 text-green-600/80';
      case 'IN_TRANSIT':
        return 'border-yellow-200/50 text-yellow-600/80';
      case 'PICKED_UP':
        return 'border-blue-200/50 text-blue-600/80';
      case 'ASSIGNED':
        return 'border-gray-200/50 text-gray-600/80';
      case 'CANCELLED':
        return 'border-red-200/50 text-red-600/80';
      default:
        return 'border-gray-200/50 text-gray-600/80';
    }
  };

  const getStatusLabel = (status: string) => {
    return status?.replace(/_/g, ' ') || 'UNKNOWN';
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.deliveryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orders?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orders?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orders?.estates?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleConfirmDelivery = async (qrCode: string) => {
    try {
      await deliveriesAPI.confirmDelivery(qrCode);
      alert('Delivery confirmed successfully! Payment has been released.');
      loadDeliveries();
    } catch (err: any) {
      console.error('Error confirming delivery:', err);
      alert(err.message || 'Failed to confirm delivery');
    }
  };

  const handleDownloadWaybill = async (waybillId: string, waybillNumber: string) => {
    try {
      const blob = await deliveriesAPI.downloadWaybillPdf(waybillId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waybill-${waybillNumber || waybillId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to download waybill';
      alert(msg);
    }
  };

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title={t('buyerPortalPages.deliveries')} navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-green-200/50 pb-6">
            <div>
              <h1 className="text-2xl font-light text-gray-900">My Deliveries</h1>
              <p className="text-sm text-gray-600 mt-2 font-light">Track and manage your deliveries</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="border-b border-green-200/50 pb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" strokeWidth={1} />
                <input
                  type="text"
                  placeholder="Search by delivery number, order number, product, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
                >
                  <option value="all">All Status</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="font-light">{error}</p>
              <button
                type="button"
                onClick={() => loadDeliveries()}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-light rounded border border-red-200 transition-colors shrink-0"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-light">Loading deliveries...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="border-b border-green-200/50 pb-6 hover:border-green-300/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Truck className="w-5 h-5 text-green-600/60" strokeWidth={1} />
                        <h3 className="text-lg font-light text-gray-900">
                          {delivery.deliveryNumber || `Delivery #${delivery.id.slice(0, 8)}`}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 font-light">
                        Order: {delivery.orders?.orderNumber || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 font-light">
                        Product: {delivery.orders?.productName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 font-light">
                        Supplier: {delivery.orders?.estates?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className={`px-3 py-1 text-xs font-light border flex items-center gap-1 ${getStatusColor(delivery.status)}`}>
                        {getStatusIcon(delivery.status)}
                        {getStatusLabel(delivery.status)}
                      </span>
                      {delivery.waybills?.id && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadWaybill(delivery.waybills.id, delivery.waybills.waybillNumber)
                          }
                          className="px-3 py-1 border border-gray-300 text-sm font-light hover:border-green-200/50 transition-colors flex items-center gap-1"
                        >
                          <FileDown className="w-4 h-4" strokeWidth={1} />
                          Waybill PDF
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedDelivery(delivery)}
                        className="px-3 py-1 border border-gray-300 text-sm font-light hover:border-green-200/50 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" strokeWidth={1} />
                        Details
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" strokeWidth={1} />
                      <div>
                        <span className="text-gray-600 font-light">From:</span>
                        <span className="ml-2 font-light text-gray-900">
                          {delivery.pickupAddress || delivery.orders?.estates?.name || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" strokeWidth={1} />
                      <div>
                        <span className="text-gray-600 font-light">To:</span>
                        <span className="ml-2 font-light text-gray-900">
                          {typeof delivery.deliveryAddress === 'string'
                            ? delivery.deliveryAddress
                            : delivery.deliveryAddress?.address || 'N/A'}
                        </span>
                      </div>
                    </div>
                    {delivery.users && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-gray-400" strokeWidth={1} />
                        <div>
                          <span className="text-gray-600 font-light">Driver:</span>
                          <span className="ml-2 font-light text-gray-900">
                            {delivery.users.firstName} {delivery.users.lastName}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200/50 font-light">
                    {delivery.assignedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" strokeWidth={1} />
                        <span>Assigned: {new Date(delivery.assignedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {delivery.pickedUpAt && (
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" strokeWidth={1} />
                        <span>Picked Up: {new Date(delivery.pickedUpAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {delivery.deliveredAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" strokeWidth={1} />
                        <span>Delivered: {new Date(delivery.deliveredAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* QR Code for confirmation */}
                  {delivery.status === 'IN_TRANSIT' && delivery.deliveryQRCode && (
                    <div className="mt-4 pt-4 border-t border-green-200/50">
                      <p className="text-sm text-gray-600 mb-2 font-light">Scan QR code to confirm delivery:</p>
                      <div className="flex items-center gap-2">
                        <div className="bg-white p-3 border border-green-200/50">
                          <QrCode className="w-16 h-16 text-green-600/60" strokeWidth={1} />
                        </div>
                        <button
                          onClick={() => handleConfirmDelivery(delivery.deliveryQRCode)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors"
                        >
                          Confirm Delivery
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filteredDeliveries.length === 0 && (
            <div className="text-center py-12 border-b border-green-200/50">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1} />
              <p className="text-gray-500 font-light">No deliveries found</p>
              <p className="text-sm text-gray-400 mt-2 font-light">
                {searchTerm ? 'Try adjusting your search' : 'Your deliveries will appear here once orders are placed'}
              </p>
            </div>
          )}

          {/* Delivery Details Modal */}
          {selectedDelivery && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6 border-b border-gray-200/50 pb-4">
                    <div>
                      <h2 className="text-2xl font-light text-gray-900 mb-2">
                        Delivery {selectedDelivery.deliveryNumber}
                      </h2>
                      <p className="text-sm text-gray-600 font-light">
                        Order: {selectedDelivery.orders?.orderNumber || 'N/A'}
                      </p>
                      {selectedDelivery.waybills?.id && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadWaybill(
                              selectedDelivery.waybills.id,
                              selectedDelivery.waybills.waybillNumber,
                            )
                          }
                          className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-sm font-light hover:border-green-200/50 transition-colors"
                        >
                          <FileDown className="w-4 h-4" strokeWidth={1} />
                          Download waybill PDF
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedDelivery(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" strokeWidth={1} />
                    </button>
                  </div>

                  {/* Delivery Status Timeline */}
                  <div className="mb-6 border-b border-gray-200/50 pb-6">
                    <h3 className="text-sm font-light text-gray-500 mb-4">Delivery Timeline</h3>
                    <div className="space-y-3">
                      {selectedDelivery.assignedAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-600/60 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-light text-gray-900">Assigned</p>
                            <p className="text-xs text-gray-500 font-light">
                              {new Date(selectedDelivery.assignedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedDelivery.pickedUpAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-600/60 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-light text-gray-900">Picked Up</p>
                            <p className="text-xs text-gray-500 font-light">
                              {new Date(selectedDelivery.pickedUpAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedDelivery.inTransitAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-yellow-600/60 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-light text-gray-900">In Transit</p>
                            <p className="text-xs text-gray-500 font-light">
                              {new Date(selectedDelivery.inTransitAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedDelivery.deliveredAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-600/60 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-light text-gray-900">Delivered</p>
                            <p className="text-xs text-gray-500 font-light">
                              {new Date(selectedDelivery.deliveredAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-b border-gray-200/50 pb-6">
                    <div>
                      <h3 className="text-sm font-light text-gray-500 mb-4">Pickup Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 font-light">Location:</span>
                          <span className="ml-2 font-light text-gray-900">
                            {selectedDelivery.pickupAddress || selectedDelivery.orders?.estates?.name || 'N/A'}
                          </span>
                        </div>
                        {selectedDelivery.orders?.estates?.users && (
                          <div>
                            <span className="text-gray-600 font-light">Supplier:</span>
                            <span className="ml-2 font-light text-gray-900">
                              {selectedDelivery.orders.estates.users.firstName} {selectedDelivery.orders.estates.users.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-light text-gray-500 mb-4">Delivery Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 font-light">Address:</span>
                          <span className="ml-2 font-light text-gray-900">
                            {typeof selectedDelivery.deliveryAddress === 'string'
                              ? selectedDelivery.deliveryAddress
                              : selectedDelivery.deliveryAddress?.address || 'N/A'}
                          </span>
                        </div>
                        {selectedDelivery.users && (
                          <div>
                            <span className="text-gray-600 font-light">Driver:</span>
                            <span className="ml-2 font-light text-gray-900">
                              {selectedDelivery.users.firstName} {selectedDelivery.users.lastName}
                            </span>
                            {selectedDelivery.users.phone && (
                              <span className="ml-2 text-xs text-gray-500 font-light">
                                ({selectedDelivery.users.phone})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  {selectedDelivery.orders && (
                    <div className="mb-6 border-b border-gray-200/50 pb-6">
                      <h3 className="text-sm font-light text-gray-500 mb-4">Order Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Product:</span>
                          <span className="font-light text-gray-900">
                            {selectedDelivery.orders.productName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Quantity:</span>
                          <span className="font-light text-gray-900">
                            {selectedDelivery.orders.quantity} {selectedDelivery.orders.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Total Amount:</span>
                          <span className="font-light text-green-600/80">
                            €{selectedDelivery.orders.totalAmount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR Code for confirmation */}
                  {selectedDelivery.status === 'IN_TRANSIT' && selectedDelivery.deliveryQRCode && (
                    <div className="mb-6 border-b border-gray-200/50 pb-6">
                      <h3 className="text-sm font-light text-gray-500 mb-4">Confirm Delivery</h3>
                      <p className="text-sm text-gray-600 mb-4 font-light">
                        Scan the QR code or click the button below to confirm delivery and release payment.
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-4 border border-green-200/50">
                          <QrCode className="w-24 h-24 text-green-600/60" strokeWidth={1} />
                        </div>
                        <button
                          onClick={() => handleConfirmDelivery(selectedDelivery.deliveryQRCode)}
                          className="px-6 py-3 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors"
                        >
                          Confirm Delivery
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
