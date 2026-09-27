# ✅ Business Logic Services - Kompletirano

## 📋 Pregled

Kreirana su **4 ključna servisa** sa kompletnom poslovnom logikom:

1. **Sync Engine** - Offline-to-online sinhronizacija
2. **Integrity Guard** - Validacija inputa i security alerts
3. **Dynamic Pricing** - Real-time cena semena
4. **Vera Bonus Calculator** - Bonus za washed & sorted

---

## 🔄 1. Sync Engine

### Funkcionalnosti

✅ **Batch Sync** - Prima array unosa sa terena  
✅ **Late Entry Detection** - Označava unose starije od 24h  
✅ **Compliance Check** - Validira barcode kroz Integrity Guard  
✅ **GPS Validation** - Proverava koordinate unutar farme  

### API

**POST** `/sync/field-entries`
```json
{
  "entries": [
    {
      "id": "offline-entry-123",
      "type": "PRSKANJE",
      "farmId": "estate-123",
      "fertilizerBarcode": "FERT-123",
      "data": {
        "date": "2024-02-15",
        "location": { "lat": 44.7866, "lng": 20.4489 }
      },
      "createdAt": "2024-02-15T10:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "synced": 5,
  "late": 2,
  "failed": 1,
  "lateEntries": [...],
  "failedEntries": [...]
}
```

### Late Entry Logic

```typescript
// Entry je "late" ako je stariji od 24h
const hoursDiff = (now - entryDate) / (1000 * 60 * 60);
if (hoursDiff > 24) {
  // Označi kao late entry
  // Kreiraj ComplianceLog sa status: PENDING
  // Zahteva admin review
}
```

---

## 🛡️ 2. Integrity Guard

### Funkcionalnosti

✅ **Barcode Validation** - Proverava protiv Bio-White-List  
✅ **GPS Validation** - Proverava koordinate unutar farme  
✅ **Security Alerts** - Kreira alert za violations  
✅ **Admin Notifications** - Obaveštava admine  

### validateInput Function

```typescript
async validateInput(input: {
  barcode: string;
  barcodeType: 'FERTILIZER' | 'SEED' | 'PACKAGING';
  userId: string;
  farmId: string;
  entryType: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
}): Promise<{
  valid: boolean;
  reason?: string;
  alertCreated?: boolean;
}>
```

### Validation Steps

1. **Fertilizer Check:**
   - Query `BioWhiteList` za barcode
   - Ako nije na listi → Block + Security Alert
   - Ako je inactive → Block + Security Alert

2. **Seed Check:**
   - Query `Seed` tabelu za serial number
   - Validira seed assignment farmeru

3. **GPS Check:**
   - Proverava koordinate unutar farm boundaries
   - Ako je van → Block + Security Alert

### Security Alert Types

- `UNAUTHORIZED_CHEMICAL` - Barcode nije na white list
- `INACTIVE_CHEMICAL` - Barcode je inactive
- `GPS_VIOLATION` - Koordinate van farme
- `LATE_ENTRY` - Unos stariji od 24h

---

## 💰 3. Dynamic Pricing Service

### Funkcionalnosti

✅ **Partner Discount** - 30% popust za partnere  
✅ **Area Limit** - Popust samo do 200kg po hektaru  
✅ **Full Price Above Limit** - Sve preko limita po punoj ceni  

### Pricing Logic

```
1. Proveri da li je farmer partner
2. Izračunaj farm area (hektari)
3. Izračunaj discount limit = area × 200kg
4. Ako quantity <= limit:
   - Sva količina dobija popust
   Ako quantity > limit:
   - Limit količina dobija popust
   - Preostalo po punoj ceni
```

### API

**GET** `/pricing/seed-price?quantity=600&seedType=Apple`

**Response:**
```json
{
  "farmerId": "farmer-123",
  "quantity": 600,
  "isPartner": true,
  "farmAreaHectares": 2.5,
  "discountLimit": 500,
  "discountEligibleQuantity": 500,
  "fullPriceQuantity": 100,
  "standardPricePerKg": 10.0,
  "partnerPricePerKg": 7.0,
  "discountAmount": 1500.0,
  "total": 4500.0,
  "breakdown": {
    "discounted": {
      "quantity": 500,
      "pricePerKg": 7.0,
      "subtotal": 3500.0
    },
    "fullPrice": {
      "quantity": 100,
      "pricePerKg": 10.0,
      "subtotal": 1000.0
    }
  }
}
```

### Example Calculation

**Scenario:** Partner farmer, 2.5ha, želi 600kg semena

```
Farm Area: 2.5 ha
Discount Limit: 2.5 × 200 = 500kg

Quantity: 600kg
- Prvih 500kg: Partner cena (7.0 EUR/kg) = 3,500 EUR
- Preostalih 100kg: Standard cena (10.0 EUR/kg) = 1,000 EUR
Total: 4,500 EUR
Discount: 1,500 EUR (na prvih 500kg)
```

---

## 🎁 4. Vera Bonus Calculator

### Funkcionalnosti

✅ **Washed & Sorted Bonus** - 0.50 EUR po kg  
✅ **Automatic Calculation** - Automatski računa bonus  
✅ **Bonus Tracking** - Prati earned/paid/pending  

### Bonus Logic

```typescript
// Ako je shipment marked kao 'Washed & Sorted'
if (isWashedAndSorted) {
  bonus = quantity × 0.50 EUR/kg
  finalPrice = basePrice + bonus
}
```

### API

**POST** `/vera-bonus/calculate`
```json
{
  "shipmentId": "shipment-123",
  "isWashedAndSorted": true
}
```

**Response:**
```json
{
  "shipmentId": "shipment-123",
  "isWashedAndSorted": true,
  "quantity": 1000,
  "bonusPerKg": 0.50,
  "totalBonus": 500.0,
  "basePrice": 2000.0,
  "finalPrice": 2500.0
}
```

**GET** `/vera-bonus/summary/:farmerId`
```json
{
  "farmerId": "farmer-123",
  "totalShipments": 10,
  "eligibleShipments": 8,
  "totalBonusEarned": 4000.0,
  "totalBonusPaid": 3000.0,
  "pendingBonus": 1000.0
}
```

---

## 🔗 Kompletna Integracija

### Flow: Field Entry → Sync → Validation → Pricing → Bonus

```
1. Farmer unosi podatke offline (IndexedDB)
   ↓
2. Sync kada je online → POST /sync/field-entries
   ↓
3. Integrity Guard validira barcode
   ↓
4. Ako validan → Kreira compliance log
   ↓
5. Ako invalidan → Block + Security Alert
   ↓
6. Farmer kupuje seme → GET /pricing/seed-price
   ↓
7. Dynamic pricing računa cenu (partner discount)
   ↓
8. Shipment kreiran → POST /vera-bonus/calculate
   ↓
9. Ako washed & sorted → Dodaje bonus na finalnu cenu
```

---

## 📊 Database Models Potrebni

### SecurityAlert (Dodaj u schema.prisma)

```prisma
model SecurityAlert {
  id String @id @default(uuid())
  type String // "UNAUTHORIZED_CHEMICAL", etc.
  severity String // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  barcode String?
  userId String
  farmId String
  message String
  status String @default("PENDING")
  // ... other fields
}
```

### ComplianceLog (Iz biovera-core schema)

```prisma
model ComplianceLog {
  id String @id @default(uuid())
  farmerId String
  estateId String
  entryType String
  scannedBarcode String
  isCompliant Boolean
  synced Boolean @default(false)
  // ... other fields
}
```

### Shipment (Iz biovera-core schema)

```prisma
model Shipment {
  id String @id @default(uuid())
  farmerId String
  seedInventoryId String // CRITICAL for traceability
  quantity Float
  veraBonusEligible Boolean
  veraBonusAmount Float
  // ... other fields
}
```

---

## ✅ Checklist

- [x] Sync Engine kreiran
- [x] Integrity Guard kreiran
- [x] Dynamic Pricing kreiran
- [x] Vera Bonus Calculator kreiran
- [x] API endpoints kreirani
- [x] TypeScript komentari dodati
- [ ] SecurityAlert model dodati u schema
- [ ] ComplianceLog model dodati u schema
- [ ] Shipment model dodati u schema
- [ ] Testirati sve servise
- [ ] Integrisati sa frontend-om

---

## 🚀 Sledeći Koraci

1. **Dodaj modele u schema.prisma:**
   - SecurityAlert (iz schema.security-alert.prisma)
   - ComplianceLog (iz schema.biovera-core.prisma)
   - Shipment (iz schema.biovera-core.prisma)

2. **Pokreni migraciju:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_business_logic_models
   ```

3. **Testiraj servise:**
   - Test sync sa late entries
   - Test integrity guard sa unauthorized barcode
   - Test pricing sa partner discount
   - Test vera bonus calculation

4. **Integriši sa frontend-om:**
   - Offline sync endpoint
   - Pricing preview
   - Bonus calculation

---

**Svi servisi su kreirani sa TypeScript komentarima i spremni za integraciju!**
