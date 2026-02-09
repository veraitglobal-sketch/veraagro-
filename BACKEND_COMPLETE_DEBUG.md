# 🔧 Backend Complete Debug Guide

## 🚨 Problem: Backend Neće da Se Pokrene

Hajde da prođemo kroz sve korake sistematski.

---

## 🔍 Korak 1: Proveri Backend Service Status u Railway-u

### A) Otvori Railway Dashboard

1. Idi na: https://railway.app/dashboard
2. Klikni na tvoj **Backend Service** (ne Database!)

### B) Proveri Status

**U Backend Service overview-u, proveri:**

1. **Status**:
   - ✅ **"Running"** → Backend je pokrenut, ali možda crash-uje
   - ❌ **"Stopped"** → Backend nije pokrenut
   - ⚠️ **"Restarting"** → Backend se restart-uje (crash loop)
   - ⚠️ **"Deploying"** → Backend se deploy-uje

2. **Health Check**:
   - ✅ **"Healthy"** → Backend radi
   - ❌ **"Unhealthy"** → Backend ne radi

3. **Last Deployment**:
   - Proveri da li je poslednji deployment uspešan ili neuspešan

---

## 🔍 Korak 2: Proveri Backend Service Logs

### A) Otvori Logs

1. **Backend Service** → **Deployments** tab
2. Klikni na najnoviji deployment
3. **View Logs** ili **Logs** tab
4. **Kopiraj poslednje 100-200 linija** logova

### B) Šta Tražiti u Logovima

#### ✅ Normalni Backend Logs:
```
Running Prisma migrations...
Migrations completed successfully
Bio Vera Backend running on http://localhost:3000
```

#### ❌ Backend Crash Logs:
```
JWT_SECRET environment variable is required
Error validating datasource `db`: the URL must start with the protocol `postgresql://`
PrismaClientInitializationError
Cannot find module...
Error: listen EADDRINUSE: address already in use :::3000
```

**Kopiraj grešku koju vidiš i javi mi!**

---

## 🔍 Korak 3: Proveri Environment Variables

### A) Backend Service → Variables Tab

**Proveri da li su postavljeni SVI obavezni env vars:**

#### ✅ Obavezni Env Vars:
- `JWT_SECRET` - **MORA BITI POSTAVLJEN!** (generiši random string)
- `DATABASE_URL` - Trebalo bi da bude `postgresql://...` (ne placeholder!)
- `PORT` - Trebalo bi da bude `3000` ili prazno (default 3000)
- `NODE_ENV` - Trebalo bi da bude `production`

#### ✅ Email Env Vars (za contact form):
- `SMTP_HOST` - npr. `smtp.resend.com` ili `smtp.gmail.com`
- `SMTP_PORT` - npr. `587` ili `465`
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password (Resend API key ili Gmail app password)
- `EMAIL_FROM` - Trebalo bi da bude `info@biovera.app`
- `ADMIN_EMAIL` - Trebalo bi da bude `info@biovera.app`

#### ✅ Frontend URL:
- `FRONTEND_URL` - Trebalo bi da bude `https://www.biovera.app`

### B) Ako Neki Env Var Nedostaje

1. Klikni **"New Variable"** ili **"Add"**
2. Dodaj **Key** i **Value**
3. **Save**
4. **Restart backend service**

---

## 🔍 Korak 4: Proveri Database Connection

### A) Proveri PostgreSQL Database Status

1. **Railway Dashboard** → **PostgreSQL Database** (ne Backend Service!)
2. Proveri **Status**:
   - ✅ **"Running"** → Database radi
   - ❌ **"Stopped"** → Database nije pokrenut

### B) Proveri `DATABASE_URL`

1. **Backend Service** → **Variables** tab
2. Pronađi `DATABASE_URL`
3. **Proveri Value**:
   - ✅ Trebalo bi da bude: `postgresql://user:password@host:port/database`
   - ❌ Ako je: `postgresql://placeholder` ili prazno → **TO JE PROBLEM!**

**Ako `DATABASE_URL` nije tačan:**
1. **PostgreSQL Database** → **Variables** tab
2. Kopiraj `DATABASE_URL` iz database service-a
3. **Backend Service** → **Variables** tab
4. Dodaj `DATABASE_URL` sa kopiranom vrednošću
5. **Save**
6. **Restart backend service**

---

## 🔧 Korak 5: Restart Backend Service

### A) Restart u Railway Dashboard

1. **Backend Service** → **Settings**
2. Klikni **"Restart"** ili **"Redeploy"**
3. Sačekaj da se restart završi (1-2 minuta)

### B) Proveri Logs Nakon Restart-a

1. **View Logs** nakon restart-a
2. Proveri da li backend uspešno start-uje:
   - ✅ `Bio Vera Backend running on http://localhost:3000`
   - ❌ Ako vidiš greške → proveri env vars

---

## 🔍 Korak 6: Test Backend Health

### A) Test Health Endpoint

```bash
curl https://biovera-production.up.railway.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"2026-02-08T23:35:00.000Z"}
```

**Ako dobiješ:**
- ❌ `502 Bad Gateway` → Backend nije pokrenut
- ❌ `Connection refused` → Backend nije pokrenut
- ❌ `404 Not Found` → Backend nema `/health` endpoint

---

## 🚨 Najčešći Problemi i Rešenja

### Problem 1: `JWT_SECRET` Missing
**Simptomi**:
- Backend crash-uje na start
- Logs: `JWT_SECRET environment variable is required`

**Rešenje**:
1. **Backend Service** → **Variables** tab
2. Klikni **"New Variable"**
3. **Key**: `JWT_SECRET`
4. **Value**: Generiši random string (npr. `openssl rand -base64 32`)
5. **Save**
6. **Restart backend service**

### Problem 2: `DATABASE_URL` Invalid
**Simptomi**:
- Backend crash-uje na start
- Logs: `Error validating datasource db`

**Rešenje**:
1. Proveri da li je PostgreSQL database kreiran u Railway-u
2. **PostgreSQL Database** → **Variables** tab
3. Kopiraj `DATABASE_URL`
4. **Backend Service** → **Variables** tab
5. Dodaj `DATABASE_URL` sa kopiranom vrednošću
6. **Save**
7. **Restart backend service**

### Problem 3: Port Conflict
**Simptomi**:
- Backend crash-uje na start
- Logs: `Error: listen EADDRINUSE: address already in use :::3000`

**Rešenje**:
1. Proveri `PORT` env var (trebalo bi da bude `3000` ili prazno)
2. **Restart backend service**

### Problem 4: Prisma Migrations Failed
**Simptomi**:
- Backend crash-uje na start
- Logs: `P3009: migrate found failed migrations`

**Rešenje**:
1. Proveri `backend/src/main.ts` - trebalo bi da automatski rešava failed migrations
2. Proveri Railway logs za migration greške
3. **Restart backend service**

### Problem 5: Missing Dependencies
**Simptomi**:
- Backend crash-uje na start
- Logs: `Cannot find module...`

**Rešenje**:
1. Proveri `backend/package.json` - da li su sve dependencies instalirane
2. **Redeploy backend service**

---

## ✅ Checklist

- [ ] Backend service status proveren u Railway (Running/Stopped/Restarting?)
- [ ] Backend service logs provereni (poslednje 100-200 linija)
- [ ] Environment variables provereni (`JWT_SECRET`, `DATABASE_URL`, etc.)
- [ ] `JWT_SECRET` postavljen (ako nedostaje)
- [ ] `DATABASE_URL` postavljen (ako nedostaje)
- [ ] PostgreSQL database status proveren (Running?)
- [ ] Backend service restart-ovan
- [ ] Health check testiran (`/health` endpoint)

---

## 📝 Javi mi

1. **Šta je backend service status u Railway?** (Running/Stopped/Restarting?)
2. **Šta vidiš u backend service logs?** (kopiraj poslednje 100-200 linija, posebno greške!)
3. **Da li su svi env vars postavljeni?** (posebno `JWT_SECRET` i `DATABASE_URL`)
4. **Da li je PostgreSQL database Running?**
5. **Da li si restart-ovao backend service?**
6. **Da li `/health` endpoint sada radi?** (`curl` test)

**Kopiraj mi backend logs greške i javi mi šta vidiš!**

---

## 🔗 Korisni Linkovi

- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health**: https://biovera-production.up.railway.app/health
- **Generate JWT_SECRET**: `openssl rand -base64 32`
