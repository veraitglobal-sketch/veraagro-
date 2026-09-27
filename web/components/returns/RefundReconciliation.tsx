'use client';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

type Method = 'WALLET_RECOVERY' | 'PLATFORM_COST';
type Person = { id: string; firstName: string; lastName: string };
type Source = { sourceKey: string; recipient: Person | null; amountCents: number; availableCents: number | null; kind: string };
type Entry = { id: string; sourceKey: string; amountCents: number; method: Method; credit: { wallets: { users: Person } } | null };
type Saved = { id: string; recoveredCents: number; platformCostCents: number; reason: string; createdAt: string; entries: Entry[] };
type Detail = { refundId: string; revision: number; amountCents: number; currency: string; sources: Source[]; reconciliation: Saved | null };

export function RefundReconciliation({ refundId, reload }: { refundId: string; reload: () => Promise<void> }) {
  const { t } = useTranslation(); const lock = useRef(false);
  const [details, setDetails] = useState<Detail | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [methods, setMethods] = useState<Record<string, Method | ''>>({}), [reason, setReason] = useState('');
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) {
      const message = (e as { response?: { data?: { message?: unknown } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : t('refundReconciliation.error'));
    } finally { lock.current = false; setBusy(false); }
  };
  const load = async () => {
    const { data } = await api.get<Detail>(`/delivery-returns/refunds/${refundId}/reconciliation`);
    setDetails(data); setMethods({}); setReason('');
  };
  const money = (amount: number) => `${(amount / 100).toFixed(2)} ${details?.currency || 'EUR'}`;
  const name = (person: Person | null) => person ? `${person.firstName} ${person.lastName}` : t('refundReconciliation.uncredited');
  const recovered = details?.sources.reduce((sum, s) => sum + (methods[s.sourceKey] === 'WALLET_RECOVERY' ? s.amountCents : 0), 0) || 0;
  const platformCost = details?.sources.reduce((sum, s) => sum + (methods[s.sourceKey] === 'PLATFORM_COST' ? s.amountCents : 0), 0) || 0;
  const ready = !!details && details.sources.length > 0 && details.sources.every(s => !!methods[s.sourceKey]) && reason.trim().length >= 20;
  return <section className="space-y-3 rounded border p-4">
    <h4 className="font-semibold">{t('refundReconciliation.title')}</h4>
    <button className="rounded border px-3 py-2" disabled={busy} onClick={() => void run(load)}>{t('refundReconciliation.open')}</button>
    {details?.reconciliation ? <>
      <p>{t('refundReconciliation.closed')} · {new Date(details.reconciliation.createdAt).toLocaleString()}</p>
      <p>{t('refundReconciliation.recovered')}: {money(details.reconciliation.recoveredCents)}</p>
      <p>{t('refundReconciliation.platformCost')}: {money(details.reconciliation.platformCostCents)}</p>
      <p className="whitespace-pre-wrap">{details.reconciliation.reason}</p>
      <ul className="space-y-2">{details.reconciliation.entries.map(entry => <li key={entry.id}>
        {name(entry.credit?.wallets.users || null)} · {money(entry.amountCents)} · {t(`refundReconciliation.methods.${entry.method}`)}
      </li>)}</ul>
    </> : details ? <>
      <p>{t('refundReconciliation.hint')}</p>
      {details.sources.map(source => <label key={source.sourceKey} className="block space-y-1 rounded bg-gray-50 p-3">
        <span className="block">{name(source.recipient)} · {money(source.amountCents)}</span>
        {source.availableCents !== null ? <span className="block text-sm">{t('refundReconciliation.available')}: {money(source.availableCents)}</span> : null}
        <select className="w-full rounded border p-2" disabled={busy} value={methods[source.sourceKey] || ''} onChange={e => setMethods(prev => ({ ...prev, [source.sourceKey]: e.target.value as Method | '' }))}>
          <option value="">{t('refundReconciliation.choose')}</option>
          {source.recipient ? <option value="WALLET_RECOVERY">{t('refundReconciliation.methods.WALLET_RECOVERY')}</option> : null}
          <option value="PLATFORM_COST">{t('refundReconciliation.methods.PLATFORM_COST')}</option>
        </select>
      </label>)}
      <p>{t('refundReconciliation.recovered')}: {money(recovered)} · {t('refundReconciliation.platformCost')}: {money(platformCost)}</p>
      <label className="block">{t('refundReconciliation.reason')}<textarea className="block w-full rounded border p-2" disabled={busy} value={reason} onChange={e => setReason(e.target.value)} maxLength={8000} /></label>
      <button className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50" disabled={busy || !ready} onClick={() => {
        if (!window.confirm(t('refundReconciliation.confirm', { recovered: money(recovered), cost: money(platformCost) }))) return;
        void run(async () => {
          const { data } = await api.post<Saved>(`/delivery-returns/refunds/${refundId}/reconciliation`, { revision: details.revision,
            amountCents: details.amountCents, currency: details.currency, reason: reason.trim(),
            entries: details.sources.map(s => ({ sourceKey: s.sourceKey, amountCents: s.amountCents, method: methods[s.sourceKey] })) });
          setDetails({ ...details, reconciliation: data, sources: [] }); await reload();
        });
      }}>{t('refundReconciliation.save')}</button>
    </> : null}
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
  </section>;
}
