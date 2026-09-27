# 🔧 Build Errors - Rešenje

## ❌ Problem

Oba build-a failed:
- **Railway** (backend) - failed
- **Vercel** (frontend) - failed

---

## 🔍 Kako da Saznaš Tačnu Grešku

### Railway (Backend):
1. Railway Dashboard → Projekat → Service
2. Klikni na **failed deployment**
3. Klikni **"View logs"**
4. Scroll do kraja - vidiš tačnu grešku

### Vercel (Frontend):
1. Vercel Dashboard → Projekat
2. Klikni na **failed deployment**
3. Klikni **"View Build Logs"**
4. Scroll do kraja - vidiš tačnu grešku

---

## 🎯 Najčešće Greške i Rešenja

### 1. Railway - "Cannot find module" ili "Module not found"

**Problem:** Nedostaju dependencies ili Root Directory nije tačan.

**Rešenje:**
1. Railway Settings → **Root Directory**: `backend`
2. Railway Settings → **Build Command**: `npm install && npm run build && npx prisma generate`
3. Proveri da li su svi dependencies u `backend/package.json`

---

### 2. Railway - "Prisma Client not generated"

**Problem:** Prisma Client nije generisan pre build-a.

**Rešenje:**
- Build Command mora uključivati `npx prisma generate`:
  ```
  npm install && npm run build && npx prisma generate
  ```

---

### 3. Railway - "DATABASE_URL not found"

**Problem:** Environment variable nedostaje.

**Rešenje:**
1. Railway Settings → Variables
2. Dodaj `DATABASE_URL`
3. Railway automatski daje PostgreSQL - klikni **"Add PostgreSQL"** u projekat
4. Railway automatski doda `DATABASE_URL` variable

---

### 4. Railway - "Error: Cannot find module '@nestjs/...'"

**Problem:** Dependencies nisu instalirane.

**Rešenje:**
- Proveri da li je `npm install` u Build Command
- Build Command: `npm install && npm run build && npx prisma generate`

---

### 5. Vercel - "Module not found" ili "Cannot resolve"

**Problem:** Import greške ili nedostaju dependencies.

**Rešenje:**
1. Proveri da li je **Root Directory** postavljen na `web` u Vercel Settings
2. Proveri da li su svi dependencies u `web/package.json`
3. Proveri da li postoje TypeScript greške:
   ```bash
   cd web
   npm run build
   ```

---

### 6. Vercel - "Environment variable not found"

**Problem:** `NEXT_PUBLIC_*` variables nedostaju.

**Rešenje:**
1. Vercel Settings → Environment Variables
2. Dodaj:
   - `NEXT_PUBLIC_API_URL` (može biti placeholder dok backend nije deployed)
   - `NEXT_PUBLIC_SITE_URL`

---

### 7. Vercel - "Build failed: TypeScript errors"

**Problem:** TypeScript greške u kodu.

**Rešenje:**
1. Lokalno proveri:
   ```bash
   cd web
   npm run build
   ```
2. Popravi sve TypeScript greške
3. Commit i push

---

## 📋 Railway Checklist

- [ ] **Root Directory**: `backend` (u Settings)
- [ ] **Build Command**: `npm install && npm run build && npx prisma generate`
- [ ] **Start Command**: `npm run start:prod`
- [ ] **Environment Variables**:
  - [ ] `DATABASE_URL` (Railway automatski daje ako dodaš PostgreSQL)
  - [ ] `JWT_SECRET`
  - [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - [ ] `EMAIL_FROM`, `ADMIN_EMAIL`
  - [ ] `FRONTEND_URL`
  - [ ] `PORT=3000`
  - [ ] `NODE_ENV=production`

---

## 📋 Vercel Checklist

- [ ] **Root Directory**: `web` (u Settings)
- [ ] **Framework Preset**: Next.js (automatski)
- [ ] **Build Command**: `npm run build` (automatski)
- [ ] **Environment Variables**:
  - [ ] `NEXT_PUBLIC_API_URL` (može biti placeholder)
  - [ ] `NEXT_PUBLIC_SITE_URL=https://biovera.app`

---

## 🚀 Brzo Rešenje

### Railway:
1. Settings → **Root Directory**: `backend`
2. Settings → **Build Command**: `npm install && npm run build && npx prisma generate`
3. Settings → **Start Command**: `npm run start:prod`
4. Settings → **Variables** → Dodaj PostgreSQL (automatski doda `DATABASE_URL`)
5. Settings → **Variables** → Dodaj ostale variables
6. **Redeploy**

### Vercel:
1. Settings → **Root Directory**: `web`
2. Settings → **Environment Variables** → Dodaj:
   - `NEXT_PUBLIC_API_URL=https://placeholder.com` (privremeno)
   - `NEXT_PUBLIC_SITE_URL=https://biovera.app`
3. **Redeploy**

---

## 🆘 Ako i Dalje Ne Radi

**Pošalji mi:**
1. **Railway logs** (View logs → kopiraj poslednje 50 linija)
2. **Vercel logs** (View Build Logs → kopiraj poslednje 50 linija)

Pa ću ti pomoći da rešimo tačnu grešku! 🔍
