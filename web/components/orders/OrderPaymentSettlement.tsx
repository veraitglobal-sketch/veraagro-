'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';

type Payment = { status: string; farmerAmount: number; driverAmount: number; platformFee: number };

/** Admin initiates the existing guarded release; the server validates delivery and disputes. */
export function OrderPaymentSettlement({ orderId, orderNumber, onReleased, onError }: {
  orderId: string; orderNumber: string; onReleased: () => Promise<void>; onError: (message: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (payment && !dialog.current?.open) dialog.current?.showModal();
    if (!payment && dialog.current?.open) dialog.current.close();
  }, [payment]);
  const money = (amount: number) => Number(amount).toLocaleString(i18n.language, { style: 'currency', currency: 'EUR' });
  const review = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const { data } = await api.get<Payment>(`/payments/order/${encodeURIComponent(orderId)}`);
      if (data.status !== 'IN_ESCROW') { setError(t('paymentSettlement.changed')); await onReleased(); return; }
      setPayment(data);
    } catch (err) { setError(apiErrorOrT(err, t, 'paymentSettlement.loadFailed')); }
    finally { lock.current = false; setBusy(false); }
  };
  const release = async () => {
    if (lock.current || !payment) return;
    lock.current = true; setBusy(true); setError('');
    try {
      await api.post(`/payments/order/${encodeURIComponent(orderId)}/release`);
      setPayment(null);
      await onReleased();
    } catch (err) {
      setPayment(null); // A retry must fetch the current payment, including an uncertain acknowledgement.
      const message = apiErrorOrT(err, t, 'paymentSettlement.releaseFailed');
      await onReleased();
      onError(`${orderNumber}: ${message}`);
    } finally { lock.current = false; setBusy(false); }
  };
  return <div className="mt-2 whitespace-normal">
    <button type="button" disabled={busy} onClick={() => void review()}
      className="rounded-md bg-[#2D5A27] px-3 py-2 text-xs text-white disabled:opacity-50">{t('paymentSettlement.review')}</button>
    {error ? <p role="alert" className="mt-2 max-w-72 text-xs text-red-700">{error}</p> : null}
    <dialog ref={dialog} aria-label={t('paymentSettlement.title')}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border-0 p-0 backdrop:bg-black/40"
      onCancel={event => { event.preventDefault(); if (!busy) setPayment(null); }}>
      {payment ? <>
      <div className="w-full max-w-md rounded-xl bg-white p-6 text-sm text-gray-900">
        <h2 className="text-lg font-semibold">{t('paymentSettlement.title')}</h2>
        <p className="mt-1 text-gray-600">{orderNumber}</p>
        <dl className="my-4 grid grid-cols-2 gap-2">
          <dt>{t('paymentSettlement.grower')}</dt><dd className="text-right">{money(payment.farmerAmount)}</dd>
          <dt>{t('paymentSettlement.transport')}</dt><dd className="text-right">{money(payment.driverAmount)}</dd>
          <dt>{t('paymentSettlement.platform')}</dt><dd className="text-right">{money(payment.platformFee)}</dd>
        </dl>
        <p className="text-gray-600">{t('paymentSettlement.explanation')}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" autoFocus disabled={busy} onClick={() => setPayment(null)} className="rounded border px-4 py-2">{t('common.cancel')}</button>
          <button type="button" disabled={busy} onClick={() => void release()} className="rounded bg-[#2D5A27] px-4 py-2 text-white disabled:opacity-50">{t('paymentSettlement.confirm')}</button>
        </div>
      </div>
      </> : null}
    </dialog>
  </div>;
}
