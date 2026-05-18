import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { b2bSuppliersAPI } from '../../../lib/api';
import type { PartnerOrder, PartnerThread } from './types';

export function usePartnerOrdersData() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [threads, setThreads] = useState<PartnerThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [o, th] = await Promise.all([
        b2bSuppliersAPI.getMyDirectOrders(),
        b2bSuppliersAPI.getMyThreadsAsFarmer(),
      ]);
      setOrders(o as PartnerOrder[]);
      setThreads(th as PartnerThread[]);
    } catch (e) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e instanceof Error ? e.message : t('producer.dashboard.partnerOrders.loadFailed')),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const markReceived = useCallback(
    async (orderId: string) => {
      setReceivingId(orderId);
      setErr(null);
      try {
        await b2bSuppliersAPI.markOrderReceivedAtFarm(orderId);
        await load();
        return true;
      } catch (e) {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setErr(
          typeof msg === 'string' ? msg : e instanceof Error ? e.message : t('producer.dashboard.partnerOrders.markReceivedFailed'),
        );
        return false;
      } finally {
        setReceivingId(null);
      }
    },
    [load, t],
  );

  const findOrder = useCallback((orderId: string) => orders.find((o) => o.id === orderId), [orders]);

  return {
    orders,
    threads,
    loading,
    refreshing,
    err,
    receivingId,
    load,
    onRefresh,
    markReceived,
    findOrder,
    setErr,
  };
}
