import { useState, useEffect, useCallback, useMemo } from 'react';
import { ordersAPI, Order } from '../../../lib/api';
import { theme } from '../../../lib/theme';

export type OrderFilterStatus = 'all' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export function useOrdersListData() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<OrderFilterStatus>('all');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const filteredOrders = useMemo(
    () => (filter === 'all' ? orders : orders.filter(o => o.status === filter)),
    [orders, filter]
  );

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'PENDING': return theme.colors.warning;
      case 'CONFIRMED': return theme.colors.accent;
      case 'PREPARING': return theme.colors.primary;
      case 'IN_TRANSIT': return theme.colors.primary;
      case 'DELIVERED': return theme.colors.success || theme.colors.primary;
      case 'CANCELLED': return theme.colors.error;
      default: return theme.colors.text.secondary;
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'PREPARING': return 'Preparing';
      case 'IN_TRANSIT': return 'In Transit';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }, []);

  return {
    orders,
    loading,
    refreshing,
    filter,
    setFilter,
    loadOrders,
    onRefresh,
    filteredOrders,
    getStatusColor,
    getStatusLabel,
  };
}
