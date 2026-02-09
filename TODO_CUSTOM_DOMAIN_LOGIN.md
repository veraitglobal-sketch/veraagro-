# 📋 TODO: Custom Domain Login Fix

## ✅ Trenutno Stanje

- ✅ **Login radi na**: `https://bio-vera.vercel.app/login`
- ❌ **Login ne radi na**: `https://www.biovera.app/login`
- ✅ **Backend radi**: `https://biovera-production.up.railway.app/health` → `{"status":"healthy"}`
- ✅ **Environment Variable konfigurisan**: `NEXT_PUBLIC_API_URL` = `https://biovera-production.up.railway.app`
- ✅ **Production environment označen** za `NEXT_PUBLIC_API_URL`

---

## 🔍 Problem

Frontend na custom domain-u (`www.biovera.app`) ne može da se poveže sa backend-om, iako:
- Backend radi
- Environment variable je ispravno konfigurisan
- Production environment je označen

**Mogući uzroci:**
1. Frontend nije redeploy-ovan nakon promene env var
2. Browser cache problem
3. `FRONTEND_URL` nije postavljen u Railway backend env vars (CORS problem)

---

## 🔧 Sledeći Koraci (Sutra)

### Korak 1: Proveri Frontend Deployment

1. **Vercel Dashboard** → Tvoj Projekat (`bio-vera`)
2. **Deployments** tab
3. Proveri da li je poslednji deployment **Production** environment
4. Proveri da li je deployment **uspešan**

**Ako nije redeploy-ovan:**
- Klikni **"..."** → **"Redeploy"**
- Proveri da je Environment: **Production**
- Sačekaj da se build završi

### Korak 2: Proveri Browser Network Tab

1. Otvori: `https://www.biovera.app/login`
2. **Hard refresh**: `Cmd + Shift + R` (Mac) ili `Ctrl + Shift + R` (Windows)
3. Otvori Browser Console (F12) → **Network** tab
4. Pokušaj da se uloguješ:
   - Partner Code: `ADMIN001`
   - Password: `test123`
5. Proveri Network tab:
   - **Request URL**: Trebalo bi da bude `https://biovera-production.up.railway.app/auth/login`
   - **Status**: Trebalo bi da bude `200 OK` ili greška

**Ako vidiš:**
- ❌ `http://localhost:3004/auth/login` → Frontend nije redeploy-ovan ili cache problem
- ❌ `Network Error` → Frontend ne može da se poveže sa backend-om
- ❌ `CORS error` → `FRONTEND_URL` nije postavljen u Railway

### Korak 3: Proveri Railway Backend CORS

1. **Railway Dashboard** → Backend Service → **Variables** tab
2. Proveri da li je postavljen:
   - `FRONTEND_URL=https://www.biovera.app`

**Ako nije postavljen:**
1. Klikni **"New Variable"**
2. **Key**: `FRONTEND_URL`
3. **Value**: `https://www.biovera.app`
4. **Save**
5. **Restart backend service**

### Korak 4: Test Backend Health

```bash
curl https://biovera-production.up.railway.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"..."}
```

### Korak 5: Test Login Endpoint Direktno

```bash
curl -X POST https://biovera-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ADMIN001",
    "password": "test123"
  }'
```

**Očekivani odgovor:**
```json
{
  "access_token": "...",
  "user": {...}
}
```

---

## 🚨 Najčešći Problemi i Rešenja

### Problem 1: Request URL je `localhost:3004`
**Uzrok**: Frontend nije redeploy-ovan ili browser cache
**Rešenje**:
1. Redeploy frontend (Production environment)
2. Hard refresh u browser-u (`Cmd + Shift + R`)

### Problem 2: "Network Error"
**Uzrok**: Frontend ne može da se poveže sa backend-om
**Rešenje**:
1. Proveri da li je backend health check radi
2. Proveri da li je `NEXT_PUBLIC_API_URL` tačno postavljen
3. Proveri da je Production environment označen

### Problem 3: "CORS Error"
**Uzrok**: `FRONTEND_URL` nije postavljen u Railway
**Rešenje**:
1. Dodaj `FRONTEND_URL=https://www.biovera.app` u Railway backend env vars
2. Restart backend service

### Problem 4: "401 Unauthorized"
**Uzrok**: Wrong credentials ili backend auth problem
**Rešenje**:
1. Proveri credentials (`ADMIN001` / `test123`)
2. Proveri Railway backend logs za auth greške

---

## ✅ Checklist za Sutra

- [ ] Frontend deployment proveren (Production environment)
- [ ] Frontend redeploy-ovan (ako je potrebno)
- [ ] Browser Network tab proveren (Request URL, Status)
- [ ] Hard refresh uradjen (`Cmd + Shift + R`)
- [ ] `FRONTEND_URL` proveren u Railway backend env vars
- [ ] Backend health check testiran (`/health` endpoint)
- [ ] Login endpoint testiran direktno (`curl` test)
- [ ] Browser Console proveren (greške?)

---

## 📝 Trenutna Konfiguracija

### Vercel Environment Variables:
- ✅ `NEXT_PUBLIC_API_URL` = `https://biovera-production.up.railway.app`
- ✅ Production environment označen
- ✅ Preview environment označen

### Railway Backend:
- ✅ Backend radi: `https://biovera-production.up.railway.app/health`
- ❓ `FRONTEND_URL` - treba proveriti

### Custom Domain:
- ✅ `www.biovera.app` - konfigurisan u Vercel-u
- ✅ DNS records - konfigurisani u Vercel-u

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health**: https://biovera-production.up.railway.app/health
- **Login (Vercel)**: https://bio-vera.vercel.app/login
- **Login (Custom)**: https://www.biovera.app/login

---

## 💡 Napomene

- **Sve je konfigurisano ispravno** - problem je verovatno u redeploy-u ili CORS-u
- **Backend radi** - nema problema sa backend-om
- **Environment variable je ispravan** - samo treba redeploy frontend-a
- **Custom domain radi** - frontend se učitava, samo ne može da se poveže sa backend-om

**Sutra ćemo proveriti:**
1. Da li je frontend redeploy-ovan
2. Da li je `FRONTEND_URL` postavljen u Railway
3. Browser Network tab za detaljne greške
