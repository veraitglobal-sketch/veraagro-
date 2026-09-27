# Railway Backend Crash Debug

## Kako da vidiš grešku:

1. **Idi na Railway Dashboard**
   - Otvori **BioVera service**

2. **Idi na "Deploy Logs" tab**
   - Tamo ćeš videti tačnu grešku

3. **Kopiraj grešku i pošalji mi**

## Najčešći uzroci crash-a:

### 1. DATABASE_URL problem
- Greška: `the URL must start with the protocol postgresql://`
- **Rešenje:** Proveri da li `DATABASE_URL` postoji u backend Variables i da li je u ispravnom formatu

### 2. JWT_SECRET problem
- Greška: `JwtStrategy requires a secret or key`
- **Rešenje:** Proveri da li `JWT_SECRET` postoji u Variables

### 3. Prisma OpenSSL problem
- Greška: `libssl.so.1.1: cannot open shared object file`
- **Rešenje:** Već smo popravili - trebalo bi da radi sa OpenSSL 3.0

### 4. Missing environment variables
- Greška: `Cannot read property of undefined`
- **Rešenje:** Proveri da li su sve potrebne varijable postavljene

## Provera:

1. **Otvori Deploy Logs**
2. **Scroll do kraja** - tamo je najnovija greška
3. **Kopiraj poslednje 20-30 linija** i pošalji mi

## Brza provera Variables:

Idi na **Settings → Variables** i proveri da li postoje:
- ✅ `DATABASE_URL` (mora biti `postgresql://...`)
- ✅ `JWT_SECRET`
- ✅ `PORT=3000`
- ✅ `NODE_ENV=production`
- ✅ `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- ✅ `EMAIL_FROM`, `ADMIN_EMAIL`
- ✅ `FRONTEND_URL`

## Ako DATABASE_URL ne postoji:

1. Idi na **Postgres service** → **Variables**
2. Kopiraj `DATABASE_URL` vrednost
3. Idi na **BioVera service** → **Variables**
4. Dodaj novi variable:
   - Name: `DATABASE_URL`
   - Value: paste kopiranu vrednost
