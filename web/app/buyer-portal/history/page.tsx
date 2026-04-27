'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { ordersAPI } from '@/lib/api';
import { Clock, Package, CheckCircle, XCircle } from 'lucide-react';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';

export default function OrderHistoryPage() {
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersAPI.getAll();
      // Filter completed/cancelled orders for history
      const historyOrders = data.filter((order: any) => 
        order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'DELIVERED'
      );
      setOrders(historyOrders);
    } catch (err: any) {
      console.error('Error loading order history:', err);
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter((order: any) => order.status === filter);

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title="Order History" navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-green-200/50 pb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-light text-gray-900">Order History</h1>
                <p className="text-sm text-gray-600 mt-2 font-light">View your completed and cancelled orders</p>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
              >
              <option value="all">All Orders</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            </div>
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading order history...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border-b border-green-200/50 pb-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {order.status === 'COMPLETED' || order.status === 'DELIVERED' ? (
                        <CheckCircle className="w-6 h-6 text-green-600/60" strokeWidth={1} />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600/60" strokeWidth={1} />
                      )}
                      <div>
                        <h3 className="text-lg font-light text-gray-900">
                          {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                        </h3>
                        <p className="text-sm text-gray-500 font-light">
                          {order.estates?.name || 'Estate name not available'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-light border ${
                      order.status === 'COMPLETED' || order.status === 'DELIVERED'
                        ? 'border-green-200/50 text-green-600/80'
                        : 'border-red-200/50 text-red-600/80'
                    }`}>
                      {order.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-gray-400" strokeWidth={1} />
                      <div>
                        <span className="text-gray-600 font-light">Product:</span>
                        <span className="ml-2 font-light text-gray-900">
                          {order.productName}
                        </span>
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
                      <span className="font-light text-green-600/80">
                        €{order.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-200/50 font-light">
                    <Clock className="w-4 h-4" strokeWidth={1} />
                    <span>
                      {order.status === 'COMPLETED' || order.status === 'DELIVERED'
                        ? `Completed: ${new Date(order.updatedAt || order.createdAt).toLocaleDateString()}`
                        : `Cancelled: ${new Date(order.updatedAt || order.createdAt).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-12 border-b border-green-200/50">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1} />
              <p className="text-gray-500 font-light">No order history found</p>
              <p className="text-sm text-gray-400 mt-2 font-light">
                {filter === 'all' 
                  ? 'You haven\'t completed or cancelled any orders yet'
                  : `No ${filter.toLowerCase()} orders found`}
              </p>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
