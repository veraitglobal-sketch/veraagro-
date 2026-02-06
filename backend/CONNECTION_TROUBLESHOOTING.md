# 🔧 Rešavanje Problema sa Konekcijom

## ❌ Trenutna Greška
```
Error: P1001: Can't reach database server at `jeqpcicjhawaxgoqvenp.supabase.co:5432`
```

## ✅ Rešenja (proveri redom):

### 1. Proveri da li je Supabase projekat aktivan

1. Idi na: https://supabase.com/dashboard/project/jeqpcicjhawaxgoqvenp
2. Proveri da li vidiš status projekta
3. Ako je projekat **pauziran**, klikni **"Resume"** ili **"Restore"**

### 2. Proveri Connection String Format

Otvori Supabase Dashboard → Settings → Database → Connection string

**Opcija A: Direktni Connection (URI tab)**
```
postgresql://postgres:Jov!ca75433@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres?schema=public
```

**Opcija B: Connection Pooling (preporučeno)**
1. Klikni na **"Connection Pooling"** tab
2. Kopiraj connection string (izgleda ovako):
   ```
   postgresql://postgres.jeqpcicjhawaxgoqvenp:Jov!ca75433@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
3. Dodaj `?schema=public` na kraju

### 3. Ažuriraj .env Fajl

Otvori `backend/.env` i zameni `DATABASE_URL` sa connection string-om iz Supabase Dashboard-a.

**VAŽNO:** Ako password sadrži specijalne karaktere (kao `!`), možda treba URL encoding:
- `!` postaje `%21`
- Ili koristi connection string direktno iz Supabase (on već ima pravilno encoding)

### 4. Testiraj Konekciju

```bash
cd backend

# Test sa Prisma
npx prisma db pull

# Ili direktno push schema
npx prisma db push
```

### 5. Alternativa: Koristi Connection Pooling

Connection pooling je često pouzdaniji:

1. U Supabase Dashboard → Settings → Database
2. Klikni **"Connection Pooling"** tab
3. Kopiraj connection string
4. Ažuriraj `DATABASE_URL` u `.env`

Format:
```env
DATABASE_URL="postgresql://postgres.jeqpcicjhawaxgoqvenp:Jov!ca75433@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?schema=public"
```

## 🔍 Debug Koraci

Ako još uvek ne radi:

1. **Proveri password:**
   - Idi na Settings → Database
   - Klikni "Reset database password" ako nisi siguran
   - Novi password će biti generisan

2. **Proveri da li je projekat aktivan:**
   - Supabase projekti se automatski pauziraju nakon neaktivnosti
   - Resume projekat u dashboard-u

3. **Koristi connection pooling:**
   - Često je pouzdaniji od direktnog connection-a
   - Port je 6543 umesto 5432

4. **Testiraj sa psql (ako imaš instaliran):**
   ```bash
   psql "postgresql://postgres:Jov!ca75433@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres"
   ```

## 📝 Trenutni .env Format

Trenutno u `.env`:
```env
DATABASE_URL="postgresql://postgres:Jov%21ca75433@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres?schema=public"
```

Ako ovo ne radi, probaj:
1. Connection pooling URL
2. Direktan connection string iz Supabase Dashboard-a (kopiraj-ceo)
3. Reset password-a i koristi novi
