'use client';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import type { StockReservation } from './OrderStockAllocation';
export function BuyerOrderStock({ order, reload }: { order: { id: string; status: string; payments?: unknown; stockReservation?: StockReservation | null }; reload: () => Promise<void> }) {
  const { t } = useTranslation(); const lock = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const cancel = async () => {
    if (lock.current || !window.confirm(t('orderStock.cancelConfirm'))) return;
    lock.current = true; setBusy(true); setError('');
    try { await api.post(`/orders/${order.id}/cancel`); await reload(); }
    catch (e) { setError(apiErrorOrT(e, t, 'orderStock.error')); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="my-2 space-y-2 text-xs">
    <p>{t(`orderStock.states.${order.stockReservation?.status || 'UNALLOCATED'}`)}{order.stockReservation ? ` · ${order.stockReservation.quantity} ${order.stockReservation.unit}` : ''}</p>
    {['PENDING', 'APPROVED'].includes(order.status) && !order.payments && <button type="button" disabled={busy} onClick={() => void cancel()} className="border rounded p-2 disabled:opacity-50">{t('orderStock.cancel')}</button>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}
