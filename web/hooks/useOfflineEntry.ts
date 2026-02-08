// React Hook for offline field entry
// Handles validation, storage, and sync

import { useState, useEffect, useCallback } from 'react';
import {
  saveFieldEntry,
  getFieldEntries,
  deleteFieldEntry,
  saveScannedCode,
  getLatestScannedCode,
  hasScannedCode,
  getScannedCodes,
  FieldEntry,
  ScannedCode,
} from '@/lib/offline/indexeddb';
import { syncAllEntries, setupAutoSync, setupPeriodicSync, isOnline, onOnlineStatusChange } from '@/lib/offline/sync';
import { checkCompliance } from '@/lib/offline/compliance';

export type EntryType = 'PRSKANJE' | 'SETVA' | 'BERBA';

interface UseOfflineEntryOptions {
  farmId?: string;
  autoSync?: boolean;
  syncInterval?: number;
}

interface UseOfflineEntryReturn {
  // State
  entries: FieldEntry[];
  scannedCodes: ScannedCode[];
  latestScannedCode: ScannedCode | null;
  isOnline: boolean;
  hasValidScan: boolean;
  loading: boolean;
  error: string | null;
  pendingSync: number;

  // Actions
  scanCode: (code: string, type: 'SEED' | 'PACKAGING') => Promise<void>;
  addEntry: (
    type: EntryType,
    data: FieldEntry['data'],
    options?: { seedSerialNumber?: string; packagingBarcode?: string }
  ) => Promise<{ success: boolean; error?: string; entryId?: string }>;
  deleteEntry: (id: string) => Promise<void>;
  syncNow: () => Promise<{ synced: number; failed: number }>;
  refresh: () => Promise<void>;
}

export function useOfflineEntry(options: UseOfflineEntryOptions = {}): UseOfflineEntryReturn {
  const { farmId, autoSync = true, syncInterval = 30000 } = options;

  const [entries, setEntries] = useState<FieldEntry[]>([]);
  const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);
  const [latestScannedCode, setLatestScannedCode] = useState<ScannedCode | null>(null);
  const [online, setOnline] = useState(true);
  const [hasValidScan, setHasValidScan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(0);

  // Initialize and load data
  useEffect(() => {
    loadData();
  }, [farmId]);

  // Monitor online status
  useEffect(() => {
    setOnline(isOnline());
    const cleanup = onOnlineStatusChange((isOnline) => {
      setOnline(isOnline);
    });
    return cleanup;
  }, []);

  // Setup auto-sync
  useEffect(() => {
    if (!autoSync) return;

    const cleanupAuto = setupAutoSync((result) => {
      setPendingSync(result.failed);
      loadData(); // Refresh entries after sync
    });

    const cleanupPeriodic = setupPeriodicSync(syncInterval, (result) => {
      setPendingSync(result.failed);
      loadData();
    });

    return () => {
      cleanupAuto();
      cleanupPeriodic();
    };
  }, [autoSync, syncInterval]);

  // Check for valid scan
  useEffect(() => {
    checkValidScan();
  }, [scannedCodes, farmId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [entriesData, codesData] = await Promise.all([
        getFieldEntries(farmId),
        getScannedCodes(farmId),
      ]);

      setEntries(entriesData);
      setScannedCodes(codesData);

      const latest = codesData.length > 0 ? codesData[0] : null;
      setLatestScannedCode(latest);

      // Count unsynced entries
      const unsynced = entriesData.filter((e) => !e.synced);
      setPendingSync(unsynced.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading offline data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkValidScan = async () => {
    const hasScan = await hasScannedCode(farmId);
    setHasValidScan(hasScan);
  };

  const scanCode = useCallback(
    async (code: string, type: 'SEED' | 'PACKAGING') => {
      try {
        setError(null);
        await saveScannedCode(code, type, farmId);
        await loadData(); // Reload to get updated codes
      } catch (err: any) {
        setError(err.message || 'Failed to save scanned code');
        throw err;
      }
    },
    [farmId]
  );

  const addEntry = useCallback(
    async (
      type: EntryType,
      data: FieldEntry['data'] & { deviceId?: string; deviceTimestamp?: string },
      options?: { seedSerialNumber?: string; packagingBarcode?: string; fertilizerBarcode?: string }
    ): Promise<{ success: boolean; error?: string; entryId?: string }> => {
      try {
        setError(null);

        // VALIDATION: Check if code is scanned
        const hasScan = await hasScannedCode(farmId);
        const latestCode = await getLatestScannedCode(farmId);

        if (!hasScan && !options?.seedSerialNumber && !options?.packagingBarcode) {
          return {
            success: false,
            error: 'Morate prvo skenirati bar-kod semena ili ambalaže pre unosa podataka.',
          };
        }

        // Use provided codes or latest scanned code
        const seedSerialNumber = options?.seedSerialNumber || (latestCode?.type === 'SEED' ? latestCode.code : undefined);
        const packagingBarcode =
          options?.packagingBarcode || (latestCode?.type === 'PACKAGING' ? latestCode.code : undefined);

        if (!seedSerialNumber && !packagingBarcode) {
          return {
            success: false,
            error: 'Nedostaje serijski broj semena ili bar-kod ambalaže.',
          };
        }

        // COMPLIANCE CHECK: If fertilizer barcode is provided, check against Bio-White-List
        if (options?.fertilizerBarcode && online) {
          try {
            const complianceResult = await checkCompliance(options.fertilizerBarcode, farmId, type);
            if (!complianceResult.compliant || complianceResult.blocked) {
              return {
                success: false,
                error: complianceResult.reason || 'Compliance check failed. Unos je blokiran.',
              };
            }
          } catch (complianceError: any) {
            // If offline, allow entry but mark for compliance check on sync
            if (!online) {
              console.warn('Offline - compliance check will be performed on sync');
            } else {
              return {
                success: false,
                error: complianceError.message || 'Compliance check failed',
              };
            }
          }
        }

        // Validate farmId
        if (!farmId) {
          return {
            success: false,
            error: 'Farm ID je obavezan.',
          };
        }

        // Save entry
        const entryId = await saveFieldEntry({
          type,
          farmId,
          seedSerialNumber,
          packagingBarcode,
          fertilizerBarcode: options?.fertilizerBarcode, // Include fertilizer barcode for compliance check
          data: {
            ...data,
            date: data.date || new Date().toISOString(),
          },
        });

        // Reload entries
        await loadData();

        // Auto-sync if online
        if (online) {
          setTimeout(() => {
            syncAllEntries().then((result) => {
              setPendingSync(result.failed);
              loadData();
            });
          }, 500);
        }

        return { success: true, entryId };
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to save entry';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [farmId, online]
  );

  const deleteEntry = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteFieldEntry(id);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry');
      throw err;
    }
  }, []);

  const syncNow = useCallback(async () => {
    try {
      setError(null);
      const result = await syncAllEntries();
      setPendingSync(result.failed);
      await loadData();
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to sync';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadData();
  }, []);

  return {
    entries,
    scannedCodes,
    latestScannedCode,
    isOnline: online,
    hasValidScan,
    loading,
    error,
    pendingSync,
    scanCode,
    addEntry,
    deleteEntry,
    syncNow,
    refresh,
  };
}
