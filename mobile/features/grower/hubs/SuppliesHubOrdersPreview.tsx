import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { formatOrderLines } from '../partner-orders/types';
import { orderPartnerLabel, orderStatusTone } from '../partner-orders/partner-order-ui';
import type { PartnerOrder } from '../partner-orders/types';

type Props = {
  loaded: boolean;
  orders: PartnerOrder[];
  totalCount: number;
};

export function SuppliesHubOrdersPreview({ loaded, orders, totalCount }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const dateLocale = useAppLocaleTag();
  const partnerFallback = () => t('producer.dashboard.partnerOrders.partnerFallback');

  const summarizeItems = (items: unknown) => {
    const lines = formatOrderLines(items);
    if (lines.length === 0) return '';
    if (lines.length === 1) return lines[0];
    return t('producer.dashboard.partnerOrders.itemsMore', { first: lines[0], count: lines.length - 1 });
  };

  return (
    <View style={styles.wrap}>
      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.hubs.supplies.sectionOrders')}</Text>

      {!loaded ? (
        <View style={[enterpriseUi.inAppPanel, styles.loading]}>
          <ActivityIndicator color={enterpriseColors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={[enterpriseUi.inAppPanel, styles.empty]}>
          <Package size={26} color={enterpriseColors.gray600} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>{t('producer.dashboard.partnerOrders.emptyOrdersShort')}</Text>
          <Text style={styles.emptyHint}>{t('producer.hubs.supplies.ordersEmptyHint')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/map' as Href)}
            style={styles.emptyCta}
            accessibilityRole="button"
          >
            <Text style={styles.emptyCtaText}>{t('producer.dashboard.suppliersMap')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={enterpriseUi.inAppPanel}>
          {orders.map((o, index) => {
            const tone = orderStatusTone(o.status);
            const statusLabel = t(`supplier.b2bOrderStatus.${o.status}`, { defaultValue: o.status });
            const itemsLine = summarizeItems(o.items);
            const dateStr = new Date(o.createdAt).toLocaleDateString(dateLocale);

            return (
              <TouchableOpacity
                key={o.id}
                onPress={() => router.push(`/(producer)/partner-order/${o.id}` as Href)}
                activeOpacity={0.72}
                style={[styles.orderRow, index < orders.length - 1 && styles.orderRowBorder]}
                accessibilityRole="button"
                accessibilityLabel={orderPartnerLabel(o, partnerFallback())}
              >
                <View style={styles.orderMain}>
                  <Text style={enterpriseUi.navRowTitle} numberOfLines={1}>
                    {orderPartnerLabel(o, partnerFallback())}
                  </Text>
                  {itemsLine ? (
                    <Text style={enterpriseUi.navRowSubtitle} numberOfLines={1}>
                      {itemsLine}
                    </Text>
                  ) : null}
                  <Text style={styles.orderDate}>
                    {dateStr} · #{o.id.slice(0, 8)}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.pillText, { color: tone.text }]}>{statusLabel}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => router.push('/(producer)/partner-orders')}
            style={styles.viewAll}
            accessibilityRole="button"
          >
            <Text style={styles.viewAllText}>
              {totalCount > 1
                ? t('producer.hubs.supplies.viewAllOrdersCount', { count: totalCount })
                : t('producer.hubs.supplies.viewAllOrders')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  loading: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: enterpriseColors.gray600,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: enterpriseColors.primary,
    justifyContent: 'center',
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  orderRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  orderMain: {
    flex: 1,
    minWidth: 0,
  },
  orderDate: {
    marginTop: 4,
    fontSize: 12,
    color: enterpriseColors.gray600,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 110,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewAll: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
});
