# Veraagrar / BioVera — pregled lokalnog projekta

Datum: 26.09.2026.

Naknadno: prva faza popravki opisana je u [BEZBEDNOSNE_POPRAVKE_2026-09-26.md](BEZBEDNOSNE_POPRAVKE_2026-09-26.md). Nalazi i broj testova ispod prikazuju stanje pre tih popravki.

Pregled obuhvata strukturu repozitorijuma, konfiguraciju, dokumentaciju, autentifikaciju i odabrane ključne poslovne tokove. Ovo nije pregled svake linije niti potvrda rada produkcije. Nisu pokretani server, migracije baze, slanje poruka, plaćanja ili deployment. Postojeće izmene korisnika nisu menjane.

## Obim i arhitektura

- Web: Next.js 16.1.6, React 19, 149 `page.tsx` stranica. Javni višejezični sajt i portali proizvođača, kupaca, dobavljača, logistike i administracije.
- Mobile: Expo 54, React Native 0.81.5; 101 TSX fajl u direktorijumu ruta, uključujući layoute. Tokovi proizvođača, kupca, dobavljača i logistike.
- Backend: NestJS 10, Prisma 5, PostgreSQL; 79 fajlova modula i 68 Prisma modela. Broj fajlova modula nije broj zasebno deployovanih servisa.
- Shared: validacija karence, GlobalGAP, obračuni, putanja proizvođača i dizajn tokeni.
- Poslovna celina: imanja/parcele → setva i dnevnik → berba i batch → pakovanje i QR → logistička misija i temperatura → primopredaja → kupac i evidencija isplate.
- Postoji implementacija offline skladištenja i sinhronizacije, notifikacija, dokumenata i Polygon integracije. Njihov rad sa stvarnim uređajem i spoljnim servisima nije potvrđen ovim pregledom.

## Provere

| Provera | Rezultat |
|---|---|
| `npm run typecheck` u web | Prolazi |
| `npm run typecheck` u mobile | Prolazi |
| Backend `tsc --noEmit --incremental false` | Prolazi posle regenerisanja Prisma klijenta |
| `npm run prisma:generate --prefix backend` | Uspešno, bez migriranja baze |
| Automatski testovi | Nisu pronađeni `.spec` / `.test` TS, TSX ili JS fajlovi u izvorima tri aplikacije |
| CI | Provera tipova za web/mobile i backend build; bez koraka za izvršavanje testova |

Prva backend provera je prijavila 20 grešaka vezanih za zastarele generisane Prisma tipove. Posle regenerisanja klijenta sve su nestale. Produkcioni build, browser provera, native build i E2E provera nisu izvršeni.

## Potvrđeni nalazi iz koda, po prioritetu

### P1 — Test superadministrator se podrazumevano kreira u produkciji

`backend/src/main.ts:38` pokreće `create:users` kada je okruženje production i `CREATE_TEST_USERS` nije tačno `false`. `backend/scripts/create-test-users.ts:11` koristi fiksnu test lozinku i kreira aktivnog SUPER_ADMIN korisnika. Skripta radi upsert konkretnih naloga, nema proveru da je cela baza prazna. Postojećem nalogu ne resetuje lozinku, ali može napraviti nedostajući test nalog i u nepraznoj bazi.

Predlog: izbaciti automatsko kreiranje test korisnika iz produkcionog starta; zaseban, eksplicitan bootstrap administratora. Stanje naloga u produkcionoj bazi nije proveravano.

### P1 — Kupac može označiti narudžbinu plaćenom bez potvrde priliva

`backend/src/orders/orders.service.ts:517` proverava vlasništvo i status APPROVED, ali zatim na osnovu kupčevog poziva pravi IN_ESCROW zapis i postavlja PAID. Nema provere banke ili platnog provajdera; transactionId je opcion. Postoji zaseban administratorski tok potvrde bankovne uplate, ali ga kupčev endpoint zaobilazi.

Predlog: kupčev poziv kreira samo nameru/uputstvo za plaćanje. PAID/IN_ESCROW sme nastati tek posle verifikovane potvrde provajdera ili ovlašćene evidencije bankovne uplate.

### P1 — Payment endpointi ne proveravaju vlasništvo ni poslovnu ulogu

`backend/src/payments/payments.controller.ts:10` i `:15` zahtevaju samo validan JWT. Identitet korisnika se ne prosleđuje servisima. Prijavljen korisnik koji zna ID tuđe narudžbine može dobiti podatke o plaćanju i pozvati release. Servis proverava stanje dostave i plaćanja, ali ne ovlašćenje pozivaoca; ovo ne znači da se može osloboditi proizvoljno plaćanje u bilo kom stanju.

Predlog: ograničiti čitanje na učesnike/admina i eksplicitno definisati ko sme pokrenuti release.

### P1 — ADMIN dobija prava SUPER_ADMIN

`backend/src/auth/guards/roles.guard.ts:39` mapira ADMIN na SUPER_ADMIN. Time i rute označene samo SUPER_ADMIN prihvataju ADMIN, na primer brisanje korisnika u `backend/src/users/users.controller.ts:182`.

Predlog: razdvojiti nivoe prava; kompatibilnost starih naziva rešiti bez automatskog podizanja privilegija.

### P1 — Cena i količina narudžbine prihvataju se direktno od klijenta

`backend/src/orders/orders.controller.ts` prihvata telo kao `any`; `backend/src/orders/orders.service.ts:157` računa iznos iz prosleđenih quantity i unitPrice. Nema učitavanja merodavne cene niti provere pozitivne količine/cene u ovom toku. Administratorsko odobrenje postoji, ali nije zamena za validaciju ulaza.

Predlog: validacioni DTO i serverska cena ili jasno odvojena ponuda čiju konačnu cenu potvrđuje administracija.

### P2 — Blokiranje korisnika ne poništava postojeći JWT

`backend/src/auth/strategies/jwt.strategy.ts:23` vraća identitet i uloge iz tokena bez provere aktuelnog statusa korisnika. Status se proverava pri prijavi, ali već izdati token može ostati prihvaćen do isteka; podrazumevani vek je 7 dana.

Predlog: proveravati status/verziju sesije i omogućiti opoziv sesija pri blokiranju i promeni privilegija.

## Održavanje i sledeći koraci

Repozitorijum već ima mnogo lokalnih izmena, posebno javnog sajta, prevoda, SEO i navigacije. Njih treba sačuvati i pregledati kao zasebnu celinu pre objavljivanja.

Dokumentacija sadrži istorijske izveštaje koji nisu pouzdan prikaz trenutnog koda. Na primer, dokument o buyer handover prazninama kaže da mobilni buyer deo ne postoji, dok sada postoje buyer rute. Postojanje ruta ipak ne dokazuje da pokrivaju ceo tok primopredaje.

Pre širenja funkcionalnosti prioritet su navedene provere pristupa i plaćanja, zatim automatizovani testovi autorizacije, narudžbine, potvrde uplate i idempotentne isplate. Posle toga treba proveriti tok parcela → batch → isporuka → primopredaja → isplata na izolovanoj test bazi, uključujući offline povratak veze i stvaran mobilni uređaj.
