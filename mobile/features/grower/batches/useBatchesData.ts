import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { onBatchListRefreshRequest } from '../../../lib/batch-refresh';
import { batchesAPI } from '../../../lib/api';
import { isLikelyNetworkError } from '../../../lib/api-error';
import { lotsForEstate } from '../../../lib/estate-deletion';
import { theme } from '../../../lib/theme';
import type { LotListItem } from '../../../lib/lot-display';

export type BatchFilter = 'all' | 'packed' | 'inHub' | 'inTransit' | 'delivered';

export type BatchListItem = LotListItem;

export type StatusColors = {
  background: string;
  text: string;
};

function normalizeStatus(status: string | null | undefined): BatchFilter | 'other' {
  const s = String(status ?? '').toUpperCase();
  if (['PACKED', 'QUALITY_VERIFIED', 'HARVESTED'].includes(s)) return 'packed';
  if (s === 'IN_HUB') return 'inHub';
  if (s === 'IN_TRANSIT') return 'inTransit';
  if (['DELIVERED', 'SOLD', 'RETURNED', 'EXPIRED'].includes(s)) return 'delivered';
  return 'other';
}

function matchesFilter(status: string | null | undefined, filter: BatchFilter): boolean {
  if (filter === 'all') return true;
  return normalizeStatus(status) === filter;
}

export function useBatchesData(estateId?: string) {
  const { t } = useTranslation();
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<BatchFilter>('all');
  const hasCacheRef = useRef(false);

  const loadBatches = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true || hasCacheRef.current;
    if (!silent) setLoading(true);
    try {
      const data = await batchesAPI.getAll();
      setLoadError(false);
      setBatches(Array.isArray(data) ? data : []);
      hasCacheRef.current = true;
    } catch (error) {
      setLoadError(true);
      if (!isLikelyNetworkError(error)) {
        console.error('Error loading batches:', error);
      }
      if (!hasCacheRef.current) setBatches([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBatches({ silent: hasCacheRef.current });
    }, [loadBatches]),
  );

  useEffect(() => {
    return onBatchListRefreshRequest(() => {
      void loadBatches();
    });
  }, [loadBatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBatches({ silent: true });
    setRefreshing(false);
  }, [loadBatches]);

  const scopedBatches = useMemo(() => lotsForEstate(batches, estateId), [batches, estateId]);

  const filteredBatches = useMemo(
    () => scopedBatches.filter((b) => matchesFilter(b.status, filter)),
    [scopedBatches, filter],
  );

  const counts = useMemo(() => {
    const c: Record<BatchFilter, number> = {
      all: scopedBatches.length,
      packed: 0,
      inHub: 0,
      inTransit: 0,
      delivered: 0,
    };
    for (const b of scopedBatches) {
      const bucket = normalizeStatus(b.status);
      if (bucket !== 'other') c[bucket] += 1;
    }
    return c;
  }, [scopedBatches]);

  const getStatusLabel = useCallback(
    (status: string | null | undefined): string => {
      const bucket = normalizeStatus(status);
      switch (bucket) {
        case 'packed':
          return t('producer.batches.packed');
        case 'inHub':
          return t('producer.batches.inHub');
        case 'inTransit':
          return t('producer.batches.inTransit');
        case 'delivered':
          return t('producer.batches.delivered');
        default:
          return status ? String(status) : '';
      }
    },
    [t],
  );

  const getStatusColor = useCallback((status: string | null | undefined): StatusColors => {
    const bucket = normalizeStatus(status);
    switch (bucket) {
      case 'packed':
        return { background: theme.colors.primaryLight, text: theme.colors.primary };
      case 'inHub':
        return { background: theme.colors.infoLight, text: theme.colors.info };
      case 'inTransit':
        return { background: theme.colors.warningLight, text: theme.colors.warning };
      case 'delivered':
        return { background: theme.colors.borderLight, text: theme.colors.text.secondary };
      default:
        return { background: theme.colors.borderLight, text: theme.colors.text.secondary };
    }
  }, []);

  return {
    batches: scopedBatches,
    loadError,
    loading,
    refreshing,
    filter,
    setFilter,
    filteredBatches,
    counts,
    onRefresh,
    getStatusLabel,
    getStatusColor,
  };
}
