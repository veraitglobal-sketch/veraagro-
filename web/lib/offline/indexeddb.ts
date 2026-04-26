// IndexedDB utility for offline storage
// Stores field entries (spraying, planting, harvest) locally

const DB_NAME = 'BioVeraOfflineDB';
const DB_VERSION = 1;
const STORE_ENTRIES = 'fieldEntries';
const STORE_SCANNED_CODES = 'scannedCodes';

interface FieldEntry {
  id: string;
  type: 'PRSKANJE' | 'SETVA' | 'BERBA';
  farmId: string;
  seedSerialNumber?: string; // Required for validation
  packagingBarcode?: string; // Alternative to seed serial
  fertilizerBarcode?: string; // For compliance check (Bio-White-List)
  data: {
    date: string;
    location?: { lat: number; lng: number };
    notes?: string;
    [key: string]: any; // Additional type-specific data
  };
  synced: boolean;
  createdAt: string;
  syncedAt?: string;
}

interface ScannedCode {
  id: string;
  code: string;
  type: 'SEED' | 'PACKAGING';
  scannedAt: string;
  farmId?: string;
}

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create field entries store
      if (!database.objectStoreNames.contains(STORE_ENTRIES)) {
        const entriesStore = database.createObjectStore(STORE_ENTRIES, {
          keyPath: 'id',
        });
        entriesStore.createIndex('synced', 'synced', { unique: false });
        entriesStore.createIndex('createdAt', 'createdAt', { unique: false });
        entriesStore.createIndex('farmId', 'farmId', { unique: false });
      }

      // Create scanned codes store
      if (!database.objectStoreNames.contains(STORE_SCANNED_CODES)) {
        const codesStore = database.createObjectStore(STORE_SCANNED_CODES, {
          keyPath: 'id',
        });
        codesStore.createIndex('scannedAt', 'scannedAt', { unique: false });
        codesStore.createIndex('code', 'code', { unique: true });
      }
    };
  });
}

// Get database instance
export async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    await initDB();
  }
  return db!;
}

// Field Entries Operations

export async function saveFieldEntry(
  entry: Omit<FieldEntry, 'id' | 'synced' | 'createdAt'> & { fertilizerBarcode?: string }
): Promise<string> {
  const database = await getDB();
  const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const fullEntry: FieldEntry = {
    ...entry,
    id,
    synced: false,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_ENTRIES], 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.add(fullEntry);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function getFieldEntries(farmId?: string): Promise<FieldEntry[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_ENTRIES], 'readonly');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.getAll();

    request.onsuccess = () => {
      let entries = request.result as FieldEntry[];
      if (farmId) {
        entries = entries.filter((e) => e.farmId === farmId);
      }
      // Sort by createdAt descending
      entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(entries);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getUnsyncedEntries(): Promise<FieldEntry[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_ENTRIES], 'readonly');
    const store = transaction.objectStore(STORE_ENTRIES);
    const index = store.index('synced');
    const request = index.getAll(false as unknown as IDBValidKey);

    request.onsuccess = () => resolve(request.result as FieldEntry[]);
    request.onerror = () => reject(request.error);
  });
}

export async function markEntryAsSynced(id: string): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_ENTRIES], 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const entry = getRequest.result;
      if (entry) {
        entry.synced = true;
        entry.syncedAt = new Date().toISOString();
        const updateRequest = store.put(entry);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteFieldEntry(id: string): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_ENTRIES], 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Scanned Codes Operations

export async function saveScannedCode(
  code: string,
  type: 'SEED' | 'PACKAGING',
  farmId?: string
): Promise<string> {
  const database = await getDB();
  const id = `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const scannedCode: ScannedCode = {
    id,
    code,
    type,
    scannedAt: new Date().toISOString(),
    farmId,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_SCANNED_CODES], 'readwrite');
    const store = transaction.objectStore(STORE_SCANNED_CODES);
    const request = store.add(scannedCode);

    request.onsuccess = () => resolve(id);
    request.onerror = () => {
      // If code already exists, update it
      const updateRequest = store.put(scannedCode);
      updateRequest.onsuccess = () => resolve(id);
      updateRequest.onerror = () => reject(updateRequest.error);
    };
  });
}

export async function getScannedCodes(farmId?: string): Promise<ScannedCode[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_SCANNED_CODES], 'readonly');
    const store = transaction.objectStore(STORE_SCANNED_CODES);
    const request = store.getAll();

    request.onsuccess = () => {
      let codes = request.result as ScannedCode[];
      if (farmId) {
        codes = codes.filter((c) => c.farmId === farmId);
      }
      // Sort by scannedAt descending
      codes.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
      resolve(codes);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getLatestScannedCode(farmId?: string): Promise<ScannedCode | null> {
  const codes = await getScannedCodes(farmId);
  return codes.length > 0 ? codes[0] : null;
}

export async function hasScannedCode(farmId?: string): Promise<boolean> {
  const codes = await getScannedCodes(farmId);
  return codes.length > 0;
}

export async function clearScannedCodes(farmId?: string): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_SCANNED_CODES], 'readwrite');
    const store = transaction.objectStore(STORE_SCANNED_CODES);
    const request = farmId
      ? store.index('farmId').openCursor(IDBKeyRange.only(farmId))
      : store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Clear all data (for testing/reset)
export async function clearAllData(): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_ENTRIES, STORE_SCANNED_CODES], 'readwrite');
    transaction.objectStore(STORE_ENTRIES).clear();
    transaction.objectStore(STORE_SCANNED_CODES).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export type { FieldEntry, ScannedCode };
