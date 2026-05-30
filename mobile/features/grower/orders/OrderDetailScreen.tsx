import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { order, loading, onRefresh } = useOrderDetailData(orderId);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch {
      Alert.alert(t('common.error'), t('common.tryAgain'));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !order) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>{t('producer.orders.loading')}</Text>
      </View>
    );
  }
  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>{t('producer.orders.notFound')}</Text>
      </View>
    );
  }

  const orderAny = order as Order & { buyer?: any; buyerInfo?: any; paymentStatus?: string };
  const buyerInfo = orderAny.buyer || orderAny.buyerInfo || null;
  const paymentStatus = orderAny.paymentStatus || 'PENDING';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <OrderDetailHeader />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
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
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
                borderWidth: 0.5,
                borderColor: theme.colors.border,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '400', color: theme.colors.text.primary, marginBottom: theme.spacing.sm, letterSpacing: 0.3 }}>
                {t('producer.orders.deliveryNotesHeading')}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>{order.deliveryNotes}</Text>
            </View>
          )}
          <OrderTimelineBlock order={order} />
        </View>
      </ScrollView>
    </View>
  );
}
