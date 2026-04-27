'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { partnerApplicationsAdminAPI } from '@/lib/api';
import { useAdminNavItems } from '@/lib/admin-nav';
import Link from 'next/link';

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Received',
  UNDER_REVIEW: 'Under review',
  CONTACTED: 'Contacted',
  MEETING_SCHEDULED: 'Meeting scheduled',
  NEGOTIATION: 'Negotiation',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ONBOARDED: 'Onboarded (account)',
};

type Row = {
  id: string;
  referenceCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  internalNotes: string | null;
  meetingAt: string | null;
  linkedUserId: string | null;
  linkedUser?: { partnerCode: string; email: string | null; firstName: string; lastName: string } | null;
};

export default function AdminPartnerApplicationsPage() {
  const adminNavItems = useAdminNavItems();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    status: 'SUBMITTED',
    internalNotes: '',
    meetingAt: '',
    linkedUserId: '',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await partnerApplicationsAdminAPI.list({
        status: statusFilter || undefined,
        search: search || undefined,
      })) as Row[];
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [statusFilter]);

  const openEdit = (r: Row) => {
    setEditing(r);
    setSaveErr(null);
    setForm({
      status: r.status,
      internalNotes: r.internalNotes || '',
      meetingAt: r.meetingAt ? r.meetingAt.slice(0, 16) : '',
      linkedUserId: r.linkedUserId || '',
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setSaveErr(null);
    try {
      await partnerApplicationsAdminAPI.update(editing.id, {
        status: form.status,
        internalNotes: form.internalNotes || undefined,
        meetingAt: form.meetingAt ? new Date(form.meetingAt).toISOString() : null,
        linkedUserId: form.linkedUserId.trim() || null,
      });
      setEditing(null);
      await load();
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title="Partner applications" navItems={adminNavItems}>
        <div className="p-6 max-w-6xl mx-auto">
          <p className="text-sm text-gray-600 mb-4">
            Distributor / supplier partner interest from the website. When ready, create a store account in{' '}
            <Link href="/admin/supplier-stores" className="text-[#2D5A27] underline">
              Supplier stores
            </Link>{' '}
            and link the user ID here.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="search"
              placeholder="Search company, email, ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void load()}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm flex-1 min-w-[200px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1.5 text-sm"
            >
              <option value="">All statuses</option>
              {Object.keys(STATUS_LABEL).map((k) => (
                <option key={k} value={k}>
                  {STATUS_LABEL[k]}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void load()} className="px-3 py-1.5 bg-gray-100 rounded text-sm">
              Search
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-2 font-medium">Ref</th>
                    <th className="p-2 font-medium">Company</th>
                    <th className="p-2 font-medium">Contact</th>
                    <th className="p-2 font-medium">Status</th>
                    <th className="p-2 font-medium">Created</th>
                    <th className="p-2 font-medium">Linked user</th>
                    <th className="p-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 font-mono text-xs">{r.referenceCode}</td>
                      <td className="p-2">{r.companyName}</td>
                      <td className="p-2">
                        <div>{r.contactPerson}</div>
                        <div className="text-gray-500 text-xs">{r.email}</div>
                      </td>
                      <td className="p-2">{STATUS_LABEL[r.status] || r.status}</td>
                      <td className="p-2 text-xs text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="p-2 text-xs">
                        {r.linkedUser ? (
                          <span>
                            {r.linkedUser.partnerCode}
                            {r.linkedUser.email && ` · ${r.linkedUser.email}`}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="text-[#2D5A27] text-xs underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <p className="p-4 text-gray-500">No applications yet.</p>}
            </div>
          )}

          {editing && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-4 shadow-lg">
                <h3 className="font-medium text-gray-900 mb-1">{editing.companyName}</h3>
                <p className="text-xs text-gray-500 font-mono mb-3">{editing.referenceCode}</p>
                {saveErr && <p className="text-sm text-red-600 mb-2">{saveErr}</p>}
                <label className="block text-xs text-gray-600 mb-1">Status</label>
                <select
                  className="w-full border rounded px-2 py-1.5 text-sm mb-3"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {Object.keys(STATUS_LABEL).map((k) => (
                    <option key={k} value={k}>
                      {STATUS_LABEL[k]}
                    </option>
                  ))}
                </select>
                <label className="block text-xs text-gray-600 mb-1">Internal notes (team only)</label>
                <textarea
                  className="w-full border rounded px-2 py-1.5 text-sm mb-3 min-h-[80px]"
                  value={form.internalNotes}
                  onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))}
                />
                <label className="block text-xs text-gray-600 mb-1">Meeting (local time)</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded px-2 py-1.5 text-sm mb-3"
                  value={form.meetingAt}
                  onChange={(e) => setForm((f) => ({ ...f, meetingAt: e.target.value }))}
                />
                <label className="block text-xs text-gray-600 mb-1">Linked user ID (UUID after creating store user)</label>
                <input
                  className="w-full border rounded px-2 py-1.5 text-sm mb-3 font-mono text-xs"
                  placeholder="optional"
                  value={form.linkedUserId}
                  onChange={(e) => setForm((f) => ({ ...f, linkedUserId: e.target.value }))}
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm border rounded">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className="px-3 py-1.5 text-sm bg-[#2D5A27] text-white rounded disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
