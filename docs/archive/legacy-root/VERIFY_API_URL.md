# ✅ Verifikacija: `NEXT_PUBLIC_API_URL`

## ✅ Backend Status

**Backend radi!** ✅
- Health check: `https://biovera-production.up.railway.app/health` → `{"status":"healthy"}`
- Contact endpoint: `https://biovera-production.up.railway.app/contact/submit` → Odgovara (ali email service ne radi)

**URL je tačan**: `https://biovera-production.up.railway.app` ✅

---

## 🔍 Problem: Frontend Ne Može da Se Poveže

**Uzrok**: `NEXT_PUBLIC_API_URL` nije postavljen u Vercel-u ili frontend nije redeploy-ovan.

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

### C) Ako Nije Tačan, Ažuriraj

1. Klikni **Edit** pored `NEXT_PUBLIC_API_URL`
2. Promeni **Value** na:
   ```
   https://biovera-production.up.railway.app
   ```
3. Proveri da su svi **Environments** označeni:
   - ✅ Production
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
4. Sačekaj da se build završi (1-2 minuta)

**Ili:**
- Ako vidiš notifikaciju "Updated Environment Variable successfully", klikni **"Redeploy"** direktno iz notifikacije

---

## 🔍 Korak 3: Test u Browser-u

### A) Otvori Contact Form

1. Otvori: `https://www.biovera.app/contact`
2. Otvori **Browser Developer Tools** (F12)
3. Idi na **Network** tab
4. **Očisti network log** (ikonica 🚫)

### B) Pokušaj da Pošalješ Contact Form

1. Popuni formu:
   - Name: Test
   - Email: test@example.com
   - Subject: Technical Support
   - Message: Test message
2. Klikni "Send Message"

### C) Proveri Network Tab

**Pronađi zahtev za `/contact/submit`:**

1. **Request URL**: 
   - ✅ Trebalo bi: `https://biovera-production.up.railway.app/contact/submit`
   - ❌ Ako vidiš: `http://localhost:3004/contact/submit` → `NEXT_PUBLIC_API_URL` nije postavljen ili frontend nije redeploy-ovan

2. **Status**:
   - ✅ `200 OK` → Zahtev uspešan! (ali email možda ne radi)
   - ❌ `400 Bad Request` → Validation error
   - ❌ `500 Internal Server Error` → Backend greška
   - ❌ `Network Error` / `Failed to fetch` → Frontend ne može da se poveže

3. **Response**:
   - Ako vidiš `{"success":false,"message":"Failed to send your message. Please try again later."}` → Backend radi, ali email service ne radi (SMTP konfiguracija)

---

## 🚨 Ako Još Ne Radi

### Problem 1: Request URL je `localhost:3004`
**Uzrok**: `NEXT_PUBLIC_API_URL` nije postavljen ili frontend nije redeploy-ovan
**Rešenje**:
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. Ažuriraj na `https://biovera-production.up.railway.app`
3. **Redeploy frontend** (VAŽNO!)

### Problem 2: "Network Error" u Browser Console
**Uzrok**: Frontend ne može da se poveže sa backend-om
**Rešenje**:
1. Proveri da li je `NEXT_PUBLIC_API_URL` tačno postavljen
2. Proveri da li je frontend redeploy-ovan
3. Proveri Browser Console za detaljne greške

### Problem 3: Backend Odgovara, Ali Email Ne Radi
**Uzrok**: SMTP konfiguracija u Railway backend env vars
**Rešenje**:
1. **Railway Dashboard** → Backend Service → **Variables** tab
2. Proveri da li su postavljeni:
   - `SMTP_HOST` (npr. `smtp.resend.com` ili `smtp.gmail.com`)
   - `SMTP_PORT` (npr. `587`)
   - `SMTP_USER` (SMTP username)
   - `SMTP_PASS` (SMTP password ili Resend API key)
   - `EMAIL_FROM=info@biovera.app`
   - `ADMIN_EMAIL=info@biovera.app`
3. Restart backend service

---

## ✅ Checklist

- [ ] Backend health check testiran (`/health` endpoint) ✅
- [ ] `NEXT_PUBLIC_API_URL` proveren u Vercel-u
- [ ] `NEXT_PUBLIC_API_URL` ažuriran na `https://biovera-production.up.railway.app`
- [ ] Frontend redeploy-ovan na Vercel-u
- [ ] Contact form testiran u Browser-u (Network tab)
- [ ] Request URL proveren (trebalo bi da bude Railway URL)
- [ ] Browser Console proveren (greške?)

---

## 📝 Javi mi

1. **Šta je trenutna vrednost `NEXT_PUBLIC_API_URL` u Vercel-u?**
2. **Da li si redeploy-ovao frontend nakon promene env var?**
3. **Šta vidiš u Browser Network tab kada pokušaš da pošalješ contact form?**
   - Request URL? (trebalo bi da bude `https://biovera-production.up.railway.app/contact/submit`)
   - Status?
   - Response?
4. **Šta vidiš u Browser Console?** (kopiraj greške ako ih ima)

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health**: https://biovera-production.up.railway.app/health
- **Contact Form**: https://www.biovera.app/contact
