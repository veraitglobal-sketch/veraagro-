import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { estatesAPI, Estate } from '../../../lib/api';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';
import { theme } from '../../../lib/theme';

function messageFromApiError(error: unknown): string | undefined {
  const r = (error as { response?: { data?: unknown } })?.response?.data;
  if (!r || typeof r !== 'object' || !('message' in r)) return undefined;
  const m = (r as { message?: string | string[] }).message;
  if (typeof m === 'string') return m;
  if (Array.isArray(m)) return m.join(' ');
  return undefined;
}

export function useEstatesData() {
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEstates = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const data = await estatesAPI.getAll();
        const list = Array.isArray(data) ? data : [];
        setEstates(list);
        await growerOfflineCache.saveEstates(list);
      } catch (error) {
        const cached = await growerOfflineCache.loadEstates();
        setEstates(cached ?? []);
        if (!cached) console.error('Error loading estates:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstates();
  }, [loadEstates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEstates();
    setRefreshing(false);
  }, [loadEstates]);

  const handleDelete = useCallback((estate: Estate) => {
    Alert.alert(
      'Delete Estate',
      `Are you sure you want to delete "${estate.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await estatesAPI.delete(estate.id);
              await loadEstates();
            } catch (error: unknown) {
              const fromApi = messageFromApiError(error);
              const status = (error as { response?: { status?: number } })?.response?.status;
              const msg =
                fromApi ||
                (status === 403
                  ? 'You do not have permission, or this estate still has orders or batches that must be resolved first.'
                  : 'Could not reach the server. Check your connection and try again.');
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  }, [loadEstates]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'CERTIFIED': return theme.colors.primary;
      case 'ACTIVE': return theme.colors.accent;
      case 'PENDING_SETUP': return theme.colors.warning;
      default: return theme.colors.text.secondary;
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'CERTIFIED': return 'Certified';
      case 'ACTIVE': return 'Active';
      case 'PENDING_SETUP': return 'Pending Setup';
      default: return status;
    }
  }, []);

  return {
    estates,
    loading,
    refreshing,
    loadEstates,
    onRefresh,
    handleDelete,
    getStatusColor,
    getStatusLabel,
  };
}
