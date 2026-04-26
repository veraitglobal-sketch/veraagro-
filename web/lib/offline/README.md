# Offline-first field entry

## Overview

Offline-first flow for field data (spray, sowing, harvest) using IndexedDB for local storage and automatic sync when the network is available.

## Features

1. **Offline storage** — IndexedDB for local records
2. **Auto sync** — Sync when connectivity returns
3. **Validation** — Barcode must be scanned before submitting an entry
4. **Status** — Online/offline and pending sync counts

## File layout

```
lib/offline/
├── indexeddb.ts      # IndexedDB helpers
├── sync.ts           # Sync service
└── README.md

hooks/
└── useOfflineEntry.ts

components/
└── OfflineEntryForm.tsx
```

## Usage

### 1. Hook

```tsx
import { useOfflineEntry } from '@/hooks/useOfflineEntry';

function MyComponent() {
  const {
    entries,
    addEntry,
    scanCode,
    hasValidScan,
    isOnline,
    pendingSync,
  } = useOfflineEntry({ farmId: 'farm-123' });

  const handleAddEntry = async () => {
    const result = await addEntry('SETVA', {
      date: new Date().toISOString(),
      notes: 'Winter wheat sowing',
    });

    if (result.success) {
      console.log('Entry saved:', result.entryId);
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <div>
      {!hasValidScan && <p>Scan a barcode before adding an entry</p>}
      <button onClick={handleAddEntry} disabled={!hasValidScan}>
        Add entry
      </button>
    </div>
  );
}
```

### 2. Form component

```tsx
import OfflineEntryForm from '@/components/OfflineEntryForm';

function FieldEntryPage() {
  return <OfflineEntryForm farmId="farm-123" />;
}
```

## API: `useOfflineEntry(options)`

**Options**

- `farmId?: string` — Farm ID
- `autoSync?: boolean` — Auto-sync when back online (default: `true`)
- `syncInterval?: number` — Periodic sync interval in ms (default: `30000`)

**Returns**

- `entries`, `scannedCodes`, `latestScannedCode`, `isOnline`, `hasValidScan`, `loading`, `error`, `pendingSync`
- `scanCode(code, type)` — Record a scan
- `addEntry(type, data, options?)` — Save an entry
- `deleteEntry(id)` — Delete an entry
- `syncNow()` — Sync immediately
- `refresh()` — Reload local data

### `addEntry(type, data, options?)`

**Parameters**

- `type: 'PRSKANJE' | 'SETVA' | 'BERBA'`
- `data: { date: string; notes?: string; ... }`
- `options?: { seedSerialNumber?: string; packagingBarcode?: string }`

**Returns**

```ts
{ success: boolean; error?: string; entryId?: string }
```

**Validation**

- A scanned barcode (seed or packaging) is required
- `farmId` is required
- Date is required

**Example error (from the app)**

```
"Scan a seed or packaging barcode first before entering data."
```

## IndexedDB schema

### Store: `fieldEntries`

```typescript
{
  id: string;
  type: 'PRSKANJE' | 'SETVA' | 'BERBA';
  farmId: string;
  seedSerialNumber?: string;
  packagingBarcode?: string;
  data: { date: string; location?: { lat: number; lng: number }; notes?: string; ... };
  synced: boolean;
  createdAt: string;
  syncedAt?: string;
}
```

### Store: `scannedCodes`

```typescript
{
  id: string;
  code: string;
  type: 'SEED' | 'PACKAGING';
  scannedAt: string;
  farmId?: string;
}
```

## Sync flow

1. Entry saved locally with `synced: false`
2. When connection is back, auto-sync runs
3. Each unsynced entry is sent to the server
4. On success → `synced: true`
5. On failure → remains unsynced; retried on next sync

## Testing offline

1. DevTools → Network → Offline
2. Create entries
3. Confirm they are stored in IndexedDB
4. Set Network → Online
5. Confirm they sync

### Inspect IndexedDB (browser console)

```javascript
const db = await new Promise((resolve, reject) => {
  const request = indexedDB.open('BioVeraOfflineDB', 1);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const transaction = db.transaction(['fieldEntries'], 'readonly');
const store = transaction.objectStore('fieldEntries');
const entries = await new Promise((resolve) => {
  const request = store.getAll();
  request.onsuccess = () => resolve(request.result);
});
console.log(entries);
```

## Backend

Expected endpoint:

```
POST /field-entries
Headers: Authorization: Bearer <token>
Body: { type, farmId, seedSerialNumber?, packagingBarcode?, data, createdAt }
```

## Notes

- IndexedDB is async; all helpers return Promises
- Sync runs when connectivity returns; periodic sync about every 30s while online
- Scanned codes persist until cleared
- Entries are not deleted automatically after sync (add cleanup if needed)
