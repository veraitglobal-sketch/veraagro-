import { useState, useEffect, useCallback } from 'react';
import { ordersAPI, Order } from '../../../lib/api';
import { colors } from '../../../lib/colors';

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

export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return 'Na čekanju';
    case 'CONFIRMED': return 'Potvrđeno';
    case 'PREPARING': return 'Priprema';
    case 'IN_TRANSIT': return 'U transportu';
    case 'DELIVERED': return 'Isporučeno';
    case 'CANCELLED': return 'Otkazano';
    default: return status;
  }
}
