import { productOwnerId } from './offline-storage';
import {
  offlineStorageForOwner, currentStorageOwner,
  PendingFieldEntry,
  isLegacyFieldLogEntry,
  isLegacyFieldLogErrorMessage,
  shouldRemoveLegacyFieldLogRow,
} from './offline-storage';
import DeviceStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './api-url';
import type { Estate } from './api';
import { imageUriToJpegDataUrl, assertDataUrlWithinSize } from './image-data-url';
import { sha256HexFromImageUri } from './image-hash';
import { getOrCreateDeviceId } from './device-id';
import i18n from '../i18n/config';
import { apiErrorMessage, axiosResponseStatus } from './api-error';
import { tString } from './i18n-strings';

// Create API instance for sync
const transportApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const SYNC_STATUS_KEY = 'sync_status';
const MAX_FIELD_LOG_PHOTO_BYTES = 8 * 1024 * 1024;
/** Prevent sync storms (socket reconnect + 30s timer) from hitting API rate limits. */
const SYNC_COOLDOWN_MS = 45_000;
const lastSyncAllAt = new Map<string, number>();
const legacyReconcileDone = new Set<string>();

function buildFieldLogGrowthNotes(entry: PendingFieldEntry): string {
  const lines: string[] = [];
  lines.push(`[Field diary · ${entry.activityType}]`);
  const src = entry.materialInputMethod;
  if (src) {
    lines.push(
      src === 'scanner'
        ? 'Material entry: barcode scan'
        : src === 'label_typed'
          ? 'Material entry: typed from packaging label'
          : 'Material entry: selected from materials list',
    );
  }
  if (entry.catalogMaterialName?.trim()) {
    lines.push(`Listed product: ${entry.catalogMaterialName.trim()}`);
  }
  const mat = entry.materialID?.trim();
  if (mat) {
    const kind = entry.materialKind;
    lines.push(kind ? `${kind}: ${mat}` : `Material: ${mat}`);
  }
  const qty = entry.materialQuantity?.trim();
  if (qty) {
    lines.push(`Quantity / count: ${qty}`);
  }
  const jn = entry.journalNotes?.trim();
  if (jn) lines.push(jn);
  return lines.join('\n');
}

/** Queue items that still need upload (pending, failed retry, or stuck mid-sync after crash). */
function needsSync(status: string | undefined): boolean {
  return status === 'pending' || status === 'error' || status === 'syncing';
}

function isUnrecoverableFieldEntry(entry: PendingFieldEntry): boolean {
  return shouldRemoveLegacyFieldLogRow(entry);
}

async function reconcileLegacyQueueOnce(offlineStorage: ReturnType<typeof offlineStorageForOwner>): Promise<number> {
  const removed = await offlineStorage.reconcileLegacyFieldLogQueue();
  if (removed > 0 && __DEV__) {
    console.log(`[field-entry sync] removed ${removed} legacy local row(s) (missing parcel/plan)`);
  }
  return removed;
}

async function peekFirstRecordedQueueError(offlineStorage: ReturnType<typeof offlineStorageForOwner>): Promise<string | null> {
  try {
    const [entries, products, costs, certPhotos, harvests] = await Promise.all([
      offlineStorage.getPendingEntries(),
      offlineStorage.getPendingProducts(),
      offlineStorage.getPendingCosts(),
      offlineStorage.getPendingCertificatePhotos(),
      offlineStorage.getPendingHarvestPlans(),
    ]);
    for (const e of entries) {
      if (e.error?.trim()) return e.error.trim();
    }
    for (const p of products) {
      if (p.error?.trim()) return p.error.trim();
    }
    for (const c of costs) {
      if (c.error?.trim()) return c.error.trim();
    }
    for (const p of certPhotos) {
      if (p.error?.trim()) return p.error.trim();
    }
    for (const h of harvests) {
      if (h.error?.trim()) return h.error.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

export interface SyncQueueBreakdown {
  fieldLog: number;
  products: number;
  costs: number;
  certificatePhotos: number;
  harvestPlans: number;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  pendingCount: number;
  /** Field diary rows missing parcel/plan — will never upload until deleted locally. */
  legacyFieldLogCount: number;
  breakdown: SyncQueueBreakdown;
  syncing: boolean;
  lastError: string | null;
  /** First concrete API/validation error from any queue (for alerts). */
  firstQueueError: string | null;
}

/**
 * Offline Sync Service
 * Handles syncing pending field entries to backend when online
 */
function syncServiceForSession(owner: string, token: string | null) {
  const offlineStorage = offlineStorageForOwner(owner);
  const AsyncStorage = {
    getItem: (key: string) => DeviceStorage.getItem(key === SYNC_STATUS_KEY ? `${key}:${owner}` : key),
    setItem: (key: string, value: string) => DeviceStorage.setItem(key === SYNC_STATUS_KEY ? `${key}:${owner}` : key, value),
  };
  const assertSession = async () => {
    if (!owner || !token || await currentStorageOwner() !== owner || await DeviceStorage.getItem('auth_token') !== token) {
      throw new Error('Account changed; sync paused.');
    }
  };
  const syncApi = {
    post: async (path: string, body: unknown, _config?: unknown) => {
      await assertSession();
      return transportApi.post(path, body, { headers: { Authorization: `Bearer ${token}` } });
    },
    get: async (path: string) => {
      await assertSession();
      return transportApi.get(path, { headers: { Authorization: `Bearer ${token}` } });
    },
  };
  return {
  /**
   * Get current sync status (field entries + products + costs)
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const [entries, products, costs, certPhotos, harvests] = await Promise.all([
        offlineStorage.getPendingEntries(),
        offlineStorage.getPendingProducts(),
        offlineStorage.getPendingCosts(),
        offlineStorage.getPendingCertificatePhotos(),
        offlineStorage.getPendingHarvestPlans(),
      ]);
      const pendingEntries = entries.filter((e) => needsSync(e.status)).length;
      const pendingProducts = products.filter((p) => needsSync(p.status)).length;
      const pendingCosts = costs.filter((c) => needsSync(c.status)).length;
      const pendingCertPhotos = certPhotos.filter((c) => needsSync(c.status)).length;
      const pendingHarvests = harvests.filter((h) => needsSync(h.status)).length;
      const pendingCount =
        pendingEntries + pendingProducts + pendingCosts + pendingCertPhotos + pendingHarvests;
      const legacyFieldLogCount = await offlineStorage.countLegacyFieldLogEntries();
      const firstQueueError = await peekFirstRecordedQueueError(offlineStorage);

      const statusData = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      const status = statusData ? JSON.parse(statusData) : {};

      return {
        lastSyncTime: status.lastSyncTime || null,
        pendingCount,
        legacyFieldLogCount,
        breakdown: {
          fieldLog: pendingEntries,
          products: pendingProducts,
          costs: pendingCosts,
          certificatePhotos: pendingCertPhotos,
          harvestPlans: pendingHarvests,
        },
        syncing: status.syncing || false,
        lastError: status.lastError || null,
        firstQueueError,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSyncTime: null,
        pendingCount: 0,
        legacyFieldLogCount: 0,
        breakdown: {
          fieldLog: 0,
          products: 0,
          costs: 0,
          certificatePhotos: 0,
          harvestPlans: 0,
        },
        syncing: false,
        lastError: null,
        firstQueueError: null,
      };
    }
  },

  /**
   * Sync all pending entries to backend
   * @param updateGlobalLedger when false (`syncAll` path), avoids writing SYNC_STATUS halfway through a multi-queue flush
   */
  async reconcileLegacyFieldLogQueueOnStartup(): Promise<number> {
    if (legacyReconcileDone.has(owner)) return 0;
    legacyReconcileDone.add(owner);
    return reconcileLegacyQueueOnce(offlineStorage);
  },

  async syncPendingEntries(updateGlobalLedger = true): Promise<{ success: number; failed: number }> {
    await reconcileLegacyQueueOnce(offlineStorage);

    const pending = await offlineStorage.getPendingEntries();
    const pendingEntries = pending.filter(
      (e) => needsSync(e.status) && !isUnrecoverableFieldEntry(e),
    );

    if (pendingEntries.length === 0) {
      return { success: 0, failed: 0 };
    }

    if (updateGlobalLedger) {
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ syncing: true, lastError: null }));
    }

    let success = 0;
    let failed = 0;

    for (const entry of pendingEntries) {
      if (isUnrecoverableFieldEntry(entry)) {
        const msg = tString(i18n.t, 'producer.sync.fieldEntryNeedsParcelPlan');
        entry.status = 'unrecoverable';
        entry.error = msg;
        await offlineStorage.updateEntryStatus(entry.id, 'unrecoverable', msg);
        await offlineStorage.patchFieldLogHistory(entry.id, { status: 'unrecoverable', error: msg });
        continue;
      }

      try {
        // Mark as syncing
        entry.status = 'syncing';
        await offlineStorage.updateEntryStatus(entry.id, 'syncing');
        await offlineStorage.patchFieldLogHistory(entry.id, { status: 'syncing' });

        if (!entry.parcelId?.trim() || !entry.harvestAnnouncementId?.trim()) {
          const msg = tString(i18n.t, 'producer.sync.fieldEntryNeedsParcelPlan');
          entry.status = 'unrecoverable';
          entry.error = msg;
          await offlineStorage.updateEntryStatus(entry.id, 'unrecoverable', msg);
          await offlineStorage.patchFieldLogHistory(entry.id, { status: 'unrecoverable', error: msg });
          continue;
        }

        // Prefer estate recorded at save time; use live list or last cached copy when offline.
        // Keep requests on the captured token, including after slow photo processing.
        const response = await syncApi.get('/estates');
        const list: Estate[] = Array.isArray(response.data) ? response.data : [];
        // Avoid `estateId && find`: empty string `""` would short-circuit to `""` and poison the union type.
        const preferred: Estate | undefined = entry.estateId
          ? list.find((e) => e.id === entry.estateId)
          : undefined;
        const estateId = entry.estateId ? preferred?.id : list[0]?.id;

        if (!estateId) {
          throw new Error('No estate found. Please create an estate first.');
        }

        let imageDataUrl: string;
        try {
          imageDataUrl = await imageUriToJpegDataUrl(entry.photoUri);
          assertDataUrlWithinSize(imageDataUrl, MAX_FIELD_LOG_PHOTO_BYTES);
        } catch (e: unknown) {
          const raw = e instanceof Error ? e.message : '';
          if (raw === 'PHOTO_TOO_LARGE') {
            throw new Error(tString(i18n.t, 'producer.growthJournalAlerts.photoLarge'));
          }
          throw new Error(apiErrorMessage(e, tString(i18n.t, 'producer.fieldLogAlerts.saveFailed')));
        }

        const imageHash = await sha256HexFromImageUri(entry.photoUri);
        const deviceId = await getOrCreateDeviceId();
        const notesMerged = buildFieldLogGrowthNotes(entry).trim();

        const usesMaterial =
          entry.activityType === 'Planting' ||
          entry.activityType === 'Fertilizing' ||
          entry.activityType === 'Spraying';
        const materialBarcode = entry.materialID?.trim() ?? '';
        const materialKind = entry.materialKind;

        await syncApi.post('/growth-logs', {
          estateId,
          parcelId: entry.parcelId.trim(),
          harvestAnnouncementId: entry.harvestAnnouncementId.trim(),
          imageUrl: imageDataUrl,
          imageHash,
          gpsLatitude: entry.location.lat,
          gpsLongitude: entry.location.lng,
          deviceId,
          deviceTimestamp: entry.timestamp,
          notes: notesMerged || undefined,
          growthStage: entry.growthStage?.trim() || undefined,
          ...(usesMaterial && materialBarcode && materialKind
            ? {
                materialBarcode,
                materialKind,
                requiresMaterialBarcode: true,
              }
            : {}),
        });

        await offlineStorage.patchFieldLogHistory(entry.id, { status: 'synced', error: undefined });
        // Mark as synced
        await offlineStorage.removeEntry(entry.id);
        success++;
      } catch (error: unknown) {
        const msg = apiErrorMessage(error, 'Sync failed');
        if (
          isLegacyFieldLogEntry(entry) ||
          isLegacyFieldLogErrorMessage(msg) ||
          isLegacyFieldLogErrorMessage(entry.error)
        ) {
          await offlineStorage.discardFieldLogQueueItem(entry.id);
          continue;
        }
        if (msg.includes('429') || msg.toLowerCase().includes('too many')) {
          entry.status = 'pending';
          await offlineStorage.updateEntryStatus(entry.id, 'pending', msg);
          await offlineStorage.patchFieldLogHistory(entry.id, { status: 'pending', error: msg });
          break;
        }
        console.warn(`[field-entry sync] ${entry.id}: ${msg}`);
        entry.status = 'error';
        entry.error = msg;
        await offlineStorage.updateEntryStatus(entry.id, 'error', msg);
        await offlineStorage.patchFieldLogHistory(entry.id, { status: 'error', error: msg });
        failed++;
      }
    }

    if (updateGlobalLedger) {
      await AsyncStorage.setItem(
        SYNC_STATUS_KEY,
        JSON.stringify({
          syncing: false,
          lastSyncTime: new Date().toISOString(),
          lastError: failed > 0 ? `${failed} entries failed to sync` : null,
        }),
      );
    }

    return { success, failed };
  },

  /**
   * Update entry status in storage
   */
  async updateEntryStatus(id: string, status: PendingFieldEntry['status'], error?: string): Promise<void> {
    try {
      await offlineStorage.updateEntryStatus(id, status, error);
    } catch (error) {
      console.error('Error updating entry status:', error);
    }
  },

  /**
   * Sync pending products to backend (when endpoint exists)
   */
  async syncPendingProducts(): Promise<{ success: number; failed: number }> {
    const token = await AsyncStorage.getItem('auth_token');
    if (!owner || !token) return { success: 0, failed: 0 };
    const pending = await offlineStorage.getPendingProducts(owner);
    const toSync = pending.filter((p) => needsSync(p.status));
    if (toSync.length === 0) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (const product of toSync) {
      if (await productOwnerId() !== owner || await AsyncStorage.getItem('auth_token') !== token) break;
      try {
        await offlineStorage.updateProductStatus(product.id, 'syncing', undefined, owner);
        await syncApi.post(
          '/grower-portal/products',
          {
            clientReference: product.id,
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
        // Keep the acknowledged entry available offline and if the list endpoint is unavailable.
        await offlineStorage.updateProductStatus(product.id, 'synced', undefined, owner);
        success++;
      } catch (err: unknown) {
        const status = axiosResponseStatus(err);
        const isNotImplemented = status === 404 || status === 501;
        if (isNotImplemented) {
          await offlineStorage.updateProductStatus(product.id, 'skipped', 'ENDPOINT_UNAVAILABLE', owner);
        } else {
          await offlineStorage.updateProductStatus(product.id, 'error', apiErrorMessage(err, 'Sync failed'), owner);
          failed++;
        }
      }
    }
    return { success, failed };
  },

  /**
   * Sync pending costs to backend (when endpoint exists)
   */
  async syncPendingCosts(): Promise<{ success: number; failed: number }> {
    const pending = await offlineStorage.getPendingCosts();
    const toSync = pending.filter((c) => needsSync(c.status));
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
            clientReference: cost.id,
            type: cost.type,
            productId: cost.productId,
            label: cost.label,
            amount: cost.amount,
            currency: cost.currency || 'EUR',
            note: cost.note?.trim() || undefined,
            estateId: cost.estateId,
            parcelId: cost.parcelId,
            harvestAnnouncementId: cost.harvestAnnouncementId,
            parcelLabel: cost.parcelLabel,
            plantingLabel: cost.plantingLabel,
            timestamp: cost.timestamp,
          },
          { headers: { Authorization: token ? `Bearer ${token}` : '' } }
        );
        await offlineStorage.updateCostStatus(cost.id, 'synced');
        success++;
      } catch (err: unknown) {
        const status = axiosResponseStatus(err);
        const isNotImplemented = status === 404 || status === 501;
        if (isNotImplemented) {
          await offlineStorage.updateCostStatus(cost.id, 'skipped', 'ENDPOINT_UNAVAILABLE');
        } else {
          await offlineStorage.updateCostStatus(cost.id, 'error', apiErrorMessage(err, 'Sync failed'));
          failed++;
        }
      }
    }
    return { success, failed };
  },

  /**
   * Sync pending certificate photos (when endpoint exists)
   */
  async syncPendingHarvestPlans(): Promise<{ success: number; failed: number }> {
    const pending = await offlineStorage.getPendingHarvestPlans();
    const toSync = pending.filter((h) => needsSync(h.status));
    if (toSync.length === 0) return { success: 0, failed: 0 };

    const token = await AsyncStorage.getItem('auth_token');
    let success = 0;
    let failed = 0;

    for (const h of toSync) {
      try {
        await offlineStorage.updateHarvestPlanStatus(h.id, 'syncing');
        await syncApi.post('/harvest-announcements', h.payload, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        await offlineStorage.removeHarvestPlan(h.id);
        success++;
      } catch (err: unknown) {
        const msg = apiErrorMessage(err, 'Sync failed');
        await offlineStorage.updateHarvestPlanStatus(h.id, 'error', msg);
        failed++;
      }
    }
    return { success, failed };
  },

  async syncPendingCertificatePhotos(): Promise<{ success: number; failed: number }> {
    const pending = await offlineStorage.getPendingCertificatePhotos();
    const toSync = pending.filter((p) => needsSync(p.status));
    if (toSync.length === 0) return { success: 0, failed: 0 };

    const token = await AsyncStorage.getItem('auth_token');
    let success = 0;
    let failed = 0;

    for (const photo of toSync) {
      try {
        await offlineStorage.updateCertificatePhotoStatus(photo.id, 'syncing');
        await syncApi.post(
          '/grower-portal/certificate-photos',
          {
            clientReference: photo.id,
            certificateId: photo.certificateId,
            certificateTitle: photo.certificateTitle,
            photoUri: photo.photoUri,
            timestamp: photo.timestamp,
          },
          { headers: { Authorization: token ? `Bearer ${token}` : '' } }
        );
        await offlineStorage.removeCertificatePhoto(photo.id);
        success++;
      } catch (err: unknown) {
        const status = axiosResponseStatus(err);
        const isNotImplemented = status === 404 || status === 501;
        if (isNotImplemented) {
          await offlineStorage.updateCertificatePhotoStatus(photo.id, 'skipped', 'ENDPOINT_UNAVAILABLE');
        } else {
          await offlineStorage.updateCertificatePhotoStatus(
            photo.id,
            'error',
            apiErrorMessage(err, 'Sync failed'),
          );
          failed++;
        }
      }
    }
    return { success, failed };
  },

  async syncPendingSeedScans(): Promise<{ success: number; failed: number }> {
    const pending = await offlineStorage.getPendingSeedScans();
    const toSync = pending.filter((p) => p.status === 'pending' || p.status === 'error');
    if (toSync.length === 0) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;
    for (const row of toSync) {
      try {
        await syncApi.get(`/seeds/validate/${encodeURIComponent(row.serialInput)}`);
        await offlineStorage.updatePendingSeedScan(row.id, { status: 'synced', error: undefined });
        success++;
      } catch (err: unknown) {
        await offlineStorage.updatePendingSeedScan(row.id, {
          status: 'error',
          error: apiErrorMessage(err, 'Validation failed'),
        });
        failed++;
      }
    }
    return { success, failed };
  },

  async syncPendingPlantingEntries(): Promise<{ success: number; failed: number }> {
    const pending = await offlineStorage.getPendingPlantingEntries();
    let success = 0;
    let failed = 0;
    for (const row of pending.filter((r) => r.status === 'pending' || r.status === 'error')) {
      try {
        await syncApi.post('/field-entries', row.payload);
        await offlineStorage.removePendingPlantingEntry(row.id);
        success++;
      } catch (e: unknown) {
        failed++;
        console.warn('[planting sync]', apiErrorMessage(e, 'failed'));
      }
    }
    return { success, failed };
  },

  /**
   * Sync all pending data: entries, products, costs, certificate photos
   */
  async syncAll(): Promise<{
    entries: { success: number; failed: number };
    products: { success: number; failed: number };
    costs: { success: number; failed: number };
    certificatePhotos: { success: number; failed: number };
    harvestPlans: { success: number; failed: number };
    seedScans: { success: number; failed: number };
  }> {
    const now = Date.now();
    if (now - (lastSyncAllAt.get(owner) ?? 0) < SYNC_COOLDOWN_MS) {
      return {
        entries: { success: 0, failed: 0 },
        products: { success: 0, failed: 0 },
        costs: { success: 0, failed: 0 },
        certificatePhotos: { success: 0, failed: 0 },
        harvestPlans: { success: 0, failed: 0 },
        seedScans: { success: 0, failed: 0 },
      };
    }
    lastSyncAllAt.set(owner, now);

    await reconcileLegacyQueueOnce(offlineStorage);
    await offlineStorage.resetStuckSyncingQueues();
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ syncing: true, lastError: null }));

    let entries = { success: 0, failed: 0 };
    let products = { success: 0, failed: 0 };
    let costs = { success: 0, failed: 0 };
    let certificatePhotos = { success: 0, failed: 0 };
    let harvestPlans = { success: 0, failed: 0 };
    let seedScans = { success: 0, failed: 0 };

    try {
      entries = await this.syncPendingEntries(false);
      await this.syncPendingPlantingEntries();
      products = await this.syncPendingProducts();
      costs = await this.syncPendingCosts();
      certificatePhotos = await this.syncPendingCertificatePhotos();
      harvestPlans = await this.syncPendingHarvestPlans();
      seedScans = await this.syncPendingSeedScans();
    } catch (e: unknown) {
      const msg = apiErrorMessage(e, 'Sync failed');
      await AsyncStorage.setItem(
        SYNC_STATUS_KEY,
        JSON.stringify({
          syncing: false,
          lastSyncTime: new Date().toISOString(),
          lastError: msg,
        }),
      );
      return { entries, products, costs, certificatePhotos, harvestPlans, seedScans };
    }

    const totalFailed =
      entries.failed +
      products.failed +
      costs.failed +
      certificatePhotos.failed +
      harvestPlans.failed +
      seedScans.failed;
    const detail = totalFailed > 0 ? await peekFirstRecordedQueueError(offlineStorage) : null;
    await AsyncStorage.setItem(
      SYNC_STATUS_KEY,
      JSON.stringify({
        syncing: false,
        lastSyncTime: new Date().toISOString(),
        lastError:
          totalFailed > 0
            ? detail ?? tString(i18n.t, 'producer.sync.itemsNotSent', { count: totalFailed })
            : null,
      }),
    );

    return { entries, products, costs, certificatePhotos, harvestPlans, seedScans };
  },

  /**
   * Drop all unsent local rows so the device queue cannot loop forever.
   */
  async purgeLegacyFieldLogOnly(): Promise<number> {
    const n = await offlineStorage.purgeLegacyFieldLogLocal();
    if (n > 0) {
      await AsyncStorage.setItem(
        SYNC_STATUS_KEY,
        JSON.stringify({
          syncing: false,
          lastSyncTime: new Date().toISOString(),
          lastError: null,
        }),
      );
    }
    return n;
  },

  async purgeAllLocalQueues(): Promise<{
    removed: Awaited<ReturnType<typeof offlineStorage.purgeAllUnsentLocalQueues>>;
    totalRemoved: number;
  }> {
    await offlineStorage.purgeLegacyFieldLogLocal();
    const removed = await offlineStorage.purgeAllUnsentLocalQueues();
    const totalRemoved =
      removed.fieldLogQueue +
      removed.fieldLogHistory +
      removed.harvestPlans +
      removed.products +
      removed.costs +
      removed.certificatePhotos;
    await AsyncStorage.setItem(
      SYNC_STATUS_KEY,
      JSON.stringify({
        syncing: false,
        lastSyncTime: new Date().toISOString(),
        lastError: null,
      }),
    );
    return { removed, totalRemoved };
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
      if (__DEV__) console.log('Auto-sync failed (offline?):', error);
    }
  },
};
}

type SyncService = ReturnType<typeof syncServiceForSession>;
export const syncService = new Proxy({} as SyncService, {
  get(_target, property: keyof SyncService) {
    return async (...args: unknown[]) => {
      const owner = await currentStorageOwner();
      const token = await DeviceStorage.getItem('auth_token');
      if (await currentStorageOwner() !== owner) throw new Error('Account changed; sync paused.');
      const service = syncServiceForSession(owner, token);
      return (service[property] as (...values: unknown[]) => unknown).apply(service, args);
    };
  },
});
