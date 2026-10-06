import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { productNameLabel } from '../../../../shared/i18n/labels';
import { Package, Plus, ChevronRight } from 'lucide-react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import LotIdsBlock from './LotIdsBlock';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { formatAppDate, useAppLocaleTag } from '../../../lib/date-locale';
import { theme } from '../../../lib/theme';
import { growerUi } from '../../../lib/grower-ui';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import {
  useBatchesData,
  type BatchFilter,
  type BatchListItem,
} from './useBatchesData';

export function BatchesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ estateId?: string; estateName?: string }>();
  const estateId = typeof params.estateId === 'string' ? params.estateId : undefined;
  const p = useBioVeraScreenPadding();
  const dateLocale = useAppLocaleTag();
  const {
    loading,
    loadError,
    refreshing,
    filter,
    setFilter,
    filteredBatches,
    counts,
    onRefresh,
    getStatusLabel,
    getStatusColor,
  } = useBatchesData(estateId);

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
              <Plus size={18} color="#fff" strokeWidth={2.4} />
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={growerUi.scrollContent}>
        {estateId ? <View style={{ marginBottom: 12, gap: 8 }}>
          <Text style={styles.productText}>{t('estateDeletion.lotsFor', { name: params.estateName || estateId })}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/(producer)/batches')}>
            <Text style={{ color: theme.colors.primary, paddingVertical: 8 }}>{t('estateDeletion.allLots')}</Text>
          </TouchableOpacity>
        </View> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScroll}>
          {filters.map((f) => {
            const selected = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.85}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[growerUi.filterChip, selected && growerUi.filterChipOn]}
              >
                <Text style={[growerUi.filterChipText, selected && growerUi.filterChipTextOn]}>
                  {t(f.labelKey)}
                  {f.count > 0 ? ` (${f.count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <Text style={styles.loadingText}>{t('producer.batches.loading')}</Text>
        ) : loadError ? (
          <TouchableOpacity accessibilityRole="button" onPress={() => void onRefresh()} style={styles.emptyWrap}>
            <Text style={styles.emptyDesc}>{t('estateDeletion.lotsLoadFailed')}</Text>
          </TouchableOpacity>
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
  dateLocale: string;
  getStatusLabel: (status: string | null | undefined) => string;
  getStatusColor: (status: string | null | undefined) => { background: string; text: string };
  onPress: () => void;
  productFallback: string;
};

function BatchCard({
  batch,
  dateLocale,
  getStatusLabel,
  getStatusColor,
  onPress,
  productFallback,
}: BatchCardProps) {
  const { t } = useTranslation();
  const product = productNameLabel(t, batch.productName) || productFallback;
  const qty =
    batch.quantity != null && Number(batch.quantity) > 0
      ? `${batch.quantity} ${batch.unit || 'kg'}`
      : null;
  const harvestShort = batch.harvestDate
    ? formatAppDate(batch.harvestDate, dateLocale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;
  const metaLine = [qty, harvestShort].filter(Boolean).join(' · ');
  const statusColors = getStatusColor(batch.status);
  const statusLabel = getStatusLabel(batch.status);

  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" activeOpacity={0.88} style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.productText} numberOfLines={1}>
            {product}
          </Text>
          {statusLabel ? (
            <View style={[styles.statusBadge, { backgroundColor: statusColors.background }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>{statusLabel}</Text>
            </View>
          ) : null}
        </View>
        <LotIdsBlock lot={batch} compact />
        {metaLine ? (
          <Text style={styles.metaText} numberOfLines={1}>
            {metaLine}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={16} color={theme.colors.text.secondary} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: enterpriseColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterScroll: { marginBottom: 12, flexGrow: 0 },
  loadingText: {
    padding: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  emptyDesc: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  list: {
    ...enterpriseUi.inAppPanel,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 64,
    gap: 10,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.25,
    color: theme.colors.text.primary,
  },
  metaText: {
    marginTop: 1,
    fontSize: 12.5,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
});

export default BatchesScreen;
