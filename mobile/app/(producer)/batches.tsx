import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { onBatchListRefreshRequest } from '../../lib/batch-refresh';
import { ArrowLeft, Package, QrCode, Calendar, Plus } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { batchesAPI } from '../../lib/api';
import { useAppLocaleTag } from '../../lib/date-locale';
import { getBatchStatusLabel } from '../../features/grower/batches/batch-status-i18n';

/**
 * Batches Screen
 * List of all batches with status and traceability
 * Grower-friendly typography and tap targets (readable labels, ≥44pt actions).
 */
export default function BatchesScreen() {
  const { t } = useTranslation();
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PACKED' | 'IN_HUB' | 'IN_TRANSIT' | 'DELIVERED'>('all');

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

  /** Load on focus and when coming back to this screen (e.g. after logistics updated status). */
  useFocusEffect(
    useCallback(() => {
      void loadBatches();
    }, [loadBatches]),
  );

  /** Real-time: home tab keeps one socket; when batch status changes (hub, transit, delivered), reload. */
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

  const filteredBatches = filter === 'all' 
    ? batches 
    : batches.filter(b => b.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PACKED':
      case 'QUALITY_VERIFIED':
        return theme.colors.accent;
      case 'IN_HUB': return theme.colors.warning;
      case 'IN_TRANSIT': return theme.colors.primary;
      case 'DELIVERED': return theme.colors.success || theme.colors.primary;
      case 'RETURNED': return theme.colors.warning;
      case 'EXPIRED': return theme.colors.text.secondary;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => getBatchStatusLabel(t, status);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: p.headerTop,
        paddingBottom: theme.spacing.md,
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ marginRight: theme.spacing.md, minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '600',
          color: theme.colors.text.primary,
          letterSpacing: 0.2,
          flex: 1,
        }}>
          {t('producer.batches.listScreenTitle')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(producer)/batch-new')}
          accessibilityRole="button"
          accessibilityLabel={t('producer.batches.createFabA11y')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
        >
          <Plus size={26} color={theme.colors.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={{
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {([
              { id: 'all' as const, label: t('common.all') },
              { id: 'PACKED' as const, label: t('producer.batches.filterPacked') },
              { id: 'IN_HUB' as const, label: t('producer.batches.filterInHub') },
              { id: 'IN_TRANSIT' as const, label: t('producer.batches.filterInTransit') },
              { id: 'DELIVERED' as const, label: t('producer.batches.filterDelivered') },
            ]).map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  minHeight: 44,
                  justifyContent: 'center',
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 0.5,
                  borderColor: filter === f.id ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                  backgroundColor: filter === f.id ? `${theme.colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: filter === f.id ? theme.colors.primary : theme.colors.text.secondary,
                  letterSpacing: 0.2,
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Batches List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          {loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text style={{
                color: theme.colors.text.secondary,
                fontSize: 16,
                fontWeight: '500',
                letterSpacing: 0.2,
              }}>
                {t('producer.batches.loading')}
              </Text>
            </View>
          ) : filteredBatches.length === 0 ? (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.xl,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
            }}>
              <Package size={40} color={theme.colors.text.tertiary} strokeWidth={1.25} />
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: theme.colors.text.secondary,
                marginTop: theme.spacing.sm,
                letterSpacing: 0.2,
                textAlign: 'center',
                lineHeight: 24,
                paddingHorizontal: theme.spacing.md,
              }}>
                {t('producer.batches.emptyList')}
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {filteredBatches.map((batch, index) => {
                const rowKey = String(batch.id ?? batch.batchId ?? '');
                const displayId = batch.batchId || (batch.id ? String(batch.id).slice(0, 8) : '');
                const detailRef = batch.id ?? batch.batchId;
                return (
                <TouchableOpacity
                  key={rowKey || displayId || `batch-row-${index}`}
                  onPress={() => {
                    if (detailRef) router.push(`/(producer)/batch/${detailRef}`);
                  }}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md + 2,
                    borderWidth: 0.5,
                    borderColor: 'rgba(0, 0, 0, 0.05)',
                    minHeight: 88,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${getStatusColor(batch.status)}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.sm,
                    }}>
                      <Package size={22} color={getStatusColor(batch.status)} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                        <QrCode size={18} color={theme.colors.text.secondary} strokeWidth={1.5} />
                        <Text style={{
                          fontSize: 17,
                          fontWeight: '600',
                          color: theme.colors.text.primary,
                          marginLeft: theme.spacing.xs,
                          letterSpacing: 0.2,
                        }}>
                          {displayId}
                        </Text>
                      </View>
                      <Text style={{
                        fontSize: 15,
                        fontWeight: '500',
                        color: theme.colors.text.secondary,
                        letterSpacing: 0.1,
                      }}>
                        {batch.productName || t('producer.batches.product')}
                      </Text>
                      {batch.quantity && (
                        <Text style={{
                          fontSize: 15,
                          fontWeight: '400',
                          color: theme.colors.text.secondary,
                          marginTop: 4,
                          letterSpacing: 0.1,
                        }}>
                          {batch.quantity} {batch.unit || 'kg'}
                        </Text>
                      )}
                    </View>
                    <View style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: `${getStatusColor(batch.status)}15`,
                    }}>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: getStatusColor(batch.status),
                        letterSpacing: 0.2,
                      }}>
                        {getStatusLabel(batch.status)}
                      </Text>
                    </View>
                  </View>

                  {batch.harvestDate && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: theme.spacing.xs,
                    }}>
                      <Calendar size={16} color={theme.colors.text.secondary} strokeWidth={1.5} />
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: theme.colors.text.secondary,
                        marginLeft: 6,
                        letterSpacing: 0.1,
                      }}>
                        {`${t('producer.batches.harvestLabel')}: ${new Date(batch.harvestDate).toLocaleDateString(dateLocale)}`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
