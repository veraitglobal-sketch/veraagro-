import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getLotIdLines, type LotListItem } from '../../../lib/lot-display';
import { enterpriseColors } from '../../../lib/enterprise-ui';

type Props = {
  lot: LotListItem;
  /** List cards — samo javni BATCH-ID, bez UUID. */
  compact?: boolean;
  /** Detalj lota — prikaži sistemski ID (UUID). */
  showSystemId?: boolean;
};

export default function LotIdsBlock({ lot, compact, showSystemId = !compact }: Props) {
  const { t } = useTranslation();
  const { publicId, systemId } = getLotIdLines(lot);

  if (compact) {
    return (
      <Text style={styles.publicIdCompact} numberOfLines={1} selectable>
        {publicId}
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>{t('producer.batches.lotLabel')}</Text>
      <Text style={styles.publicId} selectable>
        {publicId}
      </Text>
      {showSystemId && systemId ? (
        <Text style={styles.systemLine} selectable>
          <Text style={styles.systemLabel}>{t('producer.batches.lotSystemBatchId')}: </Text>
          {systemId}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0 },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: enterpriseColors.primary,
    marginBottom: 2,
  },
  publicId: {
    fontFamily: 'Menlo',
    letterSpacing: -0.3,
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    fontVariant: ['tabular-nums'],
  },
  publicIdCompact: {
    fontSize: 11,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    fontFamily: 'Menlo',
    letterSpacing: -0.2,
  },
  systemLine: {
    fontSize: 12,
    color: enterpriseColors.gray600,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  systemLabel: {
    fontWeight: '500',
    fontVariant: [],
  },
});
