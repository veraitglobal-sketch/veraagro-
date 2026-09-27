# Mobilna aplikacija — simulator, 26.09.2026.

## Lokalno okruženje

Android AVD: `Medium_Phone_API_36.1`, Android 36.1 x86_64. Expo Go: SDK 54 (54.0.8). Metro: port 8083. Koristi se stvarni React Native Android bundle, ne web prikaz.

API se pokreće komandom `cd backend && npm run test:mobile:api`. Runner pravi i migrira izolovanu PostgreSQL bazu, a zatim pokreće Nest fixture iz `backend/test/mobile-fixture.ts`. Njegov lokalni port i PID zapisuju se u `backend/test-results/mobile/api.json`. Testni nalog: `buyer` / `Buyer-test-2026!`. Nalog postoji samo u privremenoj bazi.

Za Metro postaviti `EXPO_PUBLIC_API_URL=http://10.0.2.2:<port-iz-api.json>` i pokrenuti `npx expo start --go --localhost --port 8083` iz mobile direktorijuma. `10.0.2.2` je adresa hosta iz Android emulatora. Na iOS simulatoru koristio bi se `127.0.0.1` umesto nje.

Za povezivanje Metro servera koristiti `adb -s emulator-5554 reverse tcp:8083 tcp:8083`, pa otvoriti `exp://127.0.0.1:8083` u Expo Go. Potrebno je sačekati da `adb shell getprop sys.boot_completed` vrati `1`; samo pojavljivanje uređaja u `adb devices` nije dovoljno.

Pomoćni alat `mobile/scripts/android-ui.py` čita UI, pritiska vidljive elemente po tekstu, unosi testne vrednosti i pravi PNG snimke. Odbija serijske brojeve fizičkih uređaja.

## Promene i provere

- `expo-splash-screen` je bio `^56.0.10`, dok lokalni Expo SDK 54 zahteva `~31.0.13`. Paket i lockfile su usklađeni.
- Android Metro bundle uspešno se sastavlja (HTTP 200).
- Mobilna TypeScript provera prolazi.

## Granice testnog okruženja

Testni API koristi stvarne servise za autentifikaciju, inventar, narudžbine, dostavu i in-app notifikacije. Email, push slanje i generisanje PDF dokumenata su zamenjeni testnim implementacijama. Firebase/APNs, fizička kamera i stvarna banka nisu predmet ove provere.

Prilikom SIGTERM/SIGINT gašenja fixture zapisuje testne narudžbine u `backend/test-results/mobile/database-orders.json`; runner zatim uklanja svoju privremenu bazu. Produkcioni server i produkciona baza nisu cilj testova.

## Ishod ove sesije

Testiranje je zaustavljeno na zahtev korisnika. Android sistem je tokom instalacije Expo Go pao sa DeadSystemException; log je sačuvan u lokalnom test-results/mobile/android-system-crash.log. Prijava, korpa i kupovina u mobilnom simulatoru nisu proverene i ne računaju se kao uspešni testovi. Dostupan iPhone 15 / iOS 17 simulator nije iskorišćen za aplikacioni test pre prekida.
