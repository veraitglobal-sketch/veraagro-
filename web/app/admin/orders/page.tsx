'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { ordersAPI, estatesAPI, missionsAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { ShoppingCart, Truck } from 'lucide-react';

import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';

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
  const { t, i18n } = useTranslation();
  const dateLocale = dateIntlLocaleFromLanguageTag(i18n.resolvedLanguage ?? i18n.language);
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
    } catch (err: unknown) {
      console.error('Error loading orders:', err);
      setError(apiErrorOrT(err, t, 'adminPages.orderManagement.errLoad'));
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
    } catch (err: unknown) {
      console.error('updateStatus', err);
      setError(apiErrorOrT(err, t, 'adminPages.orderManagement.errUpdateStatus'));
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
    } catch (err: unknown) {
      console.error('approveOrder', err);
      setError(apiErrorOrT(err, t, 'adminPages.orderManagement.errApprove'));
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
    } catch (err: unknown) {
      console.error('confirmBankPayment', err);
      setError(apiErrorOrT(err, t, 'adminPages.orderManagement.errBank'));
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
      await loadOrders();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'adminPages.orderManagement.errMission'));
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
    } catch (err: unknown) {
      console.error('updateFulfillment', err);
      setError(apiErrorOrT(err, t, 'adminPages.orderManagement.errFulfillment'));
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
              <h1 className="text-2xl font-light text-gray-900">{t('adminPages.orderManagement.headerTitle')}</h1>
              <p className="text-sm text-gray-600 mt-1 max-w-3xl">
                {t('adminPages.orderManagement.headerSubtitleBefore')}
                <strong>{t('adminPages.orderManagement.headerPrepMissionStrong')}</strong>
                {t('adminPages.orderManagement.headerSubtitleMid')}
                <strong>{t('adminPages.orderManagement.headerPendingStrong')}</strong>
                {t('adminPages.orderManagement.headerSubtitleAfterMissions')}
                <a className="text-[#2D5A27] font-medium underline" href="/admin/missions">
                  {t('adminPages.orderManagement.missionsLink')}
                </a>
                {t('adminPages.orderManagement.headerSubtitleEnd')}
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
                <p className="mt-4 text-gray-600">{t('adminPages.orderManagement.loading')}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colOrderNumber')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colBuyer')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colProduct')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colQuantity')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colAmount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colFulfillingFarm')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colGrowerMission')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colLinkedMissions')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colStatus')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colChangeStatus')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colCreated')}</th>
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
                          aria-label={t('adminPages.orderManagement.fulfillingFarmAria', {
                            orderNumber: order.orderNumber,
                          })}
                        >
                          <option value="">{t('adminPages.orderManagement.notSet')}</option>
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
                          title={t('adminPages.orderManagement.prepMissionTitle')}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          {t('adminPages.orderManagement.prepMissionCta')}
                        </button>
                        {!order.fulfillingEstateId && (
                          <p className="text-[10px] text-amber-700 mt-1">{t('adminPages.orderManagement.setFarmFirst')}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top max-w-[10rem]">
                        {Array.isArray(order.missions) && order.missions.length > 0 ? (
                          <ul className="space-y-1 text-xs">
                            {order.missions.map((m: { id: string; missionNumber: string; status: string }) => (
                              <li key={m.id}>
                                <span className="font-mono text-gray-800">{m.missionNumber}</span>
                                <span className="text-gray-400 mx-1">·</span>
                                <a
                                  href={`/grower/portal?missionId=${encodeURIComponent(m.id)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#2D5A27] font-medium underline"
                                >
                                  {t('adminPages.orderManagement.portalMissionLink')}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-gray-400">{t('common.emDash')}</span>
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
                            {t('adminPages.orderManagement.acceptOrder')}
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
                            {t('adminPages.orderManagement.confirmBankPayment')}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">{t('common.emDash')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'APPROVED' ? 'bg-sky-100 text-sky-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`adminPages.orderManagement.statuses.${order.status}`, {
                            defaultValue: order.status,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          disabled={savingId === order.id}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white max-w-[11rem] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 disabled:opacity-50"
                          aria-label={t('adminPages.orderManagement.updateStatusAria', {
                            orderNumber: order.orderNumber,
                          })}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {t(`adminPages.orderManagement.statuses.${s}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t('adminPages.orderManagement.emptyState')}</p>
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
                {t('adminPages.orderManagement.missionModalTitle')}
              </h2>
              <p className="text-sm text-gray-600">
                {t('adminPages.orderManagement.missionModalLead', {
                  orderNumber: missionModal.orderNumber,
                })}
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('adminPages.orderManagement.labelTargetKg')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={missionTargetKg}
                  onChange={(e) => setMissionTargetKg(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder={t('adminPages.orderManagement.placeholderTargetKg')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t('adminPages.orderManagement.labelChannel')}</label>
                <select
                  value={missionChannel}
                  onChange={(e) =>
                    setMissionChannel(
                      (e.target.value as '' | 'INDUSTRIAL' | 'RETAIL' | 'MIXED') || '',
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">{t('adminPages.orderManagement.notSet')}</option>
                  <option value="INDUSTRIAL">{t('adminPages.orderManagement.channelIndustrial')}</option>
                  <option value="RETAIL">{t('adminPages.orderManagement.channelRetail')}</option>
                  <option value="MIXED">{t('adminPages.orderManagement.channelMixed')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('adminPages.orderManagement.labelOpsNotes')}
                </label>
                <textarea
                  value={missionOpsNotes}
                  onChange={(e) => setMissionOpsNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder={t('adminPages.orderManagement.placeholderOpsNotes')}
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
                  {t('adminPages.orderManagement.cancel')}
                </button>
                <button
                  type="button"
                  disabled={missionSaving}
                  onClick={() => void createFarmMission()}
                  className="px-4 py-2 text-sm rounded-md bg-[#2D5A27] text-white hover:bg-[#234a20] disabled:opacity-50"
                >
                  {missionSaving ? t('adminPages.orderManagement.creating') : t('adminPages.orderManagement.createMission')}
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
                {t('adminPages.orderManagement.bankModalTitle')}
              </h2>
              <p className="text-sm text-gray-600">
                {t('adminPages.orderManagement.bankModalLead', { orderNumber: bankModal.orderNumber })}
              </p>
              <div>
                <label htmlFor="bank-tx" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminPages.orderManagement.bankRefLabel')}
                </label>
                <input
                  id="bank-tx"
                  value={bankTxId}
                  onChange={(e) => setBankTxId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder={t('adminPages.orderManagement.bankRefPlaceholder')}
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
                  {t('adminPages.orderManagement.cancel')}
                </button>
                <button
                  type="button"
                  disabled={savingId === bankModal.orderId}
                  onClick={() => void confirmBankPayment()}
                  className="px-4 py-2 text-sm rounded-md bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {savingId === bankModal.orderId ? t('adminPages.orderManagement.saving') : t('adminPages.orderManagement.markPaid')}
                </button>
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </AuthGuard>
  );
}
