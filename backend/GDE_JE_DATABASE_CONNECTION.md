# 📍 Gde je Database Connection String?

## ❌ Nisi u pravoj sekciji

Trenutno si u **API Settings** ili **Auth Settings** (JWT keys).

Za migracije treba **DATABASE** connection string!

## ✅ Pravilna Sekcija

### Korak 1: Otvori Database Settings

U Supabase Dashboard:
1. Klikni na **"Settings"** u levom meniju
2. Klikni na **"Database"** (NE "API", NE "Auth")

### Korak 2: Pronađi Connection String

U **Database** sekciji:
1. Skroluj do **"Connection string"** sekcije
2. Videćeš 2 tab-a:
   - **"URI"** - Direktni connection (port 5432)
   - **"Connection Pooling"** - Preporučeno za migracije (port 6543)

### Korak 3: Kopiraj Connection String

**Preporučeno: Connection Pooling**
1. Klikni na tab **"Connection Pooling"**
2. Videćeš connection string koji izgleda ovako:
   ```
   postgresql://postgres.jeqpcicjhawaxgoqvenp:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
3. Klikni na **"Copy"** dugme
4. Pošalji mi taj string

**Alternativa: URI (direktni)**
1. Klikni na tab **"URI"**
2. Videćeš connection string koji izgleda ovako:
   ```
   postgresql://postgres:[PASSWORD]@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres
   ```
3. Klikni na **"Copy"** dugme
4. Pošalji mi taj string

## 🎯 Direktan Link

Idi direktno na:
**https://supabase.com/dashboard/project/jeqpcicjhawaxgoqvenp/settings/database**

Tamo ćeš videti **"Connection string"** sekciju sa tab-ovima "URI" i "Connection Pooling".

## ⚠️ Važno

- **JWT keys** (koje si poslao) = za autentifikaciju
- **Database connection string** = za Prisma migracije (ovo nam treba!)
