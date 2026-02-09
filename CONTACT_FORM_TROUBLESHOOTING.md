# 🔧 Troubleshooting: Contact Form Ne Šalje Poruke

## ❌ Problem

**Contact form ne šalje poruke - dugme ostaje na "Sending..."**

---

## ✅ Checklist za Proveru

### 1. Proveri Browser Console

1. **Otvori Browser Developer Tools:**
   - Chrome: `F12` ili `Cmd+Option+I` (Mac)
   - Idi na **"Console"** tab

2. **Proveri da li ima grešaka:**
   - Ako vidiš `AxiosError: Request failed with status code 400` → Backend validation error
   - Ako vidiš `Network Error` → Backend nije dostupan ili `NEXT_PUBLIC_API_URL` nije tačan
   - Ako vidiš `CORS error` → Backend CORS nije konfigurisan

3. **Javi mi šta vidiš u Console!**

---

### 2. Proveri Backend Status

**Backend mora biti redeploy-ovan sa novim promenama!**

1. **Railway Dashboard** → Tvoj Backend Service
2. Proveri **"Deployments"** tab
3. Proveri da li je poslednji deployment uspešan
4. Proveri da li je poslednji deployment posle push-a na GitHub

**Ako backend NIJE redeploy-ovan:**
- Railway bi trebalo automatski da redeploy-uje kada push-uješ na GitHub
- Ako ne, klikni **"Redeploy"** u Railway dashboard-u

---

### 3. Proveri Backend URL

**Proveri da li je `NEXT_PUBLIC_API_URL` tačno postavljen u Vercel:**

1. **Vercel Dashboard** → Tvoj Projekat → Settings → Environment Variables
2. Proveri da li postoji `NEXT_PUBLIC_API_URL`
3. Proveri da li je vrednost tačna (Railway backend URL)

**Primer:**
```
NEXT_PUBLIC_API_URL=https://biovera-production.up.railway.app
```

**Ako nije postavljen ili je pogrešan:**
- Dodaj/ispravi `NEXT_PUBLIC_API_URL` u Vercel
- Redeploy frontend na Vercel

---

### 4. Test Backend Endpoint

**Proveri da li backend endpoint radi:**

1. **Otvori browser**
2. Idi na: `https://your-backend-url.railway.app/health`
   (ili samo `https://your-backend-url.railway.app`)
3. Trebalo bi da vidiš neki response

**Ako backend ne radi:**
- Proveri Railway logs
- Proveri da li je backend uspešno deploy-ovan

---

### 5. Proveri Backend Logs

**Proveri Railway logs za greške:**

1. **Railway Dashboard** → Tvoj Backend Service → **"Logs"** tab
2. Proveri da li ima grešaka kada pokušaš da pošalješ poruku
3. Proveri da li backend prima zahtev

**Ako vidiš greške:**
- Javi mi šta vidiš u logs

---

## 🔧 Rešenje: Korak po Korak

### Korak 1: Redeploy Backend na Railway

**Backend mora biti redeploy-ovan sa novim promenama (class-validator decorators)!**

1. **Railway Dashboard** → Tvoj Backend Service
2. Klikni **"Deployments"** tab
3. Proveri da li je poslednji deployment posle push-a na GitHub
4. Ako nije, klikni **"Redeploy"** ili **"Deploy"**

**Ili:**
- Push-uj ponovo na GitHub (možeš napraviti mali commit)
- Railway će automatski redeploy-ovati

---

### Korak 2: Proveri Vercel Environment Variables

1. **Vercel Dashboard** → Tvoj Projekat → Settings → Environment Variables
2. Proveri `NEXT_PUBLIC_API_URL`:
   - Da li postoji?
   - Da li je vrednost tačna (Railway backend URL)?

**Ako nije tačno:**
- Ažuriraj `NEXT_PUBLIC_API_URL` sa tačnim Railway backend URL-om
- Save
- Redeploy frontend na Vercel

---

### Korak 3: Redeploy Frontend na Vercel

**Nakon što ažuriraš environment variables:**

1. **Vercel Dashboard** → Tvoj Projekat
2. Klikni **"Deployments"** tab
3. Klikni **"Redeploy"** na poslednji deployment
4. Ili napravi mali commit i push na GitHub

---

### Korak 4: Test Contact Form

1. **Otvori sajt:** `https://bio-vera.vercel.app/contact`
2. **Otvori Browser Console** (`F12`)
3. **Popuni contact form**
4. **Klikni "Send Message"**
5. **Proveri Console** - da li ima grešaka?

---

## 🆘 Najčešći Problemi

### Problem 1: Backend Nije Redeploy-ovan

**Simptomi:**
- Contact form ostaje na "Sending..."
- Console pokazuje `400 error` ili `Network Error`

**Rešenje:**
- Redeploy backend na Railway
- Proveri Railway logs

---

### Problem 2: NEXT_PUBLIC_API_URL Nije Tačan

**Simptomi:**
- Contact form ostaje na "Sending..."
- Console pokazuje `Network Error`

**Rešenje:**
- Proveri `NEXT_PUBLIC_API_URL` u Vercel
- Ažuriraj sa tačnim Railway backend URL-om
- Redeploy frontend

---

### Problem 3: Backend Validation Error

**Simptomi:**
- Console pokazuje `400 error`
- Backend logs pokazuju validation error

**Rešenje:**
- Proveri da li su sva polja popunjena
- Proveri da li je email format tačan
- Proveri Railway logs za detalje

---

## ✅ Finalna Provera

- [ ] Backend redeploy-ovan na Railway (posle push-a na GitHub)
- [ ] `NEXT_PUBLIC_API_URL` tačno postavljen u Vercel
- [ ] Frontend redeploy-ovan na Vercel
- [ ] Browser Console proveren (nema grešaka)
- [ ] Backend logs provereni (backend prima zahtev)
- [ ] Contact form testiran

---

## 💡 Preporuka

**Sledeći koraci:**

1. **Redeploy backend na Railway** (ako nije automatski redeploy-ovan)
2. **Proveri `NEXT_PUBLIC_API_URL` u Vercel** (da li je tačan?)
3. **Redeploy frontend na Vercel** (ako si ažurirao environment variables)
4. **Test contact form** sa Browser Console otvorenim
5. **Javi mi šta vidiš u Console i Railway logs!**
