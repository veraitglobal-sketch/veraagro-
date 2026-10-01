import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { Package, Calendar } from 'lucide-react-native';
import EmptyState from '../../../components/EmptyState';
import { theme } from '../../../lib/theme';
import { growerUi } from '../../../lib/grower-ui';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useOrdersListData } from './useOrdersListData';
import { OrderPackingPanel } from './OrderPackingPanel';
import type { OrderFilterStatus, OrdersView } from './useOrdersListData';

/**
 * Orders list screen (producer): header, filters, list with refresh.
 */
export function OrdersListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useOrdersListData();
  const p = useBioVeraScreenPadding();
  const dateLocale = useAppLocaleTag();

  const filterSpecs = useMemo(
    (): { id: OrderFilterStatus; labelKey: string }[] => [
      { id: 'all', labelKey: 'producer.orders.filterAll' },
      { id: 'PENDING', labelKey: 'producer.orders.statusPending' },
      { id: 'CONFIRMED', labelKey: 'producer.orders.statusConfirmed' },
      { id: 'PREPARING', labelKey: 'producer.orders.statusPreparing' },
      { id: 'IN_TRANSIT', labelKey: 'producer.orders.statusInTransit' },
      { id: 'DELIVERED', labelKey: 'producer.orders.statusDelivered' },
      { id: 'CANCELLED', labelKey: 'producer.orders.statusCancelled' },
    ],
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: enterpriseColors.canvas }}>
      <BioVeraSubpageHeader title={t('navigation.orders')} left="back" />

      <View
        style={{
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingTop: 2,
        paddingBottom: 10,
        backgroundColor: enterpriseColors.canvas,
      }}
      >
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: 8 }}>
          {(['prepare', 'all'] as OrdersView[]).map((v) => (
            <TouchableOpacity
              key={v}
              onPress={() => data.setView(v)}
              style={[growerUi.filterChip, data.view === v && growerUi.filterChipOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: data.view === v }}
            >
              <Text style={[growerUi.filterChipText, data.view === v && growerUi.filterChipTextOn]}>
                {t(v === 'prepare' ? 'producer.ordersPrepare.tabPrepare' : 'producer.ordersPrepare.tabAll')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {data.view === 'all' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {filterSpecs.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => data.setFilter(f.id)}
                style={[growerUi.filterChip, data.filter === f.id && growerUi.filterChipOn]}
              >
                <Text style={[growerUi.filterChipText, data.filter === f.id && growerUi.filterChipTextOn]}>
                  {t(f.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={data.refreshing}
            onRefresh={data.onRefresh}
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
          {data.loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: 14, fontWeight: '400', letterSpacing: 0.3 }}>
                {t('common.loading')}
              </Text>
            </View>
          ) : data.filteredOrders.length === 0 ? (
            <EmptyState
              message={t(data.view === 'prepare' ? 'producer.ordersPrepare.empty' : 'producer.orders.empty')}
              icon={Package}
            />
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {data.filteredOrders.map((order) => {
                const c = data.getStatusColor(order.status);
                return (
                  <View key={order.id} style={[enterpriseUi.inAppPanel, { padding: 14 }]}>
                  <TouchableOpacity
                    onPress={() => router.push(`/(producer)/orders/${order.id}`)}
                    activeOpacity={0.6}
                    accessibilityRole="button"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${c}18`, alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={18} color={c} strokeWidth={1.9} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', letterSpacing: -0.25, color: enterpriseColors.gray900 }} numberOfLines={1}>
                          {order.productName}
                          <Text style={{ fontWeight: '500', color: enterpriseColors.gray600 }}>{`  ${order.quantity} ${order.unit}`}</Text>
                        </Text>
                        <Text style={{ fontSize: 11, color: enterpriseColors.gray600, fontFamily: 'Menlo', marginTop: 2 }} numberOfLines={1}>
                          #{order.orderNumber || order.id.slice(0, 8)}
                        </Text>
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${c}18` }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: c }}>{data.getStatusLabel(order.status)}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: enterpriseColors.gray200 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: enterpriseColors.gray900, fontVariant: ['tabular-nums'] }}>
                        {order.totalAmount.toLocaleString(dateLocale, { style: 'currency', currency: 'EUR' })}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Calendar size={12} color={enterpriseColors.gray600} strokeWidth={1.9} />
                        <Text style={{ fontSize: 12.5, color: enterpriseColors.gray600, fontVariant: ['tabular-nums'] }}>
                          {new Date(order.createdAt).toLocaleDateString(dateLocale)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                    {data.view === 'prepare' ? (
                      <OrderPackingPanel order={order} onSaved={() => void data.loadOrders({ background: true })} />
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
