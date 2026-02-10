import { useState, useEffect, useCallback } from 'react';
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
} from '../../../lib/api';
import { syncService } from '../../../lib/sync-service';
import { useSocket } from '../../../hooks/useSocket';

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

  const loadEstates = useCallback(async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(Array.isArray(data) ? data : []);
    } catch {
      setEstates([]);
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
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.27:3000';
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
    await Promise.all([loadEstates(), loadRecentEntries(), loadLiveData()]);
    if (user?.trustScore) setTrustScore(user.trustScore);
  }, [user?.trustScore, loadEstates, loadRecentEntries, loadLiveData]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!connected) loadLiveData();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, connected, loadData, loadLiveData]);

  useEffect(() => {
    if (socketNotifications.length > 0) {
      setNotifications((prev) => {
        const merged: Notification[] = [...(socketNotifications as Notification[]), ...prev];
        const unique = merged.filter((n, i, self) => self.findIndex((t) => t.id === n.id) === i);
        return unique;
      });
      const unread = socketNotifications.filter((n: any) => !(n as any).read).length;
      setUnreadCount((prev) => prev + unread);
      loadLiveData();
    }
  }, [socketNotifications, loadLiveData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadData(), syncService.syncAll()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  return {
    estates,
    trustScore,
    recentEntries,
    activeMissions,
    activeBatches,
    notifications,
    unreadCount,
    financialData,
    refreshing,
    onRefresh,
    loadData,
    loadLiveData,
  };
}
