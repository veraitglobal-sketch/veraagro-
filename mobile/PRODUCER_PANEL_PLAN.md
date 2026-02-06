# 📱 Producer Mobile Panel - Kompletan Plan

## 🎯 Trenutno Stanje

### ✅ Već Implementirano:
1. **Dashboard** - Osnovni pregled sa trust score, quick actions
2. **Field Log** - Unos radova na njivi (offline-first)
3. **Shop** - Nabavka semena/inputa
4. **Profile** - Profil korisnika
5. **Settings** - Podešavanja (notifikacije, auto-sync, GPS)
6. **Harvest** - Prijava berbe
7. **Wallet** - Novčanik i transakcije
8. **Scanner** - QR/Barcode skener

### ⚠️ Delimično Implementirano:
- **Estates** - Postoji ali je prazan
- **Growth Journal** - Postoji ali je prazan

### ❌ Potrebno Dodati:
1. **Estates Management** - Detaljno upravljanje njivama
2. **Compliance Photos** - Upload slika sa GPS validacijom
3. **Quality Entry** - Unos kvaliteta proizvoda
4. **Materials Management** - Pregled materijala i whitelist
5. **Mission Tracker** - Praćenje misija i zadataka
6. **Batches** - Pregled batch-ova, status, traceability
7. **Orders** - Pregled porudžbina proizvođača
8. **Notifications** - Smart notifikacije

---

## 📋 Detaljan Plan Implementacije

### 1. Dashboard Poboljšanja
**Prioritet: Visok**

**Trenutno:**
- Trust Score Widget ✅
- Quick Actions (Scan, New Entry, Harvest) ✅
- Recent Activity ✅
- Sync Status ✅

**Dodati:**
- **Active Missions** - Kratak pregled aktivnih misija
- **Active Batches** - Pregled batch-ova u različitim fazama
- **Notifications Badge** - Broj nepročitanih notifikacija
- **Financial Summary** - Ukupno zarađeno, pending, next payout

---

### 2. Estates Management
**Prioritet: Visok**

**Funkcionalnosti:**
- Lista svih njiva (estates)
- Dodavanje nove njive (GPS polygon)
- Detalji njive:
  - Naziv, lokacija, površina
  - Parcele unutar njive
  - Status sertifikacije
  - Mapa sa granicama
- Edit/Delete njive

**Backend Endpoints:**
- `GET /estates` - Lista njiva ✅
- `POST /estates` - Kreiranje ✅
- `GET /estates/:id` - Detalji ✅
- `PUT /estates/:id` - Update
- `DELETE /estates/:id` - Delete

---

### 3. Compliance Photos
**Prioritet: Visok**

**Funkcionalnosti:**
- Upload slika sa GPS validacijom
- Pregled svih compliance slika
- Filter po datumu, parceli, tipu
- Offline storage sa auto-sync

**Backend Endpoints:**
- `POST /compliance/photos` - Upload slike
- `GET /compliance/photos` - Lista slika
- `GET /compliance/photos/:id` - Detalji

---

### 4. Quality Entry
**Prioritet: Visok**

**Funkcionalnosti:**
- Unos kvaliteta proizvoda pre pakovanja
- Povezivanje sa batch-om
- Validacija pre slanja
- Status: Draft, Submitted, Approved

**Backend Endpoints:**
- `POST /quality-entry` - Kreiranje ✅
- `GET /quality-entry/batch/:batchId` - Pregled ✅
- `GET /quality-entry/can-create-shipment/:batchId` - Provera ✅

---

### 5. Materials Management
**Prioritet: Srednji**

**Funkcionalnosti:**
- Pregled whitelist materijala
- Pretraga po barcodu
- Filter po tipu (fertilizer, pesticide, etc.)
- Offline whitelist cache

**Backend Endpoints:**
- `GET /compliance/white-list` - Lista ✅
- Lokalni cache u AsyncStorage

---

### 6. Mission Tracker
**Prioritet: Visok**

**Funkcionalnosti:**
- Lista misija (Pending, Active, Completed)
- Detalji misije:
  - Batch info
  - Status (Created, Assigned, In Transit, Delivered)
  - Journey map
  - Timeline
- Consumer feedback
- Financial status

**Backend Endpoints:**
- `GET /missions/my-missions` - Lista ✅
- `GET /grower-portal/mission-tracker` - Tracker ✅
- `GET /grower-portal/journey-map/:missionId` - Mapa ✅
- `GET /grower-portal/consumer-feedback/:batchId` - Feedback ✅
- `GET /grower-portal/financial-status/:batchId` - Finansije ✅

---

### 7. Batches
**Prioritet: Visok**

**Funkcionalnosti:**
- Lista svih batch-ova
- Filter po statusu (Packed, In Hub, In Transit, Delivered)
- Detalji batch-a:
  - Batch ID (QR kod)
  - Product info
  - Traceability (who harvested, who drove, which hub)
  - Location history
  - Quality issues
- Kreiranje novog batch-a (pri berbi)

**Backend Endpoints:**
- `GET /batches` - Lista (potrebno dodati)
- `POST /batches` - Kreiranje ✅
- `GET /batches/:batchId/traceability` - Traceability ✅
- `GET /batches/:batchId/availability` - Availability ✅
- `POST /batches/:batchId/report-issue` - Quality issue ✅

---

### 8. Orders (Producer View)
**Prioritet: Srednji**

**Funkcionalnosti:**
- Lista porudžbina proizvođača
- Filter po statusu
- Detalji porudžbine:
  - Buyer info
  - Product, quantity, price
  - Delivery address
  - Payment status
  - Timeline

**Backend Endpoints:**
- `GET /orders` - Lista (već postoji, ali treba filter za producer)

---

### 9. Notifications
**Prioritet: Srednji**

**Funkcionalnosti:**
- Lista notifikacija
- Mark as read
- Filter po tipu
- Push notifications (budućnost)

**Backend Endpoints:**
- `GET /notifications` - Lista ✅
- `PATCH /notifications/:id/read` - Mark as read ✅

---

### 10. Growth Journal Poboljšanja
**Prioritet: Nizak**

**Funkcionalnosti:**
- Hronološki pregled growth logova
- Filter po parceli, datumu
- Slike sa GPS metadata
- Export u PDF (budućnost)

---

## 🎨 UI/UX Principi

### Dizajn:
- **Minimalistički** - Tanki fontovi, tanki borderi
- **Farmer-friendly** - Veliki dugmići (60px+), veliki fontovi (18px+)
- **Offline-first** - Sve radi bez interneta
- **High contrast** - Optimizovano za rad na suncu

### Navigacija:
- Tab-based za glavne sekcije
- Stack navigation za detalje
- Floating action button za brze akcije

---

## 📱 Predložena Struktura Tabova

### Glavni Tabovi:
1. **Dashboard** - Pregled svih aktivnosti
2. **Estates** - Upravljanje njivama
3. **Field Log** - Unos radova
4. **Batches** - Praćenje proizvoda
5. **Profile** - Profil i podešavanja

### Hidden Screens (dostupni preko navigacije):
- Shop (seeds/inputs)
- Wallet
- Settings
- Scanner
- Harvest
- Missions
- Orders
- Notifications
- Compliance Photos
- Quality Entry
- Materials
- Growth Journal

---

## 🚀 Redosled Implementacije

### Faza 1 (Prioritet: Visok):
1. ✅ Dashboard poboljšanja
2. Estates Management
3. Batches ekran
4. Mission Tracker

### Faza 2 (Prioritet: Srednji):
5. Compliance Photos
6. Quality Entry
7. Orders (producer view)
8. Notifications

### Faza 3 (Prioritet: Nizak):
9. Materials Management
10. Growth Journal poboljšanja

---

## 🔗 Backend Integracija

### Potrebni API Endpoints:
- `GET /estates` - ✅ Postoji
- `GET /batches` - ❌ Potrebno dodati (sa filterom za producer)
- `GET /missions/my-missions` - ✅ Postoji
- `GET /notifications` - ✅ Postoji
- `GET /orders?producerId=:id` - ❌ Potrebno dodati filter
- `POST /compliance/photos` - ❌ Potrebno dodati
- `GET /compliance/photos` - ❌ Potrebno dodati

---

## 📝 Napomene

- Sve ekrane treba implementirati sa **offline-first** pristupom
- **GPS validacija** obavezna za sve field entries
- **Barcode validacija** obavezna za sve materijale
- **Auto-sync** kada je internet dostupan
- **Error handling** sa user-friendly porukama
