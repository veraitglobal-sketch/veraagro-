import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
} from '../../../lib/api';
import { syncService } from '../../../lib/sync-service';
import { useSocket } from '../../../hooks/useSocket';
import { API_URL } from '../../../lib/api-url';

export interface FinancialData {
  totalEarned: number;
  pendingBalance: number;
  availableBalance: number;
  nextPayout?: string;
}

export function useDashboardData(user: { id?: string; trustScore?: number; partnerCode?: string } | null) {
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
  const [parcelSteps, setParcelSteps] = useState<{
    loaded: boolean;
    total: number;
    pending: number;
    approved: number;
  }>({ loaded: false, total: 0, pending: 0, approved: 0 });
  const [offlinePending, setOfflinePending] = useState(0);
  const appStateRef = useRef(AppState.currentState);
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncTriggerRef = useRef(0);

  const scheduleOfflineSync = useCallback(() => {
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(async () => {
      syncDebounceRef.current = null;
      const now = Date.now();
      if (now - lastSyncTriggerRef.current < 1500) return;
      lastSyncTriggerRef.current = now;
      try {
        await syncService.startAutoSync();
        const st = await syncService.getSyncStatus();
        setOfflinePending(st.pendingCount || 0);
      } catch {
        // still try to show queue size
        try {
          const st = await syncService.getSyncStatus();
          setOfflinePending(st.pendingCount || 0);
        } catch {
          // ignore
        }
      }
    }, 500);
  }, []);

  const loadEstates = useCallback(async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(Array.isArray(data) ? data : []);
    } catch {
      setEstates([]);
    }
  }, []);

  const loadParcelSteps = useCallback(async () => {
    try {
      const list = await estatesAPI.getAll();
      const estates = Array.isArray(list) ? list : [];
      let total = 0;
      let pending = 0;
      let approved = 0;
      for (const e of estates) {
        const parcels = await parcelsAPI.getByEstate(e.id).catch(() => []);
        for (const p of parcels || []) {
          total += 1;
          if (p.approvedAt) {
            approved += 1;
          } else {
            pending += 1;
          }
        }
      }
      setParcelSteps({ loaded: true, total, pending, approved });
    } catch {
      setParcelSteps({ loaded: true, total: 0, pending: 0, approved: 0 });
    }
  }, []);

  const loadOfflinePending = useCallback(async () => {
    try {
      const st = await syncService.getSyncStatus();
      setOfflinePending(st.pendingCount || 0);
    } catch {
      setOfflinePending(0);
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
      const active = (Array.isArray(missions) ? missions : []).filter(
        (m: any) => m?.status === 'PENDING' || m?.status === 'ASSIGNED' || m?.status === 'IN_TRANSIT'
      );
      setActiveMissions(active);
    } catch {
      setActiveMissions([]);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      const batches = await batchesAPI.getAll();
      const active = (Array.isArray(batches) ? batches : [])
        .filter((b: any) => b?.status === 'PACKED' || b?.status === 'IN_HUB' || b?.status === 'IN_TRANSIT')
        .slice(0, 5);
      setActiveBatches(active);
    } catch {
      setActiveBatches([]);
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

  const loadLiveData = useCallback(async () => {
    try {
      await Promise.all([loadMissions(), loadBatches(), loadNotifications(), loadFinancialData()]);
    } catch (e) {
      console.error('Error loading live data:', e);
    }
  }, [loadMissions, loadBatches, loadNotifications, loadFinancialData]);

  const loadData = useCallback(async () => {
    await Promise.all([
      loadEstates(),
      loadParcelSteps(),
      loadOfflinePending(),
      loadRecentEntries(),
      loadLiveData(),
    ]);
    if (user?.trustScore) setTrustScore(user.trustScore);
  }, [user?.trustScore, loadEstates, loadParcelSteps, loadOfflinePending, loadRecentEntries, loadLiveData]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!connected) loadLiveData();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, connected, loadData, loadLiveData]);

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
    setRefreshing(true);
    try {
      await syncService.syncAll();
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

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
    parcelSteps,
    offlinePending,
    refreshing,
    onRefresh,
    loadData,
    loadLiveData,
  };
}
