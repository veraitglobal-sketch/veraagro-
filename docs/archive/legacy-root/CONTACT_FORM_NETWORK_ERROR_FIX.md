# 🔧 Rešavanje "Network Error" za Contact Form

## ❌ Problem

**Contact form daje "Network Error" iako custom domain radi.**

**Uzrok**: `NEXT_PUBLIC_API_URL` nije tačno postavljen u Vercel-u ili frontend nije redeploy-ovan.

---

## ✅ Rešenje: Proveri i Ažuriraj `NEXT_PUBLIC_API_URL`

### Korak 1: Proveri Trenutnu Vrednost u Vercel-u

1. **Vercel Dashboard** → Tvoj Projekat → Settings → Environment Variables
2. Pronađi `NEXT_PUBLIC_API_URL`
3. Proveri trenutnu **Value**

**Moguće vrednosti:**
- ❌ `http://localhost:3004` → Pogrešno (lokalni URL)
- ❌ `http://localhost:3000` → Pogrešno (lokalni URL)
- ❌ `undefined` ili prazno → Pogrešno
- ✅ `https://api.biovera.app` → Tačno (ako custom domain radi)
- ✅ `https://biovera-production.up.railway.app` → Tačno (Railway URL)

---

### Korak 2: Ažuriraj `NEXT_PUBLIC_API_URL`

**Ako custom domain `api.biovera.app` radi:**

1. **Vercel Dashboard** → Settings → Environment Variables
2. Klikni **Edit** pored `NEXT_PUBLIC_API_URL`
3. Promeni **Value** na:
   ```
   https://api.biovera.app
   ```
4. Proveri da su svi **Environments** označeni:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Klikni **Save**

**Ako custom domain još ne radi:**

1. Koristi Railway URL:
   ```
   https://biovera-production.up.railway.app
   ```
   (zameni sa stvarnim Railway backend URL-om)

---

### Korak 3: Redeploy Frontend

**VAŽNO**: Nakon promene environment variable, **moraš redeploy-ovati** frontend!

1. **Vercel Dashboard** → Tvoj Projekat → **Deployments** tab
2. Klikni na **"..."** (tri tačke) pored najnovijeg deployment-a
3. Klikni **"Redeploy"**
4. Sačekaj da se build završi (obično 1-2 minuta)

**Napomena**: Vercel automatski redeploy-uje nakon promene env var, ali ponekad treba ručno.

---

### Korak 4: Test Backend URL

**Proveri da li backend radi na custom domain-u:**

1. Otvori browser
2. Idi na: `https://api.biovera.app/health`
   (ili `https://biovera-production.up.railway.app/health`)
3. Trebalo bi da vidiš: `{"status":"healthy"}` ✅

**Ako vidiš "Not Found" ili grešku:**
- Backend nije dostupan na tom URL-u
- Proveri Railway logs
- Proveri da li je backend aktivan

---

### Korak 5: Test Contact Form

**Nakon redeploy-a:**

1. Otvori: `https://biovera.app/contact`
2. Otvori Browser Console (F12)
3. Popuni contact form
4. Klikni "Send Message"
5. Proveri Console - da li ima grešaka?

**Ako i dalje vidiš "Network Error":**
- Proveri Network tab u Developer Tools
- Proveri da li se zahtev šalje na pravi URL
- Proveri da li backend prima zahtev (Railway logs)

---

## 🔍 Debug: Proveri Network Tab

1. **Otvori Browser Developer Tools** (F12)
2. Idi na **Network** tab
3. Pokušaj da pošalješ contact form
4. Pronađi zahtev za `/contact/submit`
5. Klikni na zahtev
6. Proveri **Request URL**:
   - Trebalo bi da bude: `https://api.biovera.app/contact/submit`
   - Ili: `https://biovera-production.up.railway.app/contact/submit`

**Ako vidiš `http://localhost:3004/contact/submit`:**
- ❌ `NEXT_PUBLIC_API_URL` nije postavljen ili nije redeploy-ovan

---

## ✅ Checklist

- [ ] Proverio trenutnu vrednost `NEXT_PUBLIC_API_URL` u Vercel-u
- [ ] Ažurirao `NEXT_PUBLIC_API_URL` na tačan backend URL
- [ ] Frontend redeploy-ovan na Vercel-u
- [ ] Backend testiran (`/health` endpoint)
- [ ] Contact form testiran sa Browser Console otvorenim
- [ ] Network tab proveren (da li se zahtev šalje na pravi URL)

---

## 🆘 Ako i dalje ne radi

### Problem 1: Backend Ne Radi na Custom Domain

**Rešenje:**
- Koristi Railway URL privremeno: `https://biovera-production.up.railway.app`
- Proveri Railway logs za greške

### Problem 2: Frontend Nije Redeploy-ovan

**Rešenje:**
- Ručno redeploy-uj frontend na Vercel-u
- Sačekaj da se build završi
- Proveri da li je novi deployment aktivan

### Problem 3: CORS Problem

**Rešenje:**
- Proveri da li `FRONTEND_URL` u Railway sadrži `https://biovera.app`
- Proveri Railway logs za CORS greške

---

## 💡 Preporuka

**Za sada:**
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. Ako nije tačan, ažuriraj ga na:
   - `https://api.biovera.app` (ako custom domain radi)
   - Ili `https://biovera-production.up.railway.app` (Railway URL)
3. Redeploy frontend
4. Test contact form

**Javi mi:**
- Šta je trenutna vrednost `NEXT_PUBLIC_API_URL` u Vercel-u?
- Da li backend radi na `https://api.biovera.app/health`?
