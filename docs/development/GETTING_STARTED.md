# Lokalno pokretanje

Koristiti Node.js 22, kao u CI konfiguraciji, i npm. PostgreSQL je potreban za backend i integracione testove. Komande u ovom vodiču polaze iz korena repozitorijuma, osim kada je izričito naveden drugi direktorijum.

## Instalacija

```sh
npm ci
npm ci --prefix backend
npm ci --prefix web
npm ci --prefix mobile
npm run prisma:generate --prefix backend
```

Ne pokretati stare repair/reset skripte da bi se postavilo razvojno okruženje. Postupak inicijalizacije opisuje [vodič za migracije](../../backend/MIGRATIONS.md).

## Backend

Za samostalan backend podesiti `backend/.env`: `DATABASE_URL` za lokalnu razvojnu bazu, `JWT_SECRET`, `NODE_ENV=development` i `PORT=3000`. Dodatne opcije opisuje `backend/.env.example`. Start aplikacije primenjuje migracije nad izabranom bazom.

```sh
npm run start:dev --prefix backend
```

Za testiranje kupovine sa privremenom bazom i testnim korisnicima:

```sh
npm run test:mobile:api --prefix backend
```

Ova komanda pravi sopstveni PostgreSQL klaster. Adresa API-ja i PID nalaze se u `backend/test-results/mobile/api.json`. Testni kupac je `buyer`, lozinka `Buyer-test-2026!`; nalog nije produkcioni. Po završetku ugasiti fixture signalom SIGTERM/SIGINT, kako bi runner uklonio privremenu bazu.

## Web

Za API na portu 3000:

```sh
NEXT_PUBLIC_API_URL=http://localhost:3000 npm run dev --prefix web -- --port 3001
```

Web je na `http://localhost:3001`. Kada se koristi privremeni testni API, zameniti 3000 njegovim portom iz `api.json`. Razvojni server ponovo pokrenuti posle promene javne API adrese.

## Mobile

Za iOS simulator i API na hostu:

```sh
cd mobile
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000 npx expo start
```

Za Android emulator koristiti `http://10.0.2.2:3000`. Port prilagoditi pokrenutom API-ju. `EXPO_PUBLIC_API_URL` eksplicitno određuje okruženje; release profil u `mobile/eas.json` koristi produkcioni API.

Expo Go mora odgovarati SDK 54. Native push i funkcije koje zahtevaju vlastiti native build proveravati odvojeno. Poslednji [izveštaj o simulatoru](../MOBILNI_SIMULATOR_2026-09-26.md) navodi šta jeste, a šta nije provereno.

## Testovi

```sh
npm run check:repo
npm run parity:typecheck
npm run parity:backend
npm test --prefix backend -- --runInBand
npm run test:integration --prefix backend
npm run test:browser --prefix backend
```

Integracioni testovi uključuju proveru migracija i koriste izolovanu PostgreSQL bazu. PostgreSQL alati se nalaze preko `pg_config --bindir` ili `PG_BIN`. Browser provera dodatno zahteva Chromium instaliran iz `web/` komandom `npx playwright install chromium`.

Rezultati browsera i mobilnog fixture-a čuvaju se u `backend/test-results/`, koji se ne prati u Git-u. Neuspešan ili preskočen test nije potvrda ispravnosti; [izveštaj testiranja](../TESTIRANJE_NARUDZBINA_2026-09-26.md) razdvaja proverene tokove od preostalih ograničenja.
