# 🚨 502 Bad Gateway - Backend Ne Odgovara

## Problem

**502 Bad Gateway** na `biovera-production.up.railway.app` znači da:
- Railway proxy **ne može** da dobije odgovor od backend aplikacije
- Backend service je **crash-ovao** ili **nije pokrenut**
- Ovo objašnjava zašto contact form ne radi!

---

## 🔍 Korak 1: Proveri Backend Service Status

### A) Otvori Railway Dashboard

1. Idi na: https://railway.app/dashboard
2. Klikni na tvoj **Backend Service** (ne Database!)
3. Proveri **Status**:
   - ✅ **"Running"** → Backend je pokrenut, ali možda crash-uje
   - ❌ **"Stopped"** → Backend nije pokrenut
   - ⚠️ **"Restarting"** → Backend se restart-uje (crash loop)

### B) Proveri Backend Service Logs

1. **Backend Service** → **Deployments** tab
2. Klikni na najnoviji deployment
3. **View Logs** ili **Logs** tab
4. **Kopiraj poslednje 50-100 linija** logova

**Šta tražiti:**

#### ❌ Backend Crash Logs:
```
JWT_SECRET environment variable is required
Error validating datasource `db`: the URL must start with the protocol `postgresql://`
PrismaClientInitializationError
Cannot find module...
Error: listen EADDRINUSE: address already in use :::3000
```

#### ✅ Normalni Backend Logs:
```
Running Prisma migrations...
Migrations completed successfully
Bio Vera Backend running on http://localhost:3000
```

---

## 🔧 Korak 2: Proveri Environment Variables

### A) Backend Service → Variables Tab

Proveri da li su postavljeni:

#### ✅ Obavezni Env Vars:
- `JWT_SECRET` - **MORA BITI POSTAVLJEN!**
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

---

## 🔧 Korak 3: Restart Backend Service

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

## 🔧 Korak 4: Proveri Backend Health Check

### A) Test Health Endpoint

```bash
curl https://biovera-production.up.railway.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"2026-02-08T23:07:00.000Z"}
```

**Ako dobiješ:**
- ❌ `502 Bad Gateway` → Backend nije pokrenut
- ❌ `Connection refused` → Backend nije pokrenut
- ❌ `404 Not Found` → Backend nema `/health` endpoint

### B) Test Contact Endpoint

```bash
curl -X POST https://biovera-production.up.railway.app/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "subject": "technical",
    "message": "Test message"
  }'
```

**Očekivani odgovor:**
```json
{
  "success": true,
  "message": "Thank you for your message. We will get back to you soon."
}
```

---

## 🚨 Najčešći Uzroci 502 Greške

### Problem 1: `JWT_SECRET` Missing
**Simptomi**:
- Backend crash-uje na start
- Logs: `JWT_SECRET environment variable is required`

**Rešenje**:
1. **Backend Service** → **Variables** tab
2. Dodaj `JWT_SECRET` (generiši random string)
3. Restart backend service

### Problem 2: `DATABASE_URL` Invalid
**Simptomi**:
- Backend crash-uje na start
- Logs: `Error validating datasource db`

**Rešenje**:
1. Proveri da li je PostgreSQL database kreiran u Railway
2. Proveri da li je `DATABASE_URL` postavljen u backend service env vars
3. Trebalo bi da bude: `postgresql://user:password@host:port/database` (ne placeholder!)

### Problem 3: Port Conflict
**Simptomi**:
- Backend crash-uje na start
- Logs: `Error: listen EADDRINUSE: address already in use :::3000`

**Rešenje**:
1. Proveri `PORT` env var (trebalo bi da bude `3000` ili prazno)
2. Restart backend service

### Problem 4: Prisma Migrations Failed
**Simptomi**:
- Backend crash-uje na start
- Logs: `P3009: migrate found failed migrations`

**Rešenje**:
1. Proveri `backend/src/main.ts` - trebalo bi da automatski rešava failed migrations
2. Proveri Railway logs za migration greške

### Problem 5: Missing Dependencies
**Simptomi**:
- Backend crash-uje na start
- Logs: `Cannot find module...`

**Rešenje**:
1. Proveri `backend/package.json` - da li su sve dependencies instalirane
2. Redeploy backend service

---

## ✅ Checklist

- [ ] Backend service status proveren u Railway
- [ ] Backend service logs provereni (poslednje 50-100 linija)
- [ ] Environment variables provereni (`JWT_SECRET`, `DATABASE_URL`, etc.)
- [ ] Backend service restart-ovan
- [ ] Health check testiran (`/health` endpoint)
- [ ] Contact endpoint testiran (`/contact/submit`)

---

## 📝 Javi mi

1. **Šta je backend service status u Railway?** (Running, Stopped, Restarting?)
2. **Šta vidiš u backend service logs?** (kopiraj poslednje 50-100 linija)
3. **Da li su svi env vars postavljeni?** (posebno `JWT_SECRET` i `DATABASE_URL`)
4. **Da li si restart-ovao backend service?**
5. **Da li `/health` endpoint sada radi?** (`curl` test)

---

## 🔗 Korisni Linkovi

- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health Check**: https://biovera-production.up.railway.app/health
- **Contact Form**: https://www.biovera.app/contact
