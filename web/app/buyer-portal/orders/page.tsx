'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BuyerOrderStock, orderStockIsReady } from '@/components/orders/BuyerOrderStock';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { ordersAPI, deliveriesAPI, invoicesAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import {
  getBuyerOrderStatusLabel,
  getBuyerOrderStatusDescription,
  getBuyerStatusBadgeClass,
  getEffectiveBuyerOrderStatus,
  getAllOrderStatusFilters,
  isCatalogOrder,
  formatPackLine,
  CATALOG_ORDER_TIMELINE,
  getCatalogTimelineStepIndex,
} from '@/lib/buyer-order-status';
import { getBuyerOrderFarmLabel } from '@/lib/buyer-order-farm-label';
import Link from 'next/link';
import { ShoppingCart, Package, MapPin, Calendar, Search, Filter, Eye, Truck, X, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';
import { PaymentInstructionsPanel } from '@/components/PaymentInstructionsPanel';

export default function OrdersPage() {
  const { t } = useTranslation();
  const orderStatusFilters = getAllOrderStatusFilters(t);
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (err: unknown) {
      console.error('Error loading orders:', err);
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4 text-[#2D5A27]/60" strokeWidth={1} />;
      case 'IN_TRANSIT':
      case 'PICKED_UP':
        return <Truck className="w-4 h-4 text-amber-600/70" strokeWidth={1} />;
      case 'PAID':
      case 'CONFIRMED':
        return <Package className="w-4 h-4 text-sky-600/60" strokeWidth={1} />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-gray-600/60" strokeWidth={1} />;
      case 'CANCELLED':
      case 'REFUNDED':
        return <X className="w-4 h-4 text-red-600/60" strokeWidth={1} />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600/60" strokeWidth={1} />;
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        (order.orderNumber || order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.estates?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesDate =
        (!dateFilter.start || new Date(order.createdAt) >= new Date(dateFilter.start)) &&
        (!dateFilter.end || new Date(order.createdAt) <= new Date(dateFilter.end));
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'amount') {
        comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
      } else {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const loadOrderDetails = async (orderId: string) => {
    try {
      const order = await ordersAPI.getOne(orderId);
      // Try to load delivery information if available
      try {
        const delivery = await deliveriesAPI.getByOrder(orderId);
        setSelectedOrder({ ...order, delivery });
      } catch {
        setSelectedOrder(order);
      }
    } catch (err: unknown) {
      console.error('Error loading order details:', err);
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  const downloadInvoicePdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await invoicesAPI.download(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Could not download invoice. Try the Invoices page.');
    }
  };

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title={t('buyerPortalPages.orders')} navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          {/* Pre-orders & Direct orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/pre-order-2026"
              className="flex items-center gap-4 p-4 rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/10 hover:bg-[#2D5A27]/10 hover:border-[#2D5A27]/40 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2D5A27]/10">
                <FileText className="h-6 w-6 text-[#2D5A27]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Pre-order 2026</p>
                <p className="text-sm text-gray-600 font-light">Plan quantities for the 2026 season</p>
              </div>
            </Link>
            <Link
              href="/buyer-portal/trade-panel"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <ShoppingCart className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Direct orders</p>
                <p className="text-sm text-gray-600 font-light">Place an order now (Vera Trade)</p>
              </div>
            </Link>
          </div>

          {/* My orders */}
          <div className="border-b border-[#2D5A27]/30 pb-6">
            <div>
              <h2 className="text-xl font-light text-gray-900">My orders</h2>
              <p className="text-sm text-gray-600 mt-1 font-light">View and track your orders</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="border-b border-[#2D5A27]/30 pb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" strokeWidth={1} />
                <input
                  type="text"
                  placeholder="Search orders by number, product, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                >
                  <option value="all">All status</option>
                  {orderStatusFilters.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 text-sm font-light hover:border-[#2D5A27]/30 transition-colors flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" strokeWidth={1} />
                  Filters
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200/50 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setDateFilter({ start: '', end: '' });
                      setStatusFilter('all');
                      setSearchTerm('');
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-light border border-gray-300 hover:border-[#2D5A27]/30 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Orders List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border-b border-[#2D5A27]/30 pb-6 hover:border-[#2D5A27]/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <ShoppingCart className="w-5 h-5 text-[#2D5A27]/60" strokeWidth={1} />
                        <h3 className="text-lg font-light text-gray-900">
                          {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 font-light">
                        {getBuyerOrderFarmLabel(order)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-light border flex items-center gap-1 rounded ${getBuyerStatusBadgeClass(getEffectiveBuyerOrderStatus(order))}`}
                        title={getBuyerOrderStatusDescription(t, order.status, order)}
                      >
                        {getStatusIcon(order.status)}
                        {getBuyerOrderStatusLabel(t, order.status, order)}
                      </span>
                      <button
                        onClick={() => loadOrderDetails(order.id)}
                        className="px-3 py-1 border border-gray-300 text-sm font-light hover:border-[#2D5A27]/30 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" strokeWidth={1} />
                        Details
                      </button>
                    </div>
                  </div>

                  {order.invoices && (
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-[#2D5A27]/60" strokeWidth={1} />
                      <span className="text-gray-600 font-light">Invoice:</span>
                      <span className="font-light text-gray-900">{order.invoices.invoiceNumber}</span>
                      <button
                        type="button"
                        onClick={() =>
                          void downloadInvoicePdf(order.invoices.id, order.invoices.invoiceNumber)
                        }
                        className="text-[#2D5A27] underline font-light hover:text-[#234a20]"
                      >
                        Download PDF
                      </button>
                      <Link
                        href="/buyer-portal/invoices"
                        className="text-gray-500 font-light hover:text-gray-800"
                      >
                        Invoice history
                      </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-gray-400" strokeWidth={1} />
                      <div>
                        <span className="text-gray-600 font-light">Product:</span>
                        <span className="ml-2 font-light text-gray-900">
                          {order.productName}
                        </span>
                        {formatPackLine(order) && (
                          <span className="block ml-6 text-xs text-gray-500 font-light mt-0.5">
                            {formatPackLine(order)}
                          </span>
                        )}
                        <BuyerOrderStock order={order} reload={loadOrders} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 font-light">Quantity:</span>
                      <span className="font-light text-gray-900">
                        {order.quantity} {order.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 font-light">Total:</span>
                      <span className="font-light text-[#2D5A27]/80">
                        €{order.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                      <span>
                        {typeof order.deliveryAddress === 'string'
                          ? order.deliveryAddress
                          : [order.deliveryAddress.street || order.deliveryAddress.address,
                              [order.deliveryAddress.postalCode, order.deliveryAddress.city].filter(Boolean).join(' '),
                              order.deliveryAddress.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {getEffectiveBuyerOrderStatus(order) === 'REJECTED' && order.rejectionReason && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 font-light">
                      {t('buyerPortalOrders.rejectionReason', { reason: order.rejectionReason })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-200/50 font-light">
                    <Calendar className="w-4 h-4" strokeWidth={1} />
                    <span>
                      Created: {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-12 border-b border-[#2D5A27]/30">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1} />
              <p className="text-gray-500 font-light">{t('buyerPortalOrders.emptyTitle')}</p>
              <p className="text-sm text-gray-400 mt-2 font-light">
                {searchTerm || statusFilter !== 'all' || dateFilter.start || dateFilter.end
                  ? t('buyerPortalOrders.emptyHintFiltered')
                  : t('buyerPortalOrders.emptyHintShop')}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/buyer-portal/trade-panel"
                  className="inline-flex min-h-[44px] items-center rounded-md bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f]"
                >
                  {t('buyerPortalOrders.emptyCtaTrade')}
                </Link>
                <Link
                  href="/buyer/shop"
                  className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  {t('buyerPortalOrders.emptyCtaShop')}
                </Link>
                <Link
                  href="/buyer-portal/dashboard"
                  className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  {t('buyerPortalOrders.emptyCtaDashboard')}
                </Link>
              </div>
            </div>
          )}

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6 border-b border-gray-200/50 pb-4">
                    <div>
                      <h2 className="text-2xl font-light text-gray-900 mb-2">
                        Order {selectedOrder.orderNumber || `#${selectedOrder.id.slice(0, 8)}`}
                      </h2>
                      <p className="text-sm text-gray-600 font-light">
                        Supplier: {getBuyerOrderFarmLabel(selectedOrder, 'N/A')}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" strokeWidth={1} />
                    </button>
                  </div>

                  {/* Order Status */}
                  <div className="mb-6 border-b border-gray-200/50 pb-6">
                    <h3 className="text-sm font-light text-gray-500 mb-2">Status</h3>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-sm font-light mb-4 ${getBuyerStatusBadgeClass(getEffectiveBuyerOrderStatus(selectedOrder))}`}
                    >
                      {getStatusIcon(selectedOrder.status)}
                      <span className="font-medium">
                        {getBuyerOrderStatusLabel(t, selectedOrder.status, selectedOrder)}
                      </span>
                    </div>
                    <p
                      className={`text-sm text-gray-600 font-light ${
                        selectedOrder.status === 'APPROVED' ? 'mb-3' : 'mb-2'
                      }`}
                    >
                      {getBuyerOrderStatusDescription(t, selectedOrder.status, selectedOrder)}
                    </p>
                    {getEffectiveBuyerOrderStatus(selectedOrder) === 'REJECTED' && selectedOrder.rejectionReason && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 font-light">
                        {t('buyerPortalOrders.rejectionReason', { reason: selectedOrder.rejectionReason })}
                      </div>
                    )}
                    {isCatalogOrder(selectedOrder) ? (
                      <div className="mb-6 rounded-lg border border-gray-200/90 bg-gray-50/70 p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          {t('buyerPortalOrders.catalogTimelineTitle')}
                        </h3>
                        <ol className="space-y-2">
                          {CATALOG_ORDER_TIMELINE.map((step, idx) => {
                            const currentIdx = getCatalogTimelineStepIndex(selectedOrder.status);
                            const done = currentIdx >= idx;
                            const active = currentIdx === idx;
                            return (
                              <li key={step.labelKey} className="flex items-center gap-3 text-sm">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                    done ? 'bg-[#2D5A27]' : 'bg-gray-300'
                                  } ${active ? 'ring-2 ring-[#2D5A27]/30' : ''}`}
                                  aria-hidden
                                />
                                <span
                                  className={`font-light ${
                                    done ? 'text-gray-900' : 'text-gray-400'
                                  } ${active ? 'font-medium' : ''}`}
                                >
                                  {t(step.labelKey)}
                                </span>
                              </li>
                            );
                          })}
                          {selectedOrder.status === 'CANCELLED' && (
                            <li className="flex items-center gap-3 text-sm text-red-700 font-light">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
                              {t('buyerPortalOrders.catalogTimeline.rejected')}
                            </li>
                          )}
                        </ol>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 font-light leading-relaxed mb-6">
                        {t('buyerPortalOrders.transportStatusHint')}
                      </p>
                    )}
                    {selectedOrder.status === 'APPROVED' && orderStockIsReady(selectedOrder) && (
                      <PaymentInstructionsPanel
                        orderNumber={selectedOrder.orderNumber}
                        totalAmount={Number(selectedOrder.totalAmount)}
                      />
                    )}
                    {selectedOrder.invoices && (
                      <div className="mb-4 p-3 rounded border border-[#2D5A27]/20 bg-[#2D5A27]/5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                          <FileText className="w-4 h-4 text-[#2D5A27]" strokeWidth={1} />
                          <span>
                            Invoice <strong className="font-medium">{selectedOrder.invoices.invoiceNumber}</strong>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void downloadInvoicePdf(
                                selectedOrder.invoices.id,
                                selectedOrder.invoices.invoiceNumber,
                              )
                            }
                            className="text-sm font-light border border-[#2D5A27]/40 px-3 py-1.5 rounded text-[#2D5A27] hover:bg-[#2D5A27]/5"
                          >
                            Download PDF
                          </button>
                          <Link
                            href="/buyer-portal/invoices"
                            className="text-sm font-light text-gray-600 hover:text-gray-900 py-1.5"
                          >
                            All invoices
                          </Link>
                        </div>
                      </div>
                    )}
                    {Array.isArray(selectedOrder.shipmentTracking?.events) &&
                    selectedOrder.shipmentTracking.events.length > 0 ? (
                      <div className="mb-6 rounded-lg border border-gray-200/90 bg-gray-50/70 p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {t('buyerPortalOrders.shipmentTimelineTitle')}
                        </h3>
                        {selectedOrder.shipmentTracking.missionNumber ? (
                          <p className="text-xs text-gray-600 font-light mb-3">
                            {t('buyerPortalOrders.shipmentMissionRef', {
                              number: selectedOrder.shipmentTracking.missionNumber,
                            })}
                          </p>
                        ) : null}
                        <ol className="space-y-3 border-l border-[#2D5A27]/30 pl-4 ml-1.5">
                          {selectedOrder.shipmentTracking.events.map(
                            (ev: { code: string; at: string }, idx: number) => {
                              const labelKey = `buyerPortalOrders.tracking.${ev.code}`;
                              const label = t(labelKey, { defaultValue: ev.code.replace(/_/g, ' ') });
                              return (
                                <li key={`${ev.code}-${ev.at}-${idx}`} className="relative">
                                  <span
                                    className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full bg-[#2D5A27]/80"
                                    aria-hidden
                                  />
                                  <p className="text-sm text-gray-900 font-light leading-snug">{label}</p>
                                  <p className="text-xs text-gray-500 font-light mt-0.5 tabular-nums">
                                    {new Date(ev.at).toLocaleString()}
                                  </p>
                                </li>
                              );
                            },
                          )}
                        </ol>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 font-light mb-4">{t('buyerPortalOrders.shipmentTimelineEmpty')}</p>
                    )}
                    <h3 className="text-sm font-light text-gray-500 mb-4 mt-2">Progress</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#2D5A27]/60 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-light text-gray-900">Order created</p>
                          <p className="text-xs text-gray-500 font-light">
                            {new Date(selectedOrder.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {selectedOrder.delivery && (
                        <>
                          {selectedOrder.delivery.assignedAt && (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 bg-blue-600/60 rounded-full"></div>
                              <div className="flex-1">
                                <p className="font-light text-gray-900">Delivery Assigned</p>
                                <p className="text-xs text-gray-500 font-light">
                                  {new Date(selectedOrder.delivery.assignedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedOrder.delivery.pickedUpAt && (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 bg-yellow-600/60 rounded-full"></div>
                              <div className="flex-1">
                                <p className="font-light text-gray-900">Picked Up</p>
                                <p className="text-xs text-gray-500 font-light">
                                  {new Date(selectedOrder.delivery.pickedUpAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedOrder.delivery.inTransitAt && (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 bg-yellow-600/60 rounded-full"></div>
                              <div className="flex-1">
                                <p className="font-light text-gray-900">In Transit</p>
                                <p className="text-xs text-gray-500 font-light">
                                  {new Date(selectedOrder.delivery.inTransitAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedOrder.delivery.deliveredAt && (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 bg-[#2D5A27]/60 rounded-full"></div>
                              <div className="flex-1">
                                <p className="font-light text-gray-900">Delivered</p>
                                <p className="text-xs text-gray-500 font-light">
                                  {new Date(selectedOrder.delivery.deliveredAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-b border-gray-200/50 pb-6">
                    <div>
                      <h3 className="text-sm font-light text-gray-500 mb-4">Order Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Product:</span>
                          <span className="font-light text-gray-900 text-right">
                            {selectedOrder.productName}
                            {formatPackLine(selectedOrder) && (
                              <span className="block text-xs text-gray-500">{formatPackLine(selectedOrder)}</span>
                            )}
                            <BuyerOrderStock order={selectedOrder} reload={loadOrders} />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Quantity:</span>
                          <span className="font-light text-gray-900">
                            {selectedOrder.quantity} {selectedOrder.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Unit Price:</span>
                          <span className="font-light text-gray-900">
                            €{selectedOrder.unitPrice?.toFixed(2) || '0.00'} / {selectedOrder.unit}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200/50">
                          <span className="text-gray-600 font-light">Total Amount:</span>
                          <span className="font-light text-[#2D5A27]/80">
                            €{selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-light text-gray-500 mb-4">Delivery Information</h3>
                      <div className="space-y-2 text-sm">
                        {selectedOrder.deliveryAddress && (
                          <div>
                            <span className="text-gray-600 font-light">Delivery Address:</span>
                            <p className="font-light text-gray-900 mt-1">
                              {typeof selectedOrder.deliveryAddress === 'string'
                                ? selectedOrder.deliveryAddress
                                : [selectedOrder.deliveryAddress.street || selectedOrder.deliveryAddress.address,
                                    [selectedOrder.deliveryAddress.postalCode, selectedOrder.deliveryAddress.city].filter(Boolean).join(' '),
                                    selectedOrder.deliveryAddress.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        )}
                        {selectedOrder.delivery?.users && (
                          <div>
                            <span className="text-gray-600 font-light">Driver:</span>
                            <span className="ml-2 font-light text-gray-900">
                              {selectedOrder.delivery.users.firstName} {selectedOrder.delivery.users.lastName}
                            </span>
                            {selectedOrder.delivery.users.phone && (
                              <span className="ml-2 text-xs text-gray-500 font-light">
                                ({selectedOrder.delivery.users.phone})
                              </span>
                            )}
                          </div>
                        )}
                        {selectedOrder.delivery?.deliveryNumber && (
                          <div>
                            <span className="text-gray-600 font-light">Delivery Number:</span>
                            <span className="ml-2 font-light text-gray-900">
                              {selectedOrder.delivery.deliveryNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  {selectedOrder.payments && (
                    <div className="mb-6 border-b border-gray-200/50 pb-6">
                      <h3 className="text-sm font-light text-gray-500 mb-4">Payment Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Payment Method:</span>
                          <span className="font-light text-gray-900">
                            {selectedOrder.payments.paymentMethod || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">Payment status:</span>
                          <span className="font-light text-gray-900">
                            {String(selectedOrder.payments.status).replace(
                              /_/g,
                              ' ',
                            )}
                          </span>
                        </div>
                        {selectedOrder.payments.releasedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-light">Released At:</span>
                            <span className="font-light text-gray-900">
                              {new Date(selectedOrder.payments.releasedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {selectedOrder.delivery && (
                      <button
                        onClick={() => {
                          setSelectedOrder(null);
                          window.location.href = '/buyer-portal/deliveries';
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-sm font-light hover:border-[#2D5A27]/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" strokeWidth={1} />
                        View Delivery Details
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-3 border border-gray-300 text-gray-700 text-sm font-light hover:border-[#2D5A27]/30 transition-colors"
                    >
                      Close
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
