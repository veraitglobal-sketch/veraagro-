import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getLotIdLines, type LotListItem } from '../../../lib/lot-display';
import { enterpriseColors } from '../../../lib/enterprise-ui';

type Props = {
  lot: LotListItem;
  compact?: boolean;
};

export default function LotIdsBlock({ lot, compact }: Props) {
  const { t } = useTranslation();
  const { publicId, systemId } = getLotIdLines(lot);

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>{t('producer.batches.lotLabel')}</Text>
      <Text style={[styles.publicId, compact && styles.publicIdCompact]} selectable>
        {publicId}
      </Text>
      {systemId ? (
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
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: enterpriseColors.primary,
    marginBottom: 2,
  },
  publicId: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    fontVariant: ['tabular-nums'],
  },
  publicIdCompact: { fontSize: 15 },
  systemLine: {
    fontSize: 11,
    color: enterpriseColors.gray600,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  systemLabel: {
    fontWeight: '500',
    fontVariant: [],
  },
});
