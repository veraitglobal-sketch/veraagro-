'use client';

import { useState, useEffect, useRef } from 'react';
import { orderQueue, canCancelUnpaid, matchesOrderSearch, heldOrderStock, type OrderQueue } from '@/lib/order-operations';
import { OrderPaymentSettlement } from '@/components/orders/OrderPaymentSettlement';
import { OrderStockAllocation } from '@/components/orders/OrderStockAllocation';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import api, { ordersAPI, estatesAPI, missionsAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { ShoppingCart, Truck } from 'lucide-react';

import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';

export default function OrdersManagementPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = dateIntlLocaleFromLanguageTag(i18n.resolvedLanguage ?? i18n.language);
  const adminNavItems = useAdminNavItems();
  const [orders, setOrders] = useState<any[]>([]);
  const [queue, setQueue] = useState<OrderQueue | 'open' | 'all'>('open');
  const [search, setSearch] = useState('');
  const [oldestFirst, setOldestFirst] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const cancelLock = useRef(false);
  const visibleOrders = orders.filter(order => (queue === 'all' || queue === 'open' && orderQueue(order) !== 'closed' || orderQueue(order) === queue) && matchesOrderSearch(order, search))
    .sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * (oldestFirst ? 1 : -1));
  const openOrders = orders.filter(order => orderQueue(order) !== 'closed');
  const held = heldOrderStock(orders, false), unpaidHeld = heldOrderStock(orders, true);
  const formatStock = (values: Array<[string, number]>) => values.length ? values.map(([unit, amount]) => `${amount.toLocaleString(dateLocale, { maximumFractionDigits: 3 })} ${unit}`).join(' · ') : '—';
  const queueOptions = ['open', 'stock', 'approval', 'payment', 'dispatch', 'progress', 'settlement', 'closed', 'all'] as const;
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
  const reopenDispatch = async (order: any) => {
    if (!window.confirm(t('orderOperations.reopenDispatchConfirm', { number: order.orderNumber }))) return;
    setSavingId(order.id);
    try {
      await api.post(`/orders/admin/${encodeURIComponent(order.id)}/reopen-dispatch`);
      await loadOrders();
    } catch (e: unknown) {
      setError(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setSavingId(null);
    }
  };

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
      setLoadedAt(new Date());
      setFulfillmentEstates(Array.isArray(est) ? est : []);
    } catch (err: unknown) {
      console.error('Error loading orders:', err);
      setError(apiErrorOrT(err, t, 'adminPages.orderManagement.errLoad'));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    if (cancelLock.current) return;
    const order = orders.find(order => order.id === orderId);
    if (status === 'CANCELLED' && (!order || !window.confirm(t('orderOperations.cancelConfirm', { number: order.orderNumber })))) return;
    cancelLock.current = true;
    try {
      setSavingId(orderId);
      setError(null);
      await ordersAPI.updateStatusAdmin(orderId, status);
      await loadOrders();
    } catch (err: unknown) {
      console.error('updateStatus', err);
      setError(apiErrorOrT(err, t, 'adminPages.orderManagement.errUpdateStatus'));
    } finally {
      cancelLock.current = false;
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

          <section className="space-y-4" aria-label={t('orderOperations.title')}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded border bg-white p-4"><p className="text-sm text-gray-600">{t('orderOperations.open')}</p><p className="text-2xl">{openOrders.length}</p></div>
              <div className="rounded border bg-white p-4"><p className="text-sm text-gray-600">{t('orderOperations.held')}</p><p className="text-lg">{formatStock(held)}</p></div>
              <div className="rounded border bg-amber-50 p-4"><p className="text-sm text-gray-700">{t('orderOperations.unpaidHeld')}</p><p className="text-lg">{formatStock(unpaidHeld)}</p></div>
            </div>
            <p className="text-sm text-gray-600">{t('orderOperations.hint')}</p>
            <div className="flex flex-wrap gap-2">
              {queueOptions.map(value => <button key={value} type="button" aria-pressed={queue === value} onClick={() => setQueue(value)} className={`rounded-full border px-3 py-2 text-sm ${queue === value ? 'bg-[#2D5A27] text-white' : 'bg-white text-gray-700'}`}>
                {t(`orderOperations.queues.${value}`)} · {value === 'all' ? orders.length : value === 'open' ? openOrders.length : orders.filter(order => orderQueue(order) === value).length}
              </button>)}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex-1 text-sm min-w-52">{t('orderOperations.search')}<input type="search" value={search} onChange={e => setSearch(e.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
              <label className="text-sm">{t('orderOperations.sort')}<select value={oldestFirst ? 'oldest' : 'newest'} onChange={e => setOldestFirst(e.target.value === 'oldest')} className="mt-1 block rounded border p-2">
                <option value="oldest">{t('orderOperations.oldest')}</option><option value="newest">{t('orderOperations.newest')}</option>
              </select></label>
              <button type="button" disabled={loading || savingId !== null} onClick={() => void loadOrders()} className="rounded border bg-white px-4 py-2 disabled:opacity-50">{t('orderOperations.refresh')}</button>
            </div>
            <p className="text-xs text-gray-500" aria-live="polite">{t('orderOperations.showing', { count: visibleOrders.length, total: orders.length })}{loadedAt ? ` · ${t('orderOperations.loaded', { time: loadedAt.toLocaleTimeString(dateLocale) })}` : ''}</p>
          </section>

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
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orderOperations.nextStep')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colStatus')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('orderOperations.cancelAction')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.orderManagement.colCreated')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibleOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                        {orderQueue(order) !== 'closed' && Date.now() - new Date(order.createdAt).getTime() >= 86400000 && <p className="mt-1 text-xs text-amber-700">{t('orderOperations.ageDays', { count: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 86400000) })}</p>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.users?.firstName} {order.users?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.productName}
                        <OrderStockAllocation orderId={order.id} status={order.status} reservation={order.stockReservation} reload={loadOrders} />
                        {['PICKED_UP', 'IN_TRANSIT'].includes(order.status) && !order.deliveries && order.payments?.status === 'IN_ESCROW' && (
                          <div className="mt-2 max-w-[16rem] whitespace-normal rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                            <p>{t('orderOperations.stuckNoDelivery')}</p>
                            <button
                              type="button"
                              disabled={savingId === order.id}
                              className="mt-1 underline disabled:opacity-50"
                              onClick={() => void reopenDispatch(order)}
                            >
                              {t('orderOperations.reopenDispatch')}
                            </button>
                          </div>
                        )}
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
                          disabled={savingId === order.id || !!order.stockReservation || ['CANCELLED', 'REFUNDED'].includes(order.status)}
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
                          disabled={!order.fulfillingEstateId || savingId === order.id || orderQueue(order) === 'closed'}
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
                                  href={`/admin/missions?missionId=${encodeURIComponent(m.id)}`}
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
                            disabled={savingId === order.id || order.stockReservation?.status !== 'RESERVED'}
                            onClick={() => void approveOrder(order.id)}
                            className="text-xs font-medium rounded-md px-3 py-1.5 bg-[#2D5A27] text-white hover:bg-[#234a20] disabled:opacity-50"
                          >
                            {t('adminPages.orderManagement.acceptOrder')}
                          </button>
                        ) : order.status === 'APPROVED' && !order.payments ? (
                          <button
                            type="button"
                            disabled={savingId === order.id || order.stockReservation?.status !== 'RESERVED'}
                            onClick={() => {
                              setBankTxId('');
                              setBankModal({ orderId: order.id, orderNumber: order.orderNumber });
                            }}
                            className="text-xs font-medium rounded-md px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
                          >
                            {t('adminPages.orderManagement.confirmBankPayment')}
                          </button>
                        ) : (
                          <div className="text-xs whitespace-normal min-w-40">
                            <p>{t(`orderOperations.steps.${orderQueue(order)}`)}</p>
                            {orderQueue(order) === 'dispatch' && <a className="mt-2 inline-block underline text-[#2D5A27]" href={`/admin/dispatch?orderId=${encodeURIComponent(order.id)}`}>{t('orderOperations.openDispatch')}</a>}
                            {orderQueue(order) === 'progress' && <a className="mt-2 inline-block underline text-[#2D5A27]" href="/admin/missions">{t('adminPages.orderManagement.missionsLink')}</a>}
                          </div>
                        )}
                        {orderQueue(order) === 'settlement' && <OrderPaymentSettlement orderId={order.id} orderNumber={order.orderNumber} onReleased={loadOrders} onError={setError} />}
                        {order.payments?.status === 'RELEASED' && <p className="mt-2 text-xs text-[#2D5A27]">{t('paymentSettlement.released')}</p>}
                        {orderQueue(order) === 'stock' && ['PENDING', 'APPROVED'].includes(order.status) && <p className="text-xs mt-2 text-amber-700 whitespace-normal">{t('orderOperations.steps.stock')}</p>}
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
                        {canCancelUnpaid(order) ? <button type="button" disabled={savingId !== null} onClick={() => void updateStatus(order.id, 'CANCELLED')} className="rounded border border-red-200 px-3 py-2 text-xs text-red-700 disabled:opacity-50">
                          {t(order.stockReservation?.status === 'RESERVED' ? 'orderOperations.release' : 'orderOperations.cancel')}
                        </button> : <span className="text-xs text-gray-400">{t('common.emDash')}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleOrders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t(orders.length ? 'orderOperations.noMatches' : 'adminPages.orderManagement.emptyState')}</p>
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
