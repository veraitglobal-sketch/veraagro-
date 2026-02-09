# 🔍 Debug: Network Error (Environment Variable je Tačan)

## ✅ Status

**Environment Variable je tačno postavljen:**
- `NEXT_PUBLIC_API_URL` = `https://biovera-production.up.railway.app` ✅
- Ažurirano: 4h ago ✅
- Environments: All Environments ✅

**Problem**: I dalje vidiš "Network Error" → Problem nije u environment variable-u!

---

## 🔍 Mogući Uzroci

### 1. Frontend nije redeploy-ovan nakon postavljanja varijable

**Rešenje:**
1. Vercel Dashboard → Deployments tab
2. Proveri da li postoji deployment **nakon** 4h ago (kada je env var ažuriran)
3. Ako nema novog deployment-a:
   - Klikni na "..." pored najnovijeg deployment-a
   - Klikni **Redeploy**
   - Sačekaj 1-2 minuta

---

### 2. Browser Cache

**Rešenje:**
1. **Hard Refresh**:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. Ili **Clear Browser Cache**:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content

---

### 3. CORS Problem

**Proveri Backend CORS:**

Backend (`backend/src/main.ts`) treba da ima:
```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'https://bio-vera.vercel.app', // Dodaj tvoj Vercel URL
    'https://biovera.app', // Dodaj tvoj custom domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Ako nema tvoj Vercel URL:**
1. Dodaj ga u `origin` array
2. Git push
3. Railway automatski redeploy-uje

---

### 4. Backend Endpoint Problem

**Test Backend Direktno:**

Otvori novi browser tab i idi na:
```
https://biovera-production.up.railway.app/growers/prospect/download
```

**Ako se PDF automatski skida:**
- ✅ Backend radi
- Problem je u frontend-u ili CORS-u

**Ako vidiš grešku:**
- ❌ Backend ima problem
- Proveri Railway logs

---

## 🧪 Debug Koraci

### Korak 1: Proveri Browser Console

1. Otvori browser Developer Tools (F12)
2. Idi na **Console** tab
3. Unesi:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_API_URL)
   ```
4. **Trebalo bi da vidiš**: `https://biovera-production.up.railway.app`

**Ako vidiš `undefined` ili `http://localhost:3004`:**
- ❌ Frontend nije redeploy-ovan ili ima cache problem
- Hard refresh ili clear cache
- Redeploy frontend

---

### Korak 2: Proveri Network Tab

1. Otvori browser Developer Tools (F12)
2. Idi na **Network** tab
3. Klikni na "Download Prospect PDF"
4. Pronađi zahtev ka `/growers/prospect/download`
5. Klikni na zahtev
6. Proveri:

**Request URL:**
- ✅ Trebalo bi: `https://biovera-production.up.railway.app/growers/prospect/download`
- ❌ Ako vidiš: `http://localhost:3004/...` → Frontend nije redeploy-ovan

**Response Status:**
- ✅ `200 OK` → Backend radi, problem je u frontend-u
- ❌ `CORS Error` → Backend CORS problem
- ❌ `500 Internal Server Error` → Backend ima grešku
- ❌ `Network Error` → Backend ne može da se pristupi

**Response Headers:**
- Trebalo bi da vidiš: `Content-Type: application/pdf`
- Trebalo bi da vidiš: `Content-Disposition: attachment; filename="..."`

---

### Korak 3: Test Backend Direktno

**Test 1: Health Check**
```
https://biovera-production.up.railway.app/health
```
Trebalo bi da vidiš: `{"status":"healthy","timestamp":"..."}`

**Test 2: Prospect Download**
```
https://biovera-production.up.railway.app/growers/prospect/download
```
Trebalo bi da se PDF automatski skida

**Ako oba rade:**
- ✅ Backend radi
- Problem je u frontend-u ili CORS-u

**Ako ne rade:**
- ❌ Backend ima problem
- Proveri Railway logs

---

## 🔧 Rešenja

### Rešenje 1: Redeploy Frontend

1. Vercel Dashboard → Deployments tab
2. Klikni na "..." pored najnovijeg deployment-a
3. Klikni **Redeploy**
4. Sačekaj 1-2 minuta
5. Hard refresh browser (`Cmd + Shift + R`)

---

### Rešenje 2: Clear Build Cache

1. Vercel Dashboard → Settings → General
2. Scroll down do "Build & Development Settings"
3. Klikni "Clear Build Cache"
4. Redeploy frontend ponovo

---

### Rešenje 3: Proveri CORS

**Proveri Backend CORS konfiguraciju:**

1. Proveri `backend/src/main.ts`
2. Proveri da li `FRONTEND_URL` u Railway environment variables sadrži tvoj Vercel URL
3. Ako nema, dodaj:
   - Railway Dashboard → BioVera service → Variables
   - Dodaj `FRONTEND_URL` = `https://bio-vera.vercel.app`
   - Restart backend

---

### Rešenje 4: Proveri Railway Logs

1. Railway Dashboard → BioVera service
2. Deployments tab → Latest → View Logs
3. Pokušaj da skineš prospekt ponovo
4. Proveri da li se pojavljuje zahtev u logs
5. Proveri da li ima grešaka

---

## 📋 Checklist

- [ ] Proverio browser console (`console.log(process.env.NEXT_PUBLIC_API_URL)`)
- [ ] Proverio Network tab (Request URL i Response Status)
- [ ] Testirao backend direktno u browser-u
- [ ] Hard refresh browser (`Cmd + Shift + R`)
- [ ] Redeploy-ovao frontend u Vercel
- [ ] Proverio CORS konfiguraciju u backend-u
- [ ] Proverio Railway logs za backend greške

---

## 🆘 Ako i dalje ne radi

1. **Proveri Railway logs** - možda backend ima grešku
2. **Proveri Vercel logs** - možda frontend ima grešku
3. **Testiraj lokalno** - pokreni backend i frontend lokalno i testiraj
4. **Kontaktiraj support** - pošalji:
   - Browser console screenshot
   - Network tab screenshot
   - Railway logs
   - Vercel logs

---

## 💡 Quick Fix

Ako žuriš, probaj:

1. **Hard Refresh**: `Cmd + Shift + R` (Mac) ili `Ctrl + Shift + R` (Windows)
2. **Redeploy Frontend**: Vercel Dashboard → Deployments → Redeploy
3. **Test Backend**: Otvori `https://biovera-production.up.railway.app/growers/prospect/download` direktno u browser-u

Ako backend direktno radi, problem je u frontend-u ili CORS-u.
