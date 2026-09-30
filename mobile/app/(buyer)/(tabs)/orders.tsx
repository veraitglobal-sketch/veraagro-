import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ordersAPI, Order } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { tBuyerOrderStatus } from '../../../lib/buyer-order-status';
import { buyerOrderNextStep } from '../../../lib/buyer-order-next-step';
import { apiErrorMessage } from '../../../lib/api-error';
import { bioVeraScrollProps, TAB_SCROLL_PADDING_BOTTOM } from '../../../lib/scroll-view-props';
import { Package } from 'lucide-react-native';
import EmptyState from '../../../components/EmptyState';
import { EnterpriseButton } from '../../../design-system/EnterpriseButton';

type Filter = 'all' | 'active' | 'action' | 'closed';
const closed = (order: Order) => ['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status);

export default function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useBioVeraScreenPadding();
  const locale = useAppLocaleTag();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const generation = useRef(0);
  const load = useCallback(async (refresh = false) => {
    const current = ++generation.current;
    setError('');
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await ordersAPI.getAll();
      if (current === generation.current) setOrders(data);
    } catch (e) {
      if (current === generation.current) setError(apiErrorMessage(e, t('buyerOrderActions.loadFailed')));
    } finally {
      if (current === generation.current) { setLoading(false); setRefreshing(false); }
    }
  }, [t]);
  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));

  const matchesFilter = (order: Order) => filter === 'all' || filter === 'active' && !closed(order) || filter === 'closed' && closed(order) || filter === 'action' && buyerOrderNextStep(order).needsAction;
  const visible = orders.filter(order => matchesFilter(order) && `${order.orderNumber} ${order.productName}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const renderOrder = ({ item: order }: { item: Order }) => {
    const next = buyerOrderNextStep(order);
    return <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', gap: 10 }}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('buyerOrderActions.openOrder', { number: order.orderNumber })} onPress={() => router.push({ pathname: '/(buyer)/order/[id]', params: { id: order.id } })} style={{ gap: 6 }}>
        <Text style={{ fontSize: 16, color: theme.colors.text.primary }}>{order.productName}</Text>
        <Text style={{ color: theme.colors.text.secondary }}>{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString(locale)}</Text>
        <Text>{order.quantity} {order.unit} · {order.totalAmount.toLocaleString(locale, { style: 'currency', currency: 'EUR' })}</Text>
        <Text style={{ color: theme.colors.primary }}>{tBuyerOrderStatus(t, order.status, order)}</Text>
      </TouchableOpacity>
      {order.catalogProductId ? (
        <Text style={{ color: order.catalogReserved ? theme.colors.primary : theme.colors.text.secondary }}>
          {order.catalogReserved
            ? t('orderStock.catalogReservedForYou', {
                defaultValue: 'Reserved for you{{detail}}',
                detail: order.catalogReservedKg ? ` · ${order.catalogReservedKg} ${order.unit ?? 'kg'}` : '',
              })
            : t('orderStock.catalogPending', { defaultValue: 'Marketplace stock reservation pending' })}
        </Text>
      ) : (
        order.stockReservation && (
          <Text style={{ color: theme.colors.text.secondary }}>
            {t(`orderStock.states.${order.stockReservation.status}`)} · {order.stockReservation.quantity}{' '}
            {order.stockReservation.unit}
          </Text>
        )
      )}
      <Text>{t(`buyerOrderActions.hints.${next.kind}`)}</Text>
      {next.deadline && <Text style={{ color: theme.colors.text.secondary }}>{t('deliveryFlow.reportDeadline', { at: new Date(next.deadline).toLocaleString(locale) })}</Text>}
      <EnterpriseButton variant={next.needsAction ? 'primary' : 'secondary'} label={t(`buyerOrderActions.buttons.${next.kind}`)}
        onPress={() => router.push({ pathname: next.destination === 'delivery' ? '/(buyer)/delivery/[id]' : '/(buyer)/order/[id]', params: { id: next.id } })} />
      {next.destination === 'delivery' && <EnterpriseButton variant="ghost" label={t('buyerOrderActions.orderDetails')} onPress={() => router.push({ pathname: '/(buyer)/order/[id]', params: { id: order.id } })} />}
    </View>;
  };
  return <View style={{ flex: 1, paddingTop: insets.topInset, backgroundColor: theme.colors.background }}>
    <FlatList data={visible} keyExtractor={order => order.id} renderItem={renderOrder}
      style={bioVeraScrollProps.style} bounces={bioVeraScrollProps.bounces} overScrollMode={bioVeraScrollProps.overScrollMode}
      showsVerticalScrollIndicator={bioVeraScrollProps.showsVerticalScrollIndicator}
      contentContainerStyle={{ flexGrow: 1, padding: theme.spacing.lg, paddingBottom: TAB_SCROLL_PADDING_BOTTOM, gap: theme.spacing.md }}
      ListHeaderComponent={<View style={{ gap: 12, marginBottom: 12 }}>
        <Text style={{ fontSize: 20, color: theme.colors.text.primary }}>{t('buyer.orders.title')}</Text>
        <TextInput accessibilityLabel={t('buyerOrderActions.search')} placeholder={t('buyerOrderActions.search')} value={search} onChangeText={setSearch}
          style={{ borderWidth: 0.5, borderColor: '#999', borderRadius: 8, padding: 12, color: theme.colors.text.primary }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(['all', 'active', 'action', 'closed'] as const).map(value => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)}
            style={{ padding: 12, borderRadius: 18, backgroundColor: filter === value ? theme.colors.primary : theme.colors.surface }}>
            <Text style={{ color: filter === value ? theme.colors.text.inverse : theme.colors.text.primary }}>{t(`buyerOrderActions.filters.${value}`)}</Text>
          </TouchableOpacity>)}
        </ScrollView>
        {loading && orders.length > 0 && <ActivityIndicator color={theme.colors.primary} />}
        {error ? <View style={{ gap: 8 }}><Text accessibilityRole="alert">{error}</Text>
          {orders.length > 0 && <Text>{t('buyerOrderActions.stale')}</Text>}
          <EnterpriseButton label={t('deliveryFlow.refresh')} variant="secondary" disabled={loading || refreshing} onPress={() => void load(true)} />
        </View> : null}
      </View>}
      ListEmptyComponent={loading ? <ActivityIndicator color={theme.colors.primary} /> : error ? null : <EmptyState message={t(orders.length ? 'buyerOrderActions.noMatches' : 'buyer.orders.empty')} icon={Package} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
    />
  </View>;
}
