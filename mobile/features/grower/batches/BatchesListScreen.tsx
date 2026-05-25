import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { onBatchListRefreshRequest } from '../../../lib/batch-refresh';
import { Package, Plus, ChevronRight } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { batchesAPI } from '../../../lib/api';
import { isLikelyNetworkError } from '../../../lib/api-error';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { getBatchStatusLabel } from '../../../features/grower/batches/batch-status-i18n';
import { groupLotsByEstate } from '../../../lib/lot-display';
import LotIdsBlock from '../../../features/grower/batches/LotIdsBlock';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import {
  enterpriseColors,
  enterpriseLotBucketStyle,
  type EnterpriseLotBucket,
} from '../../../lib/enterprise-ui';
import { growerUi, growerStyles } from '../../../lib/grower-ui';
import { HubSectionTitle } from '../../../features/grower/hubs/HubNavTile';

type LotFilter = 'all' | 'here' | 'moving' | 'done';

function statusBucket(status: string): EnterpriseLotBucket {
  const s = String(status ?? '').toUpperCase();
  if (s === 'DELIVERED' || s === 'SOLD') return 'done';
  if (s === 'IN_HUB' || s === 'IN_TRANSIT') return 'moving';
  if (s === 'PACKED' || s === 'QUALITY_VERIFIED' || s === 'HARVESTED') return 'here';
  if (s === 'RETURNED' || s === 'EXPIRED') return 'done';
  return 'here';
}

export default function BatchesScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<LotFilter>('all');
  const hasCacheRef = useRef(false);

  const loadBatches = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true || hasCacheRef.current;
    if (!silent) setLoading(true);
    try {
      const data = await batchesAPI.getAll();
      setBatches(Array.isArray(data) ? data : []);
      hasCacheRef.current = true;
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        console.warn('Backend not available, batches list empty');
      } else {
        console.error('Error loading batches:', error);
      }
      if (!hasCacheRef.current) setBatches([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBatches({ silent: hasCacheRef.current });
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
    await loadBatches({ silent: true });
    setRefreshing(false);
  };

  const filteredBatches = useMemo(() => {
    if (filter === 'all') return batches;
    return batches.filter((b) => statusBucket(b.status) === filter);
  }, [batches, filter]);

  const groupedLots = useMemo(() => groupLotsByEstate(filteredBatches), [filteredBatches]);

  const counts = useMemo(() => {
    const c = { all: batches.length, here: 0, moving: 0, done: 0 };
    for (const b of batches) {
      const bucket = statusBucket(b.status);
      c[bucket] += 1;
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
    <EnterpriseScreen
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentPaddingBottom={Math.max(p.bottomInset, 16) + 12}
      header={
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
      }
    >
      <View style={growerUi.scrollContent}>
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
                style={[growerUi.filterChip, sel && growerUi.filterChipOn]}
              >
                <Text style={[growerUi.filterChipText, sel && growerUi.filterChipTextOn]}>
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
              style={growerUi.btnPrimary}
              activeOpacity={0.85}
            >
              <Text style={growerUi.btnPrimaryText}>{t('producer.batches.createFabA11y')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {groupedLots.map((section) => (
              <View key={section.title}>
                <HubSectionTitle>
                  {t('producer.batches.lotsGroupedByEstate', { estate: section.title })}
                </HubSectionTitle>
                <View style={{ gap: 0 }}>
                  {section.items.map((batch, index) => {
                    const rowKey = String(batch.id ?? batch.batchId ?? '');
                    const detailRef = batch.id ?? batch.batchId;
                    const product = batch.productName || t('producer.batches.product');
                    const bucket = statusBucket(batch.status);
                    const { accent, tint } = enterpriseLotBucketStyle(bucket);
                    const metaParts = [
                      product,
                      batch.quantity ? `${batch.quantity} ${batch.unit || 'kg'}` : null,
                      batch.harvestDate
                        ? new Date(batch.harvestDate).toLocaleDateString(dateLocale, {
                            day: 'numeric',
                            month: 'short',
                          })
                        : null,
                      batch.parcels?.cropType || null,
                    ].filter(Boolean);

                    return (
                      <TouchableOpacity
                        key={rowKey || `batch-row-${index}`}
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
                            alignItems: 'flex-start',
                          },
                        ]}
                      >
                        <View style={[growerUi.tileIcon, { backgroundColor: tint }]}>
                          <Package size={22} color={accent} strokeWidth={1.75} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={styles.titleRow}>
                            <LotIdsBlock lot={batch} compact />
                            <View style={[growerStyles.statusPill, { backgroundColor: tint }]}>
                              <Text style={[growerStyles.statusPillText, { color: accent }]}>
                                {getBatchStatusLabel(t, batch.status)}
                              </Text>
                            </View>
                          </View>
                          {metaParts.length > 0 ? (
                            <Text style={[growerUi.tileDesc, { marginTop: 6 }]} numberOfLines={2}>
                              {metaParts.join(' · ')}
                            </Text>
                          ) : null}
                        </View>
                        <ChevronRight size={20} color={enterpriseColors.gray600} strokeWidth={1.75} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </EnterpriseScreen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  mutedCenter: {
    padding: 32,
    textAlign: 'center',
    fontSize: 16,
    color: enterpriseColors.gray600,
  },
  emptyText: {
    fontSize: 16,
    color: enterpriseColors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
});
