import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Package, Plus, ChevronRight } from 'lucide-react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import LotIdsBlock from './LotIdsBlock';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { formatAppDate, useAppLocaleTag } from '../../../lib/date-locale';
import { theme } from '../../../lib/theme';
import { growerUi } from '../../../lib/grower-ui';
import {
  useBatchesData,
  type BatchFilter,
  type BatchListItem,
} from './useBatchesData';

export function BatchesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const dateLocale = useAppLocaleTag();
  const {
    loading,
    refreshing,
    filter,
    setFilter,
    filteredBatches,
    counts,
    onRefresh,
    getStatusLabel,
    getStatusColor,
  } = useBatchesData();

  const filters: { id: BatchFilter; labelKey: string; count: number }[] = [
    { id: 'all', labelKey: 'producer.batches.all', count: counts.all },
    { id: 'packed', labelKey: 'producer.batches.packed', count: counts.packed },
    { id: 'inHub', labelKey: 'producer.batches.inHub', count: counts.inHub },
    { id: 'inTransit', labelKey: 'producer.batches.inTransit', count: counts.inTransit },
    { id: 'delivered', labelKey: 'producer.batches.delivered', count: counts.delivered },
  ];

  return (
    <EnterpriseScreen
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
        <BioVeraSubpageHeader
          title={t('producer.batches.title')}
          left="back"
          right={
            <TouchableOpacity
              onPress={() => router.push('/(producer)/batch-new')}
              accessibilityLabel={t('producer.batches.createFabA11y')}
              hitSlop={12}
              style={styles.headerAction}
            >
              <Plus size={26} color={theme.colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={growerUi.scrollContent}>
        <View style={styles.filterRow}>
          {filters.map((f) => {
            const selected = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.85}
                style={[growerUi.filterChip, selected && growerUi.filterChipOn]}
              >
                <Text style={[growerUi.filterChipText, selected && growerUi.filterChipTextOn]}>
                  {t(f.labelKey)}
                  {f.count > 0 ? ` (${f.count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <Text style={styles.loadingText}>{t('producer.batches.loading')}</Text>
        ) : filteredBatches.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Package size={48} color={theme.colors.text.tertiary} strokeWidth={1.25} />
            <Text style={styles.emptyTitle}>{t('producer.batches.noBatches')}</Text>
            <Text style={styles.emptyDesc}>{t('producer.batches.noBatchesDesc')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(producer)/batch-new')}
              style={[growerUi.btnPrimary, { marginTop: 16 }]}
              activeOpacity={0.85}
            >
              <Text style={growerUi.btnPrimaryText}>{t('producer.batches.createFabA11y')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredBatches.map((batch, index) => (
              <BatchCard
                key={String(batch.id ?? batch.batchId ?? index)}
                batch={batch}
                dateLocale={dateLocale}
                getStatusLabel={getStatusLabel}
                getStatusColor={getStatusColor}
                onPress={() => {
                  const detailRef = batch.id ?? batch.batchId;
                  if (detailRef) router.push(`/(producer)/batch/${detailRef}`);
                }}
                productFallback={t('producer.batches.product')}
                harvestPrefix={t('producer.batches.harvestDate')}
              />
            ))}
          </View>
        )}
      </View>
    </EnterpriseScreen>
  );
}

type BatchCardProps = {
  batch: BatchListItem;
  dateLocale: 'sr-Latn' | 'en-US';
  getStatusLabel: (status: string | null | undefined) => string;
  getStatusColor: (status: string | null | undefined) => { background: string; text: string };
  onPress: () => void;
  productFallback: string;
  harvestPrefix: string;
};

function BatchCard({
  batch,
  dateLocale,
  getStatusLabel,
  getStatusColor,
  onPress,
  productFallback,
  harvestPrefix,
}: BatchCardProps) {
  const product = batch.productName || productFallback;
  const qty =
    batch.quantity != null && Number(batch.quantity) > 0
      ? `${batch.quantity} ${batch.unit || 'kg'}`
      : null;
  const harvestLine = batch.harvestDate
    ? `${harvestPrefix}: ${formatAppDate(batch.harvestDate, dateLocale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`
    : null;
  const statusColors = getStatusColor(batch.status);
  const statusLabel = getStatusLabel(batch.status);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <LotIdsBlock lot={batch} compact />
          {statusLabel ? (
            <View style={[styles.statusBadge, { backgroundColor: statusColors.background }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>{statusLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.productText}>{product}</Text>
        {qty ? <Text style={styles.metaText}>{qty}</Text> : null}
        {harvestLine ? <Text style={styles.metaText}>{harvestLine}</Text> : null}
      </View>
      <ChevronRight size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  loadingText: {
    padding: 32,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  emptyDesc: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    minHeight: 72,
    gap: 8,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  productText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  metaText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});

export default BatchesScreen;
