# Offline-First Field Entry System

## 📋 Pregled

Offline-first sistem za unos podataka sa njive (prskanje, setva, berba) koji koristi IndexedDB za lokalno čuvanje i automatski sync kada je dostupna internet konekcija.

## 🎯 Ključne Funkcionalnosti

1. **Offline Storage** - IndexedDB za lokalno čuvanje podataka
2. **Auto Sync** - Automatska sinhronizacija kada se konekcija vrati
3. **Validation** - Validacija da je bar-kod skeniran pre unosa
4. **Real-time Status** - Praćenje online/offline statusa i pending sync-a

## 📁 Struktura Fajlova

```
lib/offline/
├── indexeddb.ts      # IndexedDB utility functions
├── sync.ts           # Sync service
└── README.md         # Dokumentacija

hooks/
└── useOfflineEntry.ts # React Hook za offline entry

components/
└── OfflineEntryForm.tsx # React komponenta za form
```

## 🚀 Kako Koristiti

### 1. Osnovna Upotreba

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
      notes: 'Setva pšenice',
    });

    if (result.success) {
      console.log('Entry saved:', result.entryId);
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <div>
      {!hasValidScan && <p>Morate skenirati bar-kod pre unosa</p>}
      <button onClick={handleAddEntry} disabled={!hasValidScan}>
        Dodaj Unos
      </button>
    </div>
  );
}
```

### 2. Koristeći Komponentu

```tsx
import OfflineEntryForm from '@/components/OfflineEntryForm';

function FieldEntryPage() {
  return <OfflineEntryForm farmId="farm-123" />;
}
```

## 🔧 API Reference

### `useOfflineEntry(options)`

**Options:**
- `farmId?: string` - ID farme
- `autoSync?: boolean` - Auto-sync kada se konekcija vrati (default: true)
- `syncInterval?: number` - Interval za periodic sync u ms (default: 30000)

**Returns:**
- `entries: FieldEntry[]` - Svi unosi
- `scannedCodes: ScannedCode[]` - Skenirani bar-kodovi
- `latestScannedCode: ScannedCode | null` - Poslednji skenirani kod
- `isOnline: boolean` - Online status
- `hasValidScan: boolean` - Da li postoji validan skenirani kod
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `pendingSync: number` - Broj unsynced unosa
- `scanCode(code, type)` - Skeniraj bar-kod
- `addEntry(type, data, options?)` - Dodaj unos
- `deleteEntry(id)` - Obriši unos
- `syncNow()` - Sinhronizuj sada
- `refresh()` - Refresh data

### `addEntry(type, data, options?)`

**Parameters:**
- `type: 'PRSKANJE' | 'SETVA' | 'BERBA'`
- `data: { date: string; notes?: string; [key: string]: any }`
- `options?: { seedSerialNumber?: string; packagingBarcode?: string }`

**Returns:**
```typescript
{ success: boolean; error?: string; entryId?: string }
```

**Validation:**
- Mora postojati skenirani bar-kod (seed ili packaging)
- Mora postojati farmId
- Mora postojati datum

## 📊 IndexedDB Schema

### Store: `fieldEntries`

```typescript
{
  id: string;
  type: 'PRSKANJE' | 'SETVA' | 'BERBA';
  farmId: string;
  seedSerialNumber?: string;
  packagingBarcode?: string;
  data: {
    date: string;
    location?: { lat: number; lng: number };
    notes?: string;
    [key: string]: any;
  };
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

## 🔄 Sync Flow

1. **Offline Entry** → Saved to IndexedDB with `synced: false`
2. **Connection Restored** → Auto-sync triggers
3. **Sync Process** → Each unsynced entry sent to server
4. **Success** → Entry marked as `synced: true`
5. **Failure** → Entry remains unsynced, retry on next sync

## ⚠️ Validacija

**Bar-kod Validacija:**
- Seljak **MORA** skenirati bar-kod semena ili ambalaže pre unosa
- Validacija se proverava pri svakom `addEntry()` pozivu
- Ako nema skeniranog koda, unos se blokira sa porukom greške

**Primer greške:**
```
"Morate prvo skenirati bar-kod semena ili ambalaže pre unosa podataka."
```

## 🧪 Testiranje

### Test Offline Mode

1. Otvori DevTools → Network tab
2. Postavi na "Offline"
3. Unesi podatke
4. Proveri da su sačuvani u IndexedDB
5. Postavi na "Online"
6. Proveri da se automatski sync-uju

### Proveri IndexedDB

```javascript
// U browser console
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

## 🔗 Backend Endpoint

Backend treba da ima endpoint:

```
POST /field-entries
Headers: Authorization: Bearer <token>
Body: {
  type: 'PRSKANJE' | 'SETVA' | 'BERBA',
  farmId: string,
  seedSerialNumber?: string,
  packagingBarcode?: string,
  data: { ... },
  createdAt: string
}
```

## 📝 Napomene

- IndexedDB je asinhron, sve operacije vraćaju Promise
- Sync se dešava automatski kada se konekcija vrati
- Periodic sync se izvršava svakih 30 sekundi (ako je online)
- Skenirani kodovi se čuvaju trajno (mogu se obrisati ručno)
- Unosi se ne brišu automatski nakon sync-a (može se dodati cleanup)
