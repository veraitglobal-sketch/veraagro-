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
import {
  validateMaterial,
  materialKindForFieldEntry,
} from '@/lib/offline/compliance';
import i18n from '@/i18n/config';

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
    options?: { seedSerialNumber?: string; packagingBarcode?: string; fertilizerBarcode?: string }
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
    } catch (err: unknown) {
      setError(i18n.t('growerPages.fieldEntryOfflineLoadFailed'));
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
      } catch (err: unknown) {
        setError(i18n.t('growerPages.fieldEntryOfflineSaveScanFailed'));
        console.error('saveScannedCode:', err);
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
            error: i18n.t('growerPages.fieldEntryOfflineAddScanFirst'),
          };
        }

        // Use provided codes or latest scanned code
        const seedSerialNumber = options?.seedSerialNumber || (latestCode?.type === 'SEED' ? latestCode.code : undefined);
        const packagingBarcode =
          options?.packagingBarcode || (latestCode?.type === 'PACKAGING' ? latestCode.code : undefined);

        if (!seedSerialNumber && !packagingBarcode) {
          return {
            success: false,
            error: i18n.t('growerPages.fieldEntryOfflineMissingSeedOrPackaging'),
          };
        }

        const validateBarcodeOnline = async (
          barcode: string,
          field: 'seed' | 'fertilizer',
        ): Promise<{ ok: true } | { ok: false; error: string }> => {
          if (!online) {
            return { ok: true };
          }
          try {
            const kind = materialKindForFieldEntry(type, field);
            const result = await validateMaterial(barcode, kind, farmId);
            if (!result.valid) {
              return {
                ok: false,
                error: result.message || i18n.t('growerPages.fieldEntryOfflineComplianceDefault'),
              };
            }
            return { ok: true };
          } catch (complianceError: unknown) {
            return {
              ok: false,
              error:
                complianceError instanceof Error && complianceError.message
                  ? complianceError.message
                  : i18n.t('growerPages.fieldEntryOfflineComplianceFailed'),
            };
          }
        };

        if (seedSerialNumber) {
          const seedCheck = await validateBarcodeOnline(seedSerialNumber, 'seed');
          if (!seedCheck.ok) {
            return { success: false, error: seedCheck.error };
          }
        }

        if (options?.fertilizerBarcode?.trim()) {
          const fertCheck = await validateBarcodeOnline(options.fertilizerBarcode, 'fertilizer');
          if (!fertCheck.ok) {
            return { success: false, error: fertCheck.error };
          }
        }

        // Validate farmId
        if (!farmId) {
          return {
            success: false,
            error: i18n.t('growerPages.fieldEntryOfflineFarmRequired'),
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
      } catch (err: unknown) {
        console.error('addEntry:', err);
        const errorMsg = i18n.t('growerPages.fieldEntryOfflineSaveEntryFailed');
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
    } catch (err: unknown) {
      setError(i18n.t('growerPages.fieldEntryOfflineDeleteFailed'));
      console.error('deleteFieldEntry:', err);
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
    } catch (err: unknown) {
      const errorMsg = i18n.t('growerPages.fieldEntryOfflineSyncFailed');
      setError(errorMsg);
      console.error('syncAllEntries:', err);
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
