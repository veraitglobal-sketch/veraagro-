'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { QrCode, ClipboardCheck } from 'lucide-react';
import { deliveriesAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';

const BEFORE_HANDOVER = new Set(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']);
const HANDOVER_OPEN = new Set(['INITIATED', 'IN_PROGRESS']);

type DeliveryLike = {
  id: string;
  status: string;
  digital_handovers?: { id: string; status: string } | null;
};

/**
 * Receiving at the buyer's dock:
 * 1) before the truck arrives the buyer can open the receiving code (QR) for the driver to scan;
 * 2) once the driver scanned it, the buyer completes the receipt (photos + signature).
 */
export default function BuyerReceivingStep({ delivery }: { delivery: DeliveryLike }) {
  const { t } = useTranslation();
  const [code, setCode] = useState<{ code: string; qrDataUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handover = delivery.digital_handovers ?? null;

  if (handover && HANDOVER_OPEN.has(handover.status)) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
        <p className="text-sm text-gray-800">{t('buyerReceiving.handoverStartedHint')}</p>
        <Link
          href={`/buyer-portal/handover/${encodeURIComponent(handover.id)}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f]"
        >
          <ClipboardCheck className="h-4 w-4" strokeWidth={1.8} />
          {t('buyerReceiving.completeReceipt')}
        </Link>
      </div>
    );
  }

  if (handover || !BEFORE_HANDOVER.has(delivery.status)) return null;

  const open = async () => {
    setLoading(true);
    setError(null);
    try {
      setCode(await deliveriesAPI.getBuyerReceivingCode(delivery.id));
    } catch (e: unknown) {
      setError(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <p className="text-sm font-medium text-gray-900">{t('buyerReceiving.title')}</p>
      <p className="text-sm text-gray-600">{t('buyerReceiving.hint')}</p>
      {code ? (
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={code.qrDataUrl} alt={code.code} width={160} height={160} className="rounded border border-gray-200" />
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">{t('buyerReceiving.manualCode')}</p>
            <p className="font-mono text-lg font-semibold tracking-wider text-gray-900">{code.code}</p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void open()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#2D5A27] px-4 py-2 text-sm font-medium text-[#2D5A27] hover:bg-green-50 disabled:opacity-50"
        >
          <QrCode className="h-4 w-4" strokeWidth={1.8} />
          {loading ? t('buyerReceiving.loading') : t('buyerReceiving.show')}
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
