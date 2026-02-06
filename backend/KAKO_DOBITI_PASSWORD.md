# Kako da Dobiješ Supabase Database Password

## 🔑 Opcija 1: Iz Supabase Dashboard-a

1. Idi na [Supabase Dashboard](https://supabase.com/dashboard)
2. Otvori svoj projekat (jeqpcicjhawaxgoqvenp)
3. Idi na **Settings** → **Database**
4. U sekciji **Connection string** → izaberi **URI**
5. Kopiraj connection string - password je deo nakon `postgres:` i pre `@`

Primer:
```
postgresql://postgres:TVOJ_PASSWORD_OVDE@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres
```

## 🔑 Opcija 2: Reset Password-a

Ako ne znaš password:

1. Idi na **Settings** → **Database**
2. Klikni na **Reset database password**
3. Novi password će biti generisan
4. Kopiraj ga i koristi u `.env` fajlu

## 📝 Ažuriranje .env Fajla

Kada dobiješ password, ažuriraj `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:TVOJ_STVARNI_PASSWORD@jeqpcicjhawaxgoqvenp.supabase.co:5432/postgres?schema=public"
```

**Zameni `TVOJ_STVARNI_PASSWORD` sa password-om iz Supabase Dashboard-a.**

## 🚀 Nakon Ažuriranja

Kada ažuriraš password, javi mi i ja ću pokrenuti migracije za tebe!

ILI pokreni sam:
```bash
cd backend
npx prisma migrate dev --name init
```
