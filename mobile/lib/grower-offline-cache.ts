import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Estate, Parcel } from './api';

const ESTATES_KEY = 'grower_cache_estates_v1';
const PARCELS_PREFIX = 'grower_cache_parcels_v1:';
const BATCHES_KEY = 'grower_cache_batches_v1';
const PARCEL_STATS_KEY = 'grower_cache_parcel_stats_v1';
const HARVEST_ANNOUNCEMENTS_KEY = 'grower_cache_harvest_announcements_v1';

export type CachedHarvestAnnouncement = {
  id: string;
  parcelId: string;
  announcementType: string;
  cropType: string;
  estimatedDate: string;
  status: string;
  notes?: string | null;
  createdAt?: string;
  estimatedQuantity?: number | null;
  plantingProgress?: {
    intervalDays: number;
    lastGrowthLogAt: string | null;
    nextDueAt: string;
    isOverdue: boolean;
    daysOverdue: number;
  } | null;
  parcel?: {
    id: string;
    cropType?: string | null;
    calculatedArea?: number;
    estates?: { name: string } | null;
  } | null;
};

export type CachedParcelStats = {
  total: number;
  pending: number;
  approved: number;
};

/**
 * Last-known server data for grower flows when offline (field list, harvest, dashboard).
 */
export const growerOfflineCache = {
  async saveEstates(estates: Estate[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ESTATES_KEY, JSON.stringify(estates));
    } catch {
      // ignore
    }
  },

  async loadEstates(): Promise<Estate[] | null> {
    try {
      const raw = await AsyncStorage.getItem(ESTATES_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  async saveParcels(estateId: string, parcels: Parcel[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`${PARCELS_PREFIX}${estateId}`, JSON.stringify(parcels));
    } catch {
      // ignore
    }
  },

  async loadParcels(estateId: string): Promise<Parcel[] | null> {
    try {
      const raw = await AsyncStorage.getItem(`${PARCELS_PREFIX}${estateId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  async saveBatches(batches: unknown[]): Promise<void> {
    try {
      await AsyncStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
    } catch {
      // ignore
    }
  },

  async saveParcelStats(stats: CachedParcelStats): Promise<void> {
    try {
      await AsyncStorage.setItem(PARCEL_STATS_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }
  },

  async saveHarvestAnnouncements(rows: CachedHarvestAnnouncement[]): Promise<void> {
    try {
      await AsyncStorage.setItem(HARVEST_ANNOUNCEMENTS_KEY, JSON.stringify(rows));
    } catch {
      // ignore
    }
  },

  async loadHarvestAnnouncements(): Promise<CachedHarvestAnnouncement[] | null> {
    try {
      const raw = await AsyncStorage.getItem(HARVEST_ANNOUNCEMENTS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  async loadParcelStats(): Promise<CachedParcelStats | null> {
    try {
      const raw = await AsyncStorage.getItem(PARCEL_STATS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedParcelStats;
      if (
        typeof parsed?.total === 'number' &&
        typeof parsed?.pending === 'number' &&
        typeof parsed?.approved === 'number'
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  async loadBatches<T = unknown>(): Promise<T[] | null> {
    try {
      const raw = await AsyncStorage.getItem(BATCHES_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
};
