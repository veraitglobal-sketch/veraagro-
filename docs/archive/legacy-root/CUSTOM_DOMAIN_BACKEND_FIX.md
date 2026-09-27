# 🔧 Custom Domain Backend Fix

## ✅ Status

- ✅ Backend radi na: `https://bio-vera.vercel.app/`
- ❌ Backend ne radi na: `https://www.biovera.app/login`

**Problem**: `NEXT_PUBLIC_API_URL` nije tačno postavljen ili frontend nije redeploy-ovan na custom domain-u.

---

## 🔍 Problem: Frontend Ne Može da Se Poveže sa Backend-om

**Uzrok**: 
- `NEXT_PUBLIC_API_URL` nije postavljen u Vercel-u
- Ili frontend nije redeploy-ovan nakon promene env var
- Ili `NEXT_PUBLIC_API_URL` nije postavljen za Production environment

---

## 🔧 Korak 1: Proveri `NEXT_PUBLIC_API_URL` u Vercel-u

### A) Otvori Vercel Environment Variables

1. **Vercel Dashboard** → Tvoj Projekat (`bio-vera`)
2. **Settings** → **Environment Variables**
3. Pronađi `NEXT_PUBLIC_API_URL`

### B) Proveri Trenutnu Vrednost

**Trebalo bi da bude:**
```
https://biovera-production.up.railway.app
```

**Ako je:**
- ❌ `http://localhost:3004` → **TO JE PROBLEM!**
- ❌ Prazno → **TO JE PROBLEM!**
- ❌ `https://api.biovera.app` → Može biti problem ako custom domain ne radi
- ✅ `https://biovera-production.up.railway.app` → **TAČNO!**

### C) Proveri Environments

**VAŽNO**: Proveri da su svi **Environments** označeni:
- ✅ **Production** (za `www.biovera.app`)
- ✅ **Preview**
- ✅ **Development**

**Ako Production nije označen:**
- Custom domain (`www.biovera.app`) koristi Production environment
- Ako `NEXT_PUBLIC_API_URL` nije postavljen za Production, frontend neće moći da se poveže!

### D) Ako Nije Tačan, Ažuriraj

1. Klikni **Edit** pored `NEXT_PUBLIC_API_URL`
2. Promeni **Value** na:
   ```
   https://biovera-production.up.railway.app
   ```
3. **Proveri da su SVI Environments označeni:**
   - ✅ Production (VAŽNO za custom domain!)
   - ✅ Preview
   - ✅ Development
4. **Save**

**VAŽNO**: Nakon promene env var, **moraš redeploy-ovati** frontend!

---

## 🔧 Korak 2: Redeploy Frontend

### A) Redeploy u Vercel Dashboard

1. **Vercel Dashboard** → Tvoj Projekat → **Deployments** tab
2. Klikni **"..."** (tri tačke) pored najnovijeg deployment-a
3. Klikni **"Redeploy"**
4. **Proveri da je Environment**: **Production** (za custom domain)
5. Sačekaj da se build završi (1-2 minuta)

**Ili:**
- Ako vidiš notifikaciju "Updated Environment Variable successfully", klikni **"Redeploy"** direktno iz notifikacije

---

## 🔍 Korak 3: Test Custom Domain

### A) Test Login Page

1. Otvori: `https://www.biovera.app/login`
2. Otvori **Browser Developer Tools** (F12)
3. Idi na **Console** tab
4. Idi na **Network** tab

### B) Pokušaj da Se Uloguješ

1. Popuni login formu:
   - Partner Code: `ADMIN001` (ili bilo koji test user)
   - Password: `test123`
2. Klikni "Sign In"

### C) Proveri Network Tab

**Pronađi zahtev za `/auth/login`:**

1. **Request URL**: 
   - ✅ Trebalo bi: `https://biovera-production.up.railway.app/auth/login`
   - ❌ Ako vidiš: `http://localhost:3004/auth/login` → `NEXT_PUBLIC_API_URL` nije postavljen ili frontend nije redeploy-ovan

2. **Status**:
   - ✅ `200 OK` → Zahtev uspešan!
   - ❌ `400 Bad Request` → Validation error
   - ❌ `401 Unauthorized` → Wrong credentials
   - ❌ `500 Internal Server Error` → Backend greška
   - ❌ `Network Error` / `Failed to fetch` → Frontend ne može da se poveže sa backend-om

3. **Response**:
   - Ako vidiš `{"access_token":"...","user":{...}}` → Login uspešan!
   - Ako vidiš grešku → Proveri credentials ili backend logs

### D) Proveri Console Tab

**Traži greške:**
- `Network Error` → Frontend ne može da se poveže sa backend-om
- `CORS error` → CORS problem (proveri `FRONTEND_URL` u Railway)
- `400 Bad Request` → Validation error
- `401 Unauthorized` → Wrong credentials
- `500 Internal Server Error` → Backend greška

---

## 🚨 Najčešći Problemi

### Problem 1: Request URL je `localhost:3004`
**Uzrok**: `NEXT_PUBLIC_API_URL` nije postavljen ili frontend nije redeploy-ovan
**Rešenje**:
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. Ažuriraj na `https://biovera-production.up.railway.app`
3. **Proveri da je Production environment označen!**
4. **Redeploy frontend** (VAŽNO!)

### Problem 2: "Network Error" u Browser Console
**Uzrok**: Frontend ne može da se poveže sa backend-om
**Rešenje**:
1. Proveri da li je `NEXT_PUBLIC_API_URL` tačno postavljen
2. Proveri da je Production environment označen
3. Proveri da li je frontend redeploy-ovan
4. Proveri Browser Console za detaljne greške

### Problem 3: Login Ne Radi na Custom Domain, Ali Radi na Vercel URL
**Uzrok**: `NEXT_PUBLIC_API_URL` nije postavljen za Production environment
**Rešenje**:
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. **Proveri da je Production environment označen!**
3. Ako nije, označi Production i Save
4. Redeploy frontend

### Problem 4: "CORS Error"
**Uzrok**: `FRONTEND_URL` nije postavljen u Railway backend env vars
**Rešenje**:
1. **Railway Dashboard** → Backend Service → **Variables** tab
2. Dodaj `FRONTEND_URL=https://www.biovera.app`
3. Restart backend service

---

## ✅ Checklist

- [ ] `NEXT_PUBLIC_API_URL` proveren u Vercel-u
- [ ] `NEXT_PUBLIC_API_URL` ažuriran na `https://biovera-production.up.railway.app`
- [ ] **Production environment označen** za `NEXT_PUBLIC_API_URL` (VAŽNO!)
- [ ] Frontend redeploy-ovan na Vercel-u (Production environment)
- [ ] Login page testiran na custom domain (`www.biovera.app/login`)
- [ ] Network tab proveren (Request URL, Status)
- [ ] Browser Console proveren (greške?)
- [ ] `FRONTEND_URL` postavljen u Railway backend env vars (ako ima CORS error)

---

## 📝 Javi mi

1. **Šta je trenutna vrednost `NEXT_PUBLIC_API_URL` u Vercel-u?**
2. **Da li je Production environment označen za `NEXT_PUBLIC_API_URL`?**
3. **Da li si redeploy-ovao frontend nakon promene env var?**
4. **Šta vidiš u Browser Network tab kada pokušaš da se uloguješ na `www.biovera.app/login`?**
   - Request URL? (trebalo bi da bude `https://biovera-production.up.railway.app/auth/login`)
   - Status?
   - Response?
5. **Šta vidiš u Browser Console?** (kopiraj greške ako ih ima)

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health**: https://biovera-production.up.railway.app/health
- **Login (Vercel)**: https://bio-vera.vercel.app/login
- **Login (Custom)**: https://www.biovera.app/login
