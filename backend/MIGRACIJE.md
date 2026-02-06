# Prisma Migracije - Uputstvo

## 📍 Lokacija Migracija

Migracije se nalaze u:
```
backend/prisma/migrations/
```

**Napomena:** Ovaj folder se automatski kreira kada prvi put pokreneš migracije.

## 🚀 Kako da Kreiraš i Pokreneš Migracije

### Korak 1: Proveri DATABASE_URL

Proveri da li je `DATABASE_URL` u `backend/.env` fajlu sa Supabase connection string-om:

```bash
cd backend
cat .env | grep DATABASE_URL
```

Trebalo bi da vidiš:
```
DATABASE_URL="postgresql://postgres:PASSWORD@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres?schema=public"
```

### Korak 2: Kreiraj i Pokreni Migracije

**Opcija A: Kreiraj migracije (preporučeno za produkciju)**
```bash
cd backend
npx prisma migrate dev --name init
```

Ovo će:
- Kreirati `prisma/migrations/` folder
- Kreirati SQL migraciju fajl
- Primiti migraciju na Supabase bazu
- Generisati Prisma Client

**Opcija B: Push schema direktno (brže za development)**
```bash
cd backend
npx prisma db push
```

Ovo će:
- Direktno primeniti schema na bazu (bez kreiranja migracija)
- Brže je, ali ne kreira migracije

### Korak 3: Generiši Prisma Client

Nakon migracija, uvek generiši Prisma Client:

```bash
npx prisma generate
```

## 📋 Komande za Migracije

```bash
# Kreiraj novu migraciju
npx prisma migrate dev --name migration_name

# Primeni migracije na produkciju
npx prisma migrate deploy

# Vrati poslednju migraciju
npx prisma migrate resolve --rolled-back migration_name

# Pregled migracija
ls -la prisma/migrations/

# Otvori Prisma Studio (pregled baze)
npx prisma studio
```

## 🔍 Provera Migracija

Nakon pokretanja migracija, proveri:

```bash
# Vidi kreirane migracije
ls -la prisma/migrations/

# Otvori Prisma Studio
npx prisma studio
```

Prisma Studio će se otvoriti na `http://localhost:5555` gde možeš videti sve tabele u bazi.

## ⚠️ Važno

- **Prvo ažuriraj DATABASE_URL** u `.env` fajlu sa Supabase connection string-om
- **Password** u connection string-u mora biti tačan
- Migracije se kreiraju u `prisma/migrations/` folderu
- Svaka migracija ima svoj folder sa SQL fajlovima
