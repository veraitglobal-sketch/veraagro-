# 🏗️ BioVera.app - Architecture Design Document (ADD)

**Version:** 1.0  
**Date:** 2024-02-15  
**Status:** ✅ Active Blueprint

---

## 📋 Executive Summary

This document defines the technical architecture for BioVera.app, a complete ecosystem connecting Balkan farmers with Hamburg retail. The system ensures transparency, quality, and fair compensation through offline-first design, integrity guards, and real-time tracking.

---

## 🎯 System Overview

### Core Mission
Connect Balkan farmers with Hamburg retail through:
1. **Vertical Chain:** Seed → Insurance → Cultivation → Packaging → Logistics → Retail
2. **Offline-First:** Works without internet, syncs when available
3. **Integrity Guard:** Barcode + GPS validation for compliance
4. **Transparency:** QR codes, real-time maps, public profiles
5. **Financial Accuracy:** Complete profit calculations with all margins

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web App    │  │  Mobile App  │  │  Public QR   │ │
│  │  (Next.js)   │  │  (React Nav) │  │   Pages      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          │ HTTP/REST API    │ HTTP/REST API    │ HTTP/REST API
          │ JWT Auth         │ JWT Auth         │ Public
┌─────────┼──────────────────┼──────────────────┼─────────┐
│         │                  │                  │         │
│         ▼                  ▼                  ▼         │
│              APPLICATION LAYER (NestJS)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Auth Module │ Compliance │ Logistics │ Finance │  │
│  │  Field Entry │ Material   │ Optimizer │ Tax     │  │
│  │  Quality     │ Control    │ Market    │ Export  │  │
│  └──────────────────────────────────────────────────┘  │
│         │                  │                  │         │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          │ Prisma ORM       │ IndexedDB        │ SQLite
          │                  │ (Web Offline)     │ (Mobile Offline)
┌─────────┼──────────────────┼──────────────────┼─────────┐
│         ▼                  ▼                  ▼         │
│              DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PostgreSQL (Supabase) - Primary Database         │  │
│  │  IndexedDB - Web Offline Storage                  │  │
│  │  SQLite - Mobile Offline Storage                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Module Integration Map

### 1. Database Module (Foundation)

**Purpose:** Central data storage and access layer

**Key Models:**
- `User` - Multi-role users (Farmer, Admin, Logistic, Buyer)
- `Estate` - Farms with GPS boundaries
- `SeedBatch` - Seeds with partner/standard pricing
- `InsurancePolicy` - Insurance with commission tracking
- `Batch` - Products with QR codes
- `Order` - Orders with payment splits
- `BioWhiteList` - Approved chemicals

**API Endpoints:**
- `GET /users/:id` - Get user with roles
- `GET /estates/:id` - Get farm with boundaries
- `GET /seed-batches` - List seeds with pricing
- `GET /insurance-policies` - List insurance policies

**Integration Points:**
- Used by ALL modules
- Prisma ORM for type-safe access
- IndexedDB/SQLite for offline storage

---

### 2. Compliance Module (Integrity Guard)

**Purpose:** Validate barcodes and GPS, block unauthorized chemicals

**Key Functions:**
- `checkCompliance(barcode, userId, farmId)` - Validate barcode
- `validateGPS(lat, lng, farmId)` - Check GPS within boundaries
- `sendComplianceAlert(violation)` - Alert admin

**API Endpoints:**
- `POST /compliance/check` - Check barcode compliance
- `POST /compliance/validate-gps` - Validate GPS coordinates
- `GET /compliance/white-list` - Get approved chemicals

**Integration Points:**
- **Field Entry Module:** Validates every field entry
- **Material Control Module:** Validates packaging materials
- **Database Module:** Queries `BioWhiteList`

**Data Flow:**
```
Field Entry → Compliance Check → BioWhiteList Query → Allow/Block
```

---

### 3. Field Entry Module (Offline-First)

**Purpose:** Capture field data offline, sync when online

**Key Functions:**
- `createEntry(type, data, barcode)` - Create offline entry
- `syncEntries()` - Sync all unsynced entries
- `validateEntry(entry)` - Validate before sync

**API Endpoints:**
- `POST /field-entries` - Create entry (with compliance check)
- `GET /field-entries` - List entries
- `POST /field-entries/sync` - Manual sync

**Integration Points:**
- **Compliance Module:** Validates barcode and GPS
- **Database Module:** Stores entries in PostgreSQL
- **IndexedDB/SQLite:** Offline storage

**Data Flow:**
```
User Input → IndexedDB (Offline) → Compliance Check → Sync → PostgreSQL
```

---

### 4. Material Control Module (Packaging Standards)

**Purpose:** Track Bio Vera materials, verify compliance photos

**Key Functions:**
- `checkMaterialBalance(farmerId)` - Check available materials
- `verifyCompliancePhotos(batchId)` - Verify photos
- `calculateWorkBonus(batchId)` - Calculate bonus

**API Endpoints:**
- `GET /material-control/balance/:farmerId` - Get material balance
- `POST /material-control/compliance-photos` - Upload photos
- `GET /material-control/bonus/:batchId` - Calculate bonus

**Integration Points:**
- **Compliance Module:** Validates material barcodes
- **Database Module:** Tracks `MaterialInventory`, `FarmerMaterialBalance`
- **Payment Module:** Adds bonus to farmer payout

**Data Flow:**
```
Material Purchase → Inventory Update → Compliance Check → Bonus Calculation → Payment
```

---

### 5. Logistics Module (Transport & Routing)

**Purpose:** Optimize routes, track deliveries, predict harvest

**Key Functions:**
- `predictHarvestReadiness(villageCluster)` - Predict harvest date
- `generateLoadPlan(batches)` - Optimize pallet arrangement
- `checkWeatherAndAdjustRoute(route)` - Weather-aware routing

**API Endpoints:**
- `POST /logistics-optimizer/predict-harvest` - Predict harvest
- `POST /logistics-optimizer/generate-load-plan` - Generate load plan
- `POST /logistics-optimizer/check-weather` - Check weather

**Integration Points:**
- **Database Module:** Queries `Batch`, `Estate` for harvest data
- **Market Scraper Module:** Uses price data for optimization
- **External API:** OpenWeatherMap for weather

**Data Flow:**
```
Harvest Entries → Village Clustering → Harvest Prediction → Load Plan → Weather Check → Route Optimization
```

---

### 6. Market Scraper Module (Price Intelligence)

**Purpose:** Scrape market prices, calculate margins, send alerts

**Key Functions:**
- `scrapePrices(cropType)` - Scrape prices from websites
- `calculateMargin(cropType, costs)` - Calculate profit margin
- `sendPriceAlert(change)` - Alert on significant changes

**API Endpoints:**
- `POST /market-scraper/scrape` - Manual scrape
- `GET /market-scraper/latest-prices` - Get latest prices
- `GET /market-scraper/calculate-margin` - Calculate margin

**Integration Points:**
- **Database Module:** Stores `ScrapedPrice`, `PriceAlert`
- **Logistics Module:** Uses prices for optimization
- **Financial Module:** Uses prices for profit calculation

**Data Flow:**
```
Web Scraping → Price Storage → Margin Calculation → Alert (if >5% change)
```

---

### 7. Financial Module (Profit & Tax)

**Purpose:** Calculate profits, separate VAT, generate tax reports

**Key Functions:**
- `calculateTaxSeparation(orderId)` - Separate Balkan/German costs
- `calculateProfit(orderId)` - Calculate total profit
- `generateTaxReport(period)` - Generate tax report

**API Endpoints:**
- `POST /export-automator/tax-calculation/:orderId` - Calculate tax
- `POST /export-automator/tax-report` - Generate report
- `GET /payments/:orderId` - Get payment details

**Integration Points:**
- **Database Module:** Queries `Order`, `MarketPrice`, `Transaction`
- **Material Control Module:** Includes work bonus
- **Export Automator Module:** Generates tax documents

**Data Flow:**
```
Order → Market Price → Seed Margin → Insurance Commission → Transport Costs → Tax Separation → Profit Calculation
```

---

### 8. QR Code & Transparency Module

**Purpose:** Generate QR codes, public product profiles, real-time tracking

**Key Functions:**
- `generateQRCode(batchId)` - Generate unique QR code
- `getProductProfile(batchId)` - Get public profile data
- `getRealTimeTracking(batchId)` - Get live location

**API Endpoints:**
- `GET /qr/generate/:batchId` - Generate QR code
- `GET /verify/:batchId` - Public product profile
- `GET /batch-history/:batchId` - Complete batch history

**Integration Points:**
- **Database Module:** Queries `Batch`, `LocationLog`, `TemperatureLog`
- **Map Module:** Displays real-time location
- **Public Pages:** No authentication required

**Data Flow:**
```
Batch Creation → QR Generation → Public Profile → Real-Time Tracking → Map Display
```

---

## 🔗 Module Communication Patterns

### 1. Synchronous API Calls (REST)

**Use Case:** Real-time operations, user interactions

**Example:**
```typescript
// Field Entry → Compliance Check
const compliance = await complianceService.checkCompliance(barcode, userId, farmId);
if (!compliance.compliant) {
  throw new Error('Unauthorized chemical');
}
```

### 2. Event-Driven (Future: Message Queue)

**Use Case:** Background processing, notifications

**Example:**
```typescript
// Compliance Violation → Admin Alert
complianceService.sendComplianceAlert(violation); // Async, non-blocking
```

### 3. Database Triggers (Prisma)

**Use Case:** Automatic calculations, cascading updates

**Example:**
```prisma
// Order Status Change → Payment Release
// Handled in service layer, not database
```

### 4. Offline Queue (IndexedDB/SQLite)

**Use Case:** Offline operations, sync when online

**Example:**
```typescript
// Field Entry → IndexedDB → Sync Queue → API → PostgreSQL
await saveToIndexedDB(entry);
await syncWhenOnline();
```

---

## 📊 Data Flow Diagrams

### Vertical Chain Flow

```
┌─────────┐
│  Seed   │ → Partner/Standard Pricing
└────┬────┘
     │
     ▼
┌─────────────┐
│ Insurance   │ → Commission Tracking
└────┬────────┘
     │
     ▼
┌─────────────┐
│ Cultivation │ → Bio-Compliance (Barcode + GPS)
└────┬────────┘
     │
     ▼
┌─────────────┐
│ Packaging   │ → Material Verification → Work Bonus
└────┬────────┘
     │
     ▼
┌─────────────┐
│ Logistics   │ → Route Optimization → Weather Check
└────┬────────┘
     │
     ▼
┌─────────────┐
│ Hamburg     │ → Retail → QR Verification
└─────────────┘
```

### Offline-First Flow

```
┌──────────────┐
│ User Input   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ IndexedDB    │ ← Offline Storage
│ (Web)        │
│ SQLite       │ ← Mobile Storage
│ (Mobile)     │
└──────┬───────┘
       │
       │ Internet Detected
       ▼
┌──────────────┐
│ Sync Queue   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Compliance   │ ← Barcode + GPS Validation
│ Check        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ PostgreSQL   │ ← Primary Database
└──────────────┘
```

### Financial Calculation Flow

```
┌──────────────┐
│ Order        │
└──────┬───────┘
       │
       ├─→ Seed Margin (Partner vs Standard)
       ├─→ Insurance Commission
       ├─→ Transport Costs (Balkan + German)
       ├─→ Work Bonus (Material Compliance)
       │
       ▼
┌──────────────┐
│ Tax          │
│ Separation   │
└──────┬───────┘
       │
       ├─→ Balkan Costs (No VAT)
       ├─→ German Costs (19% VAT)
       │
       ▼
┌──────────────┐
│ Profit       │
│ Calculation  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Payment      │
│ Split        │
└──────────────┘
```

---

## 🔐 Security Architecture

### Authentication & Authorization

1. **JWT Tokens:**
   - Access token (short-lived)
   - Refresh token (long-lived)
   - Stored in localStorage (web) / SecureStore (mobile)

2. **Role-Based Access:**
   - Multiple roles per user
   - Guards check role array
   - Fine-grained permissions

3. **GPS Validation:**
   - Every field entry requires GPS
   - GPS must be within farm boundaries
   - Prevents remote manipulation

4. **Device Fingerprinting:**
   - Unique device ID
   - Stored with each entry
   - Prevents duplicate submissions

5. **Rate Limiting:**
   - Throttle API calls
   - Prevent abuse
   - Configurable per endpoint

---

## 🚀 Performance Optimization

### Database

1. **Indexes:**
   - Composite indexes for frequent queries
   - Covering indexes for read-heavy operations
   - Geospatial indexes for location queries

2. **Caching:**
   - In-memory cache for distributor data
   - Redis (production) for shared cache
   - Browser cache for static assets

3. **Query Optimization:**
   - Select only needed fields
   - Use pagination for large datasets
   - Batch operations where possible

### Frontend

1. **Code Splitting:**
   - Dynamic imports for heavy components
   - Lazy loading for routes
   - Tree shaking for unused code

2. **Offline Support:**
   - Service workers for caching
   - IndexedDB for data storage
   - Background sync

3. **Performance Targets:**
   - Map load: <1s
   - Form submission: <200ms
   - Page load: <2s

---

## 📱 Platform-Specific Considerations

### Web (Next.js)

- **Offline Storage:** IndexedDB
- **Sync:** Background sync API
- **PWA:** Service workers, offline support
- **Responsive:** Mobile-first design

### Mobile (React Native)

- **Offline Storage:** SQLite
- **Sync:** Background task scheduling
- **Native Features:** Camera, GPS, Haptic feedback
- **Platform:** iOS + Android

---

## 🧪 Testing Strategy

### Unit Tests
- Service functions
- Utility functions
- Business logic

### Integration Tests
- API endpoints
- Database operations
- Module interactions

### E2E Tests
- Complete user flows
- Offline/online transitions
- Compliance checks

---

## 📈 Monitoring & Observability

### Health Checks
- `/health` - Basic health
- `/health/detailed` - Detailed metrics

### Logging
- Structured logging
- Error tracking
- Performance monitoring

### Metrics
- API response times
- Database query times
- Sync success rates
- Compliance violations

---

## 🔄 Deployment Architecture

### Development
- Local PostgreSQL (Docker)
- Local backend (NestJS)
- Local frontend (Next.js)

### Staging
- Supabase (PostgreSQL)
- Vercel (Frontend)
- Railway/Render (Backend)

### Production
- Supabase Pro (PostgreSQL + Read Replicas)
- Vercel (Frontend + CDN)
- AWS/Railway (Backend + Load Balancer)
- Redis (Caching)

---

## 📝 Next Steps

1. **Database Schema Finalization:**
   - Review all models
   - Add missing indexes
   - Create migration

2. **Module Implementation:**
   - Start with Database Module
   - Then Compliance Module
   - Then Field Entry Module
   - Continue with remaining modules

3. **Integration Testing:**
   - Test module interactions
   - Test offline/online transitions
   - Test compliance checks

4. **Performance Testing:**
   - Load testing
   - Stress testing
   - Optimization

---

## ✅ Architecture Checklist

- [x] Master System Prompt (.cursorrules)
- [x] Architecture Design Document
- [x] Module Integration Map
- [x] Data Flow Diagrams
- [x] Security Architecture
- [x] Performance Optimization
- [ ] Database Schema Finalization
- [ ] Module Implementation
- [ ] Integration Testing
- [ ] Performance Testing

---

**This document is a living blueprint. Update it as the system evolves.**
