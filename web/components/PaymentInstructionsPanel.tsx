'use client';

import { useEffect, useState } from 'react';
import {
  formatIbanDisplay,
  getPublicPaymentConfig,
  hasAnyPaymentConfig,
  type PublicPaymentConfig,
} from '@/lib/biovera-payment-public';
import { Copy, FileText, Landmark } from 'lucide-react';

type Props = {
  orderNumber: string;
  totalAmount: number;
  amountLabel?: string;
};

function mergePaymentConfig(
  local: PublicPaymentConfig,
  server: Partial<PublicPaymentConfig> | null,
): PublicPaymentConfig {
  if (!server) return local;
  return {
    beneficiary: server.beneficiary || local.beneficiary,
    bankName: server.bankName || local.bankName,
    iban: server.iban || local.iban,
    swift: server.swift || local.swift,
    currency: server.currency || local.currency,
    extraLines:
      server.extraLines && server.extraLines.length > 0
        ? server.extraLines
        : local.extraLines,
  };
}

/**
 * Renders when order status is APPROVED: wire transfer instructions for BioVera.
 * Fetches requisites from /api/biovera-bank-requisites so IBAN is visible in runtime
 * even when NEXT_PUBLIC_* was not baked in at build time.
 */
export function PaymentInstructionsPanel({ orderNumber, totalAmount, amountLabel }: Props) {
  const [c, setC] = useState<PublicPaymentConfig>(() => getPublicPaymentConfig());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/biovera-bank-requisites', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as PublicPaymentConfig;
        if (!cancelled) {
          setC(mergePaymentConfig(getPublicPaymentConfig(), data));
        }
      } catch {
        // keep local env fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const configured = hasAnyPaymentConfig(c);
  const amount =
    amountLabel ||
    (Number.isFinite(totalAmount) ? `${totalAmount.toFixed(2)} ${c.currency}` : '—');

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="mb-6 rounded-xl border-2 border-[#2D5A27]/30 bg-gradient-to-b from-white to-[#2D5A27]/[0.04] p-1 shadow-sm"
      role="region"
      aria-label="Payment instructions"
    >
      <div className="rounded-lg bg-white/90 p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#2D5A27]/10">
            <Landmark className="w-5 h-5 text-[#2D5A27]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900">Pay by bank transfer</h3>
            <p className="text-sm text-gray-600 font-light mt-0.5">
              Use the <strong>reference</strong> below in the payment description so we can match
              your payment to this order.
            </p>
          </div>
        </div>

        <div className="text-sm space-y-3 pl-0 sm:pl-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 border-b border-gray-200/80 pb-3">
            <span className="text-gray-500 font-light">Amount due</span>
            <span className="text-lg font-semibold text-[#2D5A27] tabular-nums tracking-tight">
              {amount}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-gray-200/80 pb-3">
            <span className="text-gray-500 font-light shrink-0">Reference / description</span>
            <div className="flex items-center gap-2 min-w-0">
              <code className="text-sm font-mono font-medium text-gray-900 bg-[#2D5A27]/5 px-3 py-1.5 rounded-md border border-[#2D5A27]/20 break-all text-right">
                {orderNumber}
              </code>
              <button
                type="button"
                onClick={() => void copy(orderNumber)}
                className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#2D5A27]"
                title="Copy reference"
                aria-label="Copy order reference to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading && !configured && (
            <p className="text-xs text-gray-500 font-light">Loading bank details…</p>
          )}

          {configured ? (
            <div className="mt-2 rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 p-4 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#2D5A27]/90">
                Bio Vera — payment account
              </p>
              {c.beneficiary && (
                <div>
                  <p className="text-xs text-gray-500 font-light mb-0.5">Beneficiary (receiver)</p>
                  <p className="text-sm font-medium text-gray-900">{c.beneficiary}</p>
                </div>
              )}
              {c.bankName && (
                <div>
                  <p className="text-xs text-gray-500 font-light mb-0.5">Bank name</p>
                  <p className="text-sm text-gray-900">{c.bankName}</p>
                </div>
              )}
              {c.iban && (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-xs text-gray-500 font-light">IBAN (account no.)</p>
                    <button
                      type="button"
                      onClick={() => void copy(c.iban.replace(/\s/g, ''))}
                      className="text-xs text-[#2D5A27] font-medium flex items-center gap-1 hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy IBAN
                    </button>
                  </div>
                  <p className="font-mono text-sm sm:text-base text-gray-900 tracking-wide break-all leading-relaxed">
                    {formatIbanDisplay(c.iban)}
                  </p>
                </div>
              )}
              {c.swift && (
                <div>
                  <p className="text-xs text-gray-500 font-light mb-0.5">SWIFT / BIC</p>
                  <p className="font-mono text-sm text-gray-900">{c.swift}</p>
                </div>
              )}
            </div>
          ) : (
            !loading && (
              <p className="text-amber-900 text-sm font-light border border-amber-200/80 bg-amber-50/80 rounded-lg p-3">
                <FileText className="inline w-4 h-4 -mt-0.5 mr-1 text-amber-800" />
                Bank details are not set for this site yet. Set environment variables
                (see <code className="text-xs bg-amber-100/80 px-1 rounded">web/.env.example</code>){' '}
                or add <code className="text-xs bg-amber-100/80 px-1 rounded">BIOVERA_BANK_IBAN</code>{' '}
                in hosting, then redeploy. Or contact{' '}
                <a className="underline font-medium text-amber-950" href="mailto:info@biovera.app">
                  info@biovera.app
                </a>{' '}
                for requisites.
              </p>
            )
          )}

          {c.extraLines.length > 0 && (
            <ul className="list-disc pl-4 text-gray-700 space-y-1 pt-1 text-sm">
              {c.extraLines.map((line) => (
                <li key={line} className="font-light">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
