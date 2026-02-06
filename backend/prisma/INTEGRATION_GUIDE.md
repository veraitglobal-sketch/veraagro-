# 🔗 BioVera Core Schema Integration Guide

## 📋 Overview

This guide explains how to integrate the new BioVera Core Schema models with existing models in `schema.prisma`.

---

## 🔄 Required Relations to Add

### 1. User Model Relations

Add these relations to the existing `User` model:

```prisma
model User {
  // ... existing fields ...
  
  // BioVera Core Relations
  farmerProfile      FarmerProfile?      @relation("FarmerProfile")
  complianceLogs     ComplianceLog[]     @relation("ComplianceLogs")
  insurancePolicies  InsurancePolicy[]  @relation("InsurancePolicies")
  shipments          Shipment[]          @relation("Shipments")
}
```

### 2. Estate Model Relations

Add these relations to the existing `Estate` model:

```prisma
model Estate {
  // ... existing fields ...
  
  // BioVera Core Relations
  complianceLogs    ComplianceLog[]    @relation("ComplianceLogs")
  insurancePolicies InsurancePolicy[]  @relation("InsurancePolicies")
  shipments         Shipment[]         @relation("Shipments")
}
```

### 3. Parcel Model Relations

Add these relations to the existing `Parcel` model:

```prisma
model Parcel {
  // ... existing fields ...
  
  // BioVera Core Relations
  seedInventory     SeedInventory?     @relation("SeedParcel")
  complianceLogs    ComplianceLog[]   @relation("ComplianceLogs")
  insurancePolicies InsurancePolicy[] @relation("InsurancePolicies")
}
```

### 4. Hub Model Relations

Add these relations to the existing `Hub` model:

```prisma
model Hub {
  // ... existing fields ...
  
  // BioVera Core Relations
  shipments Shipment[] @relation("ShipmentHubs")
}
```

### 5. Batch Model Relations

Add these relation to the existing `Batch` model:

```prisma
model Batch {
  // ... existing fields ...
  
  // BioVera Core Relations
  products Product[] @relation("ProductBatches")
}
```

---

## 📊 Complete Traceability Chain

### Seed → Product Flow

```
SeedInventory (batch_number, serial_number)
    ↓ (assigned to)
SeedAssignment (assignedToFarmerId, assignedToEstateId)
    ↓ (planted in)
Parcel (plantedParcelId)
    ↓ (harvested as)
Shipment (seedInventoryId, harvestedAt)
    ↓ (packed as)
Product (shipmentId, seedInventoryId, qrCodeId)
    ↓ (delivered to)
Retail Location (currentRetailLocation, currentRetailChain)
```

### Query Example: Find seed for a product in Hamburg

```typescript
// Find the seed that produced a product sold in Hamburg
const product = await prisma.product.findUnique({
  where: { qrCodeId: 'QR-123' },
  include: {
    seedInventory: {
      include: {
        seedAssignments: {
          include: {
            // Get farmer who received the seed
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

// Complete traceability:
// Product → Seed → Farmer → Estate → Parcel
```

---

## 🔍 Key Indexes for Performance

### Critical Indexes (Already in schema)

1. **Seed Traceability:**
   - `seed_inventory.batch_number` (unique)
   - `seed_inventory.serial_number` (unique)
   - `shipments.seed_inventory_id` (for reverse lookup)
   - `products.seed_inventory_id` (for reverse lookup)

2. **Compliance:**
   - `compliance_logs.scanned_barcode` (for white-list checks)
   - `compliance_logs.farmer_id + estate_id` (composite)
   - `compliance_logs.synced` (for offline sync)

3. **Shipment Tracking:**
   - `shipments.qr_code_id` (unique, for public access)
   - `shipments.status` (for filtering)
   - `shipments.harvested_at` (for timeline queries)

---

## 🚀 Migration Steps

### Step 1: Add New Models

1. Copy models from `schema.biovera-core.prisma` to `schema.prisma`
2. Add relations to existing models (see above)

### Step 2: Create Migration

```bash
cd backend
npx prisma migrate dev --name add_biovera_core_schema
```

### Step 3: Create Views (Optional)

Run SQL from `schema.integration.sql`:

```bash
psql $DATABASE_URL -f prisma/schema.integration.sql
```

Or use Prisma's `$executeRaw`:

```typescript
await prisma.$executeRaw`
  CREATE OR REPLACE VIEW seed_to_retail_traceability AS ...
`;
```

### Step 4: Verify Traceability

Test complete traceability:

```typescript
// Test: Can we trace a product back to its seed?
const trace = await prisma.$queryRaw`
  SELECT * FROM seed_to_retail_traceability 
  WHERE product_qr = 'QR-123'
`;
```

---

## ✅ Integration Checklist

- [ ] Copy models from `schema.biovera-core.prisma` to `schema.prisma`
- [ ] Add relations to `User` model
- [ ] Add relations to `Estate` model
- [ ] Add relations to `Parcel` model
- [ ] Add relations to `Hub` model
- [ ] Add relations to `Batch` model
- [ ] Run migration
- [ ] Create PostgreSQL views (optional)
- [ ] Test traceability queries
- [ ] Update API endpoints to use new models
- [ ] Update frontend to use new data structure

---

## 📝 Notes

1. **Offline Support:**
   - `ComplianceLog` has `synced` field for offline entries
   - `offlineId` stores local ID before sync

2. **Traceability:**
   - Every `Product` must have `seedInventoryId`
   - Every `Shipment` must have `seedInventoryId`
   - This ensures complete chain from seed to retail

3. **Performance:**
   - Use views for complex traceability queries
   - Indexes on foreign keys for fast lookups
   - Composite indexes for common query patterns

---

## 🔗 Related Documents

- `schema.biovera-core.prisma` - New models
- `schema.integration.sql` - PostgreSQL views
- `ARCHITECTURE_DESIGN_DOCUMENT.md` - System architecture
- `.cursorrules` - Master System Prompt
