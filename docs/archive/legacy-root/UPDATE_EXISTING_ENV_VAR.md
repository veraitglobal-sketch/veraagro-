# 🔧 Ažuriranje Postojeće Environment Variable

## ✅ Varijabla već postoji

`NEXT_PUBLIC_API_URL` već postoji u Vercel-u. Treba da proveriš i ažuriraš njen **Value**.

---

## 🔍 Korak 1: Proveri Trenutnu Vrednost

### 1.1. Otvori Vercel Dashboard

1. Idi na: https://vercel.com/dashboard
2. Klikni na tvoj projekat

### 1.2. Otvori Environment Variables

1. Klikni na **Settings** (u gornjem meniju)
2. U levom sidebar-u, klikni na **Environment Variables**

### 1.3. Pronađi `NEXT_PUBLIC_API_URL`

1. Pronađi `NEXT_PUBLIC_API_URL` u listi
2. Proveri trenutnu **Value**

**Moguće vrednosti:**
- ❌ `http://localhost:3004` → Pogrešno (lokalni URL)
- ❌ `http://localhost:3000` → Pogrešno (lokalni URL)
- ❌ `https://api.biovera.app` → Možda još nije propagiran DNS
- ✅ `https://biovera-production.up.railway.app` → Tačno!

---

## 🔧 Korak 2: Ažuriraj Vrednost

### Ako je vrednost pogrešna:

1. Klikni na **Edit** (ikonica olovke) pored `NEXT_PUBLIC_API_URL`
2. Promeni **Value** na:
   ```
   https://biovera-production.up.railway.app
   ```
3. Proveri da su svi **Environments** označeni:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Klikni **Save**

### Ako je vrednost već tačna:

- ✅ Ne treba ništa menjati
- Problem može biti u redeploy-u ili cache-u

---

## 🔄 Korak 3: Redeploy Frontend

**VAŽNO**: Nakon promene environment variable, **moraš redeploy-ovati** frontend!

### Opcija A: Automatski Redeploy

1. Vercel automatski redeploy-uje nakon promene env var
2. Sačekaj 1-2 minuta
3. Proveri da li je novi deployment kreiran

### Opcija B: Ručni Redeploy

1. Idi na **Deployments** tab
2. Klikni na **...** (tri tačke) pored najnovijeg deployment-a
3. Klikni **Redeploy**
4. Sačekaj da se build završi (obično 1-2 minuta)

---

## 🧪 Korak 4: Test

### Test 1: Proveri Environment Variable

1. Otvori sajt (npr. `https://bio-vera.vercel.app`)
2. Otvori browser Developer Tools (F12)
3. Idi na **Console** tab**
4. Unesi:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_API_URL)
   ```
5. **Trebalo bi da vidiš**: `https://biovera-production.up.railway.app`

**Ako vidiš `undefined` ili `http://localhost:3004`:**
- ❌ Environment variable nije ažuriran ili redeploy nije završen
- Proveri Vercel Settings ponovo
- Sačekaj još 1-2 minuta i pokušaj ponovo

---

### Test 2: Testiraj Download

1. Otvori stranicu sa prospektima (npr. `/growers`)
2. Klikni na "Download Prospect PDF"
3. **Trebalo bi da se PDF automatski skida** ✅

**Ako i dalje vidiš "Network Error":**
- Proveri Network tab (F12 → Network)
- Proveri da li se zahtev šalje na pravi URL
- Proveri da li je redeploy završen

---

## 🔍 Debug: Network Tab

1. Otvori browser Developer Tools (F12)
2. Idi na **Network** tab
3. Klikni na "Download Prospect PDF"
4. Pronađi zahtev ka `/growers/prospect/download`
5. Klikni na zahtev
6. Proveri **Request URL**:

**Trebalo bi:**
```
https://biovera-production.up.railway.app/growers/prospect/download
```

**Ako vidiš:**
```
http://localhost:3004/growers/prospect/download
```
→ ❌ Environment variable nije ažuriran ili redeploy nije završen

---

## 🆘 Ako i dalje ne radi

### Problem 1: Environment variable se ne ažurira

**Rešenje:**
1. **Obriši** postojeću varijablu:
   - Klikni na **Delete** (ikonica kante) pored `NEXT_PUBLIC_API_URL`
   - Potvrdi brisanje
2. **Dodaj ponovo**:
   - Klikni **Add New**
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://biovera-production.up.railway.app`
   - Environments: Production, Preview, Development
   - Save
3. **Redeploy** frontend

---

### Problem 2: Redeploy ne primenjuje promene

**Rešenje:**
1. **Clear Build Cache**:
   - Vercel Dashboard → Settings → General
   - Scroll down do "Build & Development Settings"
   - Klikni "Clear Build Cache"
2. **Redeploy** frontend ponovo

---

### Problem 3: Browser Cache

**Rešenje:**
1. **Hard Refresh**:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. Ili **Clear Browser Cache**:
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Settings → Privacy → Clear Data

---

## 📋 Checklist

- [ ] Proverio trenutnu vrednost `NEXT_PUBLIC_API_URL` u Vercel
- [ ] Ažurirao vrednost na `https://biovera-production.up.railway.app` (ako je pogrešna)
- [ ] Redeploy-ovao frontend
- [ ] Sačekao 1-2 minuta za redeploy
- [ ] Testirao u browser console (`console.log(process.env.NEXT_PUBLIC_API_URL)`)
- [ ] Testirao download prospekta
- [ ] Proverio Network tab da li se zahtev šalje na pravi URL

---

## ✅ Finalna Provera

Nakon što sve uradiš:

1. **Browser Console** → Trebalo bi da vidiš: `https://biovera-production.up.railway.app`
2. **Network Tab** → Request URL trebalo bi da bude: `https://biovera-production.up.railway.app/...`
3. **Download** → PDF bi trebalo da se automatski skida ✅

Ako sve ovo radi, problem je rešen! 🎉
