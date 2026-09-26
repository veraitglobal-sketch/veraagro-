# Prisma migracije i podizanje prazne baze

## Zašto postoji poseban početni snapshot

Istorija trenutno sadrži 35 migracija. Neke migracije menjaju tabele pre nego što ih kasniji `20260426200000_squash_baseline` kreira. Zbog toga direktan `prisma migrate deploy` na praznoj bazi pada sa P3018 / 42P01. Postojeći SQL fajlovi i njihova imena nisu menjani.

Za novu bazu koristi se zamrznuti snapshot `prisma/bootstrap/20260926.sql`. Manifest čuva SHA-256 snapshot-a i svih istorijskih migracija koje snapshot obuhvata. Snapshot je generisan iz trenutnog schema.prisma, a slaganje se proverava na stvarnom PostgreSQL-u.

## Pokretanje

Podesi DATABASE_URL za nameravano okruženje. Eksplicitna promenljiva ima prednost nad backend/.env.

```sh
npm run prisma:deploy
```

- Ako je ciljna šema prazna, wrapper u jednoj transakciji kreira šemu iz snapshot-a i upisuje odgovarajuću početnu evidenciju migracija. Advisory lock sprečava istovremenu inicijalizaciju iste šeme.
- Ako šema već sadrži tabele, sekvence, poglede, funkcije, enum ili domain tipove, početna inicijalizacija se preskače. Podaci i postojeća evidencija se ne prepisuju.
- Zatim standardni Prisma migrate deploy primenjuje eventualne nove migracije. Njegove greške prekidaju komandu.

`npm run db:init-empty` izvršava samo početnu inicijalizaciju i odbija nepraznu šemu. Ne služi za popravku postojećih baza.

Produkcioni start u main.ts koristi isti wrapper; start:release pokreće Nest, bez duplog poziva migracija. Postojeća pravila prekidanja starta pri neuspehu migracija ostaju na snazi.

## Postojeća baza sa neuspelom ili nepotpunom istorijom

Wrapper ne popravlja prethodno neuspele migracije niti drift postojeće šeme. Ako je raniji neuspeh već napravio `_prisma_migrations`, baza više nije prazna i automatska inicijalizacija se neće izvršiti. Pregledati stvarnu šemu i migracionu evidenciju na tačno određenom okruženju pre odabira ciljane popravke.

Ne brisati evidenciju migracija radi prividnog uspeha deploy-a. Stare repair/truncate skripte u repozitorijumu nisu deo ovog postupka. Produkciona baza nije pregledana niti menjana tokom lokalnog testiranja 26.09.2026.

## Buduće izmene šeme

Dodavati nove imenovane migracije posle postojećih. Ne prepisivati zamrznuti snapshot, manifest ili istorijske migracije prilikom uobičajenih izmena. Nova baza dobija snapshot pa nove migracije; postojeća baza dobija samo migracije koje joj nedostaju.

## Automatske provere

```sh
npm run test:migrations
npm run test:integration
```

Runner pravi privremeni PostgreSQL klaster, eksplicitno zamenjuje DATABASE_URL, pokreće isti deployment wrapper i proverava odsustvo razlike u odnosu na schema.prisma. Nakon provera zaustavlja i uklanja klaster. Potrebni su PostgreSQL binarni alati (`pg_config --bindir`, ili PG_BIN).

Testovi proveravaju tačne checksum vrednosti i završene migracije, odbijanje ponovne inicijalizacije uz očuvanje podataka i istorije, istovremenu inicijalizaciju i primenu nove migracije dodate posle snapshot-a. Integraciona komanda uključuje ove provere i poslovne HTTP testove; nema db push zaobilaženja migracija.


## Veza lota sa planom berbe — 26.09.2026.

Migracija `20260926120000_link_batch_harvest_plan` dodaje opcioni strani ključ `batches.harvestAnnouncementId` i indeks. Istorijski lotovi ostaju `NULL`; nema automatskog pogađanja plana niti prepisivanja postojećih podataka. Brisanje povezanog plana je ograničeno stranim ključem. Migracija mora prethoditi novom backendu. `npm run test:harvest` proverava taj tok sa stvarnim HTTP zahtevima i privremenom PostgreSQL bazom; produkcija nije menjana.

## Veza berbe sa zasadom — 26.09.2026.

Migracija `20260926234500_link_harvest_planting` dodaje opcioni `harvest_announcements.sourcePlantingId`, indeks i strani ključ ka izvornom zasadu. Istorijski podaci ostaju `NULL`; nema pogađanja zasada. Brisanje zasada sa povezanim berbama je ograničeno. Migracija mora prethoditi novom backendu. Proverena je na izdvojenoj PostgreSQL bazi zajedno sa HTTP tokom zasad → berba → lot i proverom odsustva razlike u šemi. Produkcija nije menjana.
