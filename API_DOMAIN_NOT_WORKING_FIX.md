# 🔧 Rešavanje: `api.biovera.app` Ne Radi

## ❌ Problem

**`api.biovera.app` ne radi** - vidi se "This site can't be reached" (ERR_CONNECTION_CLOSED)

**Uzrok**: Custom domain `api.biovera.app` nije konfigurisan u Railway-u ili DNS propagacija nije završena.

---

## ✅ Rešenje: Koristi Railway URL Privremeno

**Za sada koristi Railway URL** dok ne konfigurišeš custom domain:

### Korak 1: Ažuriraj `NEXT_PUBLIC_API_URL` u Vercel-u

1. **Vercel Dashboard** → Tvoj Projekat → Settings → Environment Variables
2. Pronađi `NEXT_PUBLIC_API_URL`
3. Klikni **Edit**
4. Promeni **Value** na Railway URL:
   ```
   https://biovera-production.up.railway.app
   ```
   (zameni sa stvarnim Railway backend URL-om ako je drugačiji)
5. Proveri da su svi **Environments** označeni:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. Klikni **Save**

---

### Korak 2: Redeploy Frontend

1. **Vercel Dashboard** → Tvoj Projekat → Deployments
2. Klikni **"..."** (tri tačke) pored najnovijeg deployment-a
3. Klikni **"Redeploy"**
4. Sačekaj da se build završi (1-2 minuta)

---

### Korak 3: Test Backend URL

**Proveri da li backend radi na Railway URL-u:**

1. Otvori browser
2. Idi na: `https://biovera-production.up.railway.app/health`
   (ili tvoj Railway backend URL)
3. Trebalo bi da vidiš: `{"status":"healthy"}` ✅

**Ako vidiš "Not Found" ili grešku:**
- Proveri Railway logs
- Proveri da li je backend aktivan

---

### Korak 4: Test Contact Form

**Nakon redeploy-a:**

1. Otvori: `https://biovera.app/contact`
2. Popuni contact form
3. Klikni "Send Message"
4. Trebalo bi da se poruka pošalje ✅

---

## 🔧 Opciono: Konfiguriši `api.biovera.app` Custom Domain

**Ako želiš da koristiš custom domain `api.biovera.app`:**

### Korak 1: Dodaj Custom Domain u Railway

1. **Railway Dashboard** → Tvoj Backend Service → Settings → Networking
2. Klikni **"Add Custom Domain"** ili **"Generate Domain"**
3. Unesi: `api.biovera.app`
4. Klikni **"Add"** ili **"Save"**

### Korak 2: Railway će ti dati DNS zapise

Railway će ti dati **CNAME zapis** koji treba da dodaš u Vercel DNS:

**Primer:**
```
Type: CNAME
Name: api
Value: cname.railway.app (ili nešto slično)
```

**Napomena**: Tačan CNAME zapis zavisi od Railway konfiguracije. Railway će ti dati tačan zapis!

### Korak 3: Dodaj CNAME Zapis u Vercel DNS

1. **Vercel Dashboard** → Settings → Domains → `biovera.app` → DNS Records
2. Klikni **"Add Record"**
3. Popuni:
   - **Type**: `CNAME`
   - **Name**: `api`
   - **Value**: Kopiraj iz Railway
   - **TTL**: `60` (ili `Auto`)
4. Klikni **"Save"**

### Korak 4: Sačekaj DNS Propagaciju

1. **Sačekaj 10-30 minuta** (DNS propagacija)
2. **Proveri online**: https://dnschecker.org
   - Unesi: `api.biovera.app`
   - Trebalo bi da vidiš CNAME zapis
3. **Proveri u Railway**: Status bi trebalo da se promeni na "Active"

### Korak 5: Ažuriraj `NEXT_PUBLIC_API_URL` (Kada DNS Propagira)

1. **Vercel Dashboard** → Settings → Environment Variables
2. Ažuriraj `NEXT_PUBLIC_API_URL` na:
   ```
   https://api.biovera.app
   ```
3. Redeploy frontend

---

## ✅ Preporuka

**Za sada:**
- ✅ Koristi Railway URL: `https://biovera-production.up.railway.app`
- ✅ To je potpuno OK i radi normalno!
- ✅ Ne moraš imati custom domain za API

**Kasnije (opciono):**
- Možeš konfigurisati `api.biovera.app` custom domain
- Ali to nije obavezno - Railway URL radi jednako dobro!

---

## 📋 Checklist

- [ ] `NEXT_PUBLIC_API_URL` ažuriran u Vercel na Railway URL
- [ ] Frontend redeploy-ovan na Vercel-u
- [ ] Backend testiran na Railway URL (`/health` endpoint)
- [ ] Contact form testiran
- [ ] (Opciono) Custom domain `api.biovera.app` konfigurisan

---

## 💡 Rezime

**Problem**: `api.biovera.app` ne radi (custom domain nije konfigurisan)

**Rešenje**: Koristi Railway URL privremeno:
```
NEXT_PUBLIC_API_URL=https://biovera-production.up.railway.app
```

**Ovo je potpuno OK i radi normalno!** Custom domain nije obavezan.
