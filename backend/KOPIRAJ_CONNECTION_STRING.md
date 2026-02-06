# 📋 Kopiraj Connection String iz Supabase Dashboard-a

## 🎯 Problem

Ne mogu da se povežem sa bazom koristeći connection string koji sam konstruisao. Potreban je **tačan connection string direktno iz Supabase Dashboard-a**.

## ✅ Rešenje

### Korak 1: Otvori Supabase Dashboard

Idi na: **https://supabase.com/dashboard/project/jeqpcicjhawaxgoqvenp/settings/database**

### Korak 2: Kopiraj Connection String

**Opcija A: Direktni Connection (URI)**
1. U sekciji **"Connection string"** klikni na tab **"URI"**
2. Klikni na **"Copy"** dugme
3. Pošalji mi taj string

**Opcija B: Connection Pooling (preporučeno)**
1. U sekciji **"Connection string"** klikni na tab **"Connection Pooling"**
2. Klikni na **"Copy"** dugme
3. Pošalji mi taj string

### Korak 3: Pošalji mi String

Kada kopiraš connection string, pošalji mi ga i ja ću:
1. Ažurirati `backend/.env` fajl
2. Pokrenuti migracije
3. Generisati Prisma Client

## 📝 Primer

Connection string bi trebalo da izgleda ovako:

```
postgresql://postgres:[PASSWORD]@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres
```

ILI (Connection Pooling):

```
postgresql://postgres.jeqpcicjhawaxgoqvenp:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**VAŽNO:** Kopiraj **ceo string** sa password-om - Supabase Dashboard već ima pravilno encoding!
