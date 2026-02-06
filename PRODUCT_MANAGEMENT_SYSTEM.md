# 🛒 Product Management System - Centralizovani Pristup

## 📋 Trenutno Stanje

### 1. Kako se DODAJU proizvodi?

**Trenutno:** Proizvodi se dodaju **decentralizovano** kroz `batches` kada farmer pakuje:

```
Farmer pakuje → Kreira Batch → Batch se prenosi u Hub → Hub dodaje u Inventory → Proizvod postaje dostupan
```

**Problem:** Nema centralizovanog kataloga proizvoda. Svaki farmer može da unese bilo koji naziv proizvoda.

**Lokacija koda:**
- `backend/src/batches/batches.service.ts` - `createBatch()` metoda
- `backend/src/inventory/inventory.service.ts` - `addInventory()` metoda

---

### 2. Ko ZADAJE ciljeve farmerima?

**Trenutno:** Nema sistema za zadavanje ciljeva farmerima.

**Postoji:** `missions` sistem, ali on se aktivira kada farmer klikne "Ready for Pickup", ne kada se zadaju ciljevi.

**Potrebno:** Sistem za:
- Admin/Coordinator zadaje ciljeve (npr. "100kg malina do 15. juna")
- Farmer vidi svoje ciljeve u dashboard-u
- Sistem prati napredak ka cilju

---

### 3. Kako se UNOSE proizvodi?

**Trenutni flow:**

1. **Farmer pakuje proizvod:**
   ```typescript
   POST /batches
   {
     "estateId": "...",
     "productName": "Raspberries", // ⚠️ Slobodan unos
     "quantity": 50,
     "unit": "kg",
     "harvestDate": "2024-06-15"
   }
   ```

2. **Batch se prenosi u Hub:**
   ```typescript
   POST /batches/:id/move-to-hub
   {
     "hubId": "..."
   }
   ```

3. **Hub dodaje u Inventory:**
   ```typescript
   POST /inventory
   {
     "hubId": "...",
     "estateId": "...",
     "productName": "Raspberries", // ⚠️ Dupliranje podataka
     "quantity": 50,
     "unit": "kg",
     "unitPrice": 8.50
   }
   ```

**Problem:** 
- `productName` se unosi ručno (može biti "Raspberries", "Maline", "Raspberry" - nedosledno)
- Nema validacije da li proizvod postoji u katalogu
- Nema sezonskih ograničenja

---

### 4. Kada će proizvodi biti DOSTUPNI za poručivanje?

**Trenutno:**

1. **Proizvod postaje dostupan kada:**
   - Batch se kreira (`status: PACKED`)
   - Batch se prenese u Hub (`status: IN_HUB`)
   - Inventory entry se kreira sa `status: AVAILABLE`

2. **Proizvod se može poručiti:**
   ```typescript
   GET /inventory/available?city=Hamburg
   // Vraća sve proizvode sa status: AVAILABLE
   ```

3. **Order se kreira:**
   ```typescript
   POST /orders
   {
     "estateId": "...",
     "productName": "Raspberries",
     "quantity": 10,
     "unitPrice": 8.50
   }
   ```

**Problem:**
- Nema jasnog indikatora **kada** će proizvod biti dostupan (npr. "Dostupno za 7 dana")
- Nema sistema za **rezervacije** (pre-order)
- Nema sezonskih kalendara

---

## 🎯 Predloženo Rešenje: Centralizovani Product Catalog

### 1. Product Catalog Model

```prisma
model product_catalog {
  id              String   @id @default(uuid())
  name            String   @unique // "Raspberries" (standardizovano)
  displayName     String   // "Maline" (lokalizovano)
  category        String   // "FRUITS", "VEGETABLES", "GRAINS"
  description     String?
  imageUrl        String?
  
  // Sezonski kalendar
  seasonStart     Int      // Mesec (1-12) kada počinje sezona
  seasonEnd       Int      // Mesec (1-12) kada se završava sezona
  
  // Shelf life
  shelfLifeHours  Int      // 48 za maline, 720 za jabuke
  
  // Pricing
  defaultUnit     String   // "kg", "box", "piece"
  minOrderQuantity Float   // Minimalna količina za porudžbinu
  
  // Status
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  batches         batches[]
  inventory       inventory[]
  orders          orders[]
  
  @@index([category])
  @@index([isActive])
  @@map("product_catalog")
}
```

### 2. Goals/Targets System

```prisma
model farmer_goals {
  id              String   @id @default(uuid())
  farmerId        String
  productId       String   // Reference to product_catalog
  targetQuantity   Float
  targetDate       DateTime
  currentQuantity  Float    @default(0)
  status          GoalStatus @default(PENDING)
  
  assignedBy      String   // Admin/Coordinator ID
  assignedAt      DateTime @default(now())
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  farmer          users    @relation(fields: [farmerId], references: [id])
  product         product_catalog @relation(fields: [productId], references: [id])
  assigner        users    @relation(fields: [assignedBy], references: [id])
  
  @@index([farmerId])
  @@index([productId])
  @@index([status])
  @@map("farmer_goals")
}

enum GoalStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  CANCELLED
}
```

### 3. Product Availability System

```prisma
model product_availability {
  id              String   @id @default(uuid())
  productId       String
  estateId        String
  parcelId        String?
  
  // Availability timeline
  availableFrom   DateTime // Kada će proizvod biti dostupan
  availableUntil  DateTime? // Kada prestaje da bude dostupan
  estimatedQuantity Float   // Procenjena količina
  
  // Current status
  currentQuantity Float    @default(0) // Trenutna količina u inventory
  reservedQuantity Float   @default(0) // Rezervisano kroz orders
  
  // Status
  status          AvailabilityStatus @default(UPCOMING)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  product         product_catalog @relation(fields: [productId], references: [id])
  estate          estates @relation(fields: [estateId], references: [id])
  parcel          parcels? @relation(fields: [parcelId], references: [id])
  
  @@index([productId])
  @@index([estateId])
  @@index([status])
  @@map("product_availability")
}

enum AvailabilityStatus {
  UPCOMING        // Još nije dostupan (rezervacije)
  AVAILABLE_NOW   // Dostupan sada
  LIMITED         // Ograničena količina
  SOLD_OUT        // Rasprodat
  SEASON_ENDED    // Sezona završena
}
```

---

## 🔄 Novi Flow: Kako se dodaju proizvodi

### Korak 1: Admin kreira Product Catalog (jednom)

```typescript
POST /admin/products
{
  "name": "Raspberries",
  "displayName": "Maline",
  "category": "FRUITS",
  "seasonStart": 6, // Jun
  "seasonEnd": 8,   // Avgust
  "shelfLifeHours": 48,
  "defaultUnit": "kg",
  "minOrderQuantity": 1
}
```

### Korak 2: Admin zadaje ciljeve farmerima

```typescript
POST /admin/goals
{
  "farmerId": "farmer-123",
  "productId": "raspberries-uuid",
  "targetQuantity": 500,
  "targetDate": "2024-08-15"
}
```

### Korak 3: Farmer vidi ciljeve i planira

```typescript
GET /farmer/goals
// Vraća sve ciljeve za farmera sa napretkom
```

### Korak 4: Farmer kreira Batch (sa validacijom)

```typescript
POST /batches
{
  "estateId": "...",
  "productId": "raspberries-uuid", // ⚠️ Sada koristi ID iz kataloga
  "quantity": 50,
  "harvestDate": "2024-06-15"
}

// Backend validira:
// - Da li productId postoji u katalogu
// - Da li je sezona (seasonStart <= mesec <= seasonEnd)
// - Da li farmer ima cilj za ovaj proizvod
```

### Korak 5: Proizvod postaje dostupan

```typescript
// Automatski se kreira product_availability entry
// Status: AVAILABLE_NOW (ako je harvestDate <= danas)
// Status: UPCOMING (ako je harvestDate > danas)
```

### Korak 6: Buyer vidi dostupne proizvode

```typescript
GET /inventory/available?city=Hamburg

// Vraća:
{
  "productId": "raspberries-uuid",
  "name": "Raspberries",
  "displayName": "Maline",
  "status": "AVAILABLE_NOW", // ili "UPCOMING", "LIMITED"
  "availableFrom": "2024-06-15",
  "currentQuantity": 50,
  "reservedQuantity": 10,
  "availableQuantity": 40,
  "unitPrice": 8.50
}
```

---

## 📅 Sezonski Kalendar

### Kada proizvodi mogu da se poruče?

**Trenutno:** Proizvodi se mogu poručiti kada su `status: AVAILABLE` u inventory.

**Predloženo:** 

1. **UPCOMING** (Rezervacije):
   - Proizvod se može rezervisati pre nego što je dostupan
   - Buyer vidi: "Dostupno za 7 dana" ili "Dostupno 15. juna"
   - Order status: `RESERVED` (ne `CONFIRMED`)

2. **AVAILABLE_NOW**:
   - Proizvod je dostupan sada
   - Order status: `CONFIRMED`

3. **LIMITED**:
   - Malo je ostalo (< 20% količine)
   - Buyer vidi: "Samo 10kg preostalo"

4. **SEASON_ENDED**:
   - Sezona je završena
   - Proizvod se ne može poručiti

---

## 🎯 API Endpoints (Predloženo)

### Product Catalog (Admin)

```typescript
// Kreiraj proizvod u katalogu
POST /admin/products
GET /admin/products
GET /admin/products/:id
PUT /admin/products/:id
DELETE /admin/products/:id
```

### Goals (Admin/Coordinator)

```typescript
// Zada cilj farmeru
POST /admin/goals
GET /admin/goals?farmerId=...
PUT /admin/goals/:id
DELETE /admin/goals/:id

// Farmer vidi svoje ciljeve
GET /farmer/goals
GET /farmer/goals/:id
```

### Product Availability (Public/Buyer)

```typescript
// Vidi dostupne proizvode
GET /products/available?city=Hamburg&status=AVAILABLE_NOW
GET /products/available?city=Hamburg&status=UPCOMING

// Vidi sezonski kalendar
GET /products/seasonal-calendar?month=6

// Vidi detalje proizvoda
GET /products/:id/availability
```

### Batches (Farmer) - Ažurirano

```typescript
// Kreiraj batch (sa productId umesto productName)
POST /batches
{
  "estateId": "...",
  "productId": "raspberries-uuid", // ⚠️ Sada koristi ID
  "quantity": 50,
  "harvestDate": "2024-06-15"
}
```

---

## 🔧 Implementacija

### Faza 1: Product Catalog
1. Kreiraj `product_catalog` tabelu
2. Migracija postojećih proizvoda u katalog
3. Ažuriraj `batches` i `inventory` da koriste `productId`

### Faza 2: Goals System
1. Kreiraj `farmer_goals` tabelu
2. Admin panel za zadavanje ciljeva
3. Farmer dashboard sa ciljevima

### Faza 3: Availability System
1. Kreiraj `product_availability` tabelu
2. Automatsko kreiranje availability entry-ja kada se kreira batch
3. Buyer dashboard sa statusima

### Faza 4: Sezonski Kalendar
1. Validacija sezone pri kreiranju batch-a
2. Buyer vidi sezonski kalendar
3. Rezervacije za UPCOMING proizvode

---

## 📝 Checklist

- [ ] Kreirati `product_catalog` model u Prisma
- [ ] Kreirati `farmer_goals` model
- [ ] Kreirati `product_availability` model
- [ ] Migracija postojećih proizvoda
- [ ] Ažurirati `batches.service.ts` da koristi `productId`
- [ ] Ažurirati `inventory.service.ts` da koristi `productId`
- [ ] Kreirati Admin API za product catalog
- [ ] Kreirati Admin API za goals
- [ ] Kreirati Farmer API za goals
- [ ] Kreirati Buyer API za availability
- [ ] Sezonska validacija
- [ ] Rezervacije sistem

---

## 💡 Prednosti Centralizovanog Pristupa

1. **Konzistentnost:** Svi proizvodi imaju standardizovane nazive
2. **Validacija:** Ne može se kreirati batch za proizvod koji ne postoji
3. **Sezonskost:** Automatska validacija sezone
4. **Ciljevi:** Admin može da prati i zadaje ciljeve farmerima
5. **Dostupnost:** Buyer vidi jasno kada će proizvod biti dostupan
6. **Rezervacije:** Mogućnost pre-order-a

---

## 🚀 Sledeći Koraci

1. **Diskutujte** ovaj pristup sa timom
2. **Odlučite** da li želite da implementiramo sve odjednom ili fazno
3. **Kreirajte** migracije za nove tabele
4. **Implementirajte** API endpoint-e
5. **Ažurirajte** frontend da koristi nove endpoint-e
