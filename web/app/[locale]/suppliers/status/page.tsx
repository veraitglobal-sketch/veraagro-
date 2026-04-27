'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { partnerApplicationsAPI } from '@/lib/api';

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Received',
  UNDER_REVIEW: 'Under review',
  CONTACTED: 'We have contacted you',
  MEETING_SCHEDULED: 'Meeting scheduled',
  NEGOTIATION: 'In discussion',
  APPROVED: 'Approved — onboarding in progress',
  REJECTED: 'Not selected at this time',
  ONBOARDED: 'Partner account active',
};

function StatusInner() {
  const search = useSearchParams();
  const initial = search.get('ref') || '';
  const [code, setCode] = useState(initial);
  const [loading, setLoading] = useState(!!initial);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    referenceCode: string;
    status: string;
    companyName: string;
    updatedAt: string;
  } | null>(null);

  useEffect(() => {
    if (initial) void fetchStatus(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first load with ?ref=
  }, []);

  const fetchStatus = async (c: string) => {
    const t = c.trim();
    if (!t) {
      setError('Enter your reference code');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await partnerApplicationsAPI.getStatus(t);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not find an application with this code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo1.png" alt="Bio Vera" width={56} height={20} className="h-4 w-auto" />
          </Link>
          <Link href="/suppliers" className="text-sm text-[#2D5A27]">Suppliers</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-light text-gray-900 mb-2">Application status</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter the reference code you received after submitting the supplier / distributor form on the Bio Vera website.
        </p>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. APP-1a2b3c4d"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
          <button
            type="button"
            onClick={() => void fetchStatus(code)}
            disabled={loading}
            className="px-4 py-2 bg-[#2D5A27] text-white text-sm rounded-lg disabled:opacity-50"
          >
            {loading ? '…' : 'Check'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {result && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <p className="text-xs text-gray-500 font-mono mb-1">{result.referenceCode}</p>
            <p className="text-sm text-gray-800 font-medium mb-1">{result.companyName}</p>
            <p className="text-base text-gray-900">
              {STATUS_LABEL[result.status] || result.status}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Last update: {new Date(result.updatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SupplierStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 text-center text-gray-500">Loading…</div>}>
      <StatusInner />
    </Suspense>
  );
}
