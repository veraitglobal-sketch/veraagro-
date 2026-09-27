# ⚠️ API URL Protocol Fix

## ❌ Problem

Uklonio si `https://` iz `NEXT_PUBLIC_API_URL`. To je **greška** - URL mora imati protokol!

**Bez protokola:**
```
biovera-production.up.railway.app
```

**Sa protokolom (ISPRAVNO):**
```
https://biovera-production.up.railway.app
```

---

## ✅ Rešenje: Dodaj `https://` Nazad

### Korak 1: Ažuriraj `NEXT_PUBLIC_API_URL` u Vercel-u

1. **Vercel Dashboard** → Tvoj Projekat (`bio-vera`)
2. **Settings** → **Environment Variables**
3. Pronađi `NEXT_PUBLIC_API_URL`
4. Klikni **Edit**

### Korak 2: Dodaj `https://` u Value

1. **Value** polje
2. Promeni sa:
   ```
   biovera-production.up.railway.app
   ```
   Na:
   ```
   https://biovera-production.up.railway.app
   ```
3. **Proveri da su svi Environments označeni:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Save**

**VAŽNO**: Nakon promene env var, **moraš redeploy-ovati** frontend!

---

## 🔧 Korak 3: Redeploy Frontend

1. **Vercel Dashboard** → Tvoj Projekat → **Deployments** tab
2. Klikni **"..."** (tri tačke) pored najnovijeg deployment-a
3. Klikni **"Redeploy"**
4. **Proveri da je Environment**: **Production**
5. Sačekaj da se build završi (1-2 minuta)

---

## 🔍 Korak 4: Test

### A) Test Login na Custom Domain

1. Otvori: `https://www.biovera.app/login`
2. **Hard refresh** u browser-u:
   - **Mac**: `Cmd + Shift + R`
   - **Windows**: `Ctrl + Shift + R`
3. Otvori Browser Console (F12) → **Network** tab
4. Pokušaj da se uloguješ:
   - Partner Code: `ADMIN001`
   - Password: `test123`
5. Proveri Network tab:
   - **Request URL**: Trebalo bi da bude `https://biovera-production.up.railway.app/auth/login`
   - **Status**: Trebalo bi da bude `200 OK`

---

## 🚨 Zašto `https://` je Obavezno?

**Bez protokola:**
- Browser ne zna da li je HTTP ili HTTPS
- Frontend neće moći da se poveže sa backend-om
- Dobijaš "Network Error" ili "Failed to fetch"

**Sa `https://`:**
- Browser zna da koristi HTTPS protokol
- Frontend može da se poveže sa backend-om
- SSL sertifikat je validan

---

## ✅ Checklist

- [ ] `NEXT_PUBLIC_API_URL` ažuriran sa `https://` prefiksom
- [ ] Production environment označen
- [ ] Frontend redeploy-ovan na Vercel-u
- [ ] Hard refresh uradjen u browser-u
- [ ] Login testiran na custom domain (`www.biovera.app/login`)
- [ ] Network tab proveren (Request URL, Status)

---

## 📝 Javi mi

1. **Da li si dodao `https://` nazad u `NEXT_PUBLIC_API_URL`?**
2. **Da li si redeploy-ovao frontend?**
3. **Da li login sada radi na `www.biovera.app/login`?**
4. **Šta vidiš u Browser Network tab?** (Request URL, Status)

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Backend Health**: https://biovera-production.up.railway.app/health
- **Login (Custom)**: https://www.biovera.app/login
