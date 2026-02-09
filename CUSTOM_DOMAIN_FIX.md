# 🔧 Custom Domain Fix - Frontend i Backend

## Problem

- ✅ Frontend radi na: `https://bio-vera.vercel.app/`
- ❌ Frontend ne radi na: `https://www.biovera.app` (custom domain)
- ❌ Backend možda ne radi na: `https://api.biovera.app` (custom domain)

---

## 🔍 Korak 1: Proveri Vercel Custom Domain

### A) Proveri Custom Domain u Vercel-u

1. **Vercel Dashboard** → Tvoj Projekat (`bio-vera`)
2. **Settings** → **Domains**
3. Proveri da li je `biovera.app` i `www.biovera.app` dodato

**Ako nije dodato:**
1. Klikni **"Add Domain"**
2. Dodaj: `biovera.app`
3. Dodaj: `www.biovera.app`
4. Sačekaj da se DNS proveri (može potrajati nekoliko minuta)

### B) Proveri DNS Records

**U IONOS DNS Panel-u** (ili gde god imaš DNS):

1. Proveri da li su **A records** ili **CNAME records** postavljeni:
   - `biovera.app` → Vercel IP ili CNAME
   - `www.biovera.app` → Vercel IP ili CNAME

**Vercel DNS Records:**
- Vercel će ti dati IP adrese ili CNAME za custom domain
- Dodaj ih u IONOS DNS panel

---

## 🔍 Korak 2: Proveri `NEXT_PUBLIC_API_URL` u Vercel-u

### A) Proveri Environment Variables

1. **Vercel Dashboard** → Tvoj Projekat → **Settings** → **Environment Variables**
2. Pronađi `NEXT_PUBLIC_API_URL`
3. **Proveri Value**:

**Trenutno bi trebalo da bude:**
```
https://biovera-production.up.railway.app
```

**Ako želiš da koristiš custom domain za backend:**
```
https://api.biovera.app
```

**VAŽNO**: Ako promeniš `NEXT_PUBLIC_API_URL`, **moraš redeploy-ovati** frontend!

### B) Ažuriraj `NEXT_PUBLIC_API_URL` (ako je potrebno)

**Opcija 1: Koristi Railway URL (preporučeno za sada)**
```
https://biovera-production.up.railway.app
```

**Opcija 2: Koristi Custom Domain (ako je `api.biovera.app` konfigurisan)**
```
https://api.biovera.app
```

**Kako ažurirati:**
1. Klikni **Edit** pored `NEXT_PUBLIC_API_URL`
2. Promeni **Value** na željeni URL
3. Označi sve **Environments**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Save**

### C) Redeploy Frontend

**VAŽNO**: Nakon promene env var, **moraš redeploy-ovati**!

1. **Deployments** tab
2. Klikni **"..."** pored najnovijeg deployment-a
3. Klikni **"Redeploy"**
4. Sačekaj da se build završi (1-2 minuta)

---

## 🔍 Korak 3: Proveri Railway Custom Domain za Backend

### A) Proveri Custom Domain u Railway-u

1. **Railway Dashboard** → Backend Service
2. **Settings** → **Networking** ili **Custom Domain**
3. Proveri da li je `api.biovera.app` dodato

**Ako nije dodato:**
1. Klikni **"Add Custom Domain"** ili **"Generate Domain"**
2. Dodaj: `api.biovera.app`
3. Railway će ti dati **CNAME record** ili **TXT record** za verifikaciju
4. Dodaj DNS record u IONOS DNS panel

### B) Proveri DNS Records za `api.biovera.app`

**U IONOS DNS Panel-u:**

1. Dodaj **CNAME record**:
   - **Name**: `api`
   - **Value**: Railway CNAME (npr. `biovera-production.up.railway.app`)
   - **TTL**: 3600

**Ili ako Railway traži TXT record za verifikaciju:**
1. Dodaj **TXT record**:
   - **Name**: `api` ili `_railway`
   - **Value**: Railway TXT value
   - **TTL**: 3600

### C) Sačekaj DNS Propagation

DNS promene mogu potrajati:
- **Minimum**: 5-10 minuta
- **Maksimum**: 24-48 sati

**Proveri DNS propagation:**
```bash
# Proveri CNAME record
dig api.biovera.app CNAME

# Proveri A record
dig api.biovera.app A
```

---

## 🔍 Korak 4: Test Custom Domains

### A) Test Frontend Custom Domain

1. Otvori: `https://www.biovera.app`
2. Proveri da li se sajt učitava
3. Otvori Browser Console (F12)
4. Proveri da li ima grešaka

### B) Test Backend Custom Domain

```bash
# Test health endpoint
curl https://api.biovera.app/health

# Očekivani odgovor:
# {"status":"healthy","timestamp":"..."}
```

**Ako dobiješ:**
- ❌ `502 Bad Gateway` → Backend nije pokrenut ili custom domain nije konfigurisan
- ❌ `404 Not Found` → Custom domain nije pravilno konfigurisan
- ❌ `DNS resolution failed` → DNS records nisu dodati ili nisu propagirani

### C) Test Contact Form

1. Otvori: `https://www.biovera.app/contact`
2. Otvori Browser Console (F12) → **Network** tab
3. Pokušaj da pošalješ contact form
4. Proveri da li se zahtev šalje na:
   - ✅ `https://biovera-production.up.railway.app/contact/submit` (Railway URL)
   - ✅ `https://api.biovera.app/contact/submit` (Custom domain)

---

## 🚨 Najčešći Problemi

### Problem 1: Frontend Custom Domain Ne Radi
**Uzrok**: DNS records nisu dodati ili nisu propagirani
**Rešenje**:
1. Proveri Vercel Domains settings
2. Proveri DNS records u IONOS
3. Sačekaj DNS propagation (5-10 minuta)

### Problem 2: Backend Custom Domain Ne Radi
**Uzrok**: Custom domain nije konfigurisan u Railway-u ili DNS records nisu dodati
**Rešenje**:
1. Dodaj custom domain u Railway
2. Dodaj CNAME/TXT record u IONOS DNS
3. Sačekaj DNS propagation

### Problem 3: Contact Form Ne Radi na Custom Domain
**Uzrok**: `NEXT_PUBLIC_API_URL` nije ažuriran ili frontend nije redeploy-ovan
**Rešenje**:
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. Ažuriraj na Railway URL ili custom domain
3. Redeploy frontend

### Problem 4: CORS Error
**Uzrok**: `FRONTEND_URL` nije postavljen u Railway backend env vars
**Rešenje**:
1. **Railway Backend Service** → **Variables** tab
2. Dodaj `FRONTEND_URL=https://www.biovera.app`
3. Restart backend service

---

## ✅ Checklist

- [ ] Frontend custom domain proveren u Vercel-u (`biovera.app`, `www.biovera.app`)
- [ ] DNS records provereni za frontend (A/CNAME records)
- [ ] `NEXT_PUBLIC_API_URL` proveren u Vercel-u
- [ ] `NEXT_PUBLIC_API_URL` ažuriran (Railway URL ili custom domain)
- [ ] Frontend redeploy-ovan nakon promene env var
- [ ] Backend custom domain proveren u Railway-u (`api.biovera.app`)
- [ ] DNS records provereni za backend (CNAME/TXT records)
- [ ] `FRONTEND_URL` postavljen u Railway backend env vars
- [ ] Frontend testiran na custom domain (`www.biovera.app`)
- [ ] Backend testiran na custom domain (`api.biovera.app`)
- [ ] Contact form testiran na custom domain

---

## 📝 Javi mi

1. **Da li je `biovera.app` dodato u Vercel Domains?**
2. **Šta je trenutna vrednost `NEXT_PUBLIC_API_URL` u Vercel-u?**
3. **Da li je `api.biovera.app` konfigurisan u Railway-u?**
4. **Da li si redeploy-ovao frontend nakon promene env var?**
5. **Da li frontend sada radi na `www.biovera.app`?**

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Frontend (Vercel)**: https://bio-vera.vercel.app/
- **Frontend (Custom)**: https://www.biovera.app
- **Backend (Railway)**: https://biovera-production.up.railway.app/health
- **Backend (Custom)**: https://api.biovera.app/health
