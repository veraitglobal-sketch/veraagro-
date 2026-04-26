'use client';

import { getPublicPaymentConfig, hasAnyPaymentConfig } from '@/lib/biovera-payment-public';
import { FileText, Landmark } from 'lucide-react';

type Props = {
  orderNumber: string;
  totalAmount: number;
  amountLabel?: string;
};

/**
 * Renders when order status is APPROVED: wire transfer instructions for BioVera.
 */
export function PaymentInstructionsPanel({ orderNumber, totalAmount, amountLabel }: Props) {
  const c = getPublicPaymentConfig();
  const configured = hasAnyPaymentConfig();
  const amount =
    amountLabel ||
    (Number.isFinite(totalAmount) ? `${totalAmount.toFixed(2)} ${c.currency}` : '—');

  return (
    <div
      className="mb-6 rounded-lg border border-[#2D5A27]/25 bg-[#2D5A27]/5 p-4"
      role="region"
      aria-label="Payment instructions"
    >
      <div className="flex items-start gap-2 mb-3">
        <Landmark className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <h3 className="text-sm font-medium text-gray-900">Pay by bank transfer</h3>
          <p className="text-xs text-gray-600 font-light mt-0.5">
            Use the reference below so we can match your payment to this order.
          </p>
        </div>
      </div>

      <div className="text-sm space-y-2 pl-0 sm:pl-7">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 border-b border-gray-200/60 pb-2">
          <span className="text-gray-500 font-light">Amount due</span>
          <span className="font-medium text-gray-900 tabular-nums">{amount}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 border-b border-gray-200/60 pb-2">
          <span className="text-gray-500 font-light">Reference / description</span>
          <code className="text-xs sm:text-sm bg-white/80 px-2 py-0.5 rounded border border-gray-200">
            {orderNumber}
          </code>
        </div>

        {configured ? (
          <>
            {c.beneficiary && (
              <p>
                <span className="text-gray-500 font-light">Beneficiary: </span>
                <span className="text-gray-900">{c.beneficiary}</span>
              </p>
            )}
            {c.bankName && (
              <p>
                <span className="text-gray-500 font-light">Bank: </span>
                <span className="text-gray-900">{c.bankName}</span>
              </p>
            )}
            {c.iban && (
              <p>
                <span className="text-gray-500 font-light">IBAN: </span>
                <code className="text-sm break-all">{c.iban}</code>
              </p>
            )}
            {c.swift && (
              <p>
                <span className="text-gray-500 font-light">SWIFT/BIC: </span>
                <code className="text-sm">{c.swift}</code>
              </p>
            )}
            {c.extraLines.length > 0 && (
              <ul className="list-disc pl-4 text-gray-700 space-y-1 pt-1">
                {c.extraLines.map((line) => (
                  <li key={line} className="font-light">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-amber-800 text-sm font-light border border-amber-200/60 bg-amber-50/50 rounded p-2">
            <FileText className="inline w-4 h-4 -mt-0.5 mr-1" />
            Bank details for BioVera are not configured in this environment. Your account manager
            or{' '}
            <a className="underline" href="mailto:info@biovera.app">
              info@biovera.app
            </a>{' '}
            will send payment details.
          </p>
        )}
      </div>
    </div>
  );
}
