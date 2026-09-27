'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

export function ReturnRequest({ kind, sourceId }: { kind: string; sourceId: string }) {
  const { t } = useTranslation(); const lock = useRef(false);
  const [address, setAddress] = useState(''), [instructions, setInstructions] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(false), [saved, setSaved] = useState(false);
  const create = async () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError(false);
    try { await api.post('/delivery-returns', { kind, sourceId, destinationAddress: address.trim(), instructions: instructions.trim() }); setSaved(true); }
    catch { setError(true); } finally { lock.current = false; setBusy(false); }
  };
  return <div className="space-y-3 rounded border p-3">
    <h3 className="font-semibold">{t('returnFlow.plan')}</h3><p>{t('returnFlow.planHint')}</p>
    {saved ? <p role="status">{t('returnFlow.planned')}</p> : <>
      <label className="block">{t('returnFlow.address')}<input className="block w-full rounded border p-2" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={2000} disabled={busy} /></label>
      <label className="block">{t('returnFlow.instructions')}<textarea className="block w-full rounded border p-2" value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={8000} disabled={busy} /></label>
      <button className="rounded border px-4 py-2 disabled:opacity-50" disabled={busy || address.trim().length < 10 || instructions.trim().length < 10} onClick={() => void create()}>{t('returnFlow.plan')}</button>
    </>}
    <Link className="block underline" href="/admin/returns">{t('returnFlow.title')}</Link>
    {error ? <p role="alert">{t('returnFlow.error')}</p> : null}
  </div>;
}
