import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Estate, Parcel } from './api';

const ESTATES_KEY = 'grower_cache_estates_v1';
const PARCELS_PREFIX = 'grower_cache_parcels_v1:';
const BATCHES_KEY = 'grower_cache_batches_v1';

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
