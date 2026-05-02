'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { packageBadgesAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';

/**
 * MATERIAL_SUPPLIER: when a grower returns a printed badge tree, assign it to another grower (same serials, no re-print).
 * Grower user id = target account UUID (from admin or grower profile).
 */
export default function SupplierPackageBadgesPage() {
  const { t } = useTranslation();
  const [rootSerial, setRootSerial] = useState('');
  const [newGrowerUserId, setNewGrowerUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!rootSerial.trim() || !newGrowerUserId.trim()) {
      setErr('Enter master serial and grower user id');
      return;
    }
    setLoading(true);
    try {
      const r = await packageBadgesAPI.supplierTransferToGrower({
        rootSerial: rootSerial.trim(),
        newGrowerUserId: newGrowerUserId.trim(),
      });
      setMsg(`Assigned ${(r as { rowCount?: number }).rowCount ?? ''} label row(s) to the grower.`);
      setRootSerial('');
      setNewGrowerUserId('');
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard
      requiredRoles={['MATERIAL_SUPPLIER']}
      redirectTo="/login?returnTo=%2Fsupplier%2Fpackage-badges"
    >
      <h1 className="text-2xl font-light text-gray-900 tracking-tight mb-2">Returned badge sets</h1>
      <p className="text-sm text-gray-600 mb-6 max-w-xl">
        When labels come back from a grower, they appear in your account as <code className="text-xs bg-gray-100 px-1 rounded">RETURNED_TO_SUPPLIER</code>. Transfer the whole
        tree to another grower by their <strong>user id</strong> (UUID). They do not re-register — ownership moves on the
        same serials.
      </p>
      {err && <p className="text-sm text-red-600 mb-4">{err}</p>}
      {msg && <p className="text-sm text-[#2D5A27] mb-4">{msg}</p>}
      <form onSubmit={onSubmit} className="max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Master serial (root)</label>
          <input
            value={rootSerial}
            onChange={(e) => setRootSerial(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
            placeholder="Pallet / roll code"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New grower user id (UUID)</label>
          <input
            value={newGrowerUserId}
            onChange={(e) => setNewGrowerUserId(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#2D5A27] py-2.5 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
        >
          {loading ? '…' : 'Transfer tree to grower'}
        </button>
      </form>
    </AuthGuard>
  );
}
