import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ordersAPI, Order } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { tBuyerOrderStatus } from '../../../lib/buyer-order-status';
import { bioVeraScrollProps, TAB_SCROLL_PADDING_BOTTOM } from '../../../lib/scroll-view-props';
import { ArrowRight, Package } from 'lucide-react-native';
import EmptyState from '../../../components/EmptyState';

/**
 * Buyer Orders Screen
 * Order history for customers
 */
export default function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useBioVeraScreenPadding();
  const priceLocale = useAppLocaleTag();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fmtDate = (iso: string | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString(priceLocale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';

  const fetchOrders = useCallback(async () => {
    const data = await ordersAPI.getAll();
    setOrders(data);
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      await fetchOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders]);

  const renderOrder = ({ item: order }: { item: Order }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(buyer)/order/${order.id}`)}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '400',
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.xs,
          letterSpacing: 0.3,
        }}>
          {order.productName}
        </Text>
        <Text style={{
          fontSize: 14,
          fontWeight: '400',
          color: theme.colors.text.secondary,
          letterSpacing: 0.5,
        }}>
          {order.orderNumber}
          {order.createdAt ? ` · ${fmtDate(order.createdAt)}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: theme.spacing.xs }}>
          <View style={{
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 3,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: `${theme.colors.primary}10`,
          }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text.primary }}>
              {tBuyerOrderStatus(t, order.status)}
            </Text>
          </View>
          <Text style={{
            fontSize: 13,
            fontWeight: '400',
            color: theme.colors.text.primary,
          }}>
            {order.totalAmount.toLocaleString(priceLocale, { style: 'currency', currency: 'EUR' })}
          </Text>
        </View>
      </View>
      <ArrowRight size={18} color={theme.colors.text.secondary} strokeWidth={1} />
    </TouchableOpacity>
  );

  const listEmpty = loading ? (
    <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
      <Text style={{ fontSize: 13, color: theme.colors.text.secondary }}>
        {t('buyer.orders.loading')}
      </Text>
    </View>
  ) : (
    <EmptyState message={t('buyer.orders.empty')} icon={Package} />
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.topInset, backgroundColor: theme.colors.background }}>
      <FlatList
        data={loading ? [] : orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        style={bioVeraScrollProps.style}
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.lg,
          paddingBottom: TAB_SCROLL_PADDING_BOTTOM,
          gap: theme.spacing.md,
        }}
        bounces={bioVeraScrollProps.bounces}
        overScrollMode={bioVeraScrollProps.overScrollMode}
        showsVerticalScrollIndicator={bioVeraScrollProps.showsVerticalScrollIndicator}
        ListHeaderComponent={
          <Text style={{
            fontSize: 18,
            fontWeight: '400',
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
            letterSpacing: 1,
          }}>
            {t('buyer.orders.title')}
          </Text>
        }
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressViewOffset={10}
          />
        }
      />
    </View>
  );
}
