# ✅ Railway - Sledeći Koraci

## 🎯 Šta si uradio

- ✅ Dodao Environment Variables u Railway
- ✅ Railway.json je u projektu
- ✅ Push-ovano na GitHub

---

## 📍 Sledeći Koraci

### 1. Proveri Deployment Status

1. **Otvori Railway Dashboard**
   - Idi na: https://railway.app/dashboard
   - Klikni na projekat "BioVera"
   - Klikni na service

2. **Proveri Deployments Tab**
   - Ako vidiš **"Building"** ili **"Deploying"** → sačekaj
   - Ako vidiš **"Active"** ili **"Live"** → uspešno! ✅
   - Ako vidiš **"Failed"** → klikni "View logs" da vidiš grešku

---

### 2. Saznaj Backend URL

1. **Otvori Settings Tab**
   - Klikni na **"Settings"** (gore u meniju)

2. **Pronađi Networking Sekciju**
   - Scroll do **"Networking"** ili **"Domains"**
   - Vidiš **"Public Domain"** ili **"Generate Domain"**

3. **Kopiraj Backend URL**
   - Primer: `https://biovera-backend-production.up.railway.app`
   - Ili: `https://your-service-name.up.railway.app`

**Ako ne vidiš domain:**
- Klikni **"Generate Domain"**
- Railway će automatski generisati URL

---

### 3. Testiraj Backend

Otvori browser i idi na:
```
https://your-backend-url.railway.app/health
```

Ili samo:
```
https://your-backend-url.railway.app
```

**Očekivani odgovor:**
- Može biti error (to je OK, znači da radi)
- Ili JSON response
- Ili "Cannot GET /" (to je OK, znači da server radi)

---

### 4. Dodaj Backend URL u Vercel

1. **Otvori Vercel Dashboard**
   - Idi na: https://vercel.com/dashboard
   - Klikni na projekat "BioVera"

2. **Otvori Settings → Environment Variables**

3. **Ažuriraj `NEXT_PUBLIC_API_URL`**
   ```
   Key: NEXT_PUBLIC_API_URL
   Value: https://your-backend-url.railway.app
   ```
   (zameni sa stvarnim Railway backend URL-om)

4. **Save**

5. **Redeploy Frontend**
   - Idi na **"Deployments"** tab
   - Klikni **"..."** (tri tačke) na poslednjem deployment-u
   - Klikni **"Redeploy"**

---

## ✅ Checklist

- [ ] Environment Variables dodati u Railway
- [ ] Deployment status proveren (Active/Live)
- [ ] Backend URL saznat (iz Settings → Networking)
- [ ] Backend testiran (otvoren u browser-u)
- [ ] `NEXT_PUBLIC_API_URL` ažuriran u Vercel
- [ ] Frontend redeploy-ovan na Vercel

---

## 🆘 Ako Deployment Failed

### Proveri Logs:
1. Railway Dashboard → Deployments
2. Klikni na failed deployment
3. Klikni **"View logs"**
4. Proveri grešku

### Česte Greške:

**"Error: Cannot find module"**
- Proveri da li je **Root Directory** postavljen na `backend`
- Proveri da li su sve dependencies u `package.json`

**"Error: Prisma Client not generated"**
- Proveri da li je **Build Command** uključuje `npx prisma generate`
- Treba: `npm install && npm run build && npx prisma generate`

**"Error: DATABASE_URL not found"**
- Proveri da li je `DATABASE_URL` dodat u Environment Variables
- Railway automatski daje PostgreSQL, ali moraš da ga dodaš

---

## 🎯 Kada je Sve Gotovo

**Backend URL:**
```
https://your-backend-url.railway.app
```

**Vercel Environment Variable:**
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_SITE_URL=https://biovera.app
```

---

**Javi mi backend URL kada ga saznaš, pa ćemo dodati u Vercel!** 🚀
