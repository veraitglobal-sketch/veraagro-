import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { estateDeletionBlock, estateLotsHref } from '../../../lib/estate-deletion';
import { useTranslation } from 'react-i18next';
import { estatesAPI, Estate } from '../../../lib/api';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';
import { enterpriseEstateStatusColor } from '../../../lib/enterprise-ui';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';

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
  const router = useRouter();
  const { estates: dashboardEstates } = useGrowerDashboard();
  const [estates, setEstates] = useState<Estate[]>(dashboardEstates);
  const [ready, setReady] = useState(dashboardEstates.length > 0);
  const [refreshing, setRefreshing] = useState(false);
  const hasCacheRef = useRef(dashboardEstates.length > 0);

  useEffect(() => {
    if (dashboardEstates.length === 0) return;
    setEstates(dashboardEstates);
    hasCacheRef.current = true;
    setReady(true);
  }, [dashboardEstates]);

  useLayoutEffect(() => {
    if (hasCacheRef.current) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const cached = await growerOfflineCache.loadEstates();
      if (cancelled) return;
      if (cached !== null) {
        setEstates(cached);
        hasCacheRef.current = true;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadEstates = useCallback(
    async (options?: { isPullRefresh?: boolean }) => {
      try {
        const data = await estatesAPI.getAll();
        const list = Array.isArray(data) ? data : [];
        setEstates(list);
        await growerOfflineCache.saveEstates(list);
        hasCacheRef.current = true;
        setReady(true);
      } catch (error) {
        const cached = await growerOfflineCache.loadEstates();
        setEstates(cached ?? []);
        if (cached !== null) hasCacheRef.current = true;
        if (cached === null) console.error('Error loading estates:', error);
        if (options?.isPullRefresh) {
          Alert.alert(t('producer.estates.loadFailed'), t('producer.estatesUi.errNetwork'));
        }
        setReady(true);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!ready) return;
    void loadEstates();
  }, [ready, loadEstates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEstates({ isPullRefresh: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadEstates]);

  const handleDelete = useCallback(
    (estate: Estate) => {
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
                const blocked = estateDeletionBlock(error);
                if (blocked) {
                  Alert.alert(t('estateDeletion.title'), t(`estateDeletion.${blocked}`, { name: estate.name }), [
                    { text: t('common.cancel'), style: 'cancel' },
                    ...(blocked === 'batches' ? [{ text: t('estateDeletion.openLots'), onPress: () => router.push(estateLotsHref(estate)) }] : []),
                  ]);
                  return;
                }
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
        ],
      );
    },
    [loadEstates, t, router],
  );

  const getStatusColor = useCallback((status: string) => enterpriseEstateStatusColor(status), []);

  const getStatusLabel = useCallback(
    (status: string) => {
      switch (status) {
        case 'CERTIFIED':
          return t('producer.estatesUi.statusCertified');
        case 'ACTIVE':
          return t('producer.estatesUi.statusActive');
        case 'PENDING_SETUP':
          return t('producer.estatesUi.statusPendingSetup');
        default:
          return status;
      }
    },
    [t],
  );

  return {
    estates,
    ready,
    refreshing,
    loadEstates,
    onRefresh,
    handleDelete,
    getStatusColor,
    getStatusLabel,
  };
}
