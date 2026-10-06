'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useAdminNavItems } from '@/lib/admin-nav';
import { passportReportsAPI } from '@/lib/api';
import { useTranslation } from 'react-i18next';

type ReportRow = {
  id: string; reportNumber: string; publicBatchId: string; badgeSerial: string | null;
  description: string; status: string; createdAt: string; photoDocumentId?: string | null;
  contactEmail?: string | null; contactPhone?: string | null; adminNotes?: string | null;
  batch?: { productName: string; quantity: number; unit: string; catalog_product?: { variety?: string | null } | null } | null;
};

function ReportDetails({ id, onSaved }: { id: string; onSaved: () => Promise<void> }) {
  const { t } = useTranslation();
  const [row, setRow] = useState<ReportRow | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('NEW');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    passportReportsAPI.getAdmin(id).then(data => {
      if (active) { setRow(data); setNotes(data.adminNotes ?? ''); setStatus(data.status); }
    }).catch(() => { if (active) setError(t('admin.passportReports.error')); });
    return () => { active = false; };
  }, [id, t]);
  const save = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await passportReportsAPI.updateStatus(id, { status, adminNotes: notes }); await onSaved(); }
    catch { setError(t('admin.passportReports.error')); }
    finally { setBusy(false); }
  };
  return <div className="border-t pt-4 space-y-3">
    {error ? <p role="alert" className="text-red-700">{error}</p> : null}
    {!row && !error ? <p>{t('common.loading')}</p> : null}
    {row ? <>
      <p><strong>{t('admin.passportReports.product')}:</strong> {row.batch?.productName} {row.batch?.catalog_product?.variety} · {row.batch?.quantity} {row.batch?.unit}</p>
      <p>{t('admin.passportReports.contact')}: {[row.contactEmail, row.contactPhone].filter(Boolean).join(' · ') || '—'}</p>
      <label className="block">{t('admin.passportReports.notes')}
        <textarea className="block w-full rounded border p-2" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
      </label>
      <select aria-label={t('admin.passportReports.details')} className="rounded border p-2" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="NEW">{t('admin.passportReports.new')}</option>
        <option value="IN_PROGRESS">{t('admin.passportReports.inProgress')}</option>
        <option value="RESOLVED">{t('admin.passportReports.resolve')}</option>
      </select>
      <button type="button" disabled={busy} onClick={() => void save()} className="ml-3 rounded bg-[#2D5A27] text-white px-4 py-2 disabled:opacity-50">{t('common.save')}</button>
    </> : null}
  </div>;
}

export default function AdminPassportReportsPage() {
  const { t } = useTranslation();
  const nav = useAdminNavItems();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await passportReportsAPI.listAdmin(); setRows(Array.isArray(data) ? data : []); }
    catch { setError(t('admin.passportReports.error')); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);
  return <AuthGuard requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
    <SidebarLayout title={t('admin.passportReports.title')} navItems={nav}>
      <div className="max-w-4xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('admin.passportReports.title')}</h1>
        {loading ? <p>{t('common.loading')}</p> : null}
        {error ? <div role="alert"><p>{error}</p><button onClick={() => void load()}>{t('common.retry')}</button></div> : null}
        {rows.map(row => <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div><p className="font-mono font-medium">{row.reportNumber}</p><p className="text-sm text-gray-600">{row.publicBatchId}{row.badgeSerial ? ` · ${row.badgeSerial}` : ''}</p></div>
            <span className="text-sm rounded-full px-3 py-1 bg-gray-100">{t(`admin.passportReports.${row.status === 'NEW' ? 'new' : row.status === 'IN_PROGRESS' ? 'inProgress' : 'resolve'}`)}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{row.description}</p>
          {row.photoDocumentId ? <button type="button" onClick={() => void passportReportsAPI.openAttachment(row.photoDocumentId!).catch(() => setError(t('admin.passportReports.error')))} className="text-sm text-[#2D5A27] hover:underline">{t('admin.passportReports.openPhoto')}</button> : null}
          <p className="text-xs text-gray-500">{new Date(row.createdAt).toLocaleString()}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={() => setSelectedId(selectedId === row.id ? null : row.id)} className="text-sm rounded-lg border px-3 py-2">{t('admin.passportReports.details')}</button>
            <Link href={`/passport/${encodeURIComponent(row.publicBatchId)}${row.badgeSerial ? `?badge=${encodeURIComponent(row.badgeSerial)}` : ''}`} className="text-sm text-[#2D5A27] hover:underline" target="_blank">{t('admin.passportReports.openPassport')}</Link>
          </div>
          {selectedId === row.id ? <ReportDetails key={row.id} id={row.id} onSaved={load} /> : null}
        </div>)}
        {!loading && !error && rows.length === 0 ? <p className="text-gray-600">{t('admin.passportReports.empty')}</p> : null}
      </div>
    </SidebarLayout>
  </AuthGuard>;
}
