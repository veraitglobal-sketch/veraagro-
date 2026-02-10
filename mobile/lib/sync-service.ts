import {
  offlineStorage,
  PendingFieldEntry,
  PendingProduct,
  PendingCost,
} from './offline-storage';
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
   * Get current sync status (field entries + products + costs)
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const [entries, products, costs] = await Promise.all([
        offlineStorage.getPendingEntries(),
        offlineStorage.getPendingProducts(),
        offlineStorage.getPendingCosts(),
      ]);
      const pendingEntries = entries.filter((e) => e.status === 'pending').length;
      const pendingProducts = products.filter((p) => p.status === 'pending').length;
      const pendingCosts = costs.filter((c) => c.status === 'pending').length;
      const pendingCount = pendingEntries + pendingProducts + pendingCosts;

      const statusData = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      const status = statusData ? JSON.parse(statusData) : {};

      return {
        lastSyncTime: status.lastSyncTime || null,
        pendingCount,
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
   * Sync pending products to backend (when endpoint exists)
   */
  async syncPendingProducts(): Promise<{ success: number; failed: number }> {
    const pending = await offlineStorage.getPendingProducts();
    const toSync = pending.filter((p) => p.status === 'pending');
    if (toSync.length === 0) return { success: 0, failed: 0 };

    const token = await AsyncStorage.getItem('auth_token');
    let success = 0;
    let failed = 0;

    for (const product of toSync) {
      try {
        await offlineStorage.updateProductStatus(product.id, 'syncing');
        await syncApi.post(
          '/grower-portal/products',
          {
            source: product.source,
            qrCode: product.qrCode,
            name: product.name,
            contents: product.contents,
            quantity: product.quantity,
            unit: product.unit,
            parcelOrEstate: product.parcelOrEstate,
            timestamp: product.timestamp,
          },
          { headers: { Authorization: token ? `Bearer ${token}` : '' } }
        );
        await offlineStorage.removeProduct(product.id);
        success++;
      } catch (err: any) {
        const isNotImplemented = err.response?.status === 404 || err.response?.status === 501;
        await offlineStorage.updateProductStatus(
          product.id,
          'pending',
          isNotImplemented ? undefined : err.message
        );
        if (!isNotImplemented) failed++;
      }
    }
    return { success, failed };
  },

  /**
   * Sync pending costs to backend (when endpoint exists)
   */
  async syncPendingCosts(): Promise<{ success: number; failed: number }> {
    const pending = await offlineStorage.getPendingCosts();
    const toSync = pending.filter((c) => c.status === 'pending');
    if (toSync.length === 0) return { success: 0, failed: 0 };

    const token = await AsyncStorage.getItem('auth_token');
    let success = 0;
    let failed = 0;

    for (const cost of toSync) {
      try {
        await offlineStorage.updateCostStatus(cost.id, 'syncing');
        await syncApi.post(
          '/grower-portal/costs',
          {
            type: cost.type,
            productId: cost.productId,
            label: cost.label,
            amount: cost.amount,
            currency: cost.currency || 'EUR',
            timestamp: cost.timestamp,
          },
          { headers: { Authorization: token ? `Bearer ${token}` : '' } }
        );
        await offlineStorage.removeCost(cost.id);
        success++;
      } catch (err: any) {
        const isNotImplemented = err.response?.status === 404 || err.response?.status === 501;
        await offlineStorage.updateCostStatus(
          cost.id,
          'pending',
          isNotImplemented ? undefined : err.message
        );
        if (!isNotImplemented) failed++;
      }
    }
    return { success, failed };
  },

  /**
   * Sync all pending data: entries, then products, then costs
   */
  async syncAll(): Promise<{ entries: { success: number; failed: number }; products: { success: number; failed: number }; costs: { success: number; failed: number } }> {
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ syncing: true, lastError: null }));

    const entries = await this.syncPendingEntries();
    const products = await this.syncPendingProducts();
    const costs = await this.syncPendingCosts();

    const totalFailed = entries.failed + products.failed + costs.failed;
    await AsyncStorage.setItem(
      SYNC_STATUS_KEY,
      JSON.stringify({
        syncing: false,
        lastSyncTime: new Date().toISOString(),
        lastError: totalFailed > 0 ? `${totalFailed} stavki nije poslato` : null,
      })
    );

    return { entries, products, costs };
  },

  /**
   * Auto-sync when app comes online
   */
  async startAutoSync(): Promise<void> {
    const autoSyncEnabled = await AsyncStorage.getItem('settings_auto_sync');
    if (autoSyncEnabled === 'false') return;

    try {
      await this.syncAll();
    } catch (error) {
      console.log('Auto-sync failed (offline?):', error);
    }
  },
};
