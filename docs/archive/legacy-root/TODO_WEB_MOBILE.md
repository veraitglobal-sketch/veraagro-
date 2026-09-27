# 📋 TODO: Web i Mobilna Aplikacija - Šta je Ostalo

## 🔐 1. LOGIN SISTEM

### ✅ Šta Postoji

#### Web Aplikacija:
- ✅ Login stranica: `/login/[type]` (buyer/producer)
- ✅ Auth context i hook (`lib/auth.tsx`)
- ✅ API integracija sa backend-om
- ✅ Role-based navigation (automatski redirect na dashboard)
- ✅ Token storage u localStorage

#### Mobilna Aplikacija:
- ✅ Universal login: `app/login.tsx` (opciono `?partner=1` + `redirect` za grower deep link; helper `partnerSignInHref()`)
- ✅ Buyer login: `app/buyer-login.tsx`
- ✅ Producer / logistics / supplier sign-in: isti UI kao universal login — `partner=1`; `app/partner-login.tsx` je **alias** (redirect na `/login`)
- ✅ Auth hook: `hooks/useAuth.ts`
- ✅ Token storage u AsyncStorage
- ✅ Automatski redirect na odgovarajući dashboard

---

### ❌ Šta Nedostaje

#### Web Aplikacija:

1. **Admin Login Stranica**
   - ✅ **ZAVRŠENO** - Kreirana `/app/login/admin/page.tsx`
   - ✅ Validacija admin rola
   - ✅ Redirect na admin dashboard

2. **Admin Dashboard Landing Page**
   - ✅ **ZAVRŠENO** - Kreirana `/app/admin/page.tsx`
   - ✅ Overview statistike (users, orders, missions, alerts)
   - ✅ Quick actions
   - ✅ Recent activities (orders, alerts)
   - ✅ API integracija sa backend-om

3. **Auth Guard za Admin Stranice**
   - ✅ **ZAVRŠENO** - Kreirana `components/AuthGuard.tsx`
   - ✅ Role-based access control
   - ✅ Zaštita svih admin stranica
   - ✅ Loading state

4. **Logout Funkcionalnost**
   - ✅ Postoji i radi kroz `authAPI.logout()`
   - ✅ Integrisan u Navigation komponentu

#### Mobilna Aplikacija:

1. **Admin Login i Dashboard**
   - ❌ Nema admin login opcije
   - ❌ Nema admin dashboard-a u mobilnoj aplikaciji
   - **Potrebno:** 
     - Kreirati `app/admin-login.tsx`
     - Kreirati `app/(admin)/` folder sa admin dashboard-om

2. **Auth Guard**
   - ⚠️ Postoji `components/AuthGuard.tsx` ali nije korišćen svuda
   - **Potrebno:** Dodati AuthGuard na sve zaštićene stranice

3. **Session Management**
   - ⚠️ Token se čuva ali nema refresh token logike
   - ⚠️ Nema automatskog logout-a pri isteku tokena
   - **Potrebno:** Implementirati token refresh

---

## 🖥️ 2. ADMIN PANEL

### ✅ Šta Postoji (Web)

1. **Command & Control** (`/admin/command-control`)
   - ✅ System status monitoring
   - ✅ Active missions tracking
   - ✅ Violations monitoring
   - ⚠️ Koristi mock data (nije povezano sa backend-om)

2. **Bio Vera Standards** (`/admin/standards`)
   - ✅ Pregled i editovanje standarda
   - ✅ Form za ažuriranje standarda
   - ✅ API integracija

3. **Vera Insights** (`/admin/vera-insights`)
   - ✅ CRUD operacije za insights
   - ✅ Form za dodavanje/editovanje
   - ✅ API integracija

4. **SidebarLayout Komponenta**
   - ✅ Sidebar sa navigacijom
   - ✅ Responsive design

---

### ❌ Šta Nedostaje (Web Admin Panel)

#### Glavni Admin Dashboard (`/admin`)

**Prioritet: VISOK** ✅ **ZAVRŠENO**

✅ Kreiran kompletan admin dashboard sa:

1. **Overview Statistike:**
   - Ukupan broj farmera
   - Ukupan broj buyer-a
   - Aktivne misije
   - Ukupne porudžbine (danas/ovaj mesec)
   - Revenue (danas/ovaj mesec)
   - System health status

2. **Quick Actions:**
   - Kreiraj novog korisnika
   - Kreiraj novi proizvod u katalogu
   - Zada cilj farmeru
   - Pause/Resume sistem
   - Export podataka

3. **Recent Activities:**
   - Poslednje porudžbine
   - Poslednje misije
   - Security alerts
   - System events

4. **Charts & Analytics:**
   - Revenue chart (7 dana / 30 dana)
   - Orders chart
   - Farmer activity chart
   - Product popularity chart

**Fajl:** `/web/app/admin/page.tsx`

---

#### User Management (`/admin/users`)

**Prioritet: VISOK** ✅ **ZAVRŠENO**

✅ Implementirano:
1. **Lista svih korisnika:**
   - ✅ Tabela sa farmerima, buyer-ima, admin-ima
   - ✅ Filteri po roli, statusu
   - ✅ Search funkcionalnost

2. **Kreiranje korisnika:**
   - ✅ Modal form za kreiranje novog korisnika
   - ✅ Dodela rola (multiple roles support)
   - ✅ Partner code unos

3. **Editovanje korisnika:**
   - ✅ Edit user details modal
   - ✅ Promena rola
   - ✅ Suspend/Activate korisnika
   - ⚠️ Reset password (može se dodati kasnije)

4. **User Details:**
   - ✅ Pregled svih podataka korisnika u tabeli
   - ⚠️ Istorija aktivnosti (može se dodati detaljna stranica)
   - ⚠️ Trust score (može se dodati link)
   - ✅ Povezani resursi (estates count)

**Fajl:** `/web/app/admin/users/page.tsx` ✅

---

#### Product Catalog Management (`/admin/products`)

**Prioritet: VISOK** ⚠️ **PLACEHOLDER (Čeka Backend)**

⚠️ Placeholder stranica kreirana:
- ✅ Osnovna struktura
- ⚠️ Čeka implementaciju Product Catalog backend sistema
- ⚠️ Treba implementirati kada backend bude spreman

**Fajl:** `/web/app/admin/products/page.tsx` ✅ (placeholder)

**Napomena:** Ovo zavisi od Product Catalog sistema iz `PRODUCT_MANAGEMENT_SYSTEM.md`

---

#### Goals Management (`/admin/goals`)

**Prioritet: SREDNJI**

1. **Lista ciljeva:**
   - Tabela sa svim ciljevima farmera
   - Filteri po farmeru, proizvodu, statusu
   - Progress tracking

2. **Zadavanje ciljeva:**
   - Form za kreiranje cilja:
     - Farmer selection
     - Product selection
     - Target quantity
     - Target date
   - Bulk assignment (više farmera odjednom)

3. **Progress Monitoring:**
   - Pregled napretka ka cilju
   - Alerts za farmere koji zaostaju

**Fajl:** `/web/app/admin/goals/page.tsx`

**Napomena:** Ovo zavisi od Goals sistema iz `PRODUCT_MANAGEMENT_SYSTEM.md`

---

#### Orders Management (`/admin/orders`)

**Prioritet: SREDNJI** ✅ **ZAVRŠENO (Osnovno)**

✅ Implementirano:
1. **Lista svih porudžbina:**
   - ✅ Tabela sa svim porudžbinama
   - ⚠️ Filteri (može se dodati)
   - ⚠️ Search (može se dodati)

2. **Order Details:**
   - ✅ Pregled osnovnih detalja u tabeli
   - ⚠️ Detaljna stranica (može se dodati)
   - ⚠️ Payment info (može se dodati)
   - ⚠️ Delivery tracking (može se dodati)

3. **Order Actions:**
   - ⚠️ Cancel order (može se dodati)
   - ⚠️ Refund (može se dodati)
   - ⚠️ Update status (može se dodati)

**Fajl:** `/web/app/admin/orders/page.tsx` ✅

---

#### Missions Management (`/admin/missions`)

**Prioritet: SREDNJI** ✅ **ZAVRŠENO**

✅ Implementirano:
1. **Lista svih misija:**
   - ✅ Tabela sa svim misijama
   - ✅ Filteri po statusu
   - ✅ Pregled grower-a i driver-a
   - ✅ Product info

2. **Mission Details:**
   - ✅ Osnovni detalji u tabeli
   - ⚠️ Detaljna stranica (može se dodati)
   - ⚠️ Route visualization (može se dodati)
   - ⚠️ Temperature logs (može se dodati)

3. **Mission Actions:**
   - ⚠️ Assign driver (može se dodati)
   - ⚠️ Cancel mission (može se dodati)
   - ⚠️ Update status (može se dodati)

**Fajl:** `/web/app/admin/missions/page.tsx` ✅
**Backend:** ✅ `GET /missions/admin/all` endpoint dodat

---

#### Trust Scores (`/admin/trust-scores`)

**Prioritet: NIZAK**

1. **Lista farmera sa trust score-om:**
   - Tabela sa farmerima i njihovim score-om
   - Filteri po score range-u

2. **Trust Score Details:**
   - Pregled faktora koji utiču na score
   - History score changes

3. **Manual Adjustments:**
   - Admin može ručno podesiti score
   - Add/Remove penalties/bonuses

**Fajl:** `/web/app/admin/trust-scores/page.tsx`

---

#### Security Alerts (`/admin/security`)

**Prioritet: VISOK** ✅ **ZAVRŠENO**

✅ Implementirano:
1. **Lista security alerts:**
   - ✅ Lista sa svim alerts (card layout)
   - ✅ Filteri po tipu, statusu, severity
   - ✅ Real-time updates (refresh button)

2. **Alert Details:**
   - ✅ Pregled detalja alert-a u kartici
   - ✅ Related data (user, estate)
   - ⚠️ Photos/Evidence (može se dodati ako postoji u backend-u)

3. **Alert Actions:**
   - ✅ Resolve alert (sa resolution notes)
   - ✅ Dismiss alert
   - ⚠️ Escalate (može se dodati)
   - ⚠️ Block user/farm (može se dodati)

**Fajl:** `/web/app/admin/security/page.tsx` ✅

---

#### Market Prices (`/admin/market-prices`)

**Prioritet: SREDNJI** ✅ **ZAVRŠENO**

✅ Implementirano:
1. **Lista market prices:**
   - ✅ Tabela sa cenama po crop type-u
   - ✅ Price history modal
   - ✅ Margin calculation i prikaz
   - ✅ Status prikaz (Active/Inactive)

2. **Set Market Price:**
   - ✅ Form za postavljanje cene (SuperAdmin only)
   - ✅ Effective date (from/to)
   - ✅ Buy/Sell price
   - ✅ Automatska deaktivacija starih cena

3. **Edit Market Price:**
   - ✅ Edit postojećih cena
   - ✅ Deaktivacija cena
   - ✅ Update effective dates

**Fajl:** `/web/app/admin/market-prices/page.tsx` ✅
**Backend:** ✅ Već postoji i funkcioniše

---

### ❌ Šta Nedostaje (Mobilna Admin Panel)

**Prioritet: NIZAK** (Admin panel je primarno za web)

Ali ako želite admin panel i na mobilnoj:

1. **Admin Login:**
   - `app/admin-login.tsx`

2. **Admin Dashboard:**
   - `app/(admin)/dashboard.tsx`
   - Overview statistike
   - Quick actions

3. **Admin Funkcionalnosti:**
   - User management (osnovno)
   - Orders overview
   - Missions overview
   - Security alerts

**Fajl:** `/mobile/app/(admin)/_layout.tsx` i podstranice

---

## 🌐 3. WEB APLIKACIJA - Ostalo

### ✅ Šta Postoji

1. **Landing Page** (`/`)
   - ✅ Marketplace pregled
   - ✅ Product listing
   - ✅ Login linkovi

2. **Buyer Portal:**
   - ✅ Shop (`/buyer/shop`)
   - ✅ Orders (**kanon:** `/buyer-portal/orders`; stari `/buyer/orders` trajno redirectuje na portal)

3. **Producer Portal:**
   - ✅ Dashboard (**kanon za grower početak:** `/grower`; stari `/producer/dashboard` redirectuje)
   - ✅ Scanner (`/producer/scanner`)

4. **Grower Portal:**
   - ✅ Portal (`/grower/portal`)
   - ✅ Quality Entry (`/grower/quality-entry`)
   - ✅ Compliance Photos (`/grower/compliance-photos`)
   - ✅ Materials (`/grower/materials`)

5. **Logistics Partner:**
   - ✅ Dashboard (`/logistics-partner`)
   - ✅ Handover (`/logistics-partner/handover`)

6. **Fleet Partner:**
   - ✅ Dashboard (`/fleet-partner`)
   - ✅ Missions (`/fleet-partner/missions`)
   - ✅ Deliveries (`/fleet-partner/deliveries`)
   - ✅ Payouts (`/fleet-partner/payouts`)

---

### ❌ Šta Nedostaje (Web)

1. **Admin Dashboard** (`/admin`)
   - ❌ Glavna admin stranica (prioritet: VISOK)

2. **User Management** (`/admin/users`)
   - ❌ CRUD za korisnike (prioritet: VISOK)

3. **Product Catalog** (`/admin/products`)
   - ❌ CRUD za proizvode (prioritet: VISOK)

4. **Goals Management** (`/admin/goals`)
   - ❌ Zadavanje ciljeva farmerima (prioritet: SREDNJI)

5. **Orders Management** (`/admin/orders`)
   - ❌ Pregled svih porudžbina (prioritet: SREDNJI)

6. **Missions Management** (`/admin/missions`)
   - ❌ Pregled svih misija (prioritet: SREDNJI)

7. **Security Alerts** (`/admin/security`)
   - ❌ Pregled security alerts (prioritet: VISOK)

8. **Market Prices** (`/admin/market-prices`)
   - ❌ Postavljanje market prices (prioritet: SREDNJI)

9. **Auth Guards:**
   - ❌ Middleware za zaštitu admin stranica
   - ❌ Role-based access control

10. **Buyer Registration:**
    - ❌ Registration stranica za buyer-e (`/register/buyer`)

11. **Profile Pages:**
    - ⚠️ Postoji `/buyer-portal/profile` ali možda treba proširiti
    - ❌ Producer profile page

---

## 📱 4. MOBILNA APLIKACIJA - Ostalo

### ✅ Šta Postoji

1. **Login:**
   - ✅ Universal login
   - ✅ Buyer login
   - ✅ Producer login

2. **Producer Dashboard:**
   - ✅ Dashboard (`(producer)/(tabs)/index.tsx`)
   - ✅ Estates management
   - ✅ Batches
   - ✅ Missions
   - ✅ Orders
   - ✅ Field Log
   - ✅ Harvest
   - ✅ Wallet
   - ✅ Profile
   - ✅ Settings
   - ✅ Shop (seeds)

3. **Buyer Dashboard:**
   - ✅ Shop (`(buyer)/shop.tsx`)
   - ✅ Cart (`(buyer)/cart.tsx`)
   - ✅ Checkout (`(buyer)/checkout.tsx`)
   - ✅ Orders (`(buyer)/orders.tsx`)
   - ✅ Profile (`(buyer)/profile.tsx`)

4. **Funkcionalnosti:**
   - ✅ QR Scanner
   - ✅ Map integration
   - ✅ Offline support
   - ✅ Notifications

---

### ❌ Šta Nedostaje (Mobilna)

1. **Admin Login i Dashboard:**
   - ❌ Admin login (`app/admin-login.tsx`)
   - ❌ Admin dashboard (`app/(admin)/dashboard.tsx`)
   - **Prioritet:** NIZAK (admin panel je primarno za web)

2. **Auth Guards:**
   - ⚠️ Postoji `AuthGuard.tsx` ali nije korišćen svuda
   - ❌ Dodati na sve zaštićene stranice
   - **Prioritet:** SREDNJI

3. **Session Management:**
   - ❌ Token refresh logika
   - ❌ Auto-logout pri isteku tokena
   - **Prioritet:** SREDNJI

4. **Buyer Registration:**
   - ✅ Postoji `app/buyer-register.tsx` - proveriti da li radi kako treba

5. **Error Handling:**
   - ⚠️ Postoji ali možda treba poboljšati
   - ❌ Global error boundary

6. **Offline Sync Status:**
   - ⚠️ Postoji sync service ali možda treba UI za status
   - ❌ Pregled pending sync entries

---

## 🎯 PRIORITETI

### 🔴 VISOK PRIORITET (Kritično)

1. **Web Admin Dashboard** (`/admin`)
   - Glavna admin stranica sa overview-om

2. **Web User Management** (`/admin/users`)
   - CRUD za korisnike

3. **Web Product Catalog** (`/admin/products`)
   - CRUD za proizvode (zavisi od Product Catalog sistema)

4. **Web Security Alerts** (`/admin/security`)
   - Pregled security alerts

5. **Auth Guards (Web)**
   - Zaštita admin stranica

6. **Admin Login (Web)**
   - Posebna login stranica za admin (`/login/admin`)

---

### 🟡 SREDNJI PRIORITET

1. **Web Goals Management** (`/admin/goals`)
   - Zadavanje ciljeva farmerima

2. **Web Orders Management** (`/admin/orders`)
   - Pregled svih porudžbina

3. **Web Missions Management** (`/admin/missions`)
   - Pregled svih misija

4. **Web Market Prices** (`/admin/market-prices`)
   - Postavljanje market prices

5. **Mobilna Auth Guards**
   - Zaštita stranica

6. **Mobilna Session Management**
   - Token refresh

---

### 🟢 NIZAK PRIORITET

1. **Web Trust Scores** (`/admin/trust-scores`)
   - Pregled trust scores

2. **Mobilna Admin Panel**
   - Admin dashboard na mobilnoj (opciono)

3. **Web Profile Pages**
   - Proširenje profile stranica

---

## 📝 IMPLEMENTACIJA CHECKLIST

### Faza 1: Admin Login i Dashboard (VISOK PRIORITET)

- [ ] Kreirati `/web/app/login/admin/page.tsx`
- [ ] Kreirati `/web/app/admin/page.tsx` (glavni dashboard)
- [ ] Dodati Auth Guard middleware
- [ ] Integrisati sa backend API-om za statistike

### Faza 2: User Management (VISOK PRIORITET)

- [ ] Kreirati `/web/app/admin/users/page.tsx`
- [ ] Implementirati listu korisnika
- [ ] Implementirati kreiranje korisnika
- [ ] Implementirati editovanje korisnika
- [ ] Implementirati suspend/activate

### Faza 3: Product Catalog (VISOK PRIORITET)

- [ ] Implementirati Product Catalog backend (iz `PRODUCT_MANAGEMENT_SYSTEM.md`)
- [ ] Kreirati `/web/app/admin/products/page.tsx`
- [ ] Implementirati CRUD operacije
- [ ] Implementirati sezonski kalendar

### Faza 4: Security i Orders (VISOK/SREDNJI PRIORITET)

- [ ] Kreirati `/web/app/admin/security/page.tsx`
- [ ] Kreirati `/web/app/admin/orders/page.tsx`
- [ ] Implementirati pregled i akcije

### Faza 5: Goals i Missions (SREDNJI PRIORITET)

- [ ] Implementirati Goals backend (iz `PRODUCT_MANAGEMENT_SYSTEM.md`)
- [ ] Kreirati `/web/app/admin/goals/page.tsx`
- [ ] Kreirati `/web/app/admin/missions/page.tsx`

### Faza 6: Mobilna Poboljšanja (SREDNJI PRIORITET)

- [ ] Dodati AuthGuard na sve zaštićene stranice
- [ ] Implementirati token refresh
- [ ] Poboljšati error handling

---

## 🔗 POVEZANI DOKUMENTI

- `PRODUCT_MANAGEMENT_SYSTEM.md` - Product Catalog i Goals sistem
- `BUSINESS_LOGIC_COMPLETE.md` - Backend business logika
- `ARCHITECTURE.md` - Arhitektura sistema

---

## 💡 NAPOMENE

1. **Admin Panel je primarno za Web** - Mobilna verzija je opciona
2. **Product Catalog i Goals** zavise od backend implementacije iz `PRODUCT_MANAGEMENT_SYSTEM.md`
3. **Auth Guards** su kritični za bezbednost - prioritet VISOK
4. **Admin Dashboard** je prvi korak - sve ostalo se gradi na njemu
