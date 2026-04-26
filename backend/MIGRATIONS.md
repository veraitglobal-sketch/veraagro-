# Prisma migracije (squash baseline)

Stari niz od ~14 migracija imao je pogrešan leksikografski red (npr. `init` nakon tabela koje zavise od baze) i davao duple FK / nedostajuće tabele. Sada u `prisma/migrations` postoji **jedna** migracija generisana iz `schema.prisma`:

- `20260426200000_squash_baseline/`

Kreirana je komandom:  
`npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`

## Nova / prazna baza

```bash
cd backend
unset DATABASE_URL
npx prisma migrate deploy
```

(Prisma učitava `backend/.env` — koristi **javni** `DATABASE_URL` sa Railway-ja, ne `*.railway.internal`.)

## Lokalni dev sa starom bazom (pre squash-a u git-u)

Ako lokalno imaš `_prisma_migrations` sa starih imena, a povukao si novi kod sa jednom migracijom, Prisma će se žaliti da zapis u bazi nema odgovarajući folder. Najčišće:

- **Izbriši lokalne podatke** (samo dev): `npx prisma migrate reset`  
  ili
- Tretiraj kao **proizvodnju** (vidi ispod): jednokratni baseline.

## Produkcija (Railway) — OBAVEZNO pre prvog deploy-a ovog commita

Ako baza **već** odgovara trenutnom `prisma/schema.prisma` (što jesu postojeći Railway uobičajeno), ne sme se pokrenuti `migrate deploy` koji bi izvršio ceo `20260426200000` SQL na punoj bazi (duplirani tipovi/tabanje). Umjesto toga, samo ažuriraj istoriju Prisme:

1. **Backup** baze (Railway snapshot / `pg_dump`).
2. Poveži se (npr. `railway link` → backend servis u istom projektu kao Postgres).
3. **Ne koristi** `psql "$DATABASE_URL"` lokalno — `$` se zameni ispred `railway run` i može pogađati pogrešnu bazu. Umjesto toga, iz `backend` foldera:

   ```bash
   railway run npx prisma db execute --schema prisma/schema.prisma --file scripts/truncate-prisma-migrations.sql
   ```

   (Ako pita servis, izaberi onaj gde stoji `DATABASE_URL` ka ovoj bazi, obično **backend**.)  
   (Alternativa) `railway run sh -c 'psql "$DATABASE_URL" -c "TRUNCATE TABLE \"_prisma_migrations\";"'` — samo u **jednostrukim** navodnicima oko `sh -c` da se `$DATABASE_URL` **ne** zameni lokalno.

4. Oznaka da je squash već "primijenjen" (bez SQL izvršavanja), preko **istog** Railway okruženja:

   ```bash
   cd backend
   railway run npx prisma migrate resolve --applied 20260426200000_squash_baseline
   ```

5. Provjera:

   ```bash
   railway run npx prisma migrate status
   ```

   Ako lokalni `backend/.env` meša, pre `railway run` uradi `unset DATABASE_URL`.

   Očekivano: baza u skladu s migracijama; nema pending migracija.

6. Tek onda **deploy** backenda (Railway pokreće `prisma migrate deploy` — biće no-op). Ako preskočiš ovo i deploy pokuša da izvrši ceo squash na punoj bazi, migracija će puknu — backend sada u produkciji **izlazi s kodom 1** ako `migrate deploy` ne uspije (ne radi „nastavi uprkos“).

Ako baza i shema nisu u skladu, prvo uskladi: `prisma db pull` / ručni SQL / podrška, pa onda gornje korake.

### Ako nakon `resolve --applied` vidiš P3009 / failed `20260210...` i greške u logu: `column ... buyerCompanyProfile does not exist`

Baza nije bila ažurirana stvarnim SQL-om; zapis o squashu je samo u `_prisma_migrations`. Onda:

1. Ako nisi već, **backup** baze.
2. Iz `backend` (npr. `unset DATABASE_URL` pa):

   ```bash
   railway run npx prisma db execute --schema prisma/schema.prisma --file scripts/railway-baseline-cleanup.sql
   railway run npx prisma migrate resolve --applied 20260426200000_squash_baseline
   railway run npx prisma migrate status
   ```

   Skripta: `TRUNCATE "_prisma_migrations"` (čisti P3009) + `ADD COLUMN` za `users.buyerCompanyProfile` (što trenutna produkcijska baza fali).

3. `railway run npx prisma migrate deploy` — obično no-op.

Stari `vera_insights_*_fkey` „already exists” u logu obično je posledica pokušaja da se ponove parcijalne migracije; posle ujednačenja gornjim koracima to prestaje. Greške `orders ... PRE-ORDER` / `estates` su poslovno (env / seed estate), nisu Prisma migracija.

## Stare migracije u git istoriji

Prethodni folderi su uklonjeni iz trenutnog stabla; vidi `git log -- backend/prisma/migrations` da pronađeš commit prije squash-a.
