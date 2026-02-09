# 🔧 Rešavanje "Network Error" za Prospect Download

## ❌ Problem

**Greška**: `AxiosError: Network Error`

**Uzrok**: Frontend ne može da se poveže sa backend-om jer `NEXT_PUBLIC_API_URL` nije postavljen u Vercel.

---

## ✅ Rešenje: Dodaj `NEXT_PUBLIC_API_URL` u Vercel

### Korak 1: Otvori Vercel Dashboard

1. Idi na: https://vercel.com/dashboard
2. Klikni na tvoj projekat (bio-vera ili kako se zove)

### Korak 2: Otvori Environment Variables

1. U projektu, klikni na **Settings** (u gornjem meniju)
2. U levom sidebar-u, klikni na **Environment Variables**

### Korak 3: Dodaj `NEXT_PUBLIC_API_URL`

1. Klikni **"Add New"** (ili **"Add"**)
2. Popuni:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://biovera-production.up.railway.app`
   - **Environments**: Označi sve:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Klikni **Save**

### Korak 4: Redeploy Frontend

1. Idi na **Deployments** tab
2. Klikni na **...** (tri tačke) pored najnovijeg deployment-a
3. Klikni **Redeploy**
4. Sačekaj da se build završi (obično 1-2 minuta)

---

## 🧪 Test

Nakon redeploy-a:

1. **Otvori sajt** (npr. `https://bio-vera.vercel.app`)
2. **Otvori browser Developer Tools** (F12)
3. **Idi na Console tab**
4. **Unesi**:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_API_URL)
   ```
5. **Trebalo bi da vidiš**: `https://biovera-production.up.railway.app`

**Ako vidiš `undefined` ili `http://localhost:3004`:**
- ❌ Environment variable nije postavljen
- Proveri Vercel Settings → Environment Variables ponovo

---

## ✅ Provera da li radi

1. **Otvori stranicu sa prospektima** (npr. `/growers`, `/suppliers`, `/logistics-partner`)
2. **Klikni na "Download Prospect PDF"**
3. **Trebalo bi da se PDF automatski skida** ✅

**Ako i dalje vidiš "Network Error":**
- Proveri da li je redeploy završen
- Proveri browser console za detaljne greške
- Proveri Network tab da li se zahtev šalje na pravi URL

---

## 🔍 Debug

### Proveri Network Tab

1. Otvori browser Developer Tools (F12)
2. Idi na **Network** tab
3. Klikni na "Download Prospect PDF"
4. Pronađi zahtev ka `/growers/prospect/download` (ili `/suppliers/prospect/download`)
5. Proveri **Request URL**:
   - ✅ Trebalo bi: `https://biovera-production.up.railway.app/growers/prospect/download`
   - ❌ Ako vidiš: `http://localhost:3004/growers/prospect/download` → Environment variable nije postavljen

### Proveri da li Backend radi

Otvori novi tab i idi na:
```
https://biovera-production.up.railway.app/health
```

Trebalo bi da vidiš: `{"status":"healthy","timestamp":"..."}`

---

## 📋 Checklist

- [ ] `NEXT_PUBLIC_API_URL` dodat u Vercel Environment Variables
- [ ] Value postavljen na `https://biovera-production.up.railway.app`
- [ ] Svi Environments označeni (Production, Preview, Development)
- [ ] Frontend redeploy-ovan
- [ ] Testirao download prospekta
- [ ] Proverio browser console (nema "Network Error")
- [ ] Proverio Network tab (zahtev ide na pravi URL)

---

## 🆘 Ako i dalje ne radi

1. **Proveri Vercel logs**:
   - Vercel Dashboard → Deployments → Latest → View Function Logs
   - Proveri da li ima grešaka

2. **Proveri Railway logs**:
   - Railway Dashboard → BioVera service → Deployments → Latest → View Logs
   - Proveri da li backend prima zahteve

3. **Proveri CORS**:
   - Backend već ima CORS konfigurisan
   - Ako i dalje ima problema, proveri `FRONTEND_URL` u Railway environment variables

4. **Kontaktiraj support**:
   - Pošalji screenshot sa browser console
   - Pošalji screenshot sa Network tab
   - Pošalji Vercel i Railway logs
