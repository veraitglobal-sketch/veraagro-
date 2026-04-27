'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { ordersAPI, estatesAPI, missionsAPI } from '@/lib/api';
import { ShoppingCart, Truck } from 'lucide-react';

import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';

/** Prisma OrderStatus — must match backend */
const ORDER_STATUSES = [
  'PENDING',
  'APPROVED',
  'PAID',
  'CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
] as const;

export default function OrdersManagementPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [orders, setOrders] = useState<any[]>([]);
  const [fulfillmentEstates, setFulfillmentEstates] = useState<
    { id: string; name: string; ownerId: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bankModal, setBankModal] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const [bankTxId, setBankTxId] = useState('');
  const [missionModal, setMissionModal] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const [missionOpsNotes, setMissionOpsNotes] = useState('');
  const [missionChannel, setMissionChannel] = useState<'' | 'INDUSTRIAL' | 'RETAIL' | 'MIXED'>('');
  const [missionTargetKg, setMissionTargetKg] = useState('');
  const [missionSaving, setMissionSaving] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, est] = await Promise.all([
        ordersAPI.getAllAdmin(),
        estatesAPI.getFulfillmentEstates().catch(() => []),
      ]);
      setOrders(data);
      setFulfillmentEstates(Array.isArray(est) ? est : []);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      setSavingId(orderId);
      setError(null);
      await ordersAPI.updateStatusAdmin(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    } catch (err: any) {
      console.error('updateStatus', err);
      setError(err.response?.data?.message || err.message || 'Failed to update status');
    } finally {
      setSavingId(null);
    }
  };

  const approveOrder = async (orderId: string) => {
    try {
      setSavingId(orderId);
      setError(null);
      const updated = await ordersAPI.approveOrderAdmin(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)),
      );
    } catch (err: any) {
      console.error('approveOrder', err);
      setError(err.response?.data?.message || err.message || 'Failed to accept order');
    } finally {
      setSavingId(null);
    }
  };

  const confirmBankPayment = async () => {
    if (!bankModal) return;
    try {
      setSavingId(bankModal.orderId);
      setError(null);
      const updated = await ordersAPI.confirmBankPaymentAdmin(
        bankModal.orderId,
        bankTxId.trim() || undefined,
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === bankModal.orderId ? { ...o, ...updated } : o)),
      );
      setBankModal(null);
      setBankTxId('');
    } catch (err: any) {
      console.error('confirmBankPayment', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to confirm bank payment',
      );
    } finally {
      setSavingId(null);
    }
  };

  const createFarmMission = async () => {
    if (!missionModal) return;
    setMissionSaving(true);
    setError(null);
    try {
      const kg = missionTargetKg.trim() ? parseFloat(missionTargetKg.replace(',', '.')) : undefined;
      await missionsAPI.createFromOrderAdmin({
        orderId: missionModal.orderId,
        opsNotes: missionOpsNotes.trim() || undefined,
        channel: missionChannel || undefined,
        targetKg: kg != null && !Number.isNaN(kg) ? kg : undefined,
      });
      setMissionModal(null);
      setMissionOpsNotes('');
      setMissionChannel('');
      setMissionTargetKg('');
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Could not create mission for this order',
      );
    } finally {
      setMissionSaving(false);
    }
  };

  const updateFulfillment = async (orderId: string, fulfillingEstateId: string | null) => {
    try {
      setSavingId(orderId);
      setError(null);
      const updated = await ordersAPI.updateFulfillmentAdmin(orderId, fulfillingEstateId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)),
      );
    } catch (err: any) {
      console.error('updateFulfillment', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to update fulfilling farm',
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.orders')} navItems={adminNavItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Orders Management</h1>
              <p className="text-sm text-gray-600 mt-1 max-w-3xl">
                Assign a <strong>fulfilling farm</strong> to connect the buyer to a grower. Then use{' '}
                <strong>Prep + mission</strong> to send them a transport task with your notes (kg, industrial / retail, packaging).
                The mission is <strong>PENDING</strong> until you assign logistics in{' '}
                <a className="text-[#2D5A27] font-medium underline" href="/admin/missions">Missions</a> or a driver claims
                it.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fulfilling farm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grower mission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.users?.firstName} {order.users?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.quantity} {order.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        €{order.totalAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap max-w-[14rem]">
                        <select
                          value={order.fulfillingEstateId || ''}
                          disabled={savingId === order.id}
                          onChange={(e) => {
                            const v = e.target.value;
                            void updateFulfillment(order.id, v === '' ? null : v);
                          }}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white w-full max-w-full focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 disabled:opacity-50"
                          aria-label={`Fulfilling farm for ${order.orderNumber}`}
                        >
                          <option value="">(not set)</option>
                          {fulfillmentEstates.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap max-w-[12rem]">
                        <button
                          type="button"
                          disabled={!order.fulfillingEstateId || savingId === order.id}
                          onClick={() => {
                            setMissionOpsNotes('');
                            setMissionChannel('');
                            setMissionTargetKg('');
                            setMissionModal({ orderId: order.id, orderNumber: order.orderNumber });
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1.5 border border-[#2D5A27]/30 text-[#2D5A27] hover:bg-[#2D5A27]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Create a PENDING mission for this grower with prep notes (set fulfilling farm first)"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Prep + mission
                        </button>
                        {!order.fulfillingEstateId && (
                          <p className="text-[10px] text-amber-700 mt-1">Set farm first</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.status === 'PENDING' ? (
                          <button
                            type="button"
                            disabled={savingId === order.id}
                            onClick={() => void approveOrder(order.id)}
                            className="text-xs font-medium rounded-md px-3 py-1.5 bg-[#2D5A27] text-white hover:bg-[#234a20] disabled:opacity-50"
                          >
                            Accept order
                          </button>
                        ) : order.status === 'APPROVED' && !order.payments ? (
                          <button
                            type="button"
                            disabled={savingId === order.id}
                            onClick={() => {
                              setBankTxId('');
                              setBankModal({ orderId: order.id, orderNumber: order.orderNumber });
                            }}
                            className="text-xs font-medium rounded-md px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
                          >
                            Confirm bank payment
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'APPROVED' ? 'bg-sky-100 text-sky-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          disabled={savingId === order.id}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white max-w-[11rem] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 disabled:opacity-50"
                          aria-label={`Update status for ${order.orderNumber}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {missionModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-modal-title"
          >
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 space-y-4">
              <h2 id="mission-modal-title" className="text-lg font-medium text-gray-900">
                Prep &amp; transport mission
              </h2>
              <p className="text-sm text-gray-600">
                Order <span className="font-mono">{missionModal.orderNumber}</span> — creates a task for the assigned
                grower with pickup on their farm and delivery to the address on the order. Stays PENDING for dispatch
                (you assign a driver) or for logistics to claim.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target kg (optional)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={missionTargetKg}
                  onChange={(e) => setMissionTargetKg(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="e.g. 500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Channel (optional)</label>
                <select
                  value={missionChannel}
                  onChange={(e) =>
                    setMissionChannel(
                      (e.target.value as '' | 'INDUSTRIAL' | 'RETAIL' | 'MIXED') || '',
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">(not set)</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="RETAIL">Retail</option>
                  <option value="MIXED">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Operations notes (class, box type, time window, buyer ref…)
                </label>
                <textarea
                  value={missionOpsNotes}
                  onChange={(e) => setMissionOpsNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="What the grower should prepare and how it should be sorted/packed for this buyer."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMissionModal(null);
                    setMissionOpsNotes('');
                    setMissionChannel('');
                    setMissionTargetKg('');
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={missionSaving}
                  onClick={() => void createFarmMission()}
                  className="px-4 py-2 text-sm rounded-md bg-[#2D5A27] text-white hover:bg-[#234a20] disabled:opacity-50"
                >
                  {missionSaving ? 'Creating…' : 'Create mission'}
                </button>
              </div>
            </div>
          </div>
        )}

        {bankModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bank-modal-title"
          >
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
              <h2 id="bank-modal-title" className="text-lg font-medium text-gray-900">
                Confirm bank transfer received
              </h2>
              <p className="text-sm text-gray-600">
                Order <span className="font-mono">{bankModal.orderNumber}</span> will be
                marked PAID and an escrow payment record will be created. Use this when the
                amount is visible on the BioVera account.
              </p>
              <div>
                <label htmlFor="bank-tx" className="block text-sm font-medium text-gray-700 mb-1">
                  Bank reference (optional)
                </label>
                <input
                  id="bank-tx"
                  value={bankTxId}
                  onChange={(e) => setBankTxId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="e.g. payment order number"
                  autoComplete="off"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBankModal(null);
                    setBankTxId('');
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingId === bankModal.orderId}
                  onClick={() => void confirmBankPayment()}
                  className="px-4 py-2 text-sm rounded-md bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {savingId === bankModal.orderId ? 'Saving…' : 'Mark as PAID'}
                </button>
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </AuthGuard>
  );
}
