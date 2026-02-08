# 🚀 Backend Deployment Opcije

## 📍 Trenutna Situacija

- **Frontend**: `biovera.app` (Vercel) ✅
- **Backend**: Još nije deployed ❌ (radi samo lokalno na `localhost:3004`)

---

## 🎯 Opcije za Backend Hosting

### 1. **Railway** (Preporučeno - Najlakše) ⭐

**Zašto Railway:**
- ✅ Besplatno do $5/mesec kredita
- ✅ Automatski deployment iz GitHub-a
- ✅ PostgreSQL baza uključena
- ✅ Environment variables lako se postavljaju
- ✅ HTTPS automatski

**Kako:**
1. Idi na: https://railway.app
2. Sign up sa GitHub-om
3. "New Project" → "Deploy from GitHub repo"
4. Izaberi `veraconnectgroup-tech/BioVera`
5. Root Directory: `backend`
6. Railway automatski detektuje NestJS i deploy-uje
7. **Backend URL će biti**: `https://your-project-name.up.railway.app`

**Environment Variables u Railway:**
- Dodaj sve iz `backend/.env` (DATABASE_URL, JWT_SECRET, itd.)
- Railway automatski daje PostgreSQL DATABASE_URL

---

### 2. **Render** (Besplatno)

**Zašto Render:**
- ✅ Besplatno za početak
- ✅ Automatski deployment
- ✅ PostgreSQL opciono

**Kako:**
1. Idi na: https://render.com
2. "New" → "Web Service"
3. Connect GitHub → izaberi repo
4. Root Directory: `backend`
5. Build Command: `npm install && npm run build`
6. Start Command: `npm run start:prod`
7. **Backend URL**: `https://your-service.onrender.com`

---

### 3. **Heroku** (Plaćeno, ali stabilno)

**Zašto Heroku:**
- ✅ Stabilno i pouzdano
- ✅ Lako za setup
- ⚠️ Nema besplatnog plana više

**Kako:**
1. Idi na: https://heroku.com
2. Create new app
3. Connect GitHub
4. Deploy branch
5. **Backend URL**: `https://your-app-name.herokuapp.com`

---

### 4. **AWS / DigitalOcean / Linode** (Napredno)

Za veće projekte, ali zahteva više konfiguracije.

---

## 🔍 Kako da Saznaš Backend URL

### Ako koristiš Railway:
1. Idi na Railway Dashboard
2. Klikni na tvoj projekat
3. U "Settings" → "Networking"
4. Vidiš "Public Domain" → to je tvoj backend URL
5. Primer: `https://biovera-backend.up.railway.app`

### Ako koristiš Render:
1. Idi na Render Dashboard
2. Klikni na tvoj service
3. Vidiš URL na vrhu stranice
4. Primer: `https://biovera-backend.onrender.com`

### Ako koristiš Heroku:
1. Idi na Heroku Dashboard
2. Klikni na tvoj app
3. "Settings" → "Domains"
4. Vidiš URL
5. Primer: `https://biovera-backend.herokuapp.com`

---

## 📝 Environment Variables za Vercel

Kada deploy-uješ backend, dodaj u **Vercel Environment Variables**:

### Variable 1:
```
Key: NEXT_PUBLIC_API_URL
Value: https://your-backend-url.railway.app
```
(zameni sa stvarnim backend URL-om)

### Variable 2:
```
Key: NEXT_PUBLIC_SITE_URL
Value: https://biovera.app
```

---

## ✅ Preporučeni Redosled

1. **Deploy backend na Railway** (najlakše)
2. **Saznaj backend URL** (iz Railway dashboard-a)
3. **Dodaj `NEXT_PUBLIC_API_URL` u Vercel** sa backend URL-om
4. **Redeploy frontend na Vercel**

---

## 🎯 Primer Konfiguracije

### Railway Backend:
```
Backend URL: https://biovera-api.up.railway.app
```

### Vercel Environment Variables:
```
NEXT_PUBLIC_API_URL=https://biovera-api.up.railway.app
NEXT_PUBLIC_SITE_URL=https://biovera.app
```

---

## 🆘 Ako Backend Još Nije Deployed

**Privremeno možeš staviti:**
```
NEXT_PUBLIC_API_URL=https://placeholder-backend-url.com
```

Ali frontend neće raditi dok backend nije deployed.

---

**Preporuka: Deploy backend na Railway prvo, pa onda ažuriraj Vercel variables.** 🚀
