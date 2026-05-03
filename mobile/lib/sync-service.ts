import {
  offlineStorage,
  PendingFieldEntry,
} from './offline-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './api-url';
import { growthLogsAPI, type Estate } from './api';
import { imageUriToJpegDataUrl, assertDataUrlWithinSize } from './image-data-url';
import { sha256HexFromImageUri } from './image-hash';
import { getOrCreateDeviceId } from './device-id';
import i18n from '../i18n/config';
import { growerOfflineCache } from './grower-offline-cache';
import { apiErrorMessage, axiosResponseStatus } from './api-error';
import { tString } from './i18n-strings';

// Create API instance for sync
const syncApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const SYNC_STATUS_KEY = 'sync_status';
const MAX_FIELD_LOG_PHOTO_BYTES = 8 * 1024 * 1024;

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

async function peekFirstRecordedQueueError(): Promise<string | null> {
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
   * @param updateGlobalLedger when false (`syncAll` path), avoids writing SYNC_STATUS halfway through a multi-queue flush
   */
  async syncPendingEntries(updateGlobalLedger = true): Promise<{ success: number; failed: number }> {
    const pending = await offlineStorage.getPendingEntries();
    const pendingEntries = pending.filter((e) => needsSync(e.status));

    if (pendingEntries.length === 0) {
      return { success: 0, failed: 0 };
    }

    if (updateGlobalLedger) {
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ syncing: true, lastError: null }));
    }

    let success = 0;
    let failed = 0;

    for (const entry of pendingEntries) {
      try {
        // Mark as syncing
        entry.status = 'syncing';
        await this.updateEntryStatus(entry.id, 'syncing');
        await offlineStorage.patchFieldLogHistory(entry.id, { status: 'syncing' });

        if (!entry.parcelId?.trim() || !entry.harvestAnnouncementId?.trim()) {
          throw new Error(tString(i18n.t, 'producer.sync.fieldEntryNeedsParcelPlan'));
        }

        // Prefer estate recorded at save time; use live list or last cached copy when offline.
        const { estatesAPI } = await import('./api');
        let list: Estate[] = [];
        try {
          const estates = await estatesAPI.getAll();
          list = Array.isArray(estates) ? estates : [];
          await growerOfflineCache.saveEstates(list);
        } catch {
          const cached = await growerOfflineCache.loadEstates();
          list = cached ?? [];
        }
        // Avoid `estateId && find`: empty string `""` would short-circuit to `""` and poison the union type.
        const preferred: Estate | undefined = entry.estateId
          ? list.find((e) => e.id === entry.estateId)
          : undefined;
        const estateId = preferred?.id ?? list[0]?.id;

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

        await growthLogsAPI.create({
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
        });

        await offlineStorage.patchFieldLogHistory(entry.id, { status: 'synced', error: undefined });
        // Mark as synced
        await offlineStorage.removeEntry(entry.id);
        success++;
      } catch (error: unknown) {
        const msg = apiErrorMessage(error, 'Sync failed');
        console.warn(`[field-entry sync] ${entry.id}: ${msg}`);
        entry.status = 'error';
        entry.error = msg;
        await this.updateEntryStatus(entry.id, 'error', msg);
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
    const toSync = pending.filter((p) => needsSync(p.status));
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
        await offlineStorage.removeProduct(product.id);
        success++;
      } catch (err: unknown) {
        const status = axiosResponseStatus(err);
        const isNotImplemented = status === 404 || status === 501;
        await offlineStorage.updateProductStatus(
          product.id,
          'pending',
          isNotImplemented ? undefined : apiErrorMessage(err, 'Sync failed')
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
            timestamp: cost.timestamp,
          },
          { headers: { Authorization: token ? `Bearer ${token}` : '' } }
        );
        await offlineStorage.removeCost(cost.id);
        success++;
      } catch (err: unknown) {
        const status = axiosResponseStatus(err);
        const isNotImplemented = status === 404 || status === 501;
        await offlineStorage.updateCostStatus(
          cost.id,
          'pending',
          isNotImplemented ? undefined : apiErrorMessage(err, 'Sync failed')
        );
        if (!isNotImplemented) failed++;
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
        await offlineStorage.updateCertificatePhotoStatus(
          photo.id,
          'pending',
          isNotImplemented ? undefined : apiErrorMessage(err, 'Sync failed')
        );
        if (!isNotImplemented) failed++;
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
  }> {
    await offlineStorage.resetStuckSyncingQueues();
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ syncing: true, lastError: null }));

    let entries = { success: 0, failed: 0 };
    let products = { success: 0, failed: 0 };
    let costs = { success: 0, failed: 0 };
    let certificatePhotos = { success: 0, failed: 0 };
    let harvestPlans = { success: 0, failed: 0 };

    try {
      entries = await this.syncPendingEntries(false);
      products = await this.syncPendingProducts();
      costs = await this.syncPendingCosts();
      certificatePhotos = await this.syncPendingCertificatePhotos();
      harvestPlans = await this.syncPendingHarvestPlans();
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
      return { entries, products, costs, certificatePhotos, harvestPlans };
    }

    const totalFailed =
      entries.failed +
      products.failed +
      costs.failed +
      certificatePhotos.failed +
      harvestPlans.failed;
    const detail = totalFailed > 0 ? await peekFirstRecordedQueueError() : null;
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

    return { entries, products, costs, certificatePhotos, harvestPlans };
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
