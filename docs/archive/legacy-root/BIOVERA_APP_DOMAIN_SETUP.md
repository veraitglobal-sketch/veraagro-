# 🎉 Ažuriranje Environment Variables za `biovera.app`

## ✅ Status

**Domen `biovera.app` je prihvaćen i radi!** 🎉

Sada treba da ažuriraš environment variables u Vercel i Railway.

---

## 🔧 Korak 1: Ažuriraj Vercel Environment Variables

### 1.1. Otvori Vercel Dashboard

1. Idi na: https://vercel.com/dashboard
2. Klikni na tvoj projekat (bio-vera)

### 1.2. Otvori Settings → Environment Variables

1. Klikni na **Settings** (u gornjem meniju)
2. U levom sidebar-u, klikni na **Environment Variables**

### 1.3. Ažuriraj `NEXT_PUBLIC_SITE_URL`

1. Pronađi `NEXT_PUBLIC_SITE_URL` u listi
2. Klikni na **Edit** (ili **Add** ako ne postoji)
3. Promeni **Value** na:
   ```
   https://biovera.app
   ```
4. Proveri da su svi **Environments** označeni:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Klikni **Save**

### 1.4. Proveri `NEXT_PUBLIC_API_URL`

1. Pronađi `NEXT_PUBLIC_API_URL` u listi
2. Proveri da li je vrednost tačna (Railway backend URL)
3. Ako nije tačna, ažuriraj:
   ```
   https://biovera-production.up.railway.app
   ```
   (ili tvoj Railway backend URL)

**Napomena**: Ako imaš custom domain za API (`api.biovera.app`), možeš koristiti i to:
```
https://api.biovera.app
```

---

## 🔧 Korak 2: Ažuriraj Railway Environment Variables

### 2.1. Otvori Railway Dashboard

1. Idi na: https://railway.app/dashboard
2. Klikni na tvoj backend service (ne PostgreSQL!)

### 2.2. Otvori Settings → Variables

1. Klikni na **Settings** tab
2. Scroll do **Variables** sekcije

### 2.3. Ažuriraj `FRONTEND_URL`

1. Pronađi `FRONTEND_URL` u listi
2. Klikni na **Edit** (ili **Add** ako ne postoji)
3. Promeni **Value** na:
   ```
   https://biovera.app
   ```
4. Klikni **Save**

**Napomena**: Railway će automatski redeploy-ovati backend nakon promene environment variable.

---

## 🔄 Korak 3: Redeploy Frontend na Vercel

**VAŽNO**: Nakon promene environment variables, redeploy-uj frontend!

1. **Vercel Dashboard** → Tvoj Projekat → **Deployments** tab
2. Klikni na **"..."** (tri tačke) pored najnovijeg deployment-a
3. Klikni **"Redeploy"**
4. Sačekaj da se build završi (obično 1-2 minuta)

---

## 🧪 Korak 4: Test

### Test 1: Proveri da li Sajt Radi

1. Otvori: `https://biovera.app`
2. Trebalo bi da vidiš sajt ✅

### Test 2: Proveri Contact Form

1. Otvori: `https://biovera.app/contact`
2. Popuni contact form
3. Klikni "Send Message"
4. Trebalo bi da se poruka pošalje ✅

### Test 3: Proveri Login

1. Otvori: `https://biovera.app/login`
2. Unesi:
   - **Partner Code**: `FARMER001`
   - **Password**: `test123`
3. Klikni **Login**
4. Trebalo bi da se uspešno uloguješ ✅

---

## 📋 Finalna Konfiguracija

### Vercel Environment Variables:

```
NEXT_PUBLIC_SITE_URL=https://biovera.app
NEXT_PUBLIC_API_URL=https://biovera-production.up.railway.app
```

**Ili ako imaš custom domain za API:**
```
NEXT_PUBLIC_SITE_URL=https://biovera.app
NEXT_PUBLIC_API_URL=https://api.biovera.app
```

### Railway Environment Variables:

```
FRONTEND_URL=https://biovera.app
```

---

## ✅ Checklist

- [ ] `NEXT_PUBLIC_SITE_URL` ažuriran u Vercel na `https://biovera.app`
- [ ] `NEXT_PUBLIC_API_URL` proveren/ažuriran u Vercel
- [ ] `FRONTEND_URL` ažuriran u Railway na `https://biovera.app`
- [ ] Frontend redeploy-ovan na Vercel
- [ ] Backend automatski redeploy-ovan na Railway (nakon promene env var)
- [ ] Sajt testiran na `https://biovera.app`
- [ ] Contact form testiran
- [ ] Login testiran

---

## 🎯 Rezultat

**Nakon ovih promena:**
- ✅ Sajt će raditi na `https://biovera.app`
- ✅ Emailovi će se slati sa `info@biovera.app`
- ✅ Backend će znati da frontend URL je `https://biovera.app`
- ✅ SEO meta tags će koristiti `https://biovera.app`

---

## 💡 Napomena

**Ako imaš custom domain za API (`api.biovera.app`):**
- Možeš koristiti `https://api.biovera.app` umesto Railway URL-a
- Ali prvo proveri da li DNS propagacija za `api.biovera.app` je završena
- Testiraj: `https://api.biovera.app/health`

**Ako nemaš custom domain za API:**
- Koristi Railway URL: `https://biovera-production.up.railway.app`
- To je potpuno OK i radi normalno!
