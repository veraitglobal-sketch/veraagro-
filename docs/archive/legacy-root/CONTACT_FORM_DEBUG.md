# 🔍 Contact Form Debug Guide

## Problem
Contact form ne radi na `https://www.biovera.app/contact`

---

## 🔍 Korak 1: Proveri Browser Console

1. **Otvori**: `https://www.biovera.app/contact`
2. **Otvori Browser Developer Tools** (F12 ili Cmd+Option+I)
3. **Idi na Console tab**
4. **Pokušaj da pošalješ contact form**
5. **Proveri greške u Console**

**Šta tražiti:**
- `Network Error` → Frontend ne može da se poveže sa backend-om
- `400 Bad Request` → Backend odbija zahtev (validation error)
- `500 Internal Server Error` → Backend greška
- `CORS error` → CORS problem

---

## 🔍 Korak 2: Proveri Network Tab

1. **Otvori Browser Developer Tools** (F12)
2. **Idi na Network tab**
3. **Očisti network log** (ikonica 🚫)
4. **Pokušaj da pošalješ contact form**
5. **Pronađi zahtev za `/contact/submit`**

**Proveri:**

### A) Request URL
- ✅ **Trebalo bi**: `https://biovera-production.up.railway.app/contact/submit`
- ❌ **Ako vidiš**: `http://localhost:3004/contact/submit` → `NEXT_PUBLIC_API_URL` nije postavljen u Vercel-u

### B) Request Status
- ✅ **200 OK** → Zahtev uspešan
- ❌ **400 Bad Request** → Validation error (proveri Request Payload)
- ❌ **500 Internal Server Error** → Backend greška
- ❌ **Network Error** / **Failed to fetch** → Frontend ne može da se poveže

### C) Request Payload
Klikni na zahtev → **Payload** tab → Proveri da li se šalje:
```json
{
  "name": "Test",
  "email": "test@example.com",
  "subject": "technical",
  "message": "Test message",
  "phone": ""
}
```

---

## 🔧 Korak 3: Proveri `NEXT_PUBLIC_API_URL` u Vercel-u

### A) Otvori Vercel Dashboard
1. Idi na: https://vercel.com/dashboard
2. Klikni na tvoj projekat (`bio-vera`)

### B) Proveri Environment Variables
1. **Settings** → **Environment Variables**
2. Pronađi `NEXT_PUBLIC_API_URL`
3. **Proveri Value**:
   - ✅ **Trebalo bi**: `https://biovera-production.up.railway.app`
   - ❌ **Ako je**: `http://localhost:3004` ili prazno → **TO JE PROBLEM!**

### C) Ažuriraj `NEXT_PUBLIC_API_URL` (ako je potrebno)
1. Klikni **Edit** pored `NEXT_PUBLIC_API_URL`
2. Promeni **Value** na: `https://biovera-production.up.railway.app`
3. Označi sve **Environments**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Save**

### D) Redeploy Frontend
**VAŽNO**: Nakon promene env var, **moraš redeploy-ovati**!

1. **Deployments** tab
2. Klikni **"..."** pored najnovijeg deployment-a
3. Klikni **"Redeploy"**
4. Sačekaj da se build završi (1-2 minuta)

---

## 🔧 Korak 4: Test Backend Endpoint Direktno

### A) Test sa `curl` (Terminal)
```bash
curl -X POST https://biovera-production.up.railway.app/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "subject": "technical",
    "message": "Test message"
  }'
```

**Očekivani odgovor:**
```json
{
  "success": true,
  "message": "Contact inquiry submitted successfully"
}
```

**Ako dobiješ grešku:**
- `400 Bad Request` → Validation error (proveri payload)
- `500 Internal Server Error` → Backend greška (proveri Railway logs)
- `Connection refused` → Backend nije dostupan

### B) Test u Browser-u
1. Otvori: `https://biovera-production.up.railway.app/health`
2. Trebalo bi da vidiš: `{"status":"healthy","timestamp":"..."}`

---

## 🔧 Korak 5: Proveri Railway Backend Logs

1. **Railway Dashboard** → Tvoj Backend Service
2. **Deployments** → Klikni na najnoviji deployment
3. **View Logs**
4. **Proveri greške**:
   - `JWT_SECRET` missing → Dodaj `JWT_SECRET` env var
   - `DATABASE_URL` invalid → Proveri database connection
   - `Prisma` errors → Proveri migrations

---

## 🔧 Korak 6: Proveri CORS Settings

Backend CORS je konfigurisan u `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000',
    // ... other origins
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Proveri:**
- Da li je `FRONTEND_URL` postavljen u Railway?
- Trebalo bi da bude: `https://www.biovera.app` ili `https://biovera.app`

---

## ✅ Checklist

- [ ] Browser Console proveren (greške?)
- [ ] Network tab proveren (Request URL tačan?)
- [ ] `NEXT_PUBLIC_API_URL` proveren u Vercel-u
- [ ] `NEXT_PUBLIC_API_URL` ažuriran na Railway URL
- [ ] Frontend redeploy-ovan na Vercel-u
- [ ] Backend endpoint testiran direktno (`curl`)
- [ ] Backend health check radi (`/health`)
- [ ] Railway logs provereni (greške?)
- [ ] CORS settings provereni (`FRONTEND_URL` u Railway?)

---

## 🚨 Najčešći Problemi

### Problem 1: "Network Error"
**Uzrok**: `NEXT_PUBLIC_API_URL` nije postavljen ili je pogrešan
**Rešenje**: 
1. Proveri `NEXT_PUBLIC_API_URL` u Vercel-u
2. Ažuriraj na `https://biovera-production.up.railway.app`
3. Redeploy frontend

### Problem 2: "400 Bad Request"
**Uzrok**: Validation error (npr. email format, missing fields)
**Rešenje**: 
1. Proveri Request Payload u Network tab
2. Proveri da li su sva polja popunjena
3. Proveri email format

### Problem 3: "CORS Error"
**Uzrok**: `FRONTEND_URL` nije postavljen u Railway
**Rešenje**: 
1. Dodaj `FRONTEND_URL=https://www.biovera.app` u Railway env vars
2. Restart backend service

### Problem 4: "500 Internal Server Error"
**Uzrok**: Backend greška (npr. email service, database)
**Rešenje**: 
1. Proveri Railway logs
2. Proveri da li su svi env vars postavljeni (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc.)

---

## 📝 Javi mi

1. **Šta vidiš u Browser Console?** (kopiraj grešku)
2. **Šta vidiš u Network tab?** (Request URL, Status, Payload)
3. **Šta je trenutna vrednost `NEXT_PUBLIC_API_URL` u Vercel-u?**
4. **Da li si redeploy-ovao frontend?**
5. **Da li backend endpoint radi direktno?** (`curl` test)

---

## 🔗 Korisni Linkovi

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Backend Health Check**: https://biovera-production.up.railway.app/health
- **Contact Form**: https://www.biovera.app/contact
