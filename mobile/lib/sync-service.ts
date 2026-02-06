import { offlineStorage, PendingFieldEntry } from './offline-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// For iOS simulator, use localhost. For physical devices, use the network IP
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // iOS simulator can use localhost
  if (Platform.OS === 'ios' && __DEV__) {
    return 'http://localhost:3000';
  }
  // Default to network IP for physical devices
  return 'http://192.168.178.27:3000';
};

const API_URL = getApiUrl();

// Create API instance for sync
const syncApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const SYNC_STATUS_KEY = 'sync_status';

export interface SyncStatus {
  lastSyncTime: string | null;
  pendingCount: number;
  syncing: boolean;
  lastError: string | null;
}

/**
 * Offline Sync Service
 * Handles syncing pending field entries to backend when online
 */
export const syncService = {
  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const pending = await offlineStorage.getPendingEntries();
      const statusData = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      const status = statusData ? JSON.parse(statusData) : {};

      return {
        lastSyncTime: status.lastSyncTime || null,
        pendingCount: pending.filter(e => e.status === 'pending').length,
        syncing: status.syncing || false,
        lastError: status.lastError || null,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSyncTime: null,
        pendingCount: 0,
        syncing: false,
        lastError: null,
      };
    }
  },

  /**
   * Sync all pending entries to backend
   */
  async syncPendingEntries(): Promise<{ success: number; failed: number }> {
    const pending = await offlineStorage.getPendingEntries();
    const pendingEntries = pending.filter(e => e.status === 'pending');

    if (pendingEntries.length === 0) {
      return { success: 0, failed: 0 };
    }

    // Update sync status
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
      syncing: true,
      lastError: null,
    }));

    let success = 0;
    let failed = 0;

    for (const entry of pendingEntries) {
      try {
        // Mark as syncing
        entry.status = 'syncing';
        await this.updateEntryStatus(entry.id, 'syncing');

        // Map activity type to backend format
        const activityTypeMap: Record<string, string> = {
          'Setva': 'SETVA',
          'Đubrenje': 'PRSKANJE',
          'Prskanje': 'PRSKANJE',
          'Žetva': 'BERBA',
        };

        // Get user's first estate (in production, should be selected by user)
        const { estatesAPI } = await import('./api');
        const estates = await estatesAPI.getAll();
        const estateId = estates[0]?.id;

        if (!estateId) {
          throw new Error('No estate found. Please create an estate first.');
        }

        // Prepare entry data for backend
        const entryData = {
          type: activityTypeMap[entry.activityType] || 'PRSKANJE',
          farmId: estateId,
          fertilizerBarcode: entry.materialID,
          data: {
            date: entry.timestamp,
            location: entry.location,
            notes: `Offline entry synced at ${new Date().toISOString()}`,
          },
          createdAt: entry.timestamp,
        };

        // Get auth token
        const token = await AsyncStorage.getItem('auth_token');

        // Send to backend
        await syncApi.post('/field-entries', entryData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });

        // Mark as synced
        await offlineStorage.removeEntry(entry.id);
        success++;
      } catch (error: any) {
        console.error(`Error syncing entry ${entry.id}:`, error);
        
        // Mark as error
        entry.status = 'error';
        entry.error = error.message || 'Sync failed';
        await this.updateEntryStatus(entry.id, 'error', error.message);
        failed++;
      }
    }

    // Update sync status
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
      syncing: false,
      lastSyncTime: new Date().toISOString(),
      lastError: failed > 0 ? `${failed} entries failed to sync` : null,
    }));

    return { success, failed };
  },

  /**
   * Update entry status in storage
   */
  async updateEntryStatus(id: string, status: PendingFieldEntry['status'], error?: string): Promise<void> {
    try {
      const entries = await offlineStorage.getPendingEntries();
      const entry = entries.find(e => e.id === id);
      if (entry) {
        entry.status = status;
        if (error) {
          entry.error = error;
        }
        await AsyncStorage.setItem('pending_field_entries', JSON.stringify(entries));
      }
    } catch (error) {
      console.error('Error updating entry status:', error);
    }
  },

  /**
   * Auto-sync when app comes online
   */
  async startAutoSync(): Promise<void> {
    // Check if auto-sync is enabled
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const autoSyncEnabled = await AsyncStorage.getItem('settings_auto_sync');
    
    if (autoSyncEnabled === 'false') {
      return; // Auto-sync disabled
    }

    // Check if online
    // In React Native, you can use NetInfo or just try to sync
    try {
      await this.syncPendingEntries();
    } catch (error) {
      // Silently fail - will retry next time
      console.log('Auto-sync failed (offline?):', error);
    }
  },
};
