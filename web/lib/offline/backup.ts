// IndexedDB Backup & Restore Utility
// Prevents data loss if IndexedDB is cleared

import { getFieldEntries, getScannedCodes } from './indexeddb';

/**
 * Export all offline data to JSON (for backup)
 */
export async function exportOfflineData(): Promise<string> {
  const entries = await getFieldEntries();
  const codes = await getScannedCodes();

  const data = {
    entries,
    codes,
    exportedAt: new Date().toISOString(),
    version: 1,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Download backup as file
 */
export async function downloadBackup() {
  const data = await exportOfflineData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `biovera-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restore from backup
 * Note: This requires saveFieldEntry and saveScannedCode to be exported from indexeddb.ts
 */
export async function restoreFromBackup(backupJson: string): Promise<{ restored: number; errors: number }> {
  const data = JSON.parse(backupJson);
  let restored = 0;
  let errors = 0;

  // Dynamically import functions
  const indexeddb = await import('./indexeddb');
  
  // Restore entries
  if (data.entries && indexeddb.saveFieldEntry) {
    for (const entry of data.entries) {
      try {
        await indexeddb.saveFieldEntry(entry);
        restored++;
      } catch (error) {
        console.error('Error restoring entry:', error);
        errors++;
      }
    }
  }

  // Restore codes
  if (data.codes && indexeddb.saveScannedCode) {
    for (const code of data.codes) {
      try {
        await indexeddb.saveScannedCode(code.code, code.type, code.farmId);
        restored++;
      } catch (error) {
        console.error('Error restoring code:', error);
        errors++;
      }
    }
  }

  return { restored, errors };
}

// Re-export needed functions
import { saveFieldEntry, saveScannedCode } from './indexeddb';
