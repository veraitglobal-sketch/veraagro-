'use client';

import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { smartLockAPI } from '@/lib/api';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 shadow-sm focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25';

export default function ScannerPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [serialNumber, setSerialNumber] = useState('');
  const [parcelId, setParcelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2D5A27] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login/producer');
    return null;
  }

  const handleScan = async () => {
    if (!serialNumber.trim()) {
      setError(t('growerPages.smartLockSerialRequired'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const data = await smartLockAPI.scanSeed({
        inputSerialNumber: serialNumber.trim(),
        gpsLatitude: position.coords.latitude,
        gpsLongitude: position.coords.longitude,
        parcelId: parcelId.trim() || undefined,
      });

      setResult(data);
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof (err.response.data as { message?: unknown }).message === 'string'
          ? (err.response.data as { message: string }).message
          : t('growerPages.smartLockScanError');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-semibold text-[#2D5A27]">
            {t('growerPages.smartLockHeaderBrand')}
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/grower" className="text-gray-600 transition-colors hover:text-[#2D5A27]">
              {t('growerPages.smartLockNavDashboard')}
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-light tracking-tight text-gray-900">{t('growerPages.smartLockPageTitle')}</h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-gray-700">{t('growerPages.smartLockPageLead')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="smart-lock-serial" className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('growerPages.smartLockSerialLabel')}
              </label>
              <input
                id="smart-lock-serial"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className={inputClassName}
                placeholder={t('growerPages.smartLockSerialPlaceholder')}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="smart-lock-parcel" className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('growerPages.smartLockParcelLabel')}
              </label>
              <input
                id="smart-lock-parcel"
                type="text"
                value={parcelId}
                onChange={(e) => setParcelId(e.target.value)}
                className={inputClassName}
                placeholder={t('growerPages.smartLockParcelPlaceholder')}
                autoComplete="off"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            ) : null}

            {result != null ? (
              <div className="rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/10 px-4 py-3 text-[#23471f]">
                <p className="mb-2 text-sm font-semibold">{t('growerPages.smartLockSuccessTitle')}</p>
                <pre className="max-h-64 overflow-auto rounded-md bg-white/60 p-3 text-xs text-gray-800">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleScan()}
              disabled={loading}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#2D5A27] px-6 text-base font-medium text-white transition-colors hover:bg-[#23471f] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/45 focus-visible:ring-offset-2"
            >
              {loading ? t('growerPages.smartLockScanning') : t('growerPages.smartLockScanCta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
