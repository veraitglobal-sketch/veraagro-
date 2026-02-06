# 🔄 Novi Supabase Projekat - Setup

## ❓ Važna Pitanja

1. **Da li novi projekat ima NOVI project ID?**
   - Trenutno koristim: `jeqpcicjhawaxgoqvenp`
   - Novi projekat ima drugačiji ID (npr. `abcdefghijklmnop`)

2. **Da li je password `Jov!ca75433` za NOVI projekat?**
   - Ili je to password za stari projekat?

## ✅ Rešenje

### Opcija 1: Ako imaš NOVI project ID

1. Idi na Supabase Dashboard → Novi projekat
2. Settings → Database → Connection string
3. Kopiraj **ceo connection string** iz **URI** tab-a
4. Ažuriraj `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:Jov!ca75433@NOVI_PROJECT_ID.supabase.co:5432/postgres?schema=public"
```

**Zameni `NOVI_PROJECT_ID` sa stvarnim ID-jem novog projekta!**

### Opcija 2: Koristi Connection Pooling (preporučeno)

1. U Supabase Dashboard → Settings → Database
2. Klikni na **"Connection Pooling"** tab
3. Kopiraj connection string
4. Ažuriraj `backend/.env`:

```env
DATABASE_URL="postgresql://postgres.NOVI_PROJECT_ID:Jov!ca75433@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?schema=public"
```

### Opcija 3: Kopiraj Direktno iz Dashboard-a

Najlakše je da kopiraš **ceo connection string** direktno iz Supabase Dashboard-a:

1. Settings → Database → Connection string
2. Klikni na **URI** tab
3. Klikni na **"Copy"** dugme
4. Zameni `DATABASE_URL` u `backend/.env` sa kopiranim string-om

## 🚀 Nakon Ažuriranja

Kada ažuriraš connection string, javi mi i pokrenuću migracije:

```bash
cd backend
npx prisma migrate dev --name init
```

## 📝 Trenutni .env

Trenutno:
```env
DATABASE_URL="postgresql://postgres:Jov!ca75433@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres?schema=public"
```

Ako je novi projekat, zameni `jeqpcicjhawaxgoqvenp` sa novim project ID-jem!
