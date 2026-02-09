# 🔒 SSL Certificate Fix - `api.biovera.app`

## ❌ Problem

**SSL greška**: `NET::ERR_CERT_COMMON_NAME_INVALID` na `https://api.biovera.app/health`

**Uzrok**: Railway nije generisao SSL sertifikat za `api.biovera.app` ili custom domain nije pravilno konfigurisan.

---

## ✅ Rešenje 1: Koristi Railway URL (Preporučeno za Sada)

**Za sada, koristi Railway URL u `NEXT_PUBLIC_API_URL`:**

```
https://biovera-production.up.railway.app
```

**Ovo je najbrže rešenje** - Railway URL već ima validan SSL sertifikat.

---

## 🔧 Korak 1: Ažuriraj `NEXT_PUBLIC_API_URL` u Vercel-u

### A) Otvori Vercel Environment Variables

1. **Vercel Dashboard** → Tvoj Projekat (`bio-vera`)
2. **Settings** → **Environment Variables**
3. Pronađi `NEXT_PUBLIC_API_URL`

### B) Ažuriraj na Railway URL

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

1. **Vercel Dashboard** → Tvoj Projekat → **Deployments** tab
2. Klikni **"..."** (tri tačke) pored najnovijeg deployment-a
3. Klikni **"Redeploy"**
4. Sačekaj da se build završi (1-2 minuta)

---

## 🔍 Korak 3: Test Contact Form

1. Otvori: `https://www.biovera.app/contact`
2. Otvori Browser Console (F12) → **Network** tab
3. Pokušaj da pošalješ contact form
4. Proveri Network tab:
   - **Request URL**: Trebalo bi da bude `https://biovera-production.up.railway.app/contact/submit`
   - **Status**: Trebalo bi da bude `200 OK`

---

## 🔧 Rešenje 2: Konfiguriši Custom Domain u Railway-u (Opciono)

**Ako želiš da koristiš `api.biovera.app` custom domain:**

### A) Dodaj Custom Domain u Railway-u

1. **Railway Dashboard** → Backend Service
2. **Settings** → **Networking** ili **Custom Domain**
3. Klikni **"Add Custom Domain"** ili **"Generate Domain"**
4. Dodaj: `api.biovera.app`
5. Railway će ti dati **CNAME record** ili **TXT record** za verifikaciju

### B) Dodaj DNS Record u Vercel-u

1. **Vercel DNS** → **Add Record**
2. **Type**: `CNAME`
3. **Name**: `api`
4. **Value**: Railway CNAME (npr. `biovera-production.up.railway.app`)
5. **TTL**: `60`
6. **Save**

### C) Sačekaj SSL Sertifikat

Railway automatski generiše SSL sertifikat za custom domain, ali može potrajati:
- **Minimum**: 5-10 minuta
- **Maksimum**: 24 sata

### D) Test Custom Domain

```bash
curl https://api.biovera.app/health
```

**Očekivani odgovor:**
```json
{"status":"healthy","timestamp":"2026-02-08T23:32:00.000Z"}
```

**Ako dobiješ SSL grešku:**
- Sačekaj još malo (SSL sertifikat se generiše)
- Proveri da li je custom domain pravilno konfigurisan u Railway-u

---

## 🚨 Najčešći Problemi

### Problem 1: SSL Greška na Custom Domain
**Uzrok**: Railway nije generisao SSL sertifikat ili custom domain nije pravilno konfigurisan
**Rešenje**: 
- Koristi Railway URL za sada (`https://biovera-production.up.railway.app`)
- Ili sačekaj da Railway generiše SSL sertifikat (5-10 minuta)

### Problem 2: Custom Domain Ne Radi
**Uzrok**: DNS propagation nije završen ili CNAME record nije pravilno dodat
**Rešenje**:
1. Proveri da li je `api` CNAME record dodat u Vercel DNS
2. Sačekaj DNS propagation (5-10 minuta)
3. Proveri da li je custom domain konfigurisan u Railway-u

### Problem 3: Contact Form Ne Radi
**Uzrok**: `NEXT_PUBLIC_API_URL` nije tačno postavljen ili frontend nije redeploy-ovan
**Rešenje**:
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. Ažuriraj na `https://biovera-production.up.railway.app`
3. Redeploy frontend

---

## ✅ Checklist

- [ ] `NEXT_PUBLIC_API_URL` ažuriran na `https://biovera-production.up.railway.app`
- [ ] Frontend redeploy-ovan na Vercel-u
- [ ] Contact form testiran (`www.biovera.app/contact`)
- [ ] Request URL proveren (trebalo bi da bude Railway URL)
- [ ] Browser Console proveren (greške?)

**Opciono (za custom domain):**
- [ ] Custom domain konfigurisan u Railway-u (`api.biovera.app`)
- [ ] `api` CNAME record dodat u Vercel DNS
- [ ] DNS propagation sačekan (5-10 minuta)
- [ ] SSL sertifikat generisan (Railway automatski)
- [ ] Custom domain testiran (`api.biovera.app/health`)

---

## 📝 Javi mi

1. **Da li si ažurirao `NEXT_PUBLIC_API_URL` na Railway URL?**
2. **Da li si redeploy-ovao frontend?**
3. **Da li contact form sada radi?**
4. **Da li vidiš zahtev u Network tab na Railway URL?**

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health (Railway)**: https://biovera-production.up.railway.app/health
- **Contact Form**: https://www.biovera.app/contact
