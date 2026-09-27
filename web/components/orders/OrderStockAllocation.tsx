'use client';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
export type StockReservation = { status: string; quantity: number; unit: string };
type Candidate = { id: string; quantity: number; unit: string; estates: { name: string }; hubs: { name: string; city: string } };
export function OrderStockAllocation({ orderId, status, reservation, reload }: { orderId: string; status: string; reservation?: StockReservation | null; reload: () => Promise<void> }) {
  const { t } = useTranslation(); const lock = useRef(false);
  const [options, setOptions] = useState<Candidate[] | null>(null), [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const run = async (save: boolean) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try {
      if (save) { await api.post(`/orders/admin/${orderId}/reserve-stock`, { inventoryId: selected }); await reload(); }
      else { setOptions((await api.get(`/orders/admin/${orderId}/stock-options`)).data.candidates); setSelected(''); }
    } catch (e) { setError(apiErrorOrT(e, t, 'orderStock.error')); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="mt-2 space-y-2 whitespace-normal text-xs">
    <p>{t(`orderStock.states.${reservation?.status || 'UNALLOCATED'}`)}{reservation ? ` · ${reservation.quantity} ${reservation.unit}` : ''}</p>
    {!reservation && ['PENDING', 'APPROVED', 'PAID', 'CONFIRMED'].includes(status) && <>
      <button type="button" disabled={busy} className="underline disabled:opacity-50" onClick={() => void run(false)}>{t('orderStock.choose')}</button>
      {options && <><select aria-label={t('orderStock.choose')} value={selected} disabled={busy} onChange={e => setSelected(e.target.value)} className="w-full border rounded p-2">
        <option value="">{t('orderStock.choose')}</option>
        {options.map(s => <option key={s.id} value={s.id}>{s.estates.name} · {s.hubs.name}, {s.hubs.city} · {s.quantity} {s.unit} · {s.id.slice(-8)}</option>)}
      </select>{!options.length && <p>{t('orderStock.noStock')}</p>}
      <button type="button" disabled={busy || !selected} onClick={() => void run(true)} className="rounded border p-2 disabled:opacity-50">{t('orderStock.reserve')}</button></>}
    </>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}
