# 🔧 Railway Deployment Fix

## ❌ Problem

Deployment failed sa greškom: **"Error creating build plan with Railpack"**

Railway ne može automatski da detektuje kako da build-uje NestJS backend.

---

## ✅ Rešenje

### Opcija 1: Railway Settings (Najlakše)

1. **Otvori Railway Dashboard**
   - Idi na: https://railway.app/dashboard
   - Klikni na projekat "BioVera"
   - Klikni na service

2. **Otvori Settings**
   - Klikni na **"Settings"** tab

3. **Postavi Root Directory**
   - Scroll do **"Source"** sekcije
   - **Root Directory**: `backend`
   - Save

4. **Postavi Build & Start Commands**
   - Scroll do **"Build Command"**
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm run start:prod`
   - Save

5. **Redeploy**
   - Idi na **"Deployments"** tab
   - Klikni **"Redeploy"** ili **"Deploy"**

---

### Opcija 2: Dodaj railway.json (Alternativno)

Kreirao sam `backend/railway.json` fajl sa konfiguracijom.

Ako Railway automatski ne detektuje, proveri:
- Da li je **Root Directory** postavljen na `backend` u Settings
- Da li su **Build Command** i **Start Command** postavljeni

---

## 📋 Checklist

- [ ] Root Directory: `backend` (u Railway Settings)
- [ ] Build Command: `npm install && npm run build && npx prisma generate`
- [ ] Start Command: `npm run start:prod`
- [ ] Environment Variables dodati (DATABASE_URL, JWT_SECRET, itd.)
- [ ] Redeploy pokrenut

---

## 🔑 Environment Variables za Railway

Dodaj u Railway → Settings → Variables:

```
DATABASE_URL=postgresql://... (Railway automatski daje PostgreSQL)
JWT_SECRET=your-jwt-secret
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

## 🎯 Sledeći Koraci

1. **Popravi Railway konfiguraciju** (gore)
2. **Redeploy**
3. **Saznaj backend URL** (iz Railway Settings → Networking)
4. **Dodaj u Vercel** kao `NEXT_PUBLIC_API_URL`

---

**Javi kada redeploy-uješ, pa ćemo proveriti da li radi!** 🚀
