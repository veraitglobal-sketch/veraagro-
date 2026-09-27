'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { readReturnImages } from './return-images';

type Action = 'QUARANTINE' | 'WRITE_OFF' | 'RESTOCK';
type Stock = { id: string; productName: string; unit: string; quantity: number; updatedAt: string; expiresAt: string | null;
  estates: { name: string }; hubs: { name: string; address: string; city: string } };
type Inspection = { id: string; action: Action; quantity: number; unit: string; notes: string; createdAt: string; previousQuantity: number | null; countedQuantity: number | null; inventoryId: string | null };
type Detail = { revision: number; quantity: number; unit: string; productName: string; stockStatus: string; history: Inspection[]; candidates: Stock[] };
export function ReturnDisposition({ returnId, stockStatus, reload }: { returnId: string; stockStatus: string; reload: () => Promise<void> }) {
  const { t } = useTranslation(); const lock = useRef(false);
  const [details, setDetails] = useState<Detail | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [action, setAction] = useState<Action | ''>(''), [quantity, setQuantity] = useState(''), [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]), [evidence, setEvidence] = useState<Record<string, string[]>>({});
  const [stockId, setStockId] = useState(''), [count, setCount] = useState(''), [expiry, setExpiry] = useState('');
  const [quality, setQuality] = useState(false), [counted, setCounted] = useState(false), [location, setLocation] = useState(false);
  const run = async (work: () => Promise<void>) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await work(); } catch (e) {
      const message = (e as { response?: { data?: { message?: unknown } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : t('returnDisposition.error'));
    } finally { lock.current = false; setBusy(false); }
  };
  const load = async () => {
    setDetails((await api.get<Detail>(`/delivery-returns/${returnId}/disposition`)).data);
    setAction(''); setQuantity(''); setNotes(''); setPhotos([]); setStockId(''); setCount(''); setExpiry(''); setQuality(false); setCounted(false); setLocation(false);
  };
  const selected = details?.candidates.find(s => s.id === stockId);
  const ready = !!details && !!action && photos.length >= 2 && notes.trim().length >= 20 && quantity !== '' && Number(quantity) === details.quantity &&
    (action !== 'RESTOCK' || !!selected && count !== '' && Number.isFinite(Number(count)) && Number(count) >= details.quantity && !!expiry && quality && counted && location);
  return <section className="space-y-3 rounded border p-4">
    <h3 className="font-semibold">{t('returnDisposition.title')}: {t(`returnDisposition.states.${details?.stockStatus || stockStatus}`)}</h3>
    <button className="rounded border px-3 py-2" disabled={busy} onClick={() => void run(load)}>{t('returnDisposition.open')}</button>
    {details ? <>
      {details.history.length ? <>
        <ol className="space-y-3">{details.history.map(item => <li key={item.id} className="rounded bg-gray-50 p-3">
          <p>{t(`returnDisposition.actions.${item.action}`)} · {item.quantity} {item.unit} · {new Date(item.createdAt).toLocaleString()}</p>
          <p className="whitespace-pre-wrap">{item.notes}</p>
          {item.countedQuantity !== null ? <p>{t('returnDisposition.savedCount', { before: item.previousQuantity, after: item.countedQuantity, unit: item.unit })}</p> : null}
          <button className="rounded border px-3 py-2" disabled={busy} onClick={() => void run(async () => {
            const { data } = await api.get(`/delivery-returns/${returnId}/disposition/${item.id}/evidence`);
            setEvidence(prev => ({ ...prev, [item.id]: data.photos }));
          })}>{t('returnFlow.evidence')}</button>
          {(evidence[item.id] || []).map((src, i) => <Image key={i} src={src} alt={t('returnFlow.evidence')} width={400} height={300} unoptimized className="h-40 w-full object-contain" />)}
        </li>)}</ol>
      </> : <p>{t('returnDisposition.initial')}</p>}
      {details.stockStatus === 'QUARANTINED' ? <div className="space-y-3">
        <label className="block">{t('returnDisposition.action')}<select disabled={busy} className="block w-full rounded border p-2" value={action} onChange={e => setAction(e.target.value as Action | '')}>
          <option value="">{t('returnDisposition.choose')}</option>
          {(['QUARANTINE', 'WRITE_OFF', 'RESTOCK'] as const).map(a => <option key={a} value={a}>{t(`returnDisposition.actions.${a}`)}</option>)}
        </select></label>
        <label className="block">{t('returnDisposition.quantity', { quantity: details.quantity, unit: details.unit })}<input className="block rounded border p-2" type="number" min="0.001" step="0.001" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={busy} /></label>
        <label className="block">{t('returnDisposition.notes')}<textarea className="block w-full rounded border p-2" maxLength={8000} value={notes} onChange={e => setNotes(e.target.value)} disabled={busy} /></label>
        <label className="block">{t('returnFlow.photos')}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e => {
          const files = e.target.files; setPhotos([]); void run(async () => setPhotos(await readReturnImages(files, 6)));
        }} /></label><p>{photos.length} / 6</p>
        {action === 'WRITE_OFF' ? <p>{t('returnDisposition.writeOffHint')}</p> : null}
        {action === 'RESTOCK' ? <div className="space-y-3 rounded bg-amber-50 p-3">
          <p>{t('returnDisposition.countHint')}</p>
          {!details.candidates.length ? <p>{t('returnDisposition.noStock')}</p> : null}
          <label className="block">{t('returnDisposition.stock')}<select className="block w-full rounded border p-2" disabled={busy} value={stockId} onChange={e => {
            setStockId(e.target.value); setCount(''); setExpiry(''); setQuality(false); setCounted(false); setLocation(false);
          }}><option value="">{t('returnDisposition.choose')}</option>{details.candidates.map(s => <option key={s.id} value={s.id}>{s.estates.name} · {s.hubs.name}, {s.hubs.city} · {s.quantity} {s.unit} · {s.id}</option>)}</select></label>
          {selected ? <><p>{selected.hubs.address} · {t('returnDisposition.currentCount')}: {selected.quantity} {selected.unit}</p>
            {selected.expiresAt ? <p>{t('returnDisposition.currentExpiry')}: {new Date(selected.expiresAt).toLocaleString()}</p> : null}</> : null}
          <label className="block">{t('returnDisposition.counted')}<input className="block rounded border p-2" type="number" min={details.quantity} max="1000000000" step="0.001" disabled={busy} value={count} onChange={e => setCount(e.target.value)} /></label>
          <label className="block">{t('returnDisposition.expiry')}<input className="block rounded border p-2" type="datetime-local" disabled={busy} value={expiry} onChange={e => setExpiry(e.target.value)} /></label>
          <label className="block"><input type="checkbox" checked={quality} disabled={busy} onChange={e => setQuality(e.target.checked)} /> {t('returnDisposition.quality')}</label>
          <label className="block"><input type="checkbox" checked={counted} disabled={busy} onChange={e => setCounted(e.target.checked)} /> {t('returnDisposition.countConfirmed')}</label>
          <label className="block"><input type="checkbox" checked={location} disabled={busy} onChange={e => setLocation(e.target.checked)} /> {t('returnDisposition.location')}</label>
        </div> : null}
        <button disabled={busy || !ready} className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50" onClick={() => {
          const confirmation = action === 'RESTOCK' ? t('returnDisposition.confirmCount', { count, unit: details.unit }) : t('returnDisposition.confirmDecision', { action: t(`returnDisposition.actions.${action}`) });
          if (!window.confirm(confirmation)) return;
          void run(async () => {
            await api.post(`/delivery-returns/${returnId}/disposition`, { revision: details.revision, action, quantity: Number(quantity), unit: details.unit, notes: notes.trim(), photos,
              ...(action === 'RESTOCK' && selected ? { stockCount: { inventoryId: selected.id, expectedQuantity: selected.quantity, expectedUpdatedAt: selected.updatedAt,
                countedQuantity: Number(count), expiresAt: new Date(expiry).toISOString(), qualityApproved: quality, stockCountConfirmed: counted, locationConfirmed: location } } : {}) });
            await load(); await reload();
          });
        }}>{t('returnDisposition.save')}</button>
      </div> : null}
    </> : null}
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
  </section>;
}
