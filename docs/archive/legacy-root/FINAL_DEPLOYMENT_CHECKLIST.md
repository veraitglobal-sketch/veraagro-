# ✅ Final Deployment Checklist

## ✅ DNS Records - Konfigurisano!

Sve DNS records su ispravno konfigurisani u Vercel-u:
- ✅ `api` CNAME → `biovera-production.up.railway.app.`
- ✅ MX records za IONOS email
- ✅ Resend records (DKIM, SPF, DMARC)
- ✅ Vercel automatski records

---

## 🔧 Korak 1: Redeploy Frontend

**VAŽNO**: Vercel je prikazao notifikaciju:
> "Updated Environment Variable successfully. A new deployment is needed for changes to take effect."

### A) Redeploy u Vercel Dashboard

1. **Vercel Dashboard** → Tvoj Projekat (`bio-vera`)
2. **Deployments** tab
3. Klikni **"..."** (tri tačke) pored najnovijeg deployment-a
4. Klikni **"Redeploy"**
5. Sačekaj da se build završi (1-2 minuta)

**Ili:**
- Klikni **"Redeploy"** direktno iz notifikacije (ako je još vidljiva)

---

## 🔍 Korak 2: Proveri Backend Status

### A) Test Backend Health

```bash
curl https://biovera-production.up.railway.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"2026-02-08T23:18:00.000Z"}
```

**Ako dobiješ 502 Bad Gateway:**
- Backend nije pokrenut → Proveri Railway logs
- Restart backend service u Railway-u

### B) Test Backend Custom Domain

```bash
curl https://api.biovera.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"2026-02-08T23:18:00.000Z"}
```

**Ako dobiješ 502 Bad Gateway ili DNS error:**
- DNS propagation možda nije završen (sačekaj 5-10 minuta)
- Proveri da li je `api.biovera.app` CNAME tačno postavljen

---

## 🔍 Korak 3: Proveri `NEXT_PUBLIC_API_URL`

### A) Proveri u Vercel Environment Variables

1. **Vercel Dashboard** → Tvoj Projekat → **Settings** → **Environment Variables**
2. Pronađi `NEXT_PUBLIC_API_URL`
3. **Proveri Value**:

**Opcija 1: Railway URL (preporučeno za sada)**
```
https://biovera-production.up.railway.app
```

**Opcija 2: Custom Domain (ako je `api.biovera.app` radi)**
```
https://api.biovera.app
```

**Ako nije tačan:**
1. Klikni **Edit**
2. Promeni Value
3. Označi sve Environments (Production, Preview, Development)
4. **Save**
5. **Redeploy frontend** (korak 1)

---

## 🔍 Korak 4: Test Frontend na Custom Domain

### A) Test Homepage

1. Otvori: `https://www.biovera.app`
2. Proveri da li se sajt učitava
3. Otvori Browser Console (F12)
4. Proveri da li ima grešaka

### B) Test Contact Form

1. Otvori: `https://www.biovera.app/contact`
2. Otvori Browser Console (F12) → **Network** tab
3. Popuni contact form:
   - Name: Test
   - Email: test@example.com
   - Subject: Technical Support
   - Message: Test message
4. Klikni "Send Message"
5. Proveri Network tab:
   - **Request URL**: Trebalo bi da bude `https://biovera-production.up.railway.app/contact/submit` (ili `https://api.biovera.app/contact/submit`)
   - **Status**: Trebalo bi da bude `200 OK`

**Ako vidiš "Network Error":**
- Proveri da li je `NEXT_PUBLIC_API_URL` tačno postavljen
- Proveri da li je frontend redeploy-ovan
- Proveri da li backend radi (`/health` endpoint)

---

## 🔍 Korak 5: Proveri Backend Logs (ako contact form ne radi)

### A) Railway Backend Logs

1. **Railway Dashboard** → Backend Service
2. **Deployments** → Najnoviji deployment
3. **View Logs**
4. Proveri da li ima grešaka

**Šta tražiti:**
- ✅ `Bio Vera Backend running on http://localhost:3000` → Backend radi
- ❌ `JWT_SECRET environment variable is required` → Dodaj `JWT_SECRET`
- ❌ `Error validating datasource db` → Proveri `DATABASE_URL`
- ❌ `PrismaClientInitializationError` → Proveri database connection

---

## ✅ Final Checklist

- [ ] Frontend redeploy-ovan na Vercel-u (nakon env var promene)
- [ ] Backend health check radi (`/health` endpoint)
- [ ] `NEXT_PUBLIC_API_URL` proveren u Vercel-u
- [ ] `NEXT_PUBLIC_API_URL` ažuriran (ako je potrebno)
- [ ] Frontend testiran na custom domain (`www.biovera.app`)
- [ ] Contact form testiran na custom domain
- [ ] Backend logs provereni (ako ima problema)

---

## 🚨 Ako Contact Form Još Ne Radi

### Problem 1: "Network Error"
**Uzrok**: `NEXT_PUBLIC_API_URL` nije tačno postavljen ili frontend nije redeploy-ovan
**Rešenje**:
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. Redeploy frontend
3. Proveri Browser Console za detaljne greške

### Problem 2: "400 Bad Request"
**Uzrok**: Validation error (npr. email format, missing fields)
**Rešenje**:
1. Proveri Request Payload u Network tab
2. Proveri da li su sva polja popunjena
3. Proveri email format

### Problem 3: "500 Internal Server Error"
**Uzrok**: Backend greška (npr. email service, database)
**Rešenje**:
1. Proveri Railway logs
2. Proveri da li su svi env vars postavljeni (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc.)

### Problem 4: Backend 502 Bad Gateway
**Uzrok**: Backend nije pokrenut ili crash-uje
**Rešenje**:
1. Proveri Railway backend service status
2. Proveri Railway logs
3. Restart backend service
4. Proveri env vars (`JWT_SECRET`, `DATABASE_URL`, etc.)

---

## 📝 Javi mi

1. **Da li si redeploy-ovao frontend?**
2. **Da li backend health check radi?** (`/health` endpoint)
3. **Šta je trenutna vrednost `NEXT_PUBLIC_API_URL` u Vercel-u?**
4. **Da li frontend sada radi na `www.biovera.app`?**
5. **Da li contact form sada radi?**

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Frontend (Custom)**: https://www.biovera.app
- **Backend (Railway)**: https://biovera-production.up.railway.app/health
- **Backend (Custom)**: https://api.biovera.app/health
- **Contact Form**: https://www.biovera.app/contact
