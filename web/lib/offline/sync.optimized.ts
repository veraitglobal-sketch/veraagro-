// OPTIMIZED Sync service for offline entries
// Batch processing instead of sequential

import { getUnsyncedEntries, markEntryAsSynced, FieldEntry } from './indexeddb';
import { WEB_API_BASE } from '../api-base';

const API_URL = WEB_API_BASE;
const BATCH_SIZE = 10; // Sync 10 entries at a time
const MAX_RETRIES = 3;

// Check if online
export function isOnline(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.onLine;
}

// Listen for online/offline events
export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// OPTIMIZED: Sync single entry with retry logic
export async function syncEntry(entry: FieldEntry, retryCount: number = 0): Promise<boolean> {
  if (!isOnline()) {
    console.log('Offline - cannot sync entry:', entry.id);
    return false;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return false;
    }

    // Transform entry for API
    const payload = {
      type: entry.type,
      farmId: entry.farmId,
      seedSerialNumber: entry.seedSerialNumber,
      packagingBarcode: entry.packagingBarcode,
      fertilizerBarcode: entry.fertilizerBarcode,
      data: entry.data,
      createdAt: entry.createdAt,
    };

    const response = await fetch(`${API_URL}/field-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Retry on server errors (5xx)
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        console.log(`Retrying entry ${entry.id} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return syncEntry(entry, retryCount + 1);
      }
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    // Mark as synced
    await markEntryAsSynced(entry.id);
    console.log('Entry synced successfully:', entry.id);
    return true;
  } catch (error) {
    console.error('Error syncing entry:', error);
    return false;
  }
}

// OPTIMIZED: Batch sync instead of sequential
export async function syncAllEntries(): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) {
    console.log('Offline - cannot sync entries');
    return { synced: 0, failed: 0 };
  }

  const unsynced = await getUnsyncedEntries();
  if (unsynced.length === 0) {
    console.log('No unsynced entries');
    return { synced: 0, failed: 0 };
  }

  console.log(`Syncing ${unsynced.length} entries in batches of ${BATCH_SIZE}...`);

  let synced = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
    const batch = unsynced.slice(i, i + BATCH_SIZE);

    // Sync batch in parallel
    const results = await Promise.allSettled(
      batch.map((entry) => syncEntry(entry))
    );

    // Count results
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        synced++;
      } else {
        failed++;
      }
    });

    // Small delay between batches to avoid overwhelming server
    if (i + BATCH_SIZE < unsynced.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`Sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

// Auto-sync when coming online
export function setupAutoSync(onSyncComplete?: (result: { synced: number; failed: number }) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let syncInProgress = false;

  const handleOnline = async () => {
    if (syncInProgress) return;
    syncInProgress = true;

    console.log('Connection restored - starting sync...');
    const result = await syncAllEntries();
    if (onSyncComplete) {
      onSyncComplete(result);
    }
    syncInProgress = false;
  };

  // Initial sync if online
  if (isOnline()) {
    handleOnline();
  }

  // Listen for online events
  const cleanup = onOnlineStatusChange((online) => {
    if (online && !syncInProgress) {
      handleOnline();
    }
  });

  return cleanup;
}

// Periodic sync (every 30 seconds if online)
export function setupPeriodicSync(
  intervalMs: number = 30000,
  onSyncComplete?: (result: { synced: number; failed: number }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const intervalId = setInterval(async () => {
    if (isOnline()) {
      const result = await syncAllEntries();
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}
