import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ordersAPI, Order } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { enterpriseOrderStatusColor } from '../../../lib/enterprise-ui';
import { getOrderStatusLabel } from './useOrderDetailData';

export type OrderFilterStatus = 'all' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export function useOrdersListData() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<OrderFilterStatus>('all');

  const loadOrders = useCallback(async (opts?: { background?: boolean }) => {
    const background = opts?.background === true;
    if (!background) setLoading(true);
    try {
      const data = await ordersAPI.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders({ background: true });
    setRefreshing(false);
  }, [loadOrders]);

  const filteredOrders = useMemo(
    () => (filter === 'all' ? orders : orders.filter(o => o.status === filter)),
    [orders, filter]
  );

  const getStatusColor = useCallback((status: string) => enterpriseOrderStatusColor(status), []);

  const getStatusLabel = useCallback((status: string) => getOrderStatusLabel(status, t), [t]);

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
