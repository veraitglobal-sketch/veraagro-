'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { partnerApplicationsAPI } from '@/lib/api';

function StatusInner() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const numLocale = i18n.language?.startsWith('sr') ? 'sr-RS' : 'en-US';
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

  const statusLabels = useMemo(() => {
    const raw = t('supplierStatusPage.statusLabels', { returnObjects: true });
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as Record<string, string>;
    }
    return {} as Record<string, string>;
  }, [t]);

  useEffect(() => {
    if (initial) void fetchStatus(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first load with ?ref=
  }, []);

  const fetchStatus = async (c: string) => {
    const trimmed = c.trim();
    if (!trimmed) {
      setError(t('supplierStatusPage.errEnterCode'));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await partnerApplicationsAPI.getStatus(trimmed);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('supplierStatusPage.errNotFound'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={loc('/')} className="flex items-center gap-2">
            <Image src="/logo1.png" alt={t('footer.logoAlt')} width={56} height={20} className="h-4 w-auto" />
          </Link>
          <Link href={loc('/suppliers')} className="text-sm text-[#2D5A27]">
            {t('supplierStatusPage.linkSuppliers')}
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-light text-gray-900 mb-2">{t('supplierStatusPage.title')}</h1>
        <p className="text-sm text-gray-600 mb-6">{t('supplierStatusPage.lead')}</p>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('supplierStatusPage.placeholderRef')}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
          <button
            type="button"
            onClick={() => void fetchStatus(code)}
            disabled={loading}
            className="px-4 py-2 bg-[#2D5A27] text-white text-sm rounded-lg disabled:opacity-50"
          >
            {loading ? t('supplierStatusPage.checking') : t('supplierStatusPage.check')}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {result && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <p className="text-xs text-gray-500 font-mono mb-1">{result.referenceCode}</p>
            <p className="text-sm text-gray-800 font-medium mb-1">{result.companyName}</p>
            <p className="text-base text-gray-900">
              {statusLabels[result.status] || result.status}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {t('supplierStatusPage.lastUpdate')}:{' '}
              {new Date(result.updatedAt).toLocaleString(numLocale)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SupplierStatusPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-8 text-center text-gray-500">{t('supplierStatusPage.loading')}</div>
      }
    >
      <StatusInner />
    </Suspense>
  );
}
