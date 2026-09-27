# Bio Vera - Pregled Projekta

## 📁 Struktura Projekta

```
bio-vera/
├── backend/                    # NestJS Backend API
│   ├── prisma/
│   │   └── schema.prisma      # Kompletna baza podataka (1000+ linija)
│   ├── src/
│   │   ├── auth/              # Autentifikacija (JWT, PartnerCode)
│   │   ├── users/             # Upravljanje korisnicima
│   │   ├── estates/           # Upravljanje njivama
│   │   ├── parcels/           # Upravljanje parcelama
│   │   ├── seeds/             # Upravljanje semenom
│   │   ├── smart-lock/        # QR skeniranje i validacija
│   │   ├── anti-fraud/        # Zaštita od prevare
│   │   ├── growth-logs/       # Neizmenljivi logovi rasta
│   │   ├── orders/            # E-commerce porudžbine
│   │   ├── payments/           # Escrow i split payment
│   │   ├── deliveries/        # Dostave sa QR potvrdom
│   │   ├── batches/            # Batch tracking (praćenje gajbica)
│   │   ├── inventory/          # Dinamički inventar
│   │   ├── wallets/             # Novčanici za vozače/farmere
│   │   ├── waybills/           # Automatski tovarni listovi
│   │   ├── invoices/           # Automatske fakture
│   │   ├── notifications/      # Smart notification engine
│   │   └── digital-passports/  # EU sertifikati
│   └── package.json
│
└── mobile/                     # React Native Expo App
    ├── app/
    │   ├── index.tsx           # Landing page (Marketplace)
    │   ├── partner-login.tsx   # Producer login
    │   ├── buyer-login.tsx     # Buyer login
    │   ├── (producer)/          # Producer interfejs
    │   │   ├── dashboard.tsx
    │   │   ├── estates.tsx
    │   │   ├── scanner.tsx
    │   │   └── growth-journal.tsx
    │   └── (buyer)/             # Buyer interfejs
    │       ├── shop.tsx
    │       ├── orders.tsx
    │       ├── vera-standard.tsx
    │       └── profile.tsx
    ├── i18n/
    │   └── locales/
    │       └── sr.json          # Srpski prevodi
    └── hooks/
        └── useAuth.ts           # Auth hook
```

## 🗄️ Database Schema (Prisma)

### Glavni Modeli:

1. **User** - Korisnici (Farmer, Driver, Buyer, Admin, Partner, HubManager)
2. **Estate** - Njive sa GPS poligonima
3. **Parcel** - Parcele unutar njiva
4. **Seed** - Seme sa QR kodovima
5. **GrowthLog** - Neizmenljivi logovi rasta (SHA-256 hash)
6. **Order** - Porudžbine
7. **Payment** - Escrow plaćanja sa split logikom
8. **Delivery** - Dostave sa QR kodom za potvrdu
9. **Batch** - Praćenje svake gajbice (Batch_ID)
10. **Hub** - Skladišta
11. **Inventory** - Dinamički inventar
12. **Wallet** - Novčanici
13. **Waybill** - Tovarni listovi
14. **Invoice** - Fakture
15. **Rating** - Ocene i reputacija
16. **TrustScore** - Trust score sistem
17. **Notification** - Notifikacije

## 🔑 Ključne Funkcionalnosti

### 1. Smart-Lock System
- **Lokacija**: `backend/src/smart-lock/`
- QR kod skeniranje je primarni ključ za aktivnost
- Validacija da površina parcele odgovara količini semena
- Status INVALID ako se ne poklapa

### 2. Anti-Fraud System
- **Lokacija**: `backend/src/anti-fraud/`
- Zabrana galerije (samo kamera)
- Provera vremena na telefonu
- GPS validacija
- Device ID tracking

### 3. Escrow Payment System
- **Lokacija**: `backend/src/payments/`
- Plaćanje se zaključava u escrow
- Automatski split na potvrdu dostave:
  - 70% farmeru
  - 20% vozaču
  - 10% platformi

### 4. Digital Handshake
- **Lokacija**: `backend/src/deliveries/`
- Kupac skenira QR kod sa vozačevog telefona
- Automatsko oslobađanje plaćanja
- Neoboriv dokaz dostave

### 5. Batch Tracking
- **Lokacija**: `backend/src/batches/`
- Svaka gajbica ima Batch_ID
- Jednoklik traceability:
  - Ko je ubrao
  - Ko je vozio
  - Koji hub je čuvao
- Prijava problema sa kvalitetom

### 6. Dynamic Inventory
- **Lokacija**: `backend/src/inventory/`
- Lokacijski bazirana dostupnost
- Kalkulacija vremena dostave na osnovu udaljenosti
- Ako je roba u Nišu, kupac u Subotici vidi duže vreme

### 7. Smart Notifications
- **Lokacija**: `backend/src/notifications/`
- Farmer: "Kombi stiže za 20 min"
- Vozač: "Nova tura u tvojoj blizini"
- Kupac: "Tvoj Bio paket je spakovan"

### 8. Automatic Documentation
- **Waybills**: `backend/src/waybills/` - Automatski generisani PDF
- **Invoices**: `backend/src/invoices/` - Automatski generisani PDF
- Email dostava

## 📱 Mobile App Struktura

### Landing Page (Marketplace)
- Katalog proizvoda
- Kategorije (Voće, Povrće, Žitarice)
- Bio Vera Premium sekcija
- "Postani Bio Vera Proizvođač" CTA

### Buyer Interface
- Shop - Katalog sa lokacijskim dostupnošću
- Orders - Istorija porudžbina
- Bio Vera Standard - Informacije o sertifikaciji
- Profile - Adresa za dostavu

### Producer Interface
- Dashboard - Pregled njiva i napretka
- Estates - Upravljanje njivama
- Scanner - QR kod skener
- Growth Journal - Dnevnik rasta

## 🔐 Security Features

1. **Cryptographic Hashing**
   - SHA-256 za sve GrowthLogs
   - Immutable logs (neizmenljivi)
   - Digital passport hash

2. **Anti-Fraud**
   - GPS timestamp verification
   - Device time change detection
   - Camera-only capture

3. **Role-Based Access**
   - Farmer, Driver, Buyer, Admin, Partner, HubManager
   - Svaki korisnik vidi samo svoje podatke

## 💰 Payment Flow

1. Buyer plati → Payment u ESCROW
2. Delivery dodeljena vozaču
3. Vozač pokupi sa farme
4. Vozač dostavi kupcu
5. Kupac skenira QR kod
6. **Automatski split payment:**
   - 70% → Farmer wallet
   - 20% → Driver wallet
   - 10% → Platform

## 📊 Batch Traceability Flow

1. Farmer ubere → Kreira Batch_ID
2. Batch ide u Hub
3. Batch dodeljen Order-u
4. Batch dostavljen kupcu
5. **Ako problem:** Jednoklik traceability pokazuje:
   - Ko je ubrao
   - Ko je vozio
   - Koji hub je čuvao
   - Kompletnu istoriju

## 🚀 Next Steps

1. **Instalacija zavisnosti:**
   ```bash
   cd backend && npm install
   cd ../mobile && npm install
   ```

2. **Database Setup:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

3. **Environment Variables:**
   - Kreirati `.env` fajl u `backend/`
   - Postaviti `DATABASE_URL`, `JWT_SECRET`, itd.

4. **Pokretanje:**
   ```bash
   # Backend
   cd backend && npm run start:dev
   
   # Mobile
   cd mobile && npx expo start
   ```

## 📝 Napomene

- Sve ime varijabli i funkcija su na **engleskom**
- UI tekstovi su na **srpskom** (i18n)
- Prisma schema je kompletan sa svim relacijama
- Backend servisi su implementirani sa biznis logikom
- Mobile app ima osnovne ekrane (treba dodati API integraciju)
