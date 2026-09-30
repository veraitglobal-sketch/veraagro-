'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function CatalogOrderStock({
  catalogProductId,
  catalogReservedKg,
  unit,
}: {
  catalogProductId?: string | null;
  catalogReservedKg?: number | null;
  unit?: string;
}) {
  const { t } = useTranslation();
  if (!catalogProductId) return null;

  return (
    <div className="mt-2 max-w-[16rem] whitespace-normal rounded border border-green-200 bg-green-50 p-2 text-xs text-green-900">
      <p>
        {catalogReservedKg != null
          ? t('orderStock.catalogReserved', {
              defaultValue: 'Reserved from marketplace stock: {{kg}} {{unit}}',
              kg: catalogReservedKg,
              unit: unit ?? 'kg',
            })
          : t('orderStock.catalogPending', { defaultValue: 'Marketplace stock reservation pending' })}
      </p>
      <Link
        href={`/admin/products?edit=${encodeURIComponent(catalogProductId)}&tab=stock`}
        className="mt-1 inline-block font-medium text-[#2D5A27] underline"
      >
        {t('orderStock.viewStockHistory', { defaultValue: 'View stock history' })}
      </Link>
    </div>
  );
}

export function orderStockIsReady(order: {
  catalogProductId?: string | null;
  catalogReserved?: boolean;
  stockReservation?: { status?: string } | null;
}): boolean {
  if (order.catalogProductId) return !!order.catalogReserved;
  return order.stockReservation?.status === 'RESERVED';
}
