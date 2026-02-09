# 🔍 Provera i Konfiguracija `api.biovera.app` Custom Domain

## ❓ Da li je `api.biovera.app` Konfigurisan?

Hajde da proverimo!

---

## 🔍 Korak 1: Proveri Railway Custom Domain

### 1.1. Otvori Railway Dashboard

1. Idi na: https://railway.app/dashboard
2. Klikni na tvoj backend service (ne PostgreSQL!)

### 1.2. Otvori Settings → Networking

1. Klikni na **Settings** tab
2. Scroll do **"Networking"** sekcije
3. Proveri da li vidiš **"Custom Domains"** ili **"Domains"**

### 1.3. Proveri da li Postoji `api.biovera.app`

**Ako vidiš `api.biovera.app`:**
- ✅ Custom domain je dodat!
- Proveri status:
  - **"Active"** → DNS propagacija završena, radi! ✅
  - **"Waiting for DNS update"** → DNS propagacija u toku, sačekaj ⏳
  - **"Failed"** → Problem sa DNS-om ❌

**Ako NE vidiš `api.biovera.app`:**
- ❌ Custom domain nije dodat
- Treba da ga dodaš (vidi Korak 2)

---

## 🔧 Korak 2: Dodaj `api.biovera.app` Custom Domain (Ako Nije Dodat)

### 2.1. U Railway Dashboard

1. **Settings** → **Networking** → **Custom Domains**
2. Klikni **"Add Custom Domain"** ili **"Generate Domain"**
3. Unesi: `api.biovera.app`
4. Klikni **"Add"** ili **"Save"**

### 2.2. Railway će ti dati DNS zapise

Railway će ti dati **CNAME zapis** koji treba da dodaš u Vercel DNS:

**Primer:**
```
Type: CNAME
Name: api
Value: cname.railway.app (ili nešto slično)
```

**Napomena**: Tačan CNAME zapis zavisi od Railway konfiguracije. Railway će ti dati tačan zapis!

---

## 🔧 Korak 3: Dodaj CNAME Zapis u Vercel DNS

### 3.1. Otvori Vercel DNS Records

1. **Vercel Dashboard** → Settings → Domains → `biovera.app` → DNS Records

### 3.2. Dodaj CNAME Zapis

1. Klikni **"Add Record"**
2. Popuni:
   - **Type**: `CNAME`
   - **Name**: `api`
   - **Value**: Kopiraj iz Railway (obično: `cname.railway.app` ili slično)
   - **TTL**: `60` (ili `Auto`)
3. Klikni **"Save"**

---

## 🔍 Korak 4: Proveri DNS Propagaciju

### 4.1. Sačekaj 10-30 minuta

DNS propagacija može potrajati 10-30 minuta.

### 4.2. Proveri Online

1. Idi na: https://dnschecker.org
2. Unesi: `api.biovera.app`
3. Klikni "Search"
4. Trebalo bi da vidiš CNAME zapis koji si dodao

### 4.3. Proveri u Railway

1. **Railway Dashboard** → Backend Service → Settings → Networking
2. Proveri status `api.biovera.app`:
   - **"Active"** → DNS propagacija završena! ✅
   - **"Waiting for DNS update"** → Sačekaj još ⏳

---

## 🧪 Korak 5: Test `api.biovera.app`

### 5.1. Test Health Endpoint

1. Otvori browser
2. Idi na: `https://api.biovera.app/health`
3. Trebalo bi da vidiš: `{"status":"healthy"}` ✅

**Ako vidiš "Not Found" ili grešku:**
- DNS propagacija još nije završena
- Sačekaj 30-60 minuta
- Proveri ponovo

---

## 🔧 Korak 6: Ažuriraj `NEXT_PUBLIC_API_URL` (Kada DNS Propagira)

### 6.1. Kada je Status "Active" u Railway

1. **Vercel Dashboard** → Settings → Environment Variables
2. Pronađi `NEXT_PUBLIC_API_URL`
3. Klikni **Edit**
4. Promeni **Value** na:
   ```
   https://api.biovera.app
   ```
5. Proveri da su svi **Environments** označeni:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. Klikni **Save**

### 6.2. Redeploy Frontend

1. **Vercel Dashboard** → Deployments
2. Klikni **"..."** (tri tačke) pored najnovijeg deployment-a
3. Klikni **"Redeploy"**
4. Sačekaj da se build završi

---

## ✅ Checklist

- [ ] Proverio Railway Dashboard → Backend Service → Settings → Networking
- [ ] Proverio da li postoji `api.biovera.app` custom domain
- [ ] (Ako nije) Dodao `api.biovera.app` custom domain u Railway
- [ ] Dodao CNAME zapis u Vercel DNS Records
- [ ] Sačekao 10-30 minuta (DNS propagacija)
- [ ] Proverio DNS propagaciju online (dnschecker.org)
- [ ] Proverio status u Railway (trebalo bi da bude "Active")
- [ ] Testirao `https://api.biovera.app/health`
- [ ] Ažurirao `NEXT_PUBLIC_API_URL` u Vercel na `https://api.biovera.app`
- [ ] Redeploy-ovao frontend

---

## 💡 Preporuka

**Ako `api.biovera.app` još nije konfigurisan:**

1. **Privremeno koristi Railway URL:**
   ```
   NEXT_PUBLIC_API_URL=https://biovera-production.up.railway.app
   ```
   - To je potpuno OK i radi normalno!
   - Ne moraš imati custom domain za API

2. **Ako želiš custom domain:**
   - Dodaj `api.biovera.app` u Railway
   - Dodaj CNAME zapis u Vercel DNS
   - Sačekaj DNS propagaciju
   - Ažuriraj `NEXT_PUBLIC_API_URL`

---

## 🆘 Ako Imaš Problema

### Problem 1: Railway Ne Daje CNAME Zapis

**Rešenje:**
- Proveri Railway dokumentaciju
- Ili kontaktiraj Railway support

### Problem 2: DNS Propagacija Ne Završava

**Rešenje:**
- Sačekaj 24-48 sati (maksimalno)
- Proveri da li je CNAME zapis tačan u Vercel DNS
- Proveri da li su nameserver-i na Vercel-u

### Problem 3: `api.biovera.app` Ne Radi

**Rešenje:**
- Proveri Railway logs
- Proveri da li je backend aktivan
- Proveri da li je CNAME zapis tačan

---

## 📋 Rezime

**Trenutno možeš koristiti:**
- ✅ Railway URL: `https://biovera-production.up.railway.app` (radi sada!)
- ⏳ Custom domain: `https://api.biovera.app` (ako želiš, ali nije obavezno)

**Preporuka**: Koristi Railway URL dok ne konfigurišeš custom domain. Oba rade jednako dobro!
