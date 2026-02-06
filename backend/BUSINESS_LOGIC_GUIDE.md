# 🔧 BioVera Business Logic Guide

## 📋 Overview

This guide documents the core business logic services for BioVera platform:
1. **Sync Engine** - Offline-to-online synchronization
2. **Integrity Guard** - Input validation and security
3. **Dynamic Pricing** - Real-time seed pricing
4. **Vera Bonus** - Quality-based bonus calculation

---

## 🔄 1. Sync Engine (Offline-to-Online)

### Purpose
Synchronizes field entries from offline storage (IndexedDB/SQLite) to server.

### Key Features
- **Timestamp Validation**: Marks entries older than 24 hours as "Late Entry"
- **Batch Processing**: Accepts array of entries
- **Compliance Check**: Validates barcodes through Integrity Guard
- **GPS Validation**: Verifies coordinates are within farm boundaries

### API Endpoint

**POST** `/sync/field-entries`

**Request Body:**
```json
{
  "entries": [
    {
      "id": "offline-entry-123",
      "type": "PRSKANJE",
      "farmId": "estate-123",
      "fertilizerBarcode": "FERT-123456",
      "data": {
        "date": "2024-02-15",
        "location": { "lat": 44.7866, "lng": 20.4489 },
        "notes": "Applied fertilizer"
      },
      "createdAt": "2024-02-15T10:00:00Z",
      "deviceFingerprint": "device-abc123"
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
  "lateEntries": [
    {
      "id": "offline-entry-456",
      "reason": "Entry is 25.5 hours old (threshold: 24h)"
    }
  ],
  "failedEntries": [
    {
      "id": "offline-entry-789",
      "reason": "Barcode not on Bio-White-List"
    }
  ]
}
```

### Late Entry Logic

```typescript
// Entry is considered "late" if:
const hoursDiff = (now - entryDate) / (1000 * 60 * 60);
if (hoursDiff > 24) {
  // Mark as late entry
  // Create compliance log with status: PENDING
  // Requires admin review
}
```

---

## 🛡️ 2. Integrity Guard

### Purpose
Validates all inputs before database write. Blocks unauthorized chemicals and creates security alerts.

### Key Features
- **Barcode Validation**: Checks against Bio-White-List
- **GPS Validation**: Verifies coordinates within farm boundaries
- **Security Alerts**: Creates alerts for violations
- **Admin Notifications**: Notifies admins of security issues

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
   - Query `BioWhiteList` for barcode
   - If not found → Block + Create Security Alert
   - If inactive → Block + Create Security Alert

2. **Seed Check:**
   - Query `Seed` table for serial number
   - Validate seed assignment to farmer

3. **GPS Check:**
   - Verify coordinates within farm boundaries
   - If outside → Block + Create Security Alert

### Security Alert Types

- `UNAUTHORIZED_CHEMICAL` - Barcode not on white list
- `INACTIVE_CHEMICAL` - Barcode is inactive
- `GPS_VIOLATION` - Coordinates outside farm
- `LATE_ENTRY` - Entry older than 24 hours

### Middleware Usage

```typescript
// Apply to routes that accept barcode inputs
@UseGuards(IntegrityGuardMiddleware)
@Post('field-entries')
async createEntry(@Body() body) {
  // Input already validated by middleware
}
```

---

## 💰 3. Dynamic Pricing Service

### Purpose
Calculates seed prices in real-time based on farmer status and farm size.

### Pricing Logic

1. **Partner Discount:**
   - If `farmer.isVeraPartner == true`: 30% discount
   - Discount applies only up to limit: **200kg per hectare**
   - Everything above limit: Full price

2. **Calculation Steps:**
   ```
   Step 1: Get farmer profile and farm area
   Step 2: Calculate discount limit = farmAreaHectares × 200kg
   Step 3: If quantity <= limit:
            - All quantity gets discount
          Else:
            - Limit amount gets discount
            - Remaining gets full price
   ```

### API Endpoint

**GET** `/pricing/seed-price?quantity=500&seedType=Apple`

**Response:**
```json
{
  "farmerId": "farmer-123",
  "quantity": 500,
  "isPartner": true,
  "farmAreaHectares": 2.5,
  "discountLimit": 500,
  "discountEligibleQuantity": 500,
  "fullPriceQuantity": 0,
  "standardPricePerKg": 10.0,
  "partnerPricePerKg": 7.0,
  "discountAmount": 1500.0,
  "subtotal": 3500.0,
  "total": 3500.0,
  "breakdown": {
    "discounted": {
      "quantity": 500,
      "pricePerKg": 7.0,
      "subtotal": 3500.0
    },
    "fullPrice": {
      "quantity": 0,
      "pricePerKg": 10.0,
      "subtotal": 0.0
    }
  }
}
```

### Example Calculation

**Scenario:** Partner farmer, 2.5 hectares, wants 600kg seed

```
Farm Area: 2.5 hectares
Discount Limit: 2.5 × 200 = 500kg

Quantity: 600kg
- First 500kg: Partner price (7.0 EUR/kg) = 3,500 EUR
- Remaining 100kg: Standard price (10.0 EUR/kg) = 1,000 EUR
Total: 4,500 EUR
Discount: 1,500 EUR (on first 500kg)
```

---

## 🎁 4. Vera Bonus Calculator

### Purpose
Calculates bonus for farmers based on shipment quality (washed & sorted).

### Bonus Logic

- **Condition:** Shipment marked as `isWashedAndSorted = true`
- **Bonus:** Fixed **0.50 EUR per kg**
- **Calculation:** `bonus = quantity × 0.50`
- **Final Price:** `basePrice + bonus`

### API Endpoint

**POST** `/vera-bonus/calculate`

**Request Body:**
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

### Bonus Summary

**GET** `/vera-bonus/summary/:farmerId`

**Response:**
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

## 🔗 Integration Flow

### Complete Flow: Field Entry → Sync → Validation → Pricing → Bonus

```
1. Farmer enters data offline (IndexedDB)
   ↓
2. Sync when online → POST /sync/field-entries
   ↓
3. Integrity Guard validates barcode
   ↓
4. If valid → Create compliance log
   ↓
5. If invalid → Block + Create security alert
   ↓
6. Farmer purchases seed → GET /pricing/seed-price
   ↓
7. Dynamic pricing calculates price (partner discount)
   ↓
8. Shipment created → POST /vera-bonus/calculate
   ↓
9. If washed & sorted → Add bonus to final price
```

---

## 📊 Database Models

### SecurityAlert (Add to schema)

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

---

## ✅ Testing Examples

### Test 1: Late Entry Detection

```typescript
const entries = [{
  type: 'PRSKANJE',
  farmId: 'estate-123',
  createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
  // ...
}];

const result = await syncService.syncFieldEntries(entries, userId);
// result.late should be 1
// result.lateEntries[0].reason should contain "25 hours old"
```

### Test 2: Unauthorized Chemical Block

```typescript
const validation = await integrityGuard.validateInput({
  barcode: 'UNAUTHORIZED-123',
  barcodeType: 'FERTILIZER',
  userId: 'farmer-123',
  farmId: 'estate-123',
  entryType: 'PRSKANJE',
});

// validation.valid should be false
// validation.alertCreated should be true
// SecurityAlert should be created
```

### Test 3: Partner Pricing

```typescript
const pricing = await pricingService.calculateSeedPrice(
  'partner-farmer-123',
  600, // 600kg
  'Apple'
);

// pricing.isPartner should be true
// pricing.discountEligibleQuantity should be 500 (if farm is 2.5ha)
// pricing.fullPriceQuantity should be 100
```

### Test 4: Vera Bonus

```typescript
const bonus = await bonusService.calculateBonus(
  'shipment-123',
  true // washed & sorted
);

// bonus.totalBonus should be quantity × 0.50
// Shipment.veraBonusAmount should be updated
```

---

## 🚀 Next Steps

1. **Add SecurityAlert model** to schema.prisma
2. **Run migration** for new models
3. **Test all services** with sample data
4. **Integrate with frontend** for offline sync
5. **Setup monitoring** for security alerts

---

**All services are fully documented with TypeScript comments and ready for integration.**
