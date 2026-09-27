'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useAdminNavItems } from '@/lib/admin-nav';
import api from '@/lib/api';
import { ReturnRequest } from '@/components/returns/ReturnRequest';
import { useTranslation } from 'react-i18next';

type Review = { status: string; revision: number; outcome?: string; resolution?: string; resolvedBy?: string; resolvedAt?: string };
type Delivery = { deliveryNumber: string; orderId: string };
type Inbox = {
  issues: Array<Review & { id: string; description: string; createdAt: string; deliveries: Delivery }>;
  disputes: Array<Review & { id: string; reason: string; status: string; createdAt: string; digital_handovers: { deliveries: Delivery } }>;
};
function ReviewActions({ row, onSaved }: { row: Review & { id: string; kind: string }; onSaved: () => Promise<void> }) {
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState(row.kind === 'issue' ? 'ACCEPTED' : 'REINSPECTION');
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async (action: string) => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      await api.post(`/deliveries/admin/review/${row.kind}/${row.id}`, { action, revision: row.revision,
        ...(action === 'RESOLVE' ? { outcome, resolution: resolution.trim() } : {}) });
      await onSaved();
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      setError(t(status === 409 ? 'deliveryReview.conflict' : 'deliveryReview.error'));
    } finally { setSaving(false); }
  };
  return <div className="space-y-3">
    {row.status === 'RESOLVED' ? <><p>{t(`deliveryReview.outcomes.${row.outcome}`)}</p><p className="whitespace-pre-wrap">{row.resolution}</p><p>{row.resolvedAt ? new Date(row.resolvedAt).toLocaleString() : ''}</p></> :
      row.status === 'PENDING' ? <button disabled={saving} className="rounded border px-4 py-2" onClick={() => void save('START_REVIEW')}>{t('deliveryReview.startReview')}</button> : <>
        <label className="block">{t('deliveryReview.decision')}<select className="block rounded border p-2" value={outcome} onChange={(e) => setOutcome(e.target.value)} disabled={saving}>
          {(row.kind === 'issue' ? ['ACCEPTED', 'REJECTED'] : ['REINSPECTION', 'RETURN_REQUIRED']).map((v) => <option key={v} value={v}>{t(`deliveryReview.outcomes.${v}`)}</option>)}
        </select></label>
        <label className="block">{t('deliveryReview.explanation')}<textarea className="block w-full rounded border p-2" rows={4} value={resolution} maxLength={8000} onChange={(e) => setResolution(e.target.value)} disabled={saving} /></label>
        <p className="text-sm">{t('deliveryReview.moneyHint')}</p>
        <button disabled={saving || resolution.trim().length < 20} className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50" onClick={() => void save('RESOLVE')}>{t('deliveryReview.saveDecision')}</button>
      </>}
    {row.status === 'RESOLVED' && ['ACCEPTED', 'RETURN_REQUIRED'].includes(row.outcome || '') ? <ReturnRequest kind={row.kind} sourceId={row.id} /> : null}
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
  </div>;
}
function InboxContent() {
  const { t } = useTranslation();
  const nav = useAdminNavItems();
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const load = useCallback(async () => {
    setBusy(true); setError(false);
    try { setInbox((await api.get('/deliveries/admin/review-inbox')).data); }
    catch { setError(true); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const open = async (kind: string, id: string) => {
    setBusy(true); setError(false);
    try {
      const { data } = await api.get(`/deliveries/admin/review/${kind}/${encodeURIComponent(id)}`);
      setPhotos((previous) => ({ ...previous, [id]: data.photoUrls || data.evidencePhotos || [] }));
    } catch { setError(true); }
    finally { setBusy(false); }
  };
  const rows = [...(inbox?.issues || []).map((r) => ({ ...r, kind: 'issue', text: r.description, delivery: r.deliveries })),
    ...(inbox?.disputes || []).map((r) => ({ ...r, kind: 'dispute', text: r.reason, delivery: r.digital_handovers.deliveries }))]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <SidebarLayout title={t('deliveryReview.title')} navItems={nav}>
    <main className="mx-auto max-w-5xl p-6 space-y-5">
      <h1 className="text-2xl font-semibold">{t('deliveryReview.title')}</h1>
      <p>{t('deliveryReview.hint')}</p>
      <button className="rounded border px-4 py-2 disabled:opacity-50" disabled={busy} onClick={() => void load()}>{t('deliveryReview.refresh')}</button>
      {error ? <p role="alert">{t('deliveryReview.error')}</p> : null}
      {busy ? <p role="status">{t('deliveryReview.loading')}</p> : null}
      {inbox && !rows.length ? <p>{t('deliveryReview.empty')}</p> : null}
      {rows.map((row) => <article key={`${row.kind}-${row.id}`} className="rounded-xl border bg-white p-5 space-y-3">
        <h2 className="font-semibold">{row.delivery.deliveryNumber} · {t(`deliveryReview.states.${row.status}`, { defaultValue: row.status })}</h2>
        <p className="text-sm text-gray-500">{new Date(row.createdAt).toLocaleString()} · {row.id}</p>
        <p className="whitespace-pre-wrap">{row.text}</p>
        <ReviewActions key={`${row.kind}-${row.id}-${row.revision}`} row={row} onSaved={load} />
        <button className="rounded border px-4 py-2 disabled:opacity-50" disabled={busy} onClick={() => void open(row.kind, row.id)}>{t('deliveryReview.photos')}</button>
        {photos[row.id] ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{photos[row.id].map((src, i) =>
          <Image key={i} src={src} alt={t('deliveryReview.photoAlt', { number: i + 1 })} width={600} height={400} unoptimized className="h-64 w-full object-contain" />)}</div> : null}
      </article>)}
    </main>
  </SidebarLayout>;
}
export default function DeliveryIssuesPage() {
  return <AuthGuard requiredRoles={['ADMIN', 'SUPER_ADMIN']}><InboxContent /></AuthGuard>;
}
