# 🔍 Backend Logs Check Guide

## ✅ PostgreSQL Logovi (Normalni)

Ovo što si poslao su **PostgreSQL database logovi**, ne backend service logovi. Ovi logovi su **normalni**:

- ✅ `database system is ready to accept connections` → Database radi
- ⚠️ `invalid length of startup packet` → Normalno (health checks, connection attempts)
- ⚠️ `Connection reset by peer` → Normalno (klijenti prekidaju konekciju)

**Ovo NIJE problem!** Database radi kako treba.

---

## 🔍 Treba da Proveriš Backend Service Logs

### Korak 1: Otvori Railway Dashboard

1. Idi na: https://railway.app/dashboard
2. Klikni na tvoj **Backend Service** (ne Database!)

### Korak 2: Proveri Backend Service Logs

1. **Deployments** tab
2. Klikni na najnoviji deployment
3. **View Logs** ili **Logs** tab
4. Proveri **backend service logs** (ne database logs!)

**Šta tražiti:**

#### ✅ Normalni Backend Logs:
```
Running Prisma migrations...
Migrations completed successfully
Bio Vera Backend running on http://localhost:3000
```

#### ❌ Problem Backend Logs:
```
JWT_SECRET environment variable is required
Error validating datasource `db`: the URL must start with the protocol `postgresql://`
PrismaClientInitializationError
Cannot find module...
```

---

## 🔍 Proveri Backend Health

### Test Backend Endpoint:

```bash
curl https://biovera-production.up.railway.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"2026-02-08T22:00:23.362Z"}
```

**Ako dobiješ grešku:**
- `404 Not Found` → Backend nije deploy-ovan ili nema `/health` endpoint
- `Connection refused` → Backend nije pokrenut
- `500 Internal Server Error` → Backend ima grešku

---

## 🔍 Proveri Backend Service Status

### U Railway Dashboard:

1. **Backend Service** → **Settings**
2. Proveri:
   - **Status**: Trebalo bi da bude "Running" ili "Active"
   - **Health Check**: Trebalo bi da bude "Healthy"

### Proveri Environment Variables:

1. **Backend Service** → **Variables** tab
2. Proveri da li su postavljeni:
   - ✅ `JWT_SECRET`
   - ✅ `DATABASE_URL`
   - ✅ `PORT`
   - ✅ `NODE_ENV=production`
   - ✅ `SMTP_HOST`
   - ✅ `SMTP_PORT`
   - ✅ `SMTP_USER`
   - ✅ `SMTP_PASS`
   - ✅ `EMAIL_FROM=info@biovera.app`
   - ✅ `ADMIN_EMAIL=info@biovera.app`
   - ✅ `FRONTEND_URL=https://www.biovera.app`

---

## 🚨 Najčešći Problemi

### Problem 1: Backend Service Nije Pokrenut
**Simptomi**: 
- Health check ne radi
- `Connection refused` greška

**Rešenje**:
1. Proveri Railway logs za greške
2. Proveri da li su svi env vars postavljeni
3. Restart backend service

### Problem 2: `JWT_SECRET` Missing
**Simptomi**:
- Backend crash-uje na start
- Logs pokazuju: `JWT_SECRET environment variable is required`

**Rešenje**:
1. Dodaj `JWT_SECRET` u Railway env vars
2. Restart backend service

### Problem 3: `DATABASE_URL` Invalid
**Simptomi**:
- Backend crash-uje na start
- Logs pokazuju: `Error validating datasource db`

**Rešenje**:
1. Proveri da li je PostgreSQL database kreiran u Railway
2. Proveri da li je `DATABASE_URL` postavljen u backend service env vars
3. Trebalo bi da bude: `postgresql://...` (ne placeholder!)

### Problem 4: Prisma Migrations Failed
**Simptomi**:
- Backend logs pokazuju: `P3009: migrate found failed migrations`
- Backend crash-uje

**Rešenje**:
1. Proveri `backend/src/main.ts` - trebalo bi da automatski rešava failed migrations
2. Proveri Railway logs za migration greške

---

## 📝 Javi mi

1. **Da li backend service status je "Running" u Railway?**
2. **Šta vidiš u backend service logs?** (kopiraj poslednje 20-30 linija)
3. **Da li `/health` endpoint radi?** (`curl` test)
4. **Da li su svi env vars postavljeni u backend service?**

---

## 🔗 Korisni Linkovi

- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health Check**: https://biovera-production.up.railway.app/health
- **Contact Form**: https://www.biovera.app/contact
