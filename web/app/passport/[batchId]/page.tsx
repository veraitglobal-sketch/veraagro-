'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PassportRequestGuard } from '@biovera/shared/passport/stale-fetch-guard';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import BatchPassportView from '@/components/batch-passport/BatchPassportView';
import type { BatchPassportApi } from '@/lib/passport-batch-types';
import { WEB_API_BASE } from '@/lib/api-base';
import { apiErrorOrT } from '@/lib/api-error';

export default function ProductPassportPage() {
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const batchId = params.batchId as string;
  const badgeSerial = searchParams.get('badge');
  const [data, setData] = useState<BatchPassportApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestGuard = useRef(new PassportRequestGuard());

  const fetchPassportData = useCallback(async () => {
    const seq = requestGuard.current.begin();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const id =
        typeof batchId === 'string' && batchId.length > 0 ? decodeURIComponent(batchId) : String(batchId ?? '');
      const qs = badgeSerial ? `?badge=${encodeURIComponent(badgeSerial)}` : '';
      const response = await fetch(`${WEB_API_BASE}/qr/verify/${encodeURIComponent(id)}${qs}`);
      const raw: unknown = await response.json().catch(() => ({}));

      if (!requestGuard.current.isLatest(seq)) return;

      if (!response.ok) {
        const r = raw as { message?: string | string[] };
        const fromApi =
          typeof r?.message === 'string'
            ? r.message
            : Array.isArray(r?.message)
              ? r.message.join(' ')
              : null;
        throw new Error(
          fromApi ||
            (response.status === 404
              ? t('passportPublic.batchPage.errorNoBatch')
              : t('passportPublic.batchPage.errorGeneric')),
        );
      }

      setData(raw as BatchPassportApi);
    } catch (err: unknown) {
      if (!requestGuard.current.isLatest(seq)) return;
      setError(apiErrorOrT(err, t, 'passportPublic.batchPage.errorGeneric'));
      setData(null);
    } finally {
      if (requestGuard.current.isLatest(seq)) setLoading(false);
    }
  }, [batchId, badgeSerial, t]);

  useEffect(() => {
    void fetchPassportData();
  }, [fetchPassportData]);

  const pdfQs = badgeSerial ? `?badge=${encodeURIComponent(badgeSerial)}` : '';
  const pdfHref = `${WEB_API_BASE}/qr/verify/${encodeURIComponent(batchId)}/pdf${pdfQs}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-[1.5px] border-[#2D5A27] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 text-sm">{t('passportPublic.batchPage.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-medium text-gray-900 mb-2">{t('passportPublic.batchPage.notFoundTitle')}</h1>
          <p className="text-sm text-gray-600 mb-4">{error || t('passportPublic.batchPage.passportUnavailable')}</p>
          <button
            type="button"
            onClick={() => void fetchPassportData()}
            className="min-h-[48px] rounded-lg bg-[#2D5A27] px-5 py-2 text-white hover:bg-[#23471f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
          >
            {t('passportPublic.batchPage.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pt-6 flex justify-end">
        <a
          href={pdfHref}
          className="inline-flex items-center gap-2 min-h-[48px] rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          PDF
        </a>
      </div>
      <BatchPassportView data={data} batchId={batchId} badgeSerial={badgeSerial} />
    </div>
  );
}
