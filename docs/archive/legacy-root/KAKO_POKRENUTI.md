# 🚀 Kako Pokrenuti BioVera Projekat

## 📋 Preduslovi

Pre pokretanja, proveri da imaš instalirano:

- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **npm** ili **yarn**
- **PostgreSQL** (za backend)
- **Expo CLI** (za mobile) - `npm install -g expo-cli`

---

## 🎯 Brzi Start (3 Terminala)

### Terminal 1: Backend
```bash
cd backend
npm install
npm run start:dev
```
Backend će raditi na: **http://localhost:3000**

### Terminal 2: Web Aplikacija
```bash
cd web
npm install
npm run dev
```
Web će raditi na: **http://localhost:3001** (ili sledeći slobodan port)

### Terminal 3: Mobile Aplikacija
```bash
cd mobile
npm install
npm start
```
Otvori Expo Go na telefonu i skeniraj QR kod, ili pritisni `i` za iOS simulator / `a` za Android emulator.

---

## 📝 Detaljni Koraci

### 1️⃣ Backend Setup

```bash
# Instalacija zavisnosti
cd backend
npm install

# Konfiguriši .env fajl
# Proveri da li postoji backend/.env fajl sa:
# - DATABASE_URL (Supabase connection string)
# - JWT_SECRET (neki random string)
# 
# Za Supabase connection string, vidi:
# backend/SUPABASE_CONNECTION.md ili backend/KOPIRAJ_CONNECTION_STRING.md

# Generiši Prisma client
npx prisma generate

# Pokreni migracije (ako već nisu pokrenute)
npx prisma migrate dev

# Pokreni server
npm run start:dev
```

**Napomena:** 
- Projekat koristi **Supabase** za bazu podataka
- Proveri `backend/SUPABASE_CONNECTION.md` za detalje o connection string-u
- Ako nemaš `.env` fajl, kreiraj ga sa `DATABASE_URL` i `JWT_SECRET`

### 2️⃣ Web Setup

```bash
# Instalacija zavisnosti
cd web
npm install

# Pokreni development server
npm run dev
```

Web aplikacija će biti dostupna na **http://localhost:3001** (ili drugi port ako je 3001 zauzet).

### 3️⃣ Mobile Setup

```bash
# Instalacija zavisnosti
cd mobile
npm install

# Pokreni Expo
npm start
```

**Za fizički telefon:**
1. Instaliraj **Expo Go** aplikaciju:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Skeniraj QR kod koji se pojavi u terminalu
3. Uveri se da su telefon i računar na istoj WiFi mreži

**Za simulator:**
- iOS: Pritisni `i` u terminalu
- Android: Pritisni `a` u terminalu

---

## 🔧 Korisne Komande

### Backend
```bash
# Development mode (auto-reload)
npm run start:dev

# Prisma Studio (GUI za bazu)
npx prisma studio

# Kreiraj test korisnike
npm run create:users

# Kreiraj test podatke
npm run create:data
```

### Web
```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

### Mobile
```bash
# Start Expo
npm start

# Clear cache
npx expo start -c

# iOS simulator
npm run ios

# Android emulator
npm run android
```

---

## 🐛 Troubleshooting

### Problem: Backend ne može da se poveže sa bazom
**Rešenje:**
- Projekat koristi **Supabase** (cloud PostgreSQL)
- Proveri `DATABASE_URL` u `backend/.env`
- Vidi `backend/SUPABASE_CONNECTION.md` za detalje
- Kopiraj connection string direktno iz Supabase Dashboard-a (vidi `backend/KOPIRAJ_CONNECTION_STRING.md`)

### Problem: Port je zauzet
**Rešenje:**
```bash
# Zaustavi proces na portu 3000
lsof -ti:3000 | xargs kill

# Ili promeni PORT u .env fajlu
```

### Problem: Mobile app ne može da se poveže sa backend-om
**Rešenje:**
- Proveri da li su na istoj WiFi mreži
- Za iOS simulator koristi `localhost`
- Za Android emulator koristi `10.0.2.2`
- Za fizički telefon, ažuriraj `API_URL` u `mobile/lib/api.ts` sa tvojom lokalnom IP adresom

### Problem: Prisma migrate ne radi
**Rešenje:**
```bash
# Reset baze (OPREZ: briše sve podatke!)
npx prisma migrate reset

# Ili samo pokreni migracije
npx prisma migrate dev
```

---

## 📱 API URL Konfiguracija

### Za Mobile App

Ako koristiš fizički telefon, ažuriraj `API_URL` u:
- `mobile/lib/api.ts`

```typescript
const API_URL = 'http://192.168.x.x:3000'; // Zameni sa tvojom IP adresom
```

**Kako pronaći IP adresu:**
- Mac: `ifconfig | grep "inet "`
- Windows: `ipconfig`
- Linux: `ip addr show`

---

## ✅ Provera da li sve radi

1. **Backend:** Otvori http://localhost:3000 u browseru (trebalo bi da vidiš health check)
2. **Web:** Otvori http://localhost:3001 u browseru
3. **Mobile:** Skeniraj QR kod ili otvori u simulatoru

---

## 🎉 Sledeći Koraci

1. **Kreiraj prvog korisnika** - koristi `npm run create:users` u backend direktorijumu
2. **Testiraj login** - na web ili mobile aplikaciji
3. **Dodaj test podatke** - koristi `npm run create:data` za estates, parcels, seeds

---

## 📚 Dodatna Dokumentacija

- `QUICK_START.md` - Detaljniji vodič
- `README.md` - Kompletna dokumentacija
- `PROJECT_OVERVIEW.md` - Pregled arhitekture
- `PRODUCER_PANEL_PLAN.md` - Plan za Producer Mobile Panel
