import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Store } from 'lucide-react-native';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi, growerStyles } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { formatOrderLines, type PartnerOrder } from './types';
import { usePartnerOrdersData } from './usePartnerOrdersData';
import { orderStatusTone, orderPartnerLabel } from './partner-order-ui';

function paramId(raw: string | string[] | undefined): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return '';
}

export default function PartnerOrderDetailScreen() {
  const { orderId: rawId } = useLocalSearchParams<{ orderId: string | string[] }>();
  const orderId = paramId(rawId);
  const { t } = useTranslation();
  const router = useRouter();
  const p = useBioVeraScreenPadding();
  const dateLocale = useAppLocaleTag();
  const { orders, loading, refreshing, err, receivingId, onRefresh, markReceived, load, findOrder } =
    usePartnerOrdersData();
  const [order, setOrder] = useState<PartnerOrder | null>(null);

  useEffect(() => {
    const row = findOrder(orderId);
    if (row) setOrder(row);
  }, [findOrder, orderId, orders]);

  useEffect(() => {
    if (!orderId) return;
    if (!loading && orders.length > 0 && !findOrder(orderId)) {
      void load();
    }
  }, [orderId, loading, orders.length, findOrder, load]);

  const partnerFallback = () => t('producer.dashboard.partnerOrders.partnerFallback');
  const resolved = useMemo(() => order ?? findOrder(orderId) ?? null, [order, findOrder, orderId]);

  const handleMarkReceived = useCallback(async () => {
    if (!resolved) return;
    const ok = await markReceived(resolved.id);
    if (ok) {
      const updated = findOrder(resolved.id);
      if (updated) setOrder(updated);
    }
  }, [resolved, markReceived, findOrder]);

  const openMessages = () => {
    if (!resolved) return;
    const threadQ = resolved.threadId ? `&threadId=${encodeURIComponent(resolved.threadId)}` : '';
    router.push(
      `/b2b-supplier/${encodeURIComponent(resolved.supplierUserId)}?panel=messages${threadQ}` as Href,
    );
  };

  const openStore = () => {
    if (!resolved) return;
    router.push(`/b2b-supplier/${encodeURIComponent(resolved.supplierUserId)}` as Href);
  };

  if (loading && !resolved) {
    return (
      <View style={[growerUi.canvas, styles.centered]}>
        <ActivityIndicator size="large" color={enterpriseColors.primary} />
      </View>
    );
  }

  if (!resolved) {
    return (
      <View style={growerUi.canvas}>
        <GrowerStackHeader title={t('producer.dashboard.partnerOrders.orderDetailTitle')} />
        <View style={[growerUi.scrollContent, styles.centered]}>
          <Text style={styles.empty}>{t('producer.dashboard.partnerOrders.orderNotFound')}</Text>
        </View>
      </View>
    );
  }

  const tone = orderStatusTone(resolved.status);
  const statusLabel = t(`supplier.b2bOrderStatus.${resolved.status}`, { defaultValue: resolved.status });
  const lines = formatOrderLines(resolved.items);
  const canMarkReceived =
    !resolved.farmerReceivedAt && (resolved.status === 'CONFIRMED' || resolved.status === 'FULFILLED');

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={t('producer.dashboard.partnerOrders.orderDetailTitle')}
        subtitle={orderPartnerLabel(resolved, partnerFallback())}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          ...growerUi.scrollContent,
          paddingTop: 12,
          paddingBottom: Math.max(p.bottomInset, 24) + 12,
        }}
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

        <View style={growerUi.card}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.meta}>
                {new Date(resolved.createdAt).toLocaleString(dateLocale)} · #
                {resolved.id.slice(0, 8)}
              </Text>
            </View>
            <View style={[growerStyles.statusPill, { backgroundColor: tone.bg }]}>
              <Text style={[growerStyles.statusPillText, { color: tone.text }]}>{statusLabel}</Text>
            </View>
          </View>

          {lines.length > 0 ? (
            <View style={styles.linesBlock}>
              <Text style={growerUi.sectionLabel}>{t('producer.dashboard.partnerOrders.orderItems')}</Text>
              {lines.map((line, i) => (
                <Text key={i} style={styles.line}>
                  · {line}
                </Text>
              ))}
            </View>
          ) : null}

          {resolved.noteFromFarmer ? (
            <View style={styles.noteBlock}>
              <Text style={styles.noteLabel}>{t('producer.dashboard.partnerOrders.yourNote')}</Text>
              <Text style={styles.noteBody}>{resolved.noteFromFarmer}</Text>
            </View>
          ) : null}

          {resolved.noteFromSupplier ? (
            <View style={styles.noteBlock}>
              <Text style={styles.noteLabel}>{t('producer.dashboard.partnerOrders.partnerNote')}</Text>
              <Text style={styles.noteBody}>{resolved.noteFromSupplier}</Text>
            </View>
          ) : null}

          {resolved.farmerReceivedAt ? (
            <Text style={styles.receivedOk}>
              {t('producer.dashboard.partnerOrders.receivedAtFarmWithWhen', {
                when: new Date(resolved.farmerReceivedAt).toLocaleString(dateLocale),
              })}
            </Text>
          ) : null}

          {!resolved.farmerReceivedAt && resolved.status === 'PENDING' ? (
            <Text style={styles.waiting}>{t('producer.dashboard.partnerOrders.waitingSupplierConfirm')}</Text>
          ) : null}

          {canMarkReceived ? (
            <TouchableOpacity
              onPress={() => void handleMarkReceived()}
              disabled={receivingId === resolved.id}
              style={[growerUi.btnPrimary, styles.markBtn]}
              activeOpacity={0.9}
            >
              <Text style={growerUi.btnPrimaryText}>
                {receivingId === resolved.id
                  ? t('producer.dashboard.partnerOrders.receivingInProgress')
                  : t('producer.dashboard.partnerOrders.markReceivedAtFarm')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {resolved.farmerReceivedAt ? <TouchableOpacity accessibilityRole="button" style={[styles.actionRow, { marginTop: 12 }]}
          onPress={() => router.push('/(producer)/(tabs)/products')}>
          <Text style={enterpriseUi.navRowTitle}>{t('producer.dashboard.myProducts')}</Text>
        </TouchableOpacity> : null}
        <View style={styles.actions}>
          <TouchableOpacity onPress={openStore} activeOpacity={0.72} style={styles.actionRow}>
            <Store size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
            <Text style={styles.actionText}>{t('producer.dashboard.partnerOrders.openStore')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openMessages} activeOpacity={0.72} style={styles.actionRow}>
            <MessageCircle size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
            <Text style={styles.actionText}>{t('producer.dashboard.partnerOrders.messageSupplier')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  empty: {
    fontSize: 13.5,
    color: enterpriseColors.gray600,
    textAlign: 'center',
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
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    paddingBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: enterpriseColors.gray600,
  },
  linesBlock: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  line: {
    fontSize: 13.5,
    color: enterpriseColors.gray900,
    lineHeight: 19,
    marginTop: 4,
  },
  noteBlock: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 14,
    color: enterpriseColors.gray700,
    lineHeight: 20,
  },
  receivedOk: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.primary,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  waiting: {
    fontSize: 13,
    color: '#92400E',
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    lineHeight: 18,
  },
  actions: {
    marginTop: 12,
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    minHeight: 54,
    paddingVertical: 14,
  },
  actionText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: enterpriseColors.gray900,
  },
  markBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
  },
});
