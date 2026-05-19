import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  estatesAPI,
  Estate,
  fieldEntriesAPI,
  FieldEntry,
  missionsAPI,
  Mission,
  batchesAPI,
  notificationsAPI,
  Notification,
  parcelsAPI,
  harvestAnnouncementsAPI,
} from '../../../lib/api';
import { syncService } from '../../../lib/sync-service';
import { useSocket } from '../../../hooks/useSocket';
import { API_URL } from '../../../lib/api-url';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';
import { fetchGrowerOrdersFinancial, type OrdersFinancialSnapshot } from './fetchGrowerOrdersFinancial';

export interface FinancialData {
  totalEarned: number;
  pendingBalance: number;
  availableBalance: number;
  nextPayout?: string;
}

export function useDashboardData(user: { id?: string; trustScore?: number; partnerCode?: string } | null) {
  const { t } = useTranslation();
  const { connected, notifications: socketNotifications } = useSocket();
  const [estates, setEstates] = useState<Estate[]>([]);
  const [trustScore, setTrustScore] = useState(75);
  const [recentEntries, setRecentEntries] = useState<FieldEntry[]>([]);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [ordersFinancial, setOrdersFinancial] = useState<OrdersFinancialSnapshot | null>(null);
  const [parcelSteps, setParcelSteps] = useState<{
    loaded: boolean;
    total: number;
    pending: number;
    approved: number;
  }>({ loaded: false, total: 0, pending: 0, approved: 0 });
  const [offlinePending, setOfflinePending] = useState(0);
  const [legacyFieldLogPending, setLegacyFieldLogPending] = useState(0);
  const [offlineSyncing, setOfflineSyncing] = useState(false);
  const [offlineSyncLastError, setOfflineSyncLastError] = useState<string | null>(null);
  const [batchesReadyForTransport, setBatchesReadyForTransport] = useState(0);
  const [batchTotalCount, setBatchTotalCount] = useState(0);
  const [harvestPlanCount, setHarvestPlanCount] = useState(0);
  const [hasTransportRecord, setHasTransportRecord] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncTriggerRef = useRef(0);
  const cacheHydratedRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const refreshInFlightRef = useRef(false);
  const loadDataRef = useRef<() => Promise<void>>(async () => {});
  const loadLiveDataRef = useRef<() => Promise<void>>(async () => {});

  /** Hydrate from disk before first paint when possible — avoids home layout pop-in. */
  useLayoutEffect(() => {
    if (cacheHydratedRef.current) return;
    cacheHydratedRef.current = true;
    void (async () => {
      const [cachedEstates, cachedParcelStats] = await Promise.all([
        growerOfflineCache.loadEstates(),
        growerOfflineCache.loadParcelStats(),
      ]);
      if (cachedEstates?.length) {
        setEstates(cachedEstates);
      }
      if (cachedParcelStats) {
        setParcelSteps({
          loaded: true,
          total: cachedParcelStats.total,
          pending: cachedParcelStats.pending,
          approved: cachedParcelStats.approved,
        });
      }
    })();
  }, []);

  const scheduleOfflineSync = useCallback(() => {
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(async () => {
      syncDebounceRef.current = null;
      const now = Date.now();
      if (now - lastSyncTriggerRef.current < 45_000) return;
      lastSyncTriggerRef.current = now;
      try {
        await syncService.startAutoSync();
        const st = await syncService.getSyncStatus();
        setOfflinePending(st.pendingCount || 0);
        setOfflineSyncing(Boolean(st.syncing));
        setOfflineSyncLastError(st.lastError ?? null);
      } catch {
        // still try to show queue size
        try {
          const st = await syncService.getSyncStatus();
          setOfflinePending(st.pendingCount || 0);
          setOfflineSyncing(Boolean(st.syncing));
          setOfflineSyncLastError(st.lastError ?? null);
        } catch {
          // ignore
        }
      }
    }, 2000);
  }, []);

  const loadEstates = useCallback(async (): Promise<Estate[]> => {
    try {
      const data = await estatesAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setEstates(list);
      await growerOfflineCache.saveEstates(list);
      return list;
    } catch {
      const cached = await growerOfflineCache.loadEstates();
      const list = cached ?? [];
      setEstates(list);
      return list;
    }
  }, []);

  const loadParcelSteps = useCallback(async (estateList?: Estate[]) => {
    try {
      let rows: Estate[];
      if (estateList !== undefined) {
        rows = estateList;
      } else {
        const list = await estatesAPI.getAll();
        rows = Array.isArray(list) ? list : [];
      }
      const parcelGroups = await Promise.all(
        rows.map((e) => parcelsAPI.getByEstate(e.id).catch(() => [] as Awaited<ReturnType<typeof parcelsAPI.getByEstate>>)),
      );
      let total = 0;
      let pending = 0;
      let approved = 0;
      for (const parcels of parcelGroups) {
        for (const parcel of parcels || []) {
          total += 1;
          if (parcel.approvedAt) approved += 1;
          else pending += 1;
        }
      }
      setParcelSteps({ loaded: true, total, pending, approved });
      await growerOfflineCache.saveParcelStats({ total, pending, approved });
    } catch {
      setParcelSteps((prev) =>
        prev.loaded ? prev : { loaded: true, total: 0, pending: 0, approved: 0 },
      );
    }
  }, []);

  const loadOfflinePending = useCallback(async () => {
    try {
      const st = await syncService.getSyncStatus();
      setOfflinePending(st.pendingCount || 0);
      setLegacyFieldLogPending(st.legacyFieldLogCount || 0);
      setOfflineSyncing(Boolean(st.syncing));
      setOfflineSyncLastError(st.lastError ?? null);
    } catch {
      setOfflinePending(0);
      setLegacyFieldLogPending(0);
      setOfflineSyncing(false);
      setOfflineSyncLastError(null);
    }
  }, []);

  const loadRecentEntries = useCallback(async () => {
    try {
      const entries = await fieldEntriesAPI.getAll();
      const sorted = (Array.isArray(entries) ? entries : [])
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentEntries(sorted);
    } catch {
      setRecentEntries([]);
    }
  }, []);

  const loadMissions = useCallback(async () => {
    try {
      const missions = await missionsAPI.getAll();
      const list = Array.isArray(missions) ? missions : [];
      const active = list.filter((m: any) => {
        const s = String(m?.status || '').toUpperCase().replace(/\s+/g, '_');
        return (
          s === 'PENDING' ||
          s === 'PENDING_VERIFICATION' ||
          s === 'ASSIGNED' ||
          s === 'ACCEPTED' ||
          s === 'IN_PROGRESS' ||
          s === 'READY_FOR_LOADING' ||
          s === 'PICKED_UP' ||
          s === 'IN_TRANSIT'
        );
      });
      setActiveMissions(active);
      setHasTransportRecord(
        list.some((m: any) => String(m?.status || '').toUpperCase().replace(/\s+/g, '_') !== 'CANCELLED'),
      );
    } catch {
      setActiveMissions([]);
      setHasTransportRecord(false);
    }
  }, []);

  const loadHarvestPlans = useCallback(async () => {
    try {
      const raw = await harvestAnnouncementsAPI.getMy();
      setHarvestPlanCount(Array.isArray(raw) ? raw.length : 0);
    } catch {
      setHarvestPlanCount(0);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      const batches = await batchesAPI.getAll();
      const arr = Array.isArray(batches) ? batches : [];
      await growerOfflineCache.saveBatches(arr);
      setBatchTotalCount(arr.length);
      setBatchesReadyForTransport(
        arr.filter((b: any) => b?.status === 'PACKED' || b?.status === 'QUALITY_VERIFIED').length
      );
      const active = arr
        .filter((b: any) => b?.status === 'PACKED' || b?.status === 'IN_HUB' || b?.status === 'IN_TRANSIT')
        .slice(0, 5);
      setActiveBatches(active);
    } catch {
      const cached = await growerOfflineCache.loadBatches();
      const arr = cached ?? [];
      setBatchTotalCount(arr.length);
      setBatchesReadyForTransport(
        arr.filter((b: any) => b?.status === 'PACKED' || b?.status === 'QUALITY_VERIFIED').length
      );
      const active = arr
        .filter((b: any) => b?.status === 'PACKED' || b?.status === 'IN_HUB' || b?.status === 'IN_TRANSIT')
        .slice(0, 5);
      setActiveBatches(active);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await notificationsAPI.getAll();
      const list = Array.isArray(notifs) ? notifs : [];
      setNotifications(list);
      const unread = list.filter((n: any) => !n?.read && !n?.readAt).length;
      setUnreadCount(unread);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  const loadFinancialData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;
      const response = await fetch(`${API_URL}/wallets/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const wallet = await response.json();
        setFinancialData({
          totalEarned: wallet.totalEarned || 0,
          pendingBalance: wallet.pendingBalance || 0,
          availableBalance: wallet.availableBalance || 0,
          nextPayout: wallet.nextPayoutDate,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const loadOrdersFinancial = useCallback(async () => {
    try {
      const snap = await fetchGrowerOrdersFinancial();
      setOrdersFinancial(snap);
    } catch {
      setOrdersFinancial(null);
    }
  }, []);

  const loadLiveData = useCallback(async () => {
    try {
      await Promise.all([
        loadMissions(),
        loadBatches(),
        loadNotifications(),
        loadFinancialData(),
        loadOrdersFinancial(),
        loadHarvestPlans(),
      ]);
    } catch (e) {
      console.error('Error loading live data:', e);
    }
  }, [loadMissions, loadBatches, loadNotifications, loadFinancialData, loadOrdersFinancial, loadHarvestPlans]);

  const loadData = useCallback(async () => {
    const estateList = await loadEstates();
    await Promise.all([
      loadParcelSteps(estateList),
      loadOfflinePending(),
      loadRecentEntries(),
      loadLiveData(),
    ]);
    if (user?.trustScore) setTrustScore(user.trustScore);
    initialLoadDoneRef.current = true;
  }, [user?.trustScore, loadEstates, loadParcelSteps, loadOfflinePending, loadRecentEntries, loadLiveData]);

  loadDataRef.current = loadData;
  loadLiveDataRef.current = loadLiveData;

  const userId = user?.id;

  /** Initial load once per user — not on every socket reconnect. */
  useEffect(() => {
    if (!userId) return;
    initialLoadDoneRef.current = false;
    void loadDataRef.current();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      if (!connected) void loadLiveDataRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId, connected]);

  /** When back online, refresh live slices only (missions, batches, wallet) — keep cached estates. */
  useEffect(() => {
    if (!userId || !connected || !initialLoadDoneRef.current) return;
    void loadLiveDataRef.current();
  }, [userId, connected]);

  // After transport reconnects (Socket.io), run the same auto-sync as settings allow
  useEffect(() => {
    if (!connected) return;
    scheduleOfflineSync();
  }, [connected, scheduleOfflineSync]);

  // When user brings the app to foreground, retry sending the offline queue
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current?.match(/inactive|background/) && next === 'active') {
        scheduleOfflineSync();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [scheduleOfflineSync]);

  useEffect(() => {
    if (socketNotifications.length > 0) {
      setNotifications((prev) => {
        const merged: Notification[] = [...(socketNotifications as Notification[]), ...prev];
        const unique = merged.filter((n, i, self) => self.findIndex((t) => t.id === n.id) === i);
        return unique;
      });
      const unread = socketNotifications.filter((n) => n.read !== true).length;
      setUnreadCount((prev) => prev + unread);
      loadLiveData();
    }
  }, [socketNotifications, loadLiveData]);

  const onRefresh = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setRefreshing(true);
    setOfflineSyncing(true);
    const clearStuckRefresh = setTimeout(() => {
      setRefreshing(false);
      setOfflineSyncing(false);
      refreshInFlightRef.current = false;
    }, 45_000);
    try {
      await syncService.syncAll();
      await loadData();
    } finally {
      clearTimeout(clearStuckRefresh);
      setRefreshing(false);
      setOfflineSyncing(false);
      refreshInFlightRef.current = false;
      await loadOfflinePending();
    }
  }, [loadData, loadOfflinePending]);

  const onPurgeLegacyFieldLog = useCallback(() => {
    if (legacyFieldLogPending === 0) return;
    Alert.alert(
      t('producer.fieldLogForm.discardAllTitle'),
      t('producer.sync.legacyBanner', { count: legacyFieldLogPending }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('producer.sync.purgeLegacyOnly'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const n = await syncService.purgeLegacyFieldLogOnly();
              await loadOfflinePending();
              Alert.alert(
                t('alerts.success'),
                t('producer.sync.clearLocalQueueDone', { count: n }),
              );
            })();
          },
        },
      ],
    );
  }, [legacyFieldLogPending, t, loadOfflinePending]);

  const onClearLocalQueue = useCallback(() => {
    if (offlinePending === 0 && legacyFieldLogPending === 0 && !offlineSyncLastError) return;
    Alert.alert(
      t('producer.sync.clearLocalQueueTitle'),
      t('producer.sync.clearLocalQueueBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('producer.sync.clearLocalQueue'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const { totalRemoved } = await syncService.purgeAllLocalQueues();
              setOfflinePending(0);
              setLegacyFieldLogPending(0);
              setOfflineSyncLastError(null);
              setOfflineSyncing(false);
              Alert.alert(
                t('alerts.success'),
                t('producer.sync.clearLocalQueueDone', { count: totalRemoved }),
              );
            })();
          },
        },
      ],
    );
  }, [offlinePending, offlineSyncLastError, t]);

  return {
    connected,
    estates,
    trustScore,
    recentEntries,
    activeMissions,
    activeBatches,
    notifications,
    unreadCount,
    financialData,
    ordersFinancial,
    parcelSteps,
    offlinePending,
    legacyFieldLogPending,
    offlineSyncing,
    offlineSyncLastError,
    refreshing,
    onRefresh,
    onClearLocalQueue,
    onPurgeLegacyFieldLog,
    loadData,
    loadLiveData,
    batchesReadyForTransport,
    batchTotalCount,
    harvestPlanCount,
    hasTransportRecord,
  };
}
