# 🗄️ BioVera Core Schema - Complete Database Architecture

## 📋 Overview

This schema provides **complete traceability** from seed to Hamburg retail. Every apple in Hamburg can be traced back to the seed planted 6 months ago.

---

## 🔗 Complete Traceability Chain

```
SeedInventory (batch_number, serial_number)
    ↓
SeedAssignment (assignedToFarmerId, assignedToEstateId)
    ↓
Parcel (plantedParcelId, plantingDate)
    ↓
ComplianceLog (fertilizer scans, GPS validation)
    ↓
Shipment (harvestedAt, seedInventoryId)
    ↓
Product (qrCodeId, seedInventoryId, currentRetailLocation)
    ↓
Hamburg Retail (soldAt)
```

**Key:** Every `Product` and `Shipment` has `seedInventoryId` - ensuring complete traceability.

---

## 📊 Model Details

### 1. FarmerProfile

**Purpose:** Extended farmer information with partner status and trust score

**Key Fields:**
- `isVeraPartner` - Gets seed discount
- `currentTrustScore` - Current score (0-100)
- `totalBonusEarned` - Accumulated Vera Bonus

**Relations:**
- `User` (1:1)
- `TrustScoreHistory[]` (1:many)

**Example Query:**
```typescript
const farmer = await prisma.farmerProfile.findUnique({
  where: { userId: 'farmer-123' },
  include: {
    user: true,
    trustScoreHistory: {
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  }
});
```

---

### 2. SeedInventory

**Purpose:** Track all seed batches with pricing and assignment

**Key Fields:**
- `batchNumber` - Human-readable: SEED-2024-001
- `serialNumber` - Unique for barcode scanning
- `standardPrice` - Full price
- `partnerPrice` - Discounted price for partners
- `assignedToFarmerId` - Who received the seed
- `plantedParcelId` - Where seed was planted

**Relations:**
- `SeedAssignment[]` (1:many)
- `Shipment[]` (1:many) - **CRITICAL for traceability**
- `Product[]` (1:many) - **CRITICAL for traceability**

**Example Query:**
```typescript
// Find all products from a specific seed batch
const seed = await prisma.seedInventory.findUnique({
  where: { batchNumber: 'SEED-2024-001' },
  include: {
    shipments: {
      include: {
        products: {
          where: { status: 'IN_RETAIL' }
        }
      }
    }
  }
});
```

---

### 3. ComplianceLog

**Purpose:** Offline-ready compliance tracking (barcode, GPS, photos)

**Key Fields:**
- `scannedBarcode` - Barcode of fertilizer/seed/packaging
- `isCompliant` - Passed Bio-White-List check
- `gpsLatitude`, `gpsLongitude` - GPS coordinates
- `isWithinFarm` - GPS validation
- `photos` - Array of photo URLs
- `synced` - Offline sync status
- `offlineId` - Local ID before sync

**Relations:**
- `User` (farmer)
- `Estate`
- `Parcel` (optional)

**Example Query:**
```typescript
// Get unsynced compliance logs (for offline sync)
const unsynced = await prisma.complianceLog.findMany({
  where: { synced: false },
  orderBy: { createdAt: 'asc' }
});
```

---

### 4. InsurancePolicy

**Purpose:** Track insurance policies with commission

**Key Fields:**
- `policyNumber` - Unique policy identifier
- `coverageAmount` - Total coverage
- `commissionRate` - Platform commission (e.g., 0.05 for 5%)
- `commissionAmount` - Calculated commission
- `farmerId`, `estateId`, `parcelId` - Coverage scope

**Relations:**
- `User` (farmer)
- `Estate` (optional)
- `Parcel` (optional)
- `InsuranceClaim[]` (1:many)

**Example Query:**
```typescript
// Calculate total commission from insurance
const totalCommission = await prisma.insurancePolicy.aggregate({
  where: { isActive: true },
  _sum: { commissionAmount: true }
});
```

---

### 5. Shipment

**Purpose:** Complete journey from harvest to Hamburg

**Key Fields:**
- `shipmentNumber` - SHIP-2024-001
- `qrCodeId` - QR code for public tracking
- `seedInventoryId` - **CRITICAL: Link to original seed**
- `harvestedAt` - When harvested
- `status` - PACKED, IN_TRANSIT, AT_HUB, DELIVERED, IN_RETAIL
- `veraBonusAmount` - Calculated bonus
- `veraBonusPaid` - Payment status

**Relations:**
- `User` (farmer)
- `Estate`
- `SeedInventory` - **CRITICAL for traceability**
- `Hub` (current location)
- `Product[]` (1:many)
- `LocationLog[]` (1:many)
- `TemperatureLog[]` (1:many)

**Example Query:**
```typescript
// Trace shipment back to seed
const shipment = await prisma.shipment.findUnique({
  where: { qrCodeId: 'QR-123' },
  include: {
    seedInventory: {
      include: {
        seedAssignments: {
          include: {
            // Get farmer who received seed
          }
        }
      }
    },
    farmer: true,
    estate: true,
    products: true
  }
});
```

---

### 6. Product

**Purpose:** Final product in retail with QR code

**Key Fields:**
- `productCode` - Product SKU
- `qrCodeId` - QR code for public verification
- `seedInventoryId` - **CRITICAL: Link to original seed**
- `shipmentId` - Link to shipment
- `currentRetailLocation` - Store location
- `currentRetailChain` - "Rewe", "Edeka", etc.
- `publicProfileData` - JSON for QR code page

**Relations:**
- `Shipment`
- `SeedInventory` - **CRITICAL for traceability**
- `Batch` (optional)

**Example Query:**
```typescript
// Complete traceability: Product → Seed
const product = await prisma.product.findUnique({
  where: { qrCodeId: 'QR-123' },
  include: {
    seedInventory: {
      include: {
        seedAssignments: {
          include: {
            // Farmer who received seed
          }
        }
      }
    },
    shipment: {
      include: {
        farmer: true,
        estate: true
      }
    }
  }
});
```

---

## 🔍 Traceability Queries

### Query 1: Find seed for a product in Hamburg

```typescript
const trace = await prisma.product.findUnique({
  where: { 
    qrCodeId: 'QR-123',
    currentRetailChain: 'Rewe'
  },
  include: {
    seedInventory: {
      include: {
        seedAssignments: {
          include: {
            // Assignment details
          }
        }
      }
    },
    shipment: {
      include: {
        farmer: {
          include: {
            farmerProfile: true
          }
        },
        estate: true
      }
    }
  }
});

// Complete chain:
// Product → SeedInventory → SeedAssignment → Farmer → Estate
```

### Query 2: Find all products from a seed batch

```typescript
const products = await prisma.product.findMany({
  where: {
    seedInventory: {
      batchNumber: 'SEED-2024-001'
    },
    status: { in: ['IN_RETAIL', 'SOLD'] }
  },
  include: {
    shipment: {
      include: {
        farmer: true,
        estate: true
      }
    }
  }
});
```

### Query 3: Use PostgreSQL View for fast traceability

```typescript
// Using the view from schema.integration.sql
const trace = await prisma.$queryRaw`
  SELECT * FROM seed_to_retail_traceability
  WHERE product_qr = 'QR-123'
`;
```

---

## 📈 Performance Optimization

### Indexes

**Critical Indexes for Traceability:**
- `seed_inventory.batch_number` (unique)
- `seed_inventory.serial_number` (unique)
- `shipments.seed_inventory_id` - **CRITICAL**
- `products.seed_inventory_id` - **CRITICAL**
- `products.qr_code_id` (unique) - For public access
- `shipments.qr_code_id` (unique) - For public access

**Composite Indexes:**
- `compliance_logs(farmer_id, estate_id, synced)` - For sync queries
- `shipments(seed_inventory_id, status)` - For traceability filtering

### Views

**PostgreSQL Views (from schema.integration.sql):**
1. `seed_to_retail_traceability` - Complete traceability chain
2. `compliance_summary` - Compliance statistics per farmer
3. `vera_bonus_summary` - Bonus calculations per farmer

---

## 🔄 Integration with Existing Models

### Add to User Model:

```prisma
model User {
  // ... existing fields ...
  
  // BioVera Core Relations
  farmerProfile      FarmerProfile?      @relation("FarmerProfile")
  complianceLogs     ComplianceLog[]     @relation("ComplianceLogs")
  insurancePolicies  InsurancePolicy[]    @relation("InsurancePolicies")
  shipments          Shipment[]          @relation("Shipments")
}
```

### Add to Estate Model:

```prisma
model Estate {
  // ... existing fields ...
  
  // BioVera Core Relations
  complianceLogs    ComplianceLog[]    @relation("ComplianceLogs")
  insurancePolicies InsurancePolicy[] @relation("InsurancePolicies")
  shipments         Shipment[]         @relation("Shipments")
}
```

### Add to Parcel Model:

```prisma
model Parcel {
  // ... existing fields ...
  
  // BioVera Core Relations
  seedInventory     SeedInventory?     @relation("SeedParcel")
  complianceLogs    ComplianceLog[]    @relation("ComplianceLogs")
  insurancePolicies InsurancePolicy[]  @relation("InsurancePolicies")
}
```

### Add to Hub Model:

```prisma
model Hub {
  // ... existing fields ...
  
  // BioVera Core Relations
  shipments Shipment[] @relation("ShipmentHubs")
}
```

### Add to Batch Model:

```prisma
model Batch {
  // ... existing fields ...
  
  // BioVera Core Relations
  products Product[] @relation("ProductBatches")
}
```

---

## ✅ Migration Steps

1. **Copy models** from `schema.biovera-core.prisma` to `schema.prisma`
2. **Add relations** to existing models (see above)
3. **Run migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_biovera_core_schema
   ```
4. **Create views** (optional):
   ```bash
   psql $DATABASE_URL -f prisma/schema.integration.sql
   ```
5. **Verify traceability:**
   ```typescript
   // Test query
   const test = await prisma.product.findFirst({
     include: { seedInventory: true }
   });
   console.log('Traceability works:', test?.seedInventory?.batchNumber);
   ```

---

## 🎯 Success Criteria

✅ **Complete Traceability:**
- Every product in Hamburg can be traced to its seed
- Query time < 100ms for traceability queries
- All foreign keys properly indexed

✅ **Offline Support:**
- ComplianceLog has `synced` field
- `offlineId` for local storage
- Auto-sync when online

✅ **Financial Accuracy:**
- Seed pricing (partner vs standard) tracked
- Insurance commission calculated
- Vera Bonus tracked per shipment

---

## 📝 Next Steps

1. Integrate models into main `schema.prisma`
2. Run migration
3. Update API endpoints to use new models
4. Update frontend to display traceability
5. Test complete chain: Seed → Product

---

**This schema ensures complete traceability from seed to Hamburg retail, fulfilling the BioVera Blueprint requirements.**
