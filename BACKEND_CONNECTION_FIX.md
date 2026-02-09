# 🔧 Backend Connection Fix

## ✅ Status

- ✅ Backend health check radi: `{"status":"healthy","timestamp":"2026-02-08T22:21:52.181Z"}`
- ✅ Frontend radi na `www.biovera.app`
- ❌ Contact form ne radi (ne može da se poveže sa backend-om)

---

## 🔍 Problem: Frontend Ne Može da Se Poveže sa Backend-om

**Uzrok**: `NEXT_PUBLIC_API_URL` nije tačno postavljen u Vercel-u ili frontend nije redeploy-ovan.

---

## 🔧 Korak 1: Proveri `NEXT_PUBLIC_API_URL` u Vercel-u

### A) Otvori Vercel Environment Variables

1. **Vercel Dashboard** → Tvoj Projekat (`bio-vera`)
2. **Settings** → **Environment Variables**
3. Pronađi `NEXT_PUBLIC_API_URL`
4. **Proveri trenutnu Value**

**Trebalo bi da bude:**
```
https://biovera-production.up.railway.app
```

**Ako je:**
- ❌ `http://localhost:3004` → **TO JE PROBLEM!**
- ❌ Prazno → **TO JE PROBLEM!**
- ❌ `https://api.biovera.app` → Može biti problem ako custom domain ne radi

### B) Ažuriraj `NEXT_PUBLIC_API_URL` (ako je potrebno)

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

## 🔍 Korak 3: Test Backend Connection

### A) Test Backend Health (Railway URL)

```bash
curl https://biovera-production.up.railway.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"2026-02-08T22:21:52.181Z"}
```

### B) Test Backend Custom Domain (ako je konfigurisan)

```bash
curl https://api.biovera.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"2026-02-08T22:21:52.181Z"}
```

**Ako dobiješ 502 Bad Gateway:**
- Custom domain možda nije pravilno konfigurisan
- Koristi Railway URL za sada (`https://biovera-production.up.railway.app`)

### C) Test Contact Endpoint Direktno

```bash
curl -X POST https://biovera-production.up.railway.app/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "subject": "technical",
    "message": "Test message"
  }'
```

**Očekivani odgovor:**
```json
{
  "success": true,
  "message": "Thank you for your message. We will get back to you soon."
}
```

---

## 🔍 Korak 4: Test Contact Form u Browser-u

### A) Otvori Contact Form

1. Otvori: `https://www.biovera.app/contact`
2. Otvori **Browser Developer Tools** (F12)
3. Idi na **Console** tab
4. Idi na **Network** tab

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
   - ❌ Ako vidiš: `http://localhost:3004/contact/submit` → `NEXT_PUBLIC_API_URL` nije postavljen

2. **Status**:
   - ✅ `200 OK` → Zahtev uspešan!
   - ❌ `400 Bad Request` → Validation error (proveri Request Payload)
   - ❌ `500 Internal Server Error` → Backend greška (proveri Railway logs)
   - ❌ `Network Error` / `Failed to fetch` → Frontend ne može da se poveže

3. **Request Payload**:
   - Proveri da li se šalje ispravan JSON:
   ```json
   {
     "name": "Test",
     "email": "test@example.com",
     "subject": "technical",
     "message": "Test message"
   }
   ```

### D) Proveri Console Tab

**Traži greške:**
- `Network Error` → Frontend ne može da se poveže sa backend-om
- `CORS error` → CORS problem (proveri `FRONTEND_URL` u Railway)
- `400 Bad Request` → Validation error
- `500 Internal Server Error` → Backend greška

---

## 🚨 Najčešći Problemi

### Problem 1: "Network Error" u Browser Console
**Uzrok**: `NEXT_PUBLIC_API_URL` nije postavljen ili je pogrešan
**Rešenje**:
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. Ažuriraj na `https://biovera-production.up.railway.app`
3. Redeploy frontend

### Problem 2: Request URL je `localhost:3004`
**Uzrok**: `NEXT_PUBLIC_API_URL` nije postavljen ili frontend nije redeploy-ovan
**Rešenje**:
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. Ažuriraj na `https://biovera-production.up.railway.app`
3. Redeploy frontend

### Problem 3: "CORS Error"
**Uzrok**: `FRONTEND_URL` nije postavljen u Railway backend env vars
**Rešenje**:
1. **Railway Dashboard** → Backend Service → **Variables** tab
2. Dodaj `FRONTEND_URL=https://www.biovera.app`
3. Restart backend service

### Problem 4: "400 Bad Request"
**Uzrok**: Validation error (npr. email format, missing fields)
**Rešenje**:
1. Proveri Request Payload u Network tab
2. Proveri da li su sva polja popunjena
3. Proveri email format

### Problem 5: "500 Internal Server Error"
**Uzrok**: Backend greška (npr. email service, database)
**Rešenje**:
1. Proveri Railway logs
2. Proveri da li su svi env vars postavljeni (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc.)

---

## ✅ Checklist

- [ ] Backend health check radi (`/health` endpoint)
- [ ] `NEXT_PUBLIC_API_URL` proveren u Vercel-u
- [ ] `NEXT_PUBLIC_API_URL` ažuriran na `https://biovera-production.up.railway.app`
- [ ] Frontend redeploy-ovan na Vercel-u
- [ ] Contact form testiran u Browser-u (Network tab)
- [ ] Request URL proveren (trebalo bi da bude Railway URL)
- [ ] Browser Console proveren (greške?)
- [ ] Backend endpoint testiran direktno (`curl`)

---

## 📝 Javi mi

1. **Šta je trenutna vrednost `NEXT_PUBLIC_API_URL` u Vercel-u?**
2. **Da li si redeploy-ovao frontend nakon promene env var?**
3. **Šta vidiš u Browser Network tab kada pokušaš da pošalješ contact form?**
   - Request URL?
   - Status?
   - Request Payload?
4. **Šta vidiš u Browser Console?** (kopiraj greške ako ih ima)

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health**: https://biovera-production.up.railway.app/health
- **Contact Form**: https://www.biovera.app/contact
