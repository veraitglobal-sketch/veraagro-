# Bio Vera - Brzi Start 🚀

## Preduslovi

Pre nego što pokreneš aplikaciju, potrebno je da imaš instalirano:

1. **Node.js** (v18 ili noviji) - [Download](https://nodejs.org/)
2. **PostgreSQL** - [Download](https://www.postgresql.org/download/)
3. **npm** ili **yarn**
4. **Expo CLI** (za mobilnu aplikaciju) - `npm install -g expo-cli`

## Korak 1: Backend Setup

### 1.1 Instalacija zavisnosti

```bash
cd backend
npm install
```

### 1.2 Database Setup

1. Kreiraj PostgreSQL bazu podataka:
```bash
createdb biovera_db
```

Ili koristi PostgreSQL GUI (pgAdmin, DBeaver, itd.) da kreiraš bazu `biovera_db`.

2. Ažuriraj `.env` fajl sa tvojim database credentials:
```env
DATABASE_URL="postgresql://tvoj_username:tvoja_lozinka@localhost:5432/biovera_db?schema=public"
```

3. Generiši Prisma client:
```bash
npx prisma generate
```

4. Pokreni migracije:
```bash
npx prisma migrate dev --name init
```

### 1.3 Pokretanje Backend Servera

```bash
npm run start:dev
```

Backend će biti dostupan na: `http://localhost:3000`

## Korak 2: Mobile App Setup

### 2.1 Instalacija zavisnosti

```bash
cd mobile
npm install
```

### 2.2 Pokretanje Mobile App

```bash
npm start
```

Ili direktno:
```bash
npx expo start
```

### 2.3 Povezivanje sa Backend-om

U `mobile/hooks/useAuth.ts` ažuriraj API_URL:

```typescript
const API_URL = 'http://localhost:3000'; // Za iOS simulator
// ili
const API_URL = 'http://192.168.x.x:3000'; // Za fizički telefon (zameni sa tvojom IP adresom)
```

Za fizički telefon:
1. Pronađi svoju lokalnu IP adresu:
   - Mac: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
2. Ažuriraj `API_URL` sa tom IP adresom
3. Uveri se da su telefon i računar na istoj WiFi mreži

## Korak 3: Testiranje

### Backend API Test

Otvorí browser ili koristi curl:
```bash
curl http://localhost:3000
```

### Mobile App

1. Instaliraj **Expo Go** aplikaciju na telefon:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Skeniraj QR kod koji se pojavi u terminalu nakon `expo start`

Ili koristi simulator:
- iOS: Pritisni `i` u terminalu
- Android: Pritisni `a` u terminalu

## Troubleshooting

### Problem: Database connection error

**Rešenje:**
- Proveri da li je PostgreSQL pokrenut
- Proveri credentials u `.env` fajlu
- Proveri da li baza `biovera_db` postoji

### Problem: Port 3000 je zauzet

**Rešenje:**
- Promeni PORT u `.env` fajlu
- Ili zaustavi proces koji koristi port 3000:
  ```bash
  lsof -ti:3000 | xargs kill
  ```

### Problem: Mobile app ne može da se poveže sa backend-om

**Rešenje:**
- Proveri da li su na istoj WiFi mreži
- Proveri firewall settings
- Za iOS simulator koristi `localhost`
- Za Android emulator koristi `10.0.2.2` umesto `localhost`

### Problem: Prisma migrate ne radi

**Rešenje:**
```bash
npx prisma migrate reset  # Oprez: briše sve podatke!
npx prisma migrate dev
```

## Korisni Komandi

### Backend
```bash
# Development mode (auto-reload)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Prisma Studio (GUI za bazu)
npx prisma studio

# Reset database
npx prisma migrate reset
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

## Sledeći Koraci

1. **Kreiraj prvog korisnika** (Admin/Farmer) direktno u bazi ili kroz API
2. **Testiraj QR skeniranje** - koristi test QR kod
3. **Testiraj escrow payment flow**
4. **Dodaj test podatke** za estate, parcels, seeds

## Podrška

Ako imaš problema, proveri:
- `README.md` - Kompletna dokumentacija
- `PROJECT_OVERVIEW.md` - Pregled arhitekture
- Backend logs u terminalu
- Mobile app logs u Expo Go aplikaciji
