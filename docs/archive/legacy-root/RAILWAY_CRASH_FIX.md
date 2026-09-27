# 🔧 Railway Backend Crash - Rešenje

## ❌ Problem

Backend je bio uspešno build-ovan, ali je **crashovao** nakon pokretanja.

---

## 🔍 Kako da Saznaš Tačnu Grešku

### 1. Otvori Railway Logs

1. **Railway Dashboard** → Projekat → Service
2. Klikni na **"View logs"** ili **"Logs"** tab
3. Scroll do kraja - vidiš runtime grešku

---

## 🎯 Najčešće Uzroci Crash-a

### 1. **DATABASE_URL nedostaje ili je pogrešan**

**Simptomi:**
- "Can't reach database server"
- "Connection refused"
- "DATABASE_URL is not defined"

**Rešenje:**
1. Railway Dashboard → Projekat (ne service)
2. Klikni **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway automatski doda `DATABASE_URL` environment variable
4. Proveri da li je `DATABASE_URL` dodat u Service → Settings → Variables

---

### 2. **Port nije tačan**

**Simptomi:**
- "EADDRINUSE"
- "Port already in use"

**Rešenje:**
1. Railway Settings → Variables
2. Dodaj: `PORT=3000` (ili `PORT=3004` ako koristiš 3004)
3. Proveri `backend/src/main.ts` - treba da koristi `process.env.PORT || 3000`

---

### 3. **Nedostaju Environment Variables**

**Simptomi:**
- "JWT_SECRET is not defined"
- "SMTP_HOST is not defined"

**Rešenje:**
Dodaj sve potrebne variables u Railway → Settings → Variables:

```
DATABASE_URL=postgresql://... (automatski ako si dodao PostgreSQL)
JWT_SECRET=your-jwt-secret-here
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech
EMAIL_FROM=info@biovera.app
ADMIN_EMAIL=info@biovera.app
FRONTEND_URL=https://biovera.app
PORT=3000
NODE_ENV=production
```

---

### 4. **Prisma Client nije generisan**

**Simptomi:**
- "Prisma Client is not generated"
- "Cannot find module '@prisma/client'"

**Rešenje:**
- Dockerfile već uključuje `npx prisma generate`
- Proveri da li je build prošao uspešno

---

### 5. **Database Connection Error**

**Simptomi:**
- "Connection timeout"
- "Database does not exist"

**Rešenje:**
1. Proveri da li je PostgreSQL database dodat u Railway
2. Proveri da li je `DATABASE_URL` tačan
3. Proveri da li database postoji i da li je accessible

---

## ✅ Brzo Rešenje

### Korak 1: Proveri Logs

1. Railway Dashboard → Service → **"Logs"** tab
2. Kopiraj poslednje 30-50 linija greške
3. Pošalji mi, pa ću ti pomoći da rešimo

---

### Korak 2: Proveri Environment Variables

1. Railway Dashboard → Service → **Settings** → **Variables**
2. Proveri da li su sve variables dodate:
   - `DATABASE_URL` (najvažnije!)
   - `JWT_SECRET`
   - `PORT=3000`
   - `NODE_ENV=production`
   - Ostale SMTP variables

---

### Korak 3: Proveri PostgreSQL Database

1. Railway Dashboard → **Projekat** (ne service)
2. Proveri da li postoji **PostgreSQL** service
3. Ako ne postoji:
   - Klikni **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway automatski doda `DATABASE_URL` variable

---

### Korak 4: Restart Service

1. Railway Dashboard → Service
2. Klikni **"Restart"** dugme (vidi se na screenshot-u)
3. Sačekaj da se restart-uje

---

## 📋 Checklist

- [ ] Logs pročitani (šta je tačna greška?)
- [ ] PostgreSQL database dodat (na projekat level)
- [ ] `DATABASE_URL` variable postoji (u service variables)
- [ ] `PORT=3000` variable postoji
- [ ] `JWT_SECRET` variable postoji
- [ ] `NODE_ENV=production` variable postoji
- [ ] Service restart-ovan

---

## 🆘 Ako i Dalje Ne Radi

**Pošalji mi:**
1. **Railway Logs** (poslednje 50 linija)
2. **Environment Variables** (screenshot ili lista)

Pa ću ti pomoći da rešimo tačnu grešku! 🔍

---

## 💡 Napomena

**"CRASHED"** status znači da je build prošao, ali runtime ima problem. Najčešće je to:
- Database connection problem
- Missing environment variables
- Port conflict

**"FAILED"** status znači da build nije prošao (build error).

---

**Javi mi šta vidiš u logs, pa ćemo rešiti!** 🚀
