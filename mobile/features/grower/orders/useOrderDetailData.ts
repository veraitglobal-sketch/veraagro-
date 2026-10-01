import { orderStatusLabel } from '../../../lib/shared-labels';
import { useState, useEffect, useCallback } from 'react';
import { TFunction } from 'i18next';
import { ordersAPI, Order } from '../../../lib/api';
import { theme } from '../../../lib/theme';

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
    case 'PENDING': return theme.colors.warning;
    case 'CONFIRMED': return theme.colors.accent;
    case 'PREPARING': return theme.colors.primary;
    case 'IN_TRANSIT': return theme.colors.primary;
    case 'DELIVERED': return theme.colors.success || theme.colors.primary;
    case 'CANCELLED': return theme.colors.error;
    default: return theme.colors.text.secondary;
  }
}

export function getOrderStatusLabel(status: string, t: TFunction): string {
  const key = ORDER_STATUS_KEYS[status];
  // Statuses without a producer-specific word (PAID, APPROVED, PICKED_UP, …) use the shared glossary like web.
  return key ? t(`producer.orders.${key}`) : orderStatusLabel((k, o) => String(t(k, o as never)), status, 'buyer');
}
