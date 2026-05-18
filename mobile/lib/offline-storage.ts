import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateHarvestPlanBody } from './api';
import i18n from '../i18n/config';
import { tString } from './i18n-strings';

/** Optional material kind captured with field log (offline row). */
export type FieldLogMaterialKind = 'SEED' | 'FERTILIZER' | 'PESTICIDE';

/** How the material barcode was captured (evidentiranje). */
export type FieldLogMaterialInputMethod = 'label_typed' | 'scanner' | 'catalog';

const PENDING_ENTRIES_KEY = 'pending_field_entries';
const FIELD_LOG_HISTORY_KEY = 'field_log_history_v1';
const FIELD_LOG_HISTORY_MAX = 100;
const PENDING_HARVEST_KEY = 'pending_harvest_plans';
const PENDING_PRODUCTS_KEY = 'pending_products';
const PENDING_COSTS_KEY = 'pending_costs';
const PENDING_CERTIFICATE_PHOTOS_KEY = 'pending_certificate_photos';
const WHITELIST_KEY = 'material_whitelist';

export type FieldActivityType =
  | 'Planting'
  | 'Fertilizing'
  | 'Spraying'
  | 'Harvest'
  | 'TransportCoordination'
  | 'Packaging';

export interface PendingFieldEntry {
  id: string;
  /** Set when saving so sync targets the same estate (avoids 403 if API returns estates in a different order). */
  estateId?: string;
  /** Required for sync to `POST /growth-logs` (digital passport / parcel trail). */
  parcelId?: string;
  harvestAnnouncementId?: string;
  /** Copied at save from the selected plan — used for client checks and sync payload. */
  planAnnouncementType?: string;
  materialKind?: FieldLogMaterialKind;
  /** Free text merged into growth log notes; planting plans require min length server-side. */
  journalNotes?: string;
  /** Required when plan is PLANTING (server-validated). */
  growthStage?: string;
  activityType: FieldActivityType;
  /** Quantity or count entered by user (merged into synced notes). */
  materialQuantity?: string;
  /** Barcode / code of the material. */
  materialID?: string;
  /** Typed from packaging label vs camera scan vs picker from Materijali whitelist. */
  materialInputMethod?: FieldLogMaterialInputMethod;
  /** Display name when `materialInputMethod === 'catalog'`. */
  catalogMaterialName?: string;
  photoUri: string;
  location: {
    lat: number;
    lng: number;
    /** Meters (Expo Location); forwarded to API for boundary tolerance. */
    accuracy?: number;
  };
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'error' | 'unrecoverable';
  error?: string;
}

/** Saved before parcel + crop plan were required — cannot be uploaded; delete locally only. */
export function isLegacyFieldLogEntry(entry: Pick<PendingFieldEntry, 'parcelId' | 'harvestAnnouncementId'>): boolean {
  return !entry.parcelId?.trim() || !entry.harvestAnnouncementId?.trim();
}

/** Stored error text from old app builds (EN/SR) — retry will never succeed. */
export function isLegacyFieldLogErrorMessage(error: string | undefined): boolean {
  if (!error?.trim()) return false;
  const m = error.toLowerCase();
  return (
    m.includes('parcel and crop plan') ||
    m.includes('parcele i plana') ||
    m.includes('parcele i plan useva') ||
    m.includes('saved before parcel') ||
    m.includes('sačuvan pre nego') ||
    m.includes('sačuvan bez parcele') ||
    m.includes('delete the old queue item')
  );
}

export function shouldRemoveLegacyFieldLogRow(entry: PendingFieldEntry): boolean {
  return (
    entry.status === 'unrecoverable' ||
    isLegacyFieldLogEntry(entry) ||
    (entry.status === 'error' && isLegacyFieldLogErrorMessage(entry.error))
  );
}

/** Lightweight local history for Field log (survives sync success; device-only). */
export interface FieldLogHistoryItem {
  id: string;
  timestamp: string;
  activityType: FieldActivityType;
  estateId?: string;
  parcelId?: string;
  harvestAnnouncementId?: string;
  planAnnouncementType?: string;
  journalNotesPreview: string;
  growthStage?: string;
  materialKind?: FieldLogMaterialKind;
  materialID?: string;
  materialQuantity?: string;
  materialInputMethod?: FieldLogMaterialInputMethod;
  catalogMaterialName?: string;
  status: 'pending' | 'syncing' | 'synced' | 'error' | 'unrecoverable';
  error?: string;
}

/** Offline product (QR or manual). */
export interface PendingProduct {
  id: string;
  source: 'qr' | 'manual';
  qrCode?: string;
  name: string;
  contents: string;
  quantity: number;
  unit: string;
  parcelOrEstate?: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'error' | 'skipped';
  error?: string;
}

/** Cost entry in calculator (from product or manual). */
export interface PendingCost {
  id: string;
  type: 'product' | 'manual';
  productId?: string;
  label: string;
  amount: number;
  currency?: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'error' | 'skipped';
  error?: string;
}

/** Certificate photo waiting for upload. */
export interface PendingCertificatePhoto {
  id: string;
  certificateId: string;
  certificateTitle: string;
  photoUri: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'error' | 'skipped';
  error?: string;
}

/** Harvest plan queued when offline; POST /harvest-announcements on sync. */
export interface PendingHarvestPlan {
  id: string;
  payload: CreateHarvestPlanBody;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  error?: string;
}

// Dev whitelist; production loads from server
const MOCK_WHITELIST = [
  'BIO-001-2024',
  'BIO-002-2024',
  'ORG-FERT-001',
  'ORG-SEED-001',
];

const LEGACY_ACTIVITY_TO_EN: Record<string, FieldActivityType> = {
  Setva: 'Planting',
  'Đubrenje': 'Fertilizing',
  Prskanje: 'Spraying',
  Žetva: 'Harvest',
  Planting: 'Planting',
  Fertilizing: 'Fertilizing',
  Spraying: 'Spraying',
  Harvest: 'Harvest',
  TransportCoordination: 'TransportCoordination',
  Packaging: 'Packaging',
};

const KNOWN_ACTIVITIES_SET = new Set<FieldActivityType>([
  'Planting',
  'Fertilizing',
  'Spraying',
  'Harvest',
  'TransportCoordination',
  'Packaging',
]);

function normalizeFieldActivity(raw: string): FieldActivityType {
  const fromLegacy = LEGACY_ACTIVITY_TO_EN[raw];
  if (fromLegacy) return fromLegacy;
  if (KNOWN_ACTIVITIES_SET.has(raw as FieldActivityType)) return raw as FieldActivityType;
  return 'Spraying';
}

export const offlineStorage = {
  // Get all pending entries
  async getPendingEntries(): Promise<PendingFieldEntry[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_ENTRIES_KEY);
      if (!data) return [];
      const parsed: PendingFieldEntry[] = JSON.parse(data);
      let dirty = false;
      const next = parsed.map((e) => {
        const activityType = normalizeFieldActivity(String(e.activityType));
        const row = { ...e, activityType };
        if (
          isLegacyFieldLogEntry(row) &&
          row.status !== 'unrecoverable' &&
          row.status !== 'synced'
        ) {
          dirty = true;
          return {
            ...row,
            status: 'unrecoverable' as const,
            error:
              row.error?.trim() ||
              tString(i18n.t, 'producer.sync.fieldEntryNeedsParcelPlan'),
          };
        }
        return row;
      });
      if (dirty) {
        await AsyncStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(next));
        for (const row of next) {
          if (row.status === 'unrecoverable') {
            await this.patchFieldLogHistory(row.id, {
              status: 'unrecoverable',
              error: row.error,
            });
          }
        }
      }
      return next;
    } catch (error) {
      console.error('Error getting pending entries:', error);
      return [];
    }
  },

  /** Rows that can never upload (missing parcel/plan) — stop auto-sync loops. */
  async countLegacyFieldLogEntries(): Promise<number> {
    const entries = await this.getPendingEntries();
    return entries.filter((e) => shouldRemoveLegacyFieldLogRow(e)).length;
  },

  /** Remove only legacy/unrecoverable field-log rows from this device. */
  /**
   * Drop every local field-log row that can never upload (missing parcel/plan or known legacy error).
   * Called on app start and before sync to stop infinite WARN / 429 loops.
   */
  async reconcileLegacyFieldLogQueue(): Promise<number> {
    const entries = await this.getPendingEntries();
    const legacy = entries.filter((e) => shouldRemoveLegacyFieldLogRow(e));
    if (legacy.length === 0) return 0;
    for (const e of legacy) {
      await this.discardFieldLogQueueItem(e.id);
    }
    return legacy.length;
  },

  async purgeLegacyFieldLogLocal(): Promise<number> {
    const entries = await this.getPendingEntries();
    const legacyIds = new Set(entries.filter((e) => shouldRemoveLegacyFieldLogRow(e)).map((e) => e.id));
    if (legacyIds.size === 0) return 0;

    const kept = entries.filter((e) => !legacyIds.has(e.id));
    await AsyncStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(kept));

    const history = await this.getFieldLogHistory();
    const historyNext = history.filter((h) => !legacyIds.has(h.id));
    await AsyncStorage.setItem(FIELD_LOG_HISTORY_KEY, JSON.stringify(historyNext));

    return legacyIds.size;
  },

  // Save pending entry
  async savePendingEntry(entry: Omit<PendingFieldEntry, 'id' | 'timestamp' | 'status'>): Promise<string> {
    try {
      const entries = await this.getPendingEntries();
      const newEntry: PendingFieldEntry = {
        ...entry,
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      entries.push(newEntry);
      await AsyncStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(entries));
      await this.upsertFieldLogHistoryFromPending(newEntry);
      return newEntry.id;
    } catch (error) {
      console.error('Error saving pending entry:', error);
      throw error;
    }
  },

  // Remove entry after sync
  async removeEntry(id: string): Promise<void> {
    try {
      const entries = await this.getPendingEntries();
      const filtered = entries.filter(e => e.id !== id);
      await AsyncStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing entry:', error);
      throw error;
    }
  },

  /** Drop a queued field-log row and hide it from the pending upload count. */
  async discardFieldLogQueueItem(id: string): Promise<void> {
    await this.removeEntry(id);
    try {
      const list = await this.getFieldLogHistory();
      const next = list.filter((h) => h.id !== id);
      await AsyncStorage.setItem(FIELD_LOG_HISTORY_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Error discarding field log history row:', e);
    }
  },

  /**
   * Remove every unsent field-log row from this phone (queue + local history except “sent”).
   * Use when server will never accept old rows (no parcel/plan, wrong GPS, etc.).
   */
  async purgeUnsentFieldLogLocal(): Promise<{ queueRemoved: number; historyRemoved: number }> {
    const entries = await this.getPendingEntries();
    const queueRemoved = entries.length;
    await AsyncStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify([]));

    const history = await this.getFieldLogHistory();
    const kept = history.filter((h) => h.status === 'synced');
    const historyRemoved = history.length - kept.length;
    await AsyncStorage.setItem(FIELD_LOG_HISTORY_KEY, JSON.stringify(kept));

    return { queueRemoved, historyRemoved };
  },

  async purgeUnsentFieldLogLocalIncludingLegacy(): Promise<number> {
    const legacy = await this.purgeLegacyFieldLogLocal();
    const { queueRemoved, historyRemoved } = await this.purgeUnsentFieldLogLocal();
    return legacy + queueRemoved + historyRemoved;
  },

  /**
   * Clear all local upload queues (field diary, harvest plans, products, costs, cert photos).
   * Does not touch synced server data — only AsyncStorage on this device.
   */
  async purgeAllUnsentLocalQueues(): Promise<{
    fieldLogQueue: number;
    fieldLogHistory: number;
    harvestPlans: number;
    products: number;
    costs: number;
    certificatePhotos: number;
  }> {
    const unsent = (status: string) =>
      status === 'pending' || status === 'error' || status === 'syncing' || status === 'skipped';

    const field = await this.purgeUnsentFieldLogLocal();

    const harvests = await this.getPendingHarvestPlans();
    const harvestKept = harvests.filter((h) => !unsent(h.status));
    const harvestPlans = harvests.length - harvestKept.length;
    await AsyncStorage.setItem(PENDING_HARVEST_KEY, JSON.stringify(harvestKept));

    const products = await this.getPendingProducts();
    const productsKept = products.filter((p) => !unsent(p.status));
    const productsRemoved = products.length - productsKept.length;
    await AsyncStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(productsKept));

    const costs = await this.getPendingCosts();
    const costsKept = costs.filter((c) => !unsent(c.status));
    const costsRemoved = costs.length - costsKept.length;
    await AsyncStorage.setItem(PENDING_COSTS_KEY, JSON.stringify(costsKept));

    const certs = await this.getPendingCertificatePhotos();
    const certsKept = certs.filter((c) => !unsent(c.status));
    const certificatePhotos = certs.length - certsKept.length;
    await AsyncStorage.setItem(PENDING_CERTIFICATE_PHOTOS_KEY, JSON.stringify(certsKept));

    return {
      fieldLogQueue: field.queueRemoved,
      fieldLogHistory: field.historyRemoved,
      harvestPlans,
      products: productsRemoved,
      costs: costsRemoved,
      certificatePhotos,
    };
  },

  async getFieldLogHistory(): Promise<FieldLogHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(FIELD_LOG_HISTORY_KEY);
      if (!data) return [];
      const parsed: FieldLogHistoryItem[] = JSON.parse(data);
      return parsed.map((h) => ({
        ...h,
        activityType: normalizeFieldActivity(String(h.activityType)),
      }));
    } catch (e) {
      console.error('Error reading field log history:', e);
      return [];
    }
  },

  async upsertFieldLogHistoryFromPending(entry: PendingFieldEntry): Promise<void> {
    try {
      const item: FieldLogHistoryItem = {
        id: entry.id,
        timestamp: entry.timestamp,
        activityType: entry.activityType,
        estateId: entry.estateId,
        parcelId: entry.parcelId,
        harvestAnnouncementId: entry.harvestAnnouncementId,
        planAnnouncementType: entry.planAnnouncementType,
        journalNotesPreview: (entry.journalNotes ?? '').slice(0, 240),
        growthStage: entry.growthStage,
        materialKind: entry.materialKind,
        materialQuantity: entry.materialQuantity,
        materialID: entry.materialID,
        materialInputMethod: entry.materialInputMethod,
        catalogMaterialName: entry.catalogMaterialName,
        status: entry.status,
        error: entry.error,
      };
      const prev = await this.getFieldLogHistory();
      const without = prev.filter((h) => h.id !== item.id);
      const next = [item, ...without].slice(0, FIELD_LOG_HISTORY_MAX);
      await AsyncStorage.setItem(FIELD_LOG_HISTORY_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Error writing field log history:', e);
    }
  },

  async patchFieldLogHistory(
    entryId: string,
    patch: Partial<Pick<FieldLogHistoryItem, 'status' | 'error' | 'timestamp'>>,
  ): Promise<void> {
    try {
      const list = await this.getFieldLogHistory();
      const idx = list.findIndex((h) => h.id === entryId);
      if (idx === -1) return;
      list[idx] = { ...list[idx], ...patch };
      await AsyncStorage.setItem(FIELD_LOG_HISTORY_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error patching field log history:', e);
    }
  },

  // Get whitelist
  async getWhitelist(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(WHITELIST_KEY);
      return data ? JSON.parse(data) : MOCK_WHITELIST;
    } catch (error) {
      console.error('Error getting whitelist:', error);
      return MOCK_WHITELIST;
    }
  },

  // Save whitelist
  async saveWhitelist(whitelist: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(WHITELIST_KEY, JSON.stringify(whitelist));
    } catch (error) {
      console.error('Error saving whitelist:', error);
      throw error;
    }
  },

  // --- Pending products (My products) ---
  async getPendingProducts(): Promise<PendingProduct[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending products:', error);
      return [];
    }
  },

  async savePendingProduct(entry: Omit<PendingProduct, 'id' | 'timestamp' | 'status'>): Promise<string> {
    try {
      const list = await this.getPendingProducts();
      const newEntry: PendingProduct = {
        ...entry,
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      list.push(newEntry);
      await AsyncStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(list));
      return newEntry.id;
    } catch (error) {
      console.error('Error saving pending product:', error);
      throw error;
    }
  },

  async removeProduct(id: string): Promise<void> {
    try {
      const list = await this.getPendingProducts();
      const filtered = list.filter((p) => p.id !== id);
      await AsyncStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing product:', error);
      throw error;
    }
  },

  async updateProductStatus(id: string, status: PendingProduct['status'], error?: string): Promise<void> {
    try {
      const list = await this.getPendingProducts();
      const item = list.find((p) => p.id === id);
      if (item) {
        item.status = status;
        if (error) item.error = error;
        await AsyncStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Error updating product status:', e);
    }
  },

  // --- Pending costs (cost calculator) ---
  async getPendingCosts(): Promise<PendingCost[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_COSTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending costs:', error);
      return [];
    }
  },

  async savePendingCost(entry: Omit<PendingCost, 'id' | 'timestamp' | 'status'>): Promise<string> {
    try {
      const list = await this.getPendingCosts();
      const newEntry: PendingCost = {
        ...entry,
        id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      list.push(newEntry);
      await AsyncStorage.setItem(PENDING_COSTS_KEY, JSON.stringify(list));
      return newEntry.id;
    } catch (error) {
      console.error('Error saving pending cost:', error);
      throw error;
    }
  },

  async removeCost(id: string): Promise<void> {
    try {
      const list = await this.getPendingCosts();
      const filtered = list.filter((c) => c.id !== id);
      await AsyncStorage.setItem(PENDING_COSTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing cost:', error);
      throw error;
    }
  },

  async updateCostStatus(id: string, status: PendingCost['status'], error?: string): Promise<void> {
    try {
      const list = await this.getPendingCosts();
      const item = list.find((c) => c.id === id);
      if (item) {
        item.status = status;
        if (error) item.error = error;
        await AsyncStorage.setItem(PENDING_COSTS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Error updating cost status:', e);
    }
  },

  // --- Pending certificate photos (certifications) ---
  async getPendingCertificatePhotos(): Promise<PendingCertificatePhoto[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_CERTIFICATE_PHOTOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending certificate photos:', error);
      return [];
    }
  },

  async savePendingCertificatePhoto(entry: Omit<PendingCertificatePhoto, 'id' | 'timestamp' | 'status'>): Promise<string> {
    try {
      const list = await this.getPendingCertificatePhotos();
      const newEntry: PendingCertificatePhoto = {
        ...entry,
        id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      list.push(newEntry);
      await AsyncStorage.setItem(PENDING_CERTIFICATE_PHOTOS_KEY, JSON.stringify(list));
      return newEntry.id;
    } catch (error) {
      console.error('Error saving pending certificate photo:', error);
      throw error;
    }
  },

  async removeCertificatePhoto(id: string): Promise<void> {
    try {
      const list = await this.getPendingCertificatePhotos();
      const filtered = list.filter((p) => p.id !== id);
      await AsyncStorage.setItem(PENDING_CERTIFICATE_PHOTOS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing certificate photo:', error);
      throw error;
    }
  },

  async updateCertificatePhotoStatus(id: string, status: PendingCertificatePhoto['status'], error?: string): Promise<void> {
    try {
      const list = await this.getPendingCertificatePhotos();
      const item = list.find((p) => p.id === id);
      if (item) {
        item.status = status;
        if (error) item.error = error;
        await AsyncStorage.setItem(PENDING_CERTIFICATE_PHOTOS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Error updating certificate photo status:', e);
    }
  },

  async getPendingHarvestPlans(): Promise<PendingHarvestPlan[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_HARVEST_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async savePendingHarvestPlan(
    entry: Pick<PendingHarvestPlan, 'payload'>,
  ): Promise<string> {
    const list = await this.getPendingHarvestPlans();
    const newEntry: PendingHarvestPlan = {
      ...entry,
      id: `harvest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    list.push(newEntry);
    await AsyncStorage.setItem(PENDING_HARVEST_KEY, JSON.stringify(list));
    return newEntry.id;
  },

  async removeHarvestPlan(id: string): Promise<void> {
    const list = await this.getPendingHarvestPlans();
    await AsyncStorage.setItem(
      PENDING_HARVEST_KEY,
      JSON.stringify(list.filter((h) => h.id !== id)),
    );
  },

  async updateHarvestPlanStatus(
    id: string,
    status: PendingHarvestPlan['status'],
    error?: string,
  ): Promise<void> {
    const list = await this.getPendingHarvestPlans();
    const item = list.find((h) => h.id === id);
    if (item) {
      item.status = status;
      if (error !== undefined) item.error = error;
      await AsyncStorage.setItem(PENDING_HARVEST_KEY, JSON.stringify(list));
    }
  },

  /**
   * Rows left in `syncing` after an app crash never complete; `needsSync` keeps them forever.
   * Reset to `pending` before any outbound sync sweep.
   */
  async resetStuckSyncingQueues(): Promise<void> {
    try {
      const entries = await this.getPendingEntries();
      let dirty = false;
      const entriesNext = entries.map((e) => {
        if (e.status === 'syncing') {
          dirty = true;
          return { ...e, status: 'pending' as const };
        }
        return e;
      });
      if (dirty) await AsyncStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(entriesNext));

      const products = await this.getPendingProducts();
      dirty = false;
      const productsNext = products.map((p) => {
        if (p.status === 'syncing') {
          dirty = true;
          return { ...p, status: 'pending' as const };
        }
        return p;
      });
      if (dirty) await AsyncStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(productsNext));

      const costs = await this.getPendingCosts();
      dirty = false;
      const costsNext = costs.map((c) => {
        if (c.status === 'syncing') {
          dirty = true;
          return { ...c, status: 'pending' as const };
        }
        return c;
      });
      if (dirty) await AsyncStorage.setItem(PENDING_COSTS_KEY, JSON.stringify(costsNext));

      const certs = await this.getPendingCertificatePhotos();
      dirty = false;
      const certsNext = certs.map((c) => {
        if (c.status === 'syncing') {
          dirty = true;
          return { ...c, status: 'pending' as const };
        }
        return c;
      });
      if (dirty) await AsyncStorage.setItem(PENDING_CERTIFICATE_PHOTOS_KEY, JSON.stringify(certsNext));

      const harvests = await this.getPendingHarvestPlans();
      dirty = false;
      const harvestsNext = harvests.map((h) => {
        if (h.status === 'syncing') {
          dirty = true;
          return { ...h, status: 'pending' as const };
        }
        return h;
      });
      if (dirty) await AsyncStorage.setItem(PENDING_HARVEST_KEY, JSON.stringify(harvestsNext));
    } catch (e) {
      console.warn('[offlineStorage] resetStuckSyncingQueues:', e);
    }
  },
};
