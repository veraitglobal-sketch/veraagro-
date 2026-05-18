import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, MapPinned, MessageCircle, Package } from 'lucide-react-native';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi, growerStyles } from '../../../lib/grower-ui';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { formatOrderLines, orderStatusSortKey } from './types';
import { usePartnerOrdersData } from './usePartnerOrdersData';
import { orderPartnerLabel, orderStatusTone, threadTitle } from './partner-order-ui';

type TabId = 'orders' | 'messages';

export default function PartnerOrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const dateLocale = useAppLocaleTag();
  const [tab, setTab] = useState<TabId>('orders');
  const {
    orders,
    threads,
    loading,
    refreshing,
    err,
    receivingId,
    onRefresh,
    markReceived,
  } = usePartnerOrdersData();

  const partnerFallback = () => t('producer.dashboard.partnerOrders.partnerFallback');

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((a, b) => {
        const dr = orderStatusSortKey(a.status) - orderStatusSortKey(b.status);
        if (dr !== 0) return dr;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [orders],
  );

  const summarizeItems = (items: unknown) => {
    const lines = formatOrderLines(items);
    if (lines.length === 0) return '';
    if (lines.length === 1) return lines[0];
    return t('producer.dashboard.partnerOrders.itemsMore', { first: lines[0], count: lines.length - 1 });
  };

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'orders', label: t('producer.dashboard.partnerOrders.tabOrders'), count: orders.length },
    { id: 'messages', label: t('producer.dashboard.partnerOrders.tabMessages'), count: threads.length },
  ];

  const openThread = (supplierUserId: string, threadId: string) => {
    router.push(
      `/b2b-supplier/${encodeURIComponent(supplierUserId)}?threadId=${encodeURIComponent(threadId)}` as Href,
    );
  };

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('navigation.partnerOrders')}
        subtitle={t('producer.dashboard.partnerOrders.screenLeadShort')}
      />

      <View style={styles.tabRow}>
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setTab(item.id)}
              activeOpacity={0.7}
              style={[styles.tabChip, active && styles.tabChipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{item.label}</Text>
              {item.count > 0 ? (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{item.count}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          ...growerUi.scrollContent,
          paddingTop: 8,
          paddingBottom: Math.max(p.bottomInset, 20) + 12,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => onRefresh()}
            tintColor={enterpriseColors.primary}
            colors={[enterpriseColors.primary]}
          />
        }
      >
        {err ? (
          <View style={styles.err}>
            <Text style={styles.errText}>{err}</Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={() => router.push('/map' as Href)} activeOpacity={0.72} style={styles.mapLink}>
          <MapPinned size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
          <Text style={styles.mapLinkText}>{t('producer.dashboard.suppliersMap')}</Text>
          <ChevronRight size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
        </TouchableOpacity>

        {tab === 'orders' ? (
          <>
            {loading && orders.length === 0 ? (
              <View style={styles.centered}>
                <ActivityIndicator color={enterpriseColors.primary} />
              </View>
            ) : sortedOrders.length === 0 ? (
              <View style={growerUi.emptyCard}>
                <Package size={28} color={enterpriseColors.gray600} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>{t('producer.dashboard.partnerOrders.emptyOrdersShort')}</Text>
                <Text style={styles.emptyHint}>{t('producer.dashboard.partnerOrders.emptyOrders')}</Text>
              </View>
            ) : (
              <View style={styles.panel}>
                {sortedOrders.map((o, index) => {
                  const tone = orderStatusTone(o.status);
                  const statusLabel = t(`supplier.b2bOrderStatus.${o.status}`, { defaultValue: o.status });
                  const itemsLine = summarizeItems(o.items);
                  const dateStr = new Date(o.createdAt).toLocaleDateString(dateLocale);
                  const canMarkReceived =
                    !o.farmerReceivedAt && (o.status === 'CONFIRMED' || o.status === 'FULFILLED');

                  return (
                    <View
                      key={o.id}
                      style={[styles.orderBlock, index < sortedOrders.length - 1 && styles.orderBlockBorder]}
                    >
                      <TouchableOpacity
                        onPress={() => router.push(`/(producer)/partner-order/${o.id}` as Href)}
                        activeOpacity={0.72}
                        style={styles.orderRow}
                        accessibilityRole="button"
                        accessibilityLabel={orderPartnerLabel(o, partnerFallback())}
                      >
                        <View style={styles.orderMain}>
                          <Text style={styles.orderTitle} numberOfLines={1}>
                            {orderPartnerLabel(o, partnerFallback())}
                          </Text>
                          {itemsLine ? (
                            <Text style={styles.orderMeta} numberOfLines={1}>
                              {itemsLine}
                            </Text>
                          ) : null}
                          <Text style={styles.orderDate}>
                            {dateStr} · #{o.id.slice(0, 8)}
                          </Text>
                          {o.farmerReceivedAt ? (
                            <Text style={styles.receivedOk}>
                              {t('producer.dashboard.partnerOrders.receivedShort')}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.orderEnd}>
                          <View style={[growerStyles.statusPill, { backgroundColor: tone.bg }]}>
                            <Text style={[growerStyles.statusPillText, { color: tone.text }]}>{statusLabel}</Text>
                          </View>
                          <ChevronRight size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
                        </View>
                      </TouchableOpacity>

                      {canMarkReceived ? (
                        <TouchableOpacity
                          onPress={() => void markReceived(o.id)}
                          disabled={receivingId === o.id}
                          style={styles.markReceived}
                          accessibilityRole="button"
                        >
                          <Text style={styles.markReceivedText}>
                            {receivingId === o.id
                              ? t('producer.dashboard.partnerOrders.receivingInProgress')
                              : t('producer.dashboard.partnerOrders.markReceivedAtFarm')}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {loading && threads.length === 0 ? (
              <View style={styles.centered}>
                <ActivityIndicator color={enterpriseColors.primary} />
              </View>
            ) : threads.length === 0 ? (
              <View style={growerUi.emptyCard}>
                <MessageCircle size={28} color={enterpriseColors.gray600} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>{t('producer.dashboard.partnerOrders.emptyThreadsShort')}</Text>
                <Text style={styles.emptyHint}>{t('producer.dashboard.partnerOrders.emptyThreads')}</Text>
              </View>
            ) : (
              <View style={styles.messagesPanel}>
                {threads
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
                  )
                  .map((th, index, arr) => {
                    const title = threadTitle(th, partnerFallback());
                    const when = new Date(th.lastMessageAt).toLocaleDateString(dateLocale);
                    const city = th.supplier?.material_supplier_profile?.city;
                    const subtitle = city
                      ? t('producer.dashboard.partnerOrders.threadSubtitleCity', { city, when })
                      : when;

                    return (
                      <TouchableOpacity
                        key={th.id}
                        onPress={() => openThread(th.supplierUserId, th.id)}
                        activeOpacity={0.72}
                        style={[styles.messageRow, index < arr.length - 1 && styles.messageRowBorder]}
                        accessibilityRole="button"
                      >
                        <View style={growerUi.tileIcon}>
                          <MessageCircle size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
                        </View>
                        <View style={styles.messageMain}>
                          <Text style={styles.orderTitle} numberOfLines={1}>
                            {title}
                          </Text>
                          <Text style={styles.orderMeta} numberOfLines={1}>
                            {subtitle}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 4,
  },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  tabChipActive: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  tabChipText: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray600,
  },
  tabChipTextActive: {
    color: enterpriseColors.primary,
    fontWeight: '600',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: enterpriseColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: enterpriseColors.primary,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: enterpriseColors.gray600,
  },
  tabBadgeTextActive: {
    color: enterpriseColors.white,
  },
  err: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: enterpriseColors.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  mapLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray900,
    letterSpacing: -0.15,
  },
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    overflow: 'hidden',
  },
  messagesPanel: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    overflow: 'hidden',
  },
  orderBlock: {
    paddingBottom: 4,
  },
  orderBlockBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  orderMain: {
    flex: 1,
    minWidth: 0,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
  },
  orderMeta: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    marginTop: 4,
    letterSpacing: -0.1,
  },
  orderDate: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    marginTop: 6,
  },
  receivedOk: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 6,
  },
  orderEnd: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  markReceived: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 10,
    paddingVertical: 4,
    minHeight: 36,
    justifyContent: 'center',
  },
  markReceivedText: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  messageRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  messageMain: {
    flex: 1,
    minWidth: 0,
  },
});
