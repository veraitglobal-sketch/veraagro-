'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useAdminNavItems } from '@/lib/admin-nav';
import { readReturnImages } from '@/components/returns/return-images';
import { ReturnDisposition } from '@/components/returns/ReturnDisposition';
import api from '@/lib/api';
import { RefundReconciliation } from '@/components/returns/RefundReconciliation';

type Refund = { id: string; status: string; amountCents: number; currency: string; revision: number; reconciliationRequired: boolean; originalPaymentStatus: string; reconciliation?: { recoveredCents: number; platformCostCents: number; createdAt: string } | null; confirmedAt?: string };
type ReturnCase = { id: string; status: string; revision: number; stockStatus: string; stockRevision: number; destinationAddress: string; instructions: string; collectedAt?: string; receivedAt?: string;
  delivery: { deliveryNumber: string; orders: { orderNumber: string; productName: string; quantity: number; unit: string; totalAmount: number } }; refund?: Refund | null };

function ReturnCard({ row, reload }: { row: ReturnCase; reload: () => Promise<void> }) {
  const { t } = useTranslation(); const lock = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [photos, setPhotos] = useState<string[]>([]), [notes, setNotes] = useState(''), [full, setFull] = useState(false);
  const [proof, setProof] = useState<string[]>([]), [reason, setReason] = useState('');
  const [bankReference, setBankReference] = useState(''), [bankDate, setBankDate] = useState(''), [bankEvidence, setBankEvidence] = useState('');
  const [bankProof, setBankProof] = useState<{ bankReference: string; bankEvidence: string } | null>(null);
  const amountCents = row.refund?.amountCents ?? Math.round(row.delivery.orders.totalAmount * 100);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : t('returnFlow.error'));
    } finally { lock.current = false; setBusy(false); }
  };
  const step = row.status === 'PLANNED' ? 'collect' : row.status === 'COLLECTED' ? 'receive' : null;
  return <article className="rounded-xl border p-5 space-y-4">
    <h2 className="font-semibold">{row.delivery.deliveryNumber} · {t(`returnFlow.states.${row.status}`)}</h2>
    <p>{row.delivery.orders.orderNumber} · {row.delivery.orders.productName} · {row.delivery.orders.quantity} {row.delivery.orders.unit}</p>
    <p>{row.destinationAddress}</p><p className="whitespace-pre-wrap">{row.instructions}</p>
    {row.collectedAt ? <p>{t('returnFlow.collectedAt')}: {new Date(row.collectedAt).toLocaleString()}</p> : null}
    {row.receivedAt ? <p>{t('returnFlow.receivedAt')}: {new Date(row.receivedAt).toLocaleString()}</p> : null}
    <button disabled={busy} className="rounded border px-3 py-2" onClick={() => void run(async () => {
      const { data } = await api.get(`/delivery-returns/${row.id}/evidence`); setProof([...data.collectionPhotos, ...data.receiptPhotos]);
    })}>{t('returnFlow.evidence')}</button>
    <div className="grid grid-cols-2 gap-2">{proof.map((src, i) => <Image key={i} src={src} alt={t('returnFlow.evidence')} width={400} height={300} unoptimized className="h-40 w-full object-contain" />)}</div>
    {step ? <div className="space-y-3">
      <p>{t('returnFlow.proofHint')}</p>
      <label className="block">{t('returnFlow.photos')}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(e) => { const files = e.target.files; setPhotos([]); void run(async () => setPhotos(await readReturnImages(files, 6))); }} /></label>
      <p>{photos.length} / 6</p>
      <label className="block">{t('returnFlow.notes')}<textarea className="block w-full rounded border p-2" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} maxLength={8000} /></label>
      <label className="block"><input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} disabled={busy} /> {t('returnFlow.fullShipment')}</label>
      <button className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50" disabled={busy || !full || photos.length < 2 || notes.trim().length < 10} onClick={() => void run(async () => {
        await api.post(`/delivery-returns/${row.id}/${step}`, { revision: row.revision, fullShipment: true, photos, notes: notes.trim() }); await reload();
      })}>{t(`returnFlow.${step}`)}</button>
    </div> : null}
    {row.status === 'RECEIVED' ? <ReturnDisposition key={row.stockRevision} returnId={row.id} stockStatus={row.stockStatus} reload={reload} /> : null}
    {row.status === 'RECEIVED' && !row.refund ? <div className="space-y-3 rounded border p-3">
      <h3>{t('returnFlow.approveRefund')} · {(amountCents / 100).toFixed(2)} EUR</h3><p>{t('returnFlow.refundHint')}</p>
      <label className="block">{t('returnFlow.reason')}<textarea className="block w-full rounded border p-2" value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} maxLength={8000} /></label>
      <button disabled={busy || reason.trim().length < 20} className="rounded border px-4 py-2 disabled:opacity-50" onClick={() => void run(async () => {
        await api.post(`/delivery-returns/${row.id}/refund`, { reason: reason.trim(), amountCents, currency: 'EUR' }); await reload();
      })}>{t('returnFlow.approveRefund')}</button>
    </div> : null}
    {row.refund ? <div className="space-y-3 rounded border p-3">
      <h3>{t(`returnFlow.refundStates.${row.refund.status}`)} · {(amountCents / 100).toFixed(2)} {row.refund.currency}</h3>
      {row.refund.reconciliationRequired ? <p className="rounded bg-amber-50 p-3">{t('returnFlow.reconciliation')}</p> : null}
      {row.refund.reconciliation ? <p>{t('refundReconciliation.closed')} · {t('refundReconciliation.recovered')}: {(row.refund.reconciliation.recoveredCents / 100).toFixed(2)} {row.refund.currency} · {t('refundReconciliation.platformCost')}: {(row.refund.reconciliation.platformCostCents / 100).toFixed(2)} {row.refund.currency}</p> : null}
      {row.refund.status === 'CONFIRMED' && row.refund.originalPaymentStatus === 'RELEASED' ? <RefundReconciliation refundId={row.refund.id} reload={reload} /> : null}
      {row.refund.status === 'APPROVED' ? <>
        <p>{t('returnFlow.bankHint')}</p>
        <label className="block">{t('returnFlow.bankReference')}<input className="block rounded border p-2" value={bankReference} onChange={(e) => setBankReference(e.target.value)} disabled={busy} maxLength={200} /></label>
        <label className="block">{t('returnFlow.bankDate')}<input className="block rounded border p-2" type="datetime-local" value={bankDate} onChange={(e) => setBankDate(e.target.value)} disabled={busy} /></label>
        <label className="block">{t('returnFlow.bankEvidence')}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { const files = e.target.files; setBankEvidence(''); void run(async () => setBankEvidence((await readReturnImages(files, 1))[0])); }} /></label>
        <button className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50" disabled={busy || bankReference.trim().length < 5 || !bankDate || !bankEvidence} onClick={() => {
          if (!window.confirm(t('returnFlow.bankConfirm', { amount: (amountCents / 100).toFixed(2), currency: row.refund!.currency }))) return;
          void run(async () => { await api.post(`/delivery-returns/refunds/${row.refund!.id}/confirm`, { revision: row.refund!.revision, amountCents, currency: row.refund!.currency,
            bankReference: bankReference.trim(), bankPaidAt: new Date(bankDate).toISOString(), bankEvidence }); await reload(); });
        }}>{t('returnFlow.recordBank')}</button>
      </> : <>
        <p>{row.refund.confirmedAt ? new Date(row.refund.confirmedAt).toLocaleString() : ''}</p>
        <button disabled={busy} className="rounded border px-3 py-2" onClick={() => void run(async () => { setBankProof((await api.get(`/delivery-returns/refunds/${row.refund!.id}/bank-evidence`)).data); })}>{t('returnFlow.bankEvidence')}</button>
        {bankProof ? <><p>{bankProof.bankReference}</p><Image src={bankProof.bankEvidence} alt={t('returnFlow.bankEvidence')} width={600} height={400} unoptimized className="h-60 w-full object-contain" /></> : null}
      </>}
    </div> : null}
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
  </article>;
}
function Content() {
  const { t } = useTranslation(); const nav = useAdminNavItems();
  const [rows, setRows] = useState<ReturnCase[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const reload = useCallback(async () => { setBusy(true); setError(false); try { setRows((await api.get('/delivery-returns')).data); } catch { setError(true); } finally { setBusy(false); } }, []);
  useEffect(() => { void reload(); }, [reload]);
  return <SidebarLayout title={t('returnFlow.title')} navItems={nav}><main className="mx-auto max-w-4xl space-y-5 p-6">
    <h1 className="text-2xl font-semibold">{t('returnFlow.title')}</h1><p>{t('returnFlow.listHint')}</p>
    <button disabled={busy} className="rounded border px-4 py-2" onClick={() => void reload()}>{t('deliveryReview.refresh')}</button>
    {error ? <p role="alert">{t('returnFlow.error')}</p> : null}{!busy && !rows.length && !error ? <p>{t('returnFlow.empty')}</p> : null}
    {rows.map((row) => <ReturnCard key={`${row.id}-${row.revision}-${row.stockRevision}-${row.refund?.revision ?? ''}`} row={row} reload={reload} />)}
  </main></SidebarLayout>;
}
export default function ReturnsPage() { return <AuthGuard requiredRoles={['ADMIN', 'SUPER_ADMIN']}><Content /></AuthGuard>; }
