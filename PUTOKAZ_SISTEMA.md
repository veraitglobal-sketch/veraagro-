# 🗺️ Bio Vera - Putokaz Sistema

## 📋 Sadržaj

1. [Pregled Arhitekture](#pregled-arhitekture)
2. [Tehnološki Stack](#tehnološki-stack)
3. [Role-Based Sistem](#role-based-sistem)
4. [Glavni Flow-ovi](#glavni-flow-ovi)
5. [Ključne Funkcionalnosti](#ključne-funkcionalnosti)
6. [API Struktura](#api-struktura)
7. [Baza Podataka](#baza-podataka)
8. [Frontend Struktura](#frontend-struktura)

---

## 🏗️ Pregled Arhitekture

### Tri Sloja Sistema

```
┌─────────────────────────────────────────┐
│         FRONTEND (Next.js)              │
│  - Web aplikacija za sve role           │
│  - Login/Auth                           │
│  - Role-based dashboards                │
│  - Public stranice (verify, certificate)│
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
               │ JWT Authentication
┌──────────────▼──────────────────────────┐
│      BACKEND (NestJS)                   │
│  - REST API endpoints                   │
│  - Business logic                       │
│  - Authentication & Authorization       │
│  - Real-time tracking                   │
│  - Command & Control system             │
└──────────────┬──────────────────────────┘
               │ Prisma ORM
               │ PostgreSQL
┌──────────────▼──────────────────────────┐
│    DATABASE (Supabase PostgreSQL)      │
│  - User management                      │
│  - Orders & Deliveries                 │
│  - Batches & Traceability              │
│  - Trust Scores & Audit Trails         │
└─────────────────────────────────────────┘
```

### Komunikacija

- **Frontend ↔ Backend**: REST API sa JWT token autentifikacijom
- **Backend ↔ Database**: Prisma ORM (type-safe database access)
- **Real-time**: WebSocket ili polling za live updates

---

## 🛠️ Tehnološki Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Maps**: Leaflet.js
- **HTTP Client**: Axios
- **Language**: TypeScript

### Backend
- **Framework**: NestJS (Node.js/Express)
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator
- **Language**: TypeScript

### Database
- **Provider**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Migrations**: Prisma Migrate

---

## 👥 Role-Based Sistem

### Dostupne Role

| Role | Opis | Ključne Funkcionalnosti |
|------|------|------------------------|
| **GROWER** | Poljoprivredni proizvođač | - Quality Entry form<br>- Material management<br>- Mission tracker<br>- Compliance photos |
| **LOGISTICS_PARTNER** | Transport firma | - Mission acceptance<br>- Temperature logging<br>- Route tracking<br>- Handover verification |
| **COORDINATOR** | Koordinator kvaliteta | - Quality verification<br>- Batch locking<br>- Temperature alerts |
| **BUYER** | Kupac (retail chain) | - Ordering<br>- Order tracking<br>- Batch verification |
| **SUPER_ADMIN** | Super administrator | - Price management<br>- Trust score management<br>- Kill switch<br>- Global monitoring |
| **FARMER** | Farmer (legacy) | - Estate management<br>- Seed scanning |
| **DRIVER** | Vozač | - Delivery management<br>- QR scanning |
| **HUB_MANAGER** | Menadžer distributivnog centra | - Cross-docking<br>- Inventory management |

### Multiple Roles per User

Jedan korisnik može imati **više role-ova** istovremeno:
- Npr: `[GROWER, LOGISTICS_PARTNER]` - korisnik može i da proizvodi i da transportuje

---

## 🔄 Glavni Flow-ovi

### 1. Flow: Od Polja do Supermarketa

```
┌─────────┐
│ GROWER  │
│         │
│ 1. Harvest
│ 2. Quality Entry
│ 3. Material Check
│ 4. Ready for Pickup
└────┬────┘
     │
     │ Creates Mission
     ▼
┌─────────────────┐
│ SYSTEM          │
│                 │
│ - Finds nearest │
│   logistics     │
│ - Creates batch │
│ - Assigns route │
└────┬────────────┘
     │
     │ Mission Assignment
     ▼
┌──────────────────────┐
│ LOGISTICS_PARTNER   │
│                      │
│ 1. Accept mission    │
│ 2. Pickup batch      │
│ 3. Log temperature   │
│ 4. Transport         │
│ 5. Handover          │
└────┬─────────────────┘
     │
     │ Delivery
     ▼
┌──────────────┐
│ HUB/DIST     │
│              │
│ - Arrival    │
│ - Storage    │
│ - Dispatch   │
└────┬─────────┘
     │
     │ Last Mile
     ▼
┌──────────┐
│ BUYER    │
│          │
│ - Receive│
│ - Verify │
│ - Pay    │
└──────────┘
```

### 2. Quality Entry Flow (Grower)

```
1. GROWER harvests crop
   ↓
2. Opens Quality Entry form
   ↓
3. Enters:
   - Weather data (temp, humidity, cloud cover)
   - Pre-cooling start time
   - Uploads 3 compliance photos
   - Confirms Bio Vera standard compliance
   ↓
4. System validates:
   - Material balance check
   - Photo verification
   - Standard compliance
   ↓
5. Batch created with "READY_FOR_PICKUP" status
   ↓
6. Mission automatically created
```

### 3. Mission & Logistics Flow

```
1. GROWER clicks "Ready for Pickup"
   ↓
2. SYSTEM:
   - Finds nearest LOGISTICS_PARTNER with Frigo vehicle
   - Calculates optimal route
   - Creates Mission
   - Sends notification
   ↓
3. LOGISTICS_PARTNER:
   - Receives notification
   - Accepts mission
   - Drives to farm
   ↓
4. At Farm:
   - Driver enters truck temperature
   - System validates (must match standard)
   - Batch loaded
   - Mission status: IN_TRANSIT
   ↓
5. During Transport:
   - Temperature logged every 15 min
   - GPS tracking active
   - Route deviation monitoring
   ↓
6. At Hub/Destination:
   - Arrival logged
   - Temperature verified
   - Handover completed
```

### 4. Command & Control Flow

```
┌─────────────────────────────────────┐
│ TRUST SCORE SYSTEM                  │
│                                     │
│ Every partner starts with 100 pts  │
│                                     │
│ Deductions:                         │
│ - Late arrival: -10 pts             │
│ - Temp deviation: -20 pts           │
│ - Missing signature: -50 pts        │
│ - Route deviation: -15 pts          │
│                                     │
│ If score < 70: BLOCKED              │
└─────────────────────────────────────┘
           │
           │ Monitors
           ▼
┌─────────────────────────────────────┐
│ GEOFENCING                          │
│                                     │
│ - Delivery verification (50m)       │
│ - Hub entry detection              │
│ - Route deviation alerts            │
└─────────────────────────────────────┘
           │
           │ Alerts
           ▼
┌─────────────────────────────────────┐
│ SUPER_ADMIN Dashboard               │
│                                     │
│ - Real-time alerts                  │
│ - Manual intervention               │
│ - Kill switch                       │
└─────────────────────────────────────┘
```

---

## ⚙️ Ključne Funkcionalnosti

### 1. Dynamic Pricing Engine

**Kako funkcioniše:**
- SUPER_ADMIN postavlja dnevne cene za svaki crop type
- Sve transakcije automatski referenciraju aktuelnu cenu
- Price history se čuva za analitiku

**API:**
- `POST /market-prices` - Set price (SuperAdmin only)
- `GET /market-prices/current/:cropType` - Get current price
- `GET /market-prices/history/:cropType` - Price history

### 2. Material Control System

**Kako funkcioniše:**
- Bio Vera kontroliše sve materijale (crates, labels, films)
- Farmer mora da kupi materijale pre shipment-a
- System blokira shipment ako nema dovoljno materijala
- Compliance photos se zahtevaju pre "Ready for Pickup"

**Komponente:**
- `MaterialInventory` - Centralni inventar
- `FarmerMaterialBalance` - Farmer balance
- `CompliancePhoto` - Photo verification
- `BioVeraStandard` - Standard definitions

### 3. Freshness Tracking

**Kako funkcioniše:**
- Svaki batch ima `timestamp_harvested`
- System automatski računa `remaining_shelf_life` na osnovu crop type
- Shelf life po crop-u:
  - Raspberries/Blackberries/Blueberries: 48h
  - Apples: 30 days
  - Peppers: 14 days

**API:**
- `GET /freshness/batch/:batchId` - Get remaining shelf life
- `GET /freshness/alerts` - Get expiring batches

### 4. Temperature Monitoring

**Kako funkcioniše:**
- LOGISTICS_PARTNER loguje temperaturu svakih 15 minuta
- System automatski detektuje out-of-range temperature
- Safety zone: 2°C - 6°C
- Kill switch ako temperatura >10°C za >30 min

**API:**
- `POST /temperature/log` - Log temperature
- `GET /temperature/batch/:batchId` - Get temperature history
- `GET /temperature/alerts` - Get alerts

### 5. Trust Score System

**Kako funkcioniše:**
- Svaki partner počinje sa 100 poena
- Automatske kazne za:
  - Kasno dolazak: -10
  - Temperaturna devijacija: -20
  - Nedostajući potpis: -50
  - Route devijacija: -15
- Blokiranje ako score < 70

**API:**
- `GET /trust-score/me` - Get own score
- `GET /trust-score/:userId` - Get partner score (Admin)
- `PUT /trust-score/unblock/:userId` - Unblock (SuperAdmin)

### 6. Geofencing

**Kako funkcioniše:**
- Delivery verification: Driver mora biti unutar 50m od supermarket-a
- Hub entry detection: Automatski start unloading timer-a
- Route deviation: Alert ako devijacija >2km bez traffic alert-a

**API:**
- `POST /geofencing/verify-delivery` - Verify delivery location
- `POST /geofencing/check-hub-entry` - Check hub entry
- `POST /geofencing/check-route-deviation` - Check route

### 7. Batch History & Chain of Custody

**Kako funkcioniše:**
- Svaki batch ima kompletan history:
  - Farmer data (weather, pre-cooling, photos)
  - Logistics data (pickup temp, transport, border wait)
  - Distributor data (arrival temp, visual state)
- Chain of Custody dokaz za AEO compliance

**API:**
- `GET /batch-history/batch/:batchId` - Get full history
- `POST /batch-history/distributor-arrival` - Log distributor arrival
- `POST /batch-history/border-wait-time` - Log border wait

### 8. QR Code & Traceability

**Kako funkcioniše:**
- Svaki batch ima unique QR code
- Consumer skenira QR i vidi:
  - Origin (farm name, GPS)
  - Journey timeline
  - Cold chain graph
  - Farmer profile
  - Sustainability stats

**Public Endpoints:**
- `/verify/:batchId` - Public verification page
- `/certificate/:qrId` - Freshness certificate

---

## 🔌 API Struktura

### Authentication

```
POST /auth/login
Body: { partnerCode, password }
Response: { access_token, user }
```

### Market Prices

```
GET    /market-prices
GET    /market-prices/current/:cropType
GET    /market-prices/history/:cropType
POST   /market-prices (SuperAdmin only)
PUT    /market-prices/:id (SuperAdmin only)
```

### Missions

```
POST   /missions (Grower)
PUT    /missions/:id/accept (Logistics Partner)
GET    /missions/my-missions
GET    /missions/:id
```

### Temperature

```
POST   /temperature/log
GET    /temperature/batch/:batchId
GET    /temperature/mission/:missionId
GET    /temperature/alerts
```

### Quality Entry

```
POST   /quality-entry (Grower)
GET    /quality-entry/batch/:batchId
```

### Material Control

```
GET    /material-control/inventory
GET    /material-control/my-balance (Grower)
POST   /material-control/purchase
POST   /material-control/compliance-photos
```

### Trust Score

```
GET    /trust-score/me
GET    /trust-score/:userId (Admin)
PUT    /trust-score/unblock/:userId (SuperAdmin)
```

### Batch History

```
GET    /batch-history/batch/:batchId
POST   /batch-history/distributor-arrival
POST   /batch-history/border-wait-time
```

### Grower Portal

```
GET    /grower-portal/mission-tracker
GET    /grower-portal/journey-map/:missionId
GET    /grower-portal/consumer-feedback/:batchId
GET    /grower-portal/financial-status/:batchId
```

---

## 🗄️ Baza Podataka

### Glavne Tabele

#### User Management
- `User` - Korisnici sa multiple roles
- `TrustScore` - Trust score za svakog partnera
- `Wallet` - Novčanik za zarade

#### Production
- `Estate` - Farme
- `Parcel` - Parcele unutar farmi
- `Batch` - Harvest batch-ovi
- `FreshnessTracker` - Shelf life tracking

#### Logistics
- `Mission` - Transport misije
- `Vehicle` - Frigo vozila
- `TemperatureLog` - Temperature logovi
- `LocationLog` - GPS tracking

#### Quality & Compliance
- `QualityEntry` - Farmer quality data
- `CompliancePhoto` - Compliance photos
- `MaterialInventory` - Material management
- `BioVeraStandard` - Standard definitions

#### Orders & Payments
- `Order` - Narudžbe
- `Payment` - Plaćanja
- `Delivery` - Dostave

#### Traceability
- `BatchHistory` - Kompletan batch history
- `DistributorArrival` - Distributor arrival data
- `BorderWaitTime` - Border crossing data
- `AuditTrail` - AEO compliance logs

### Relacije

```
User
  ├── Estate (1:N)
  ├── Batch (1:N) - harvested batches
  ├── Mission (1:N) - grower or logistics missions
  ├── TrustScore (1:1)
  └── Wallet (1:1)

Batch
  ├── QualityEntry (1:1)
  ├── FreshnessTracker (1:1)
  ├── TemperatureLog (1:N)
  ├── LocationLog (1:N)
  └── BatchHistory (1:1)

Mission
  ├── Vehicle (N:1)
  ├── Grower (N:1)
  ├── LogisticsPartner (N:1)
  └── Batch (1:N)
```

---

## 🎨 Frontend Struktura

### Public Stranice

```
/                          - Landing page
/login/[type]             - Login (producer/buyer)
/growers                   - Growers info page
/logistics-partner         - Logistics partner info page
/verify/:batchId          - Public batch verification
/certificate/:qrId        - Freshness certificate
```

### Role-Based Dashboards

```
/grower/
  ├── portal/             - Main dashboard
  ├── quality-entry/      - Quality entry form
  ├── materials/          - Material management
  ├── compliance-photos/  - Photo upload
  └── ...

/logistics-partner/
  ├── /                   - Main dashboard
  ├── handover/           - Handover verification
  └── ...

/fleet-partner/
  ├── /                   - Main dashboard
  ├── missions/           - Mission board
  ├── deliveries/         - Delivery management
  ├── payouts/            - Payout tracker
  └── profile/            - Company profile

/buyer/
  ├── shop/               - Product catalog
  ├── orders/             - Order management
  └── ...

/hub-manager/
  └── /                   - Cross-docking dashboard

/admin/
  ├── command-control/     - Command & Control
  └── standards/          - Standard management

/operations-center/        - Global operations view
/investors/               - Investor dashboard
/buyer-portal/            - B2B ordering
```

### Komponente

- **Layout**: Role-based navigation
- **Auth**: JWT token management
- **API**: Centralized API calls (`lib/api.ts`)
- **Charts**: Recharts za data visualization
- **Maps**: Leaflet za interactive maps

---

## 🚀 Kako Pokrenuti Sistem

### 1. Backend

```bash
cd backend

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Start server
npm run start:dev
# Server runs on http://localhost:3000
```

### 2. Frontend

```bash
cd web

# Install dependencies
npm install

# Start dev server
npm run dev
# App runs on http://localhost:3001
```

### 3. Prisma Studio (Database Viewer)

```bash
cd backend
npx prisma studio
# Opens on http://localhost:5555
```

---

## 📝 Sledeći Koraci

1. **Kreiraj prvog korisnika** (SuperAdmin) u Prisma Studio
2. **Testiraj login** kroz frontend
3. **Kreiraj test podatke** (Grower, Logistics Partner, Batch)
4. **Testiraj flow-ove** (Quality Entry → Mission → Delivery)
5. **Proveri Command & Control** sistem

---

## 🔗 Korisni Linkovi

- **Prisma Studio**: http://localhost:5555
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:3001
- **API Docs**: (može se dodati Swagger)

---

**Napomena**: Ovaj dokument je "živ" i treba ga ažurirati kako sistem evoluira.
