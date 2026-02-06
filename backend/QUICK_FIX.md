# ⚡ Brzo Rešenje - Ažuriranje Password-a

## 🔴 Problem

Password u `.env` fajlu je još uvek placeholder:
```
DATABASE_URL="postgresql://postgres:[YOUR-DB-PASSWORD]@..."
```

## ✅ Rešenje (2 minuta)

### Korak 1: Otvori Supabase Dashboard
Idi na: **https://supabase.com/dashboard/project/jeqpcicjhawaxgoqvenp/settings/database**

### Korak 2: Kopiraj Connection String
1. U sekciji **"Connection string"** klikni na tab **"URI"**
2. Kopiraj ceo string (izgleda ovako):
   ```
   postgresql://postgres:TVOJ_PASSWORD@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres
   ```

### Korak 3: Ažuriraj .env Fajl
Otvori `backend/.env` i zameni `DATABASE_URL` liniju sa kopiranim string-om:

```env
DATABASE_URL="postgresql://postgres:TVOJ_PASSWORD@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres?schema=public"
```

**Dodaj `?schema=public` na kraju ako ga nema!**

### Korak 4: Javi mi kada završiš
Kada ažuriraš password, javi mi i ja ću pokrenuti migracije!

---

## 🔄 Ako Ne Znaš Password

1. U Supabase Dashboard → Settings → Database
2. Klikni **"Reset database password"**
3. Novi password će biti generisan
4. Koristi ga u connection string-u

---

## 🚀 Nakon Ažuriranja

Kada ažuriraš password, pokreni:

```bash
cd backend
npx prisma migrate dev --name init
```

ILI javi mi i ja ću to uraditi za tebe! 😊
