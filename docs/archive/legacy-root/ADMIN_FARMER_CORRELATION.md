# 🔗 Admin Panel ↔️ Farmer Panel - Korelacija i Povezanost

## 📊 Pregled Trenutnog Stanja

### ✅ Šta FUNKCIONIŠE (Povezano)

#### 1. **Missions (Misije)**
- **Admin Panel** (`/admin/missions`):
  - ✅ Vidi sve misije svih farmera
  - ✅ Filteri po statusu, farmeru, driver-u
  - ✅ Pregled detalja misije
  - **Backend:** `GET /missions/admin/all`

- **Farmer Panel** (`/grower/portal`):
  - ✅ Vidi svoje misije (samo svoje)
  - ✅ Kreira misiju kada klikne "Ready for Pickup"
  - ✅ Pregled journey map-a, consumer feedback-a, financial status-a
  - **Backend:** `GET /grower-portal/mission-tracker`

- **Korelacija:**
  - ✅ Admin vidi sve, farmer vidi samo svoje
  - ✅ Farmer kreira misiju → Admin vidi u listi
  - ✅ Status se sinhronizuje između oba panela

---

#### 2. **Market Prices (Tržišne Cene)**
- **Admin Panel** (`/admin/market-prices`):
  - ✅ Postavlja cene za proizvode (SUPER_ADMIN only)
  - ✅ Edituje cene, postavlja effective dates
  - ✅ Vidi price history
  - ✅ Postavlja critical thresholds za automatsko povećanje cena
  - **Backend:** `POST /market-prices`, `PUT /market-prices/:id`

- **Farmer Panel:**
  - ⚠️ **NEMA direktnog prikaza market prices**
  - ⚠️ Farmer ne vidi koliko će dobiti za proizvod
  - ⚠️ Cene se koriste u buyer trade panel-u, ali ne u farmer panel-u

- **Korelacija:**
  - ❌ **NEDOSTAJE:** Farmer panel ne prikazuje market prices
  - ❌ **NEDOSTAJE:** Farmer ne vidi koliko će dobiti za svoj proizvod
  - ✅ Cene se koriste u buyer trade panel-u za prikaz cena kupcima

---

#### 3. **Users (Korisnici)**
- **Admin Panel** (`/admin/users`):
  - ✅ Kreira farmere (GROWER role)
  - ✅ Edituje farmer podatke
  - ✅ Suspend/Activate farmere
  - ✅ Dodeljuje role (multiple roles support)
  - **Backend:** `POST /users/admin`, `PUT /users/:id`

- **Farmer Panel:**
  - ✅ Farmer se loguje sa svojim kredencijalima
  - ✅ Vidi svoje podatke (kroz auth context)

- **Korelacija:**
  - ✅ Admin kreira farmera → Farmer može da se loguje
  - ✅ Admin suspenduje farmera → Farmer ne može da se loguje
  - ✅ Admin edituje farmer podatke → Farmer vidi ažurirane podatke

---

#### 4. **Orders (Porudžbine)**
- **Admin Panel** (`/admin/orders`):
  - ✅ Vidi sve porudžbine
  - ✅ Pregled detalja porudžbine
  - ✅ Filteri (može se dodati)
  - **Backend:** `GET /orders/admin/all`

- **Farmer Panel:**
  - ⚠️ **NEMA direktnog prikaza orders**
  - ⚠️ Farmer ne vidi ko je poručio njegove proizvode
  - ⚠️ Farmer vidi samo batches koje je kreirao

- **Korelacija:**
  - ❌ **NEDOSTAJE:** Farmer panel ne prikazuje orders
  - ❌ **NEDOSTAJE:** Farmer ne vidi ko je kupio njegove proizvode
  - ✅ Admin vidi sve orders, uključujući one koje se odnose na farmer-ove proizvode

---

#### 5. **Security Alerts (Sigurnosna Upozorenja)**
- **Admin Panel** (`/admin/security`):
  - ✅ Vidi sve security alerts
  - ✅ Resolve/Dismiss alerts
  - ✅ Filteri po tipu, statusu, severity
  - **Backend:** `GET /security-alerts`, `PUT /security-alerts/:id/resolve`

- **Farmer Panel:**
  - ⚠️ **NEMA direktnog prikaza security alerts**
  - ⚠️ Farmer ne vidi ako je njegov batch blokiran zbog security problema

- **Korelacija:**
  - ❌ **NEDOSTAJE:** Farmer panel ne prikazuje security alerts
  - ❌ **NEDOSTAJE:** Farmer ne vidi zašto je njegov batch blokiran
  - ✅ Admin vidi sve alerts, uključujući one vezane za farmer-ove proizvode

---

### ❌ Šta NEDOSTAJE (Nije Povezano)

#### 1. **Product Catalog (Katalog Proizvoda)**
- **Admin Panel** (`/admin/products`):
  - ⚠️ **PLACEHOLDER** - nije implementiran
  - ⚠️ Čeka backend implementaciju
  - **Backend:** ❌ Nema endpoint-a

- **Farmer Panel:**
  - ⚠️ Farmer unosi proizvode **ručno** kada kreira batch
  - ⚠️ Nema validacije da li proizvod postoji u katalogu
  - ⚠️ Nema sezonskih ograničenja

- **Korelacija:**
  - ❌ **NEDOSTAJE:** Admin ne može da kreira proizvode u katalogu
  - ❌ **NEDOSTAJE:** Farmer ne vidi listu dostupnih proizvoda
  - ❌ **NEDOSTAJE:** Nema validacije proizvoda

---

#### 2. **Goals (Ciljevi)**
- **Admin Panel** (`/admin/goals`):
  - ❌ **NEMA STRANICE** - nije implementirano
  - ❌ Admin ne može da zadaje ciljeve farmerima
  - **Backend:** ❌ Nema endpoint-a

- **Farmer Panel:**
  - ❌ **NEMA PRIKAZA** - farmer ne vidi svoje ciljeve
  - ❌ Farmer ne vidi napredak ka cilju

- **Korelacija:**
  - ❌ **NEDOSTAJE:** Sistem za zadavanje ciljeva
  - ❌ **NEDOSTAJE:** Sistem za praćenje napretka

---

#### 3. **Batches (Serije)**
- **Admin Panel:**
  - ⚠️ Admin vidi batches kroz missions i orders
  - ⚠️ Nema direktnog pregleda svih batches

- **Farmer Panel** (`/grower/batches`):
  - ⚠️ Farmer vidi svoje batches
  - ⚠️ Farmer kreira batch kada pakuje proizvod

- **Korelacija:**
  - ⚠️ **DELIMIČNO:** Admin vidi batches kroz missions, ali nema direktnog pregleda
  - ✅ Farmer kreira batch → Batch se pojavljuje u sistemu

---

## 🎯 Preporuke za Poboljšanje Korelacije

### Prioritet 1: VISOK

1. **Dodati Market Prices u Farmer Panel**
   - Farmer treba da vidi trenutne cene za svoje proizvode
   - Prikazati koliko će dobiti za svoj proizvod
   - Prikazati price history

2. **Dodati Orders u Farmer Panel**
   - Farmer treba da vidi ko je poručio njegove proizvode
   - Prikazati order status, quantity, buyer info

3. **Dodati Security Alerts u Farmer Panel**
   - Farmer treba da vidi ako je njegov batch blokiran
   - Prikazati razlog blokade i kako da reši problem

### Prioritet 2: SREDNJI

4. **Implementirati Product Catalog**
   - Admin kreira proizvode u katalogu
   - Farmer bira proizvod iz kataloga (ne unosi ručno)
   - Validacija proizvoda

5. **Implementirati Goals System**
   - Admin zadaje ciljeve farmerima
   - Farmer vidi svoje ciljeve i napredak

6. **Dodati Batches pregled u Admin Panel**
   - Admin treba da vidi sve batches direktno
   - Filteri po farmeru, proizvodu, statusu

### Prioritet 3: NIZAK

7. **Dodati Financial Overview u Farmer Panel**
   - Farmer treba da vidi svoje ukupne zarade
   - Prikazati payment history
   - Prikazati pending payments

8. **Dodati Analytics u Farmer Panel**
   - Farmer treba da vidi statistike o svojim proizvodima
   - Prikazati najprodavanije proizvode
   - Prikazati consumer feedback trends

---

## 📝 Tehnički Detalji

### Backend Endpoints za Korelaciju

#### Missions
- ✅ `GET /missions/admin/all` - Admin vidi sve misije
- ✅ `GET /grower-portal/mission-tracker` - Farmer vidi svoje misije
- ✅ `POST /missions` - Farmer kreira misiju

#### Market Prices
- ✅ `GET /market-prices` - Svi vide trenutne cene
- ✅ `POST /market-prices` - Admin postavlja cene (SUPER_ADMIN)
- ❌ **NEDOSTAJE:** `GET /market-prices/farmer/:farmerId` - Farmer vidi cene za svoje proizvode

#### Orders
- ✅ `GET /orders/admin/all` - Admin vidi sve orders
- ❌ **NEDOSTAJE:** `GET /orders/farmer/:farmerId` - Farmer vidi orders za svoje proizvode

#### Security Alerts
- ✅ `GET /security-alerts` - Admin vidi sve alerts
- ❌ **NEDOSTAJE:** `GET /security-alerts/farmer/:farmerId` - Farmer vidi alerts za svoje proizvode

#### Goals
- ❌ **NEDOSTAJE:** `POST /goals` - Admin zadaje cilj
- ❌ **NEDOSTAJE:** `GET /goals/farmer/:farmerId` - Farmer vidi svoje ciljeve
- ❌ **NEDOSTAJE:** `GET /goals/progress/:goalId` - Praćenje napretka

#### Product Catalog
- ❌ **NEDOSTAJE:** `POST /products` - Admin kreira proizvod
- ❌ **NEDOSTAJE:** `GET /products` - Svi vide katalog proizvoda
- ❌ **NEDOSTAJE:** `GET /products/seasonal` - Sezonski proizvodi

---

## 🔄 Flow Diagrami

### Missions Flow
```
Farmer Panel                    Admin Panel
     │                              │
     │ 1. Farmer kreira batch       │
     ├──────────────────────────────┤
     │                              │
     │ 2. Farmer klikne             │
     │    "Ready for Pickup"        │
     ├──────────────────────────────┤
     │                              │
     │ 3. Kreira se misija          │
     ├──────────────────────────────┤
     │                              │
     │                              │ 4. Admin vidi misiju
     │                              │    u listi
     │                              │
     │ 5. Farmer vidi svoju misiju  │
     │    u Mission Tracker-u       │
     │                              │
```

### Market Prices Flow (Trenutno)
```
Admin Panel                    Buyer Panel
     │                              │
     │ 1. Admin postavlja cenu     │
     ├──────────────────────────────┤
     │                              │
     │                              │ 2. Buyer vidi cenu
     │                              │    u Trade Panel-u
     │                              │
     │ ❌ Farmer Panel              │
     │    NEMA PRIKAZA CENA         │
```

### Market Prices Flow (Predloženo)
```
Admin Panel                    Farmer Panel              Buyer Panel
     │                              │                         │
     │ 1. Admin postavlja cenu     │                         │
     ├──────────────────────────────┤                         │
     │                              │                         │
     │                              │ 2. Farmer vidi cenu     │
     │                              │    za svoje proizvode   │
     │                              │                         │
     │                              │                         │ 3. Buyer vidi cenu
     │                              │                         │    u Trade Panel-u
     │                              │                         │
```

---

## ✅ Checklist za Implementaciju

### Faza 1: Market Prices u Farmer Panel
- [ ] Kreirati backend endpoint `GET /market-prices/farmer/:farmerId`
- [ ] Dodati stranicu u farmer panel za prikaz cena
- [ ] Prikazati cene za proizvode koje farmer proizvodi
- [ ] Prikazati price history

### Faza 2: Orders u Farmer Panel
- [ ] Kreirati backend endpoint `GET /orders/farmer/:farmerId`
- [ ] Dodati stranicu u farmer panel za prikaz orders
- [ ] Prikazati buyer info, quantity, status
- [ ] Dodati filtere i search

### Faza 3: Security Alerts u Farmer Panel
- [ ] Kreirati backend endpoint `GET /security-alerts/farmer/:farmerId`
- [ ] Dodati notifikacije u farmer panel
- [ ] Prikazati razlog blokade i rešenje

### Faza 4: Product Catalog
- [ ] Implementirati Product Catalog backend
- [ ] Kreirati admin stranicu za upravljanje proizvodima
- [ ] Dodati validaciju proizvoda u farmer panel
- [ ] Dodati sezonski kalendar

### Faza 5: Goals System
- [ ] Implementirati Goals backend
- [ ] Kreirati admin stranicu za zadavanje ciljeva
- [ ] Dodati prikaz ciljeva u farmer panel
- [ ] Dodati progress tracking

---

## 📚 Povezani Dokumenti

- `PRODUCT_MANAGEMENT_SYSTEM.md` - Product Catalog sistem
- `TODO_WEB_MOBILE.md` - Lista nedostajućih funkcionalnosti
- `BUYER_PORTAL_ENHANCEMENT.md` - Buyer portal poboljšanja
