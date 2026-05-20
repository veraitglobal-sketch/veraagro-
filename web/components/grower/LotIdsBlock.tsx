'use client';

import { useTranslation } from 'react-i18next';
import { getLotIdLines, type LotListItem } from '@/lib/lot-display';

type Props = {
  lot: LotListItem;
  compact?: boolean;
};

export function LotIdsBlock({ lot, compact }: Props) {
  const { t } = useTranslation();
  const { publicId, systemId } = getLotIdLines(lot);

  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#2D5A27]">
        {t('growerPages.lotLabel')}
      </p>
      <p className={`font-mono font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
        {publicId}
      </p>
      {systemId ? (
        <p className={`font-mono text-gray-500 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          <span className="font-sans font-medium text-gray-600">{t('growerPages.lotSystemBatchId')}: </span>
          {systemId}
        </p>
      ) : null}
    </div>
  );
}
