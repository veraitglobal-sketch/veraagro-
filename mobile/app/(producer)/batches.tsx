import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { onBatchListRefreshRequest } from '../../lib/batch-refresh';
import { Package, Plus, ChevronRight } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { batchesAPI } from '../../lib/api';
import { useAppLocaleTag } from '../../lib/date-locale';
import { getBatchStatusLabel } from '../../features/grower/batches/batch-status-i18n';
import { BioVeraSubpageHeader } from '../../components/BioVeraSubpageHeader';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { growerUi, growerStyles } from '../../lib/grower-ui';
import { HubSectionTitle } from '../../features/grower/hubs/HubNavTile';

type LotFilter = 'all' | 'here' | 'moving' | 'done';

function statusBucket(status: string): LotFilter {
  const s = String(status ?? '').toUpperCase();
  if (s === 'DELIVERED') return 'done';
  if (s === 'IN_HUB' || s === 'IN_TRANSIT') return 'moving';
  if (s === 'PACKED' || s === 'QUALITY_VERIFIED' || s === 'HARVESTED') return 'here';
  return 'here';
}

function bucketAccent(bucket: LotFilter): string {
  if (bucket === 'done') return enterpriseColors.gray600;
  if (bucket === 'moving') return '#1D4ED8';
  return enterpriseColors.primary;
}

function bucketTint(bucket: LotFilter): string {
  if (bucket === 'done') return `${enterpriseColors.gray600}18`;
  if (bucket === 'moving') return '#1D4ED818';
  return `${enterpriseColors.primary}12`;
}

export default function BatchesScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<LotFilter>('all');

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await batchesAPI.getAll();
      setBatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading batches:', error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBatches();
    }, [loadBatches]),
  );

  useEffect(() => {
    return onBatchListRefreshRequest(() => {
      void loadBatches();
    });
  }, [loadBatches]);

  const dateLocale = useAppLocaleTag();

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  const filteredBatches = useMemo(() => {
    if (filter === 'all') return batches;
    return batches.filter((b) => statusBucket(b.status) === filter);
  }, [batches, filter]);

  const counts = useMemo(() => {
    const c = { all: batches.length, here: 0, moving: 0, done: 0 };
    for (const b of batches) {
      const bucket = statusBucket(b.status);
      if (bucket !== 'all') c[bucket] += 1;
    }
    return c;
  }, [batches]);

  const filters: { id: LotFilter; label: string; count?: number }[] = [
    { id: 'all', label: t('common.all'), count: counts.all },
    { id: 'here', label: t('producer.batches.filterHere'), count: counts.here },
    { id: 'moving', label: t('producer.batches.filterMoving'), count: counts.moving },
    { id: 'done', label: t('producer.batches.filterDone'), count: counts.done },
  ];

  return (
    <View style={growerUi.canvas}>
      <BioVeraSubpageHeader
        title={t('producer.batches.listScreenTitle')}
        left="back"
        right={
          <TouchableOpacity
            onPress={() => router.push('/(producer)/batch-new')}
            accessibilityLabel={t('producer.batches.createFabA11y')}
            hitSlop={12}
            style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
          >
            <Plus size={26} color={enterpriseColors.primary} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={enterpriseColors.primary} />
        }
        contentContainerStyle={[
          growerUi.scrollContent,
          { paddingBottom: Math.max(p.bottomInset, theme.spacing.lg) },
        ]}
      >
        <Text style={[growerUi.pageLead, { marginTop: 0, marginBottom: 14 }]}>
          {t('producer.batches.listLeadOneLine')}
        </Text>

        <View style={styles.filterRow}>
          {filters.map((f) => {
            const sel = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.85}
                style={[styles.filterChip, sel && styles.filterChipOn]}
              >
                <Text style={[styles.filterChipText, sel && styles.filterChipTextOn]}>
                  {f.label}
                  {f.count != null && f.count > 0 ? ` (${f.count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!loading && filteredBatches.length > 0 ? (
          <HubSectionTitle>
            {t('producer.batches.listCountLabel', { count: filteredBatches.length })}
          </HubSectionTitle>
        ) : null}

        {loading ? (
          <Text style={styles.mutedCenter}>{t('producer.batches.loading')}</Text>
        ) : filteredBatches.length === 0 ? (
          <View style={growerUi.emptyCard}>
            <Package size={40} color={enterpriseColors.gray600} strokeWidth={1.25} />
            <Text style={styles.emptyText}>
              {filter === 'all' ? t('producer.batches.emptyList') : t('producer.batches.emptyFilter')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(producer)/batch-new')}
              style={styles.emptyCta}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCtaText}>{t('producer.batches.createFabA11y')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 0 }}>
            {filteredBatches.map((batch, index) => {
              const rowKey = String(batch.id ?? batch.batchId ?? '');
              const displayId = batch.batchId || (batch.id ? String(batch.id).slice(0, 8) : '');
              const detailRef = batch.id ?? batch.batchId;
              const product = batch.productName || t('producer.batches.product');
              const bucket = statusBucket(batch.status);
              const accent = bucketAccent(bucket);
              const metaParts = [
                batch.quantity ? `${batch.quantity} ${batch.unit || 'kg'}` : null,
                displayId || null,
                batch.harvestDate
                  ? new Date(batch.harvestDate).toLocaleDateString(dateLocale, {
                      day: 'numeric',
                      month: 'short',
                    })
                  : null,
              ].filter(Boolean);

              return (
                <TouchableOpacity
                  key={rowKey || displayId || `batch-row-${index}`}
                  onPress={() => {
                    if (detailRef) router.push(`/(producer)/batch/${detailRef}`);
                  }}
                  activeOpacity={0.88}
                  style={[
                    growerUi.tile,
                    {
                      borderLeftWidth: 4,
                      borderLeftColor: accent,
                      marginBottom: 10,
                    },
                  ]}
                >
                  <View style={[growerUi.tileIcon, { backgroundColor: bucketTint(bucket) }]}>
                    <Package size={22} color={accent} strokeWidth={1.75} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.titleRow}>
                      <Text style={growerUi.tileTitle} numberOfLines={1}>
                        {product}
                      </Text>
                      <View style={[growerStyles.statusPill, { backgroundColor: bucketTint(bucket) }]}>
                        <Text style={[growerStyles.statusPillText, { color: accent }]}>
                          {getBatchStatusLabel(t, batch.status)}
                        </Text>
                      </View>
                    </View>
                    {metaParts.length > 0 ? (
                      <Text style={growerUi.tileDesc} numberOfLines={1}>
                        {metaParts.join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronRight size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  filterChipOn: { borderColor: enterpriseColors.primary, backgroundColor: `${enterpriseColors.primary}10` },
  filterChipText: { fontSize: 14, fontWeight: '600', color: enterpriseColors.gray600 },
  filterChipTextOn: { color: enterpriseColors.primary },
  mutedCenter: {
    padding: 32,
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  emptyText: {
    fontSize: 16,
    color: enterpriseColors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
  },
  emptyCta: {
    marginTop: 16,
    backgroundColor: enterpriseColors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  emptyCtaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
});
