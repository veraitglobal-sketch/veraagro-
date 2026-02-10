import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useOrderDetailData } from './useOrderDetailData';
import OrderDetailHeader from './OrderDetailHeader';
import OrderInfoBlock from './OrderInfoBlock';
import OrderLinesBlock from './OrderLinesBlock';
import BuyerBlock from './BuyerBlock';
import DeliveryBlock from './DeliveryBlock';
import PaymentStatusBlock from './PaymentStatusBlock';
import OrderTimelineBlock from './OrderTimelineBlock';
import type { Order } from '../../../lib/api';

interface OrderDetailScreenProps {
  orderId: string | undefined;
}

export default function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { order, loading, onRefresh } = useOrderDetailData(orderId);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  if (loading && !order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>Učitavanje...</Text>
      </View>
    );
  }
  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>Porudžbina nije pronađena</Text>
      </View>
    );
  }

  const orderAny = order as Order & { buyer?: any; buyerInfo?: any; paymentStatus?: string };
  const buyerInfo = orderAny.buyer || orderAny.buyerInfo || null;
  const paymentStatus = orderAny.paymentStatus || 'PENDING';

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <OrderDetailHeader />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={{ padding: theme.spacing.md }}>
          <OrderInfoBlock order={order} />
          <OrderLinesBlock order={order} />
          <BuyerBlock buyer={buyerInfo} />
          <DeliveryBlock order={order} />
          <PaymentStatusBlock paymentStatus={paymentStatus} />
          {order.deliveryNotes && (
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginBottom: theme.spacing.sm, letterSpacing: 0.3 }}>
                Napomene
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>{order.deliveryNotes}</Text>
            </View>
          )}
          <OrderTimelineBlock order={order} />
        </View>
      </ScrollView>
    </View>
  );
}
