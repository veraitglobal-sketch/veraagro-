import { useState, useEffect, useCallback } from 'react';
import { TFunction } from 'i18next';
import { ordersAPI, Order } from '../../../lib/api';
import { colors } from '../../../lib/colors';

const ORDER_STATUS_KEYS: Record<string, string> = {
  PENDING: 'statusPending',
  CONFIRMED: 'statusConfirmed',
  PREPARING: 'statusPreparing',
  IN_TRANSIT: 'statusInTransit',
  DELIVERED: 'statusDelivered',
  CANCELLED: 'statusCancelled',
};

export function useOrderDetailData(orderId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await ordersAPI.getOne(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId, loadOrder]);

  return { order, loading, onRefresh: loadOrder };
}

export function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'PENDING': return colors.warning;
    case 'CONFIRMED': return colors.accent;
    case 'PREPARING': return colors.primary;
    case 'IN_TRANSIT': return colors.primary;
    case 'DELIVERED': return colors.success || colors.primary;
    case 'CANCELLED': return colors.error;
    default: return colors.text.secondary;
  }
}

export function getOrderStatusLabel(status: string, t: TFunction): string {
  const key = ORDER_STATUS_KEYS[status];
  return key ? t(`producer.orders.${key}`) : status;
}
