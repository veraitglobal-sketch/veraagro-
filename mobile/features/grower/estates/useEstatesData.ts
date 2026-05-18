import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasCacheRef = useRef(false);

  const loadEstates = useCallback(async (options?: { isPullRefresh?: boolean }) => {
    const showBlockingLoader = !options?.isPullRefresh && !hasCacheRef.current;
    try {
      if (showBlockingLoader) {
        setLoading(true);
      }
      try {
        const data = await estatesAPI.getAll();
        const list = Array.isArray(data) ? data : [];
        setEstates(list);
        await growerOfflineCache.saveEstates(list);
        hasCacheRef.current = true;
      } catch (error) {
        const cached = await growerOfflineCache.loadEstates();
        setEstates(cached ?? []);
        if (cached !== null) hasCacheRef.current = true;
        if (cached === null) console.error('Error loading estates:', error);
        if (options?.isPullRefresh) {
          Alert.alert(t('producer.estates.loadFailed'), t('producer.estatesUi.errNetwork'));
        }
      }
    } finally {
      if (showBlockingLoader) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cached = await growerOfflineCache.loadEstates();
      if (cancelled) return;
      if (cached !== null) {
        setEstates(cached);
        hasCacheRef.current = true;
      }
      await loadEstates();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadEstates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEstates({ isPullRefresh: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadEstates]);

  const handleDelete = useCallback((estate: Estate) => {
    Alert.alert(
      t('producer.estatesUi.deleteTitle'),
      t('producer.estatesUi.deleteMessage', { name: estate.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('producer.estatesUi.delete'),
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
                  ? t('producer.estatesUi.err403')
                  : t('producer.estatesUi.errNetwork'));
              Alert.alert(t('error'), msg);
            }
          },
        },
      ]
    );
  }, [loadEstates, t]);

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
      case 'CERTIFIED': return t('producer.estatesUi.statusCertified');
      case 'ACTIVE': return t('producer.estatesUi.statusActive');
      case 'PENDING_SETUP': return t('producer.estatesUi.statusPendingSetup');
      default: return status;
    }
  }, [t]);

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
