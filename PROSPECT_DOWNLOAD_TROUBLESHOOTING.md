# 🔧 Troubleshooting: Prospect Download Problem

## ❓ Problem: Ne možeš da skidaš prospekte

Prospekti su implementirani, ali download ne radi. Evo kako da rešiš problem:

---

## 🔍 Korak 1: Proveri Browser Console

1. Otvori browser (Chrome/Firefox)
2. Pritisni **F12** (ili **Cmd+Option+I** na Mac)
3. Idi na **Console** tab
4. Klikni na "Download Prospect PDF" dugme
5. Proveri da li ima grešaka

### Moguće greške:

#### A) `Network Error` ili `Failed to fetch`
**Problem**: Frontend ne može da pristupi backend-u

**Rešenje:**
1. Proveri da li je `NEXT_PUBLIC_API_URL` tačno postavljen u Vercel
2. Proveri da li je backend aktivan: `https://biovera-production.up.railway.app/health`
3. Proveri da li je backend URL tačan u `web/lib/api.ts`

#### B) `401 Unauthorized`
**Problem**: Backend zahteva autentifikaciju

**Rešenje:**
- Prospekti **ne treba** da zahtevaju autentifikaciju
- Proveri backend controller - endpoint treba da bude javan

#### C) `500 Internal Server Error`
**Problem**: Backend ima grešku pri generisanju PDF-a

**Rešenje:**
- Proveri Railway logs (Railway Dashboard → Deployments → View Logs)
- Možda nedostaje `pdfkit` dependency ili ima greška u PDF generisanju

#### D) `Invalid response format`
**Problem**: Backend ne vraća PDF kao blob

**Rešenje:**
- Proveri backend controller - treba da vraća PDF sa `Content-Type: application/pdf`

---

## 🔍 Korak 2: Proveri Network Tab

1. Otvori browser **Developer Tools** (F12)
2. Idi na **Network** tab
3. Klikni na "Download Prospect PDF" dugme
4. Pronađi zahtev ka `/growers/prospect/download` (ili `/suppliers/prospect/download`, `/logistics-partner/prospect/download`)
5. Klikni na zahtev i proveri:

### Response Status:
- **200 OK** → Backend radi, problem je u frontend-u
- **404 Not Found** → Endpoint ne postoji ili je pogrešan URL
- **500 Internal Server Error** → Backend ima grešku
- **CORS Error** → Backend ne dozvoljava zahteve sa frontend-a

### Response Headers:
- Trebalo bi da vidiš: `Content-Type: application/pdf`
- Trebalo bi da vidiš: `Content-Disposition: attachment; filename="..."`

### Response Body:
- Trebalo bi da bude **binary data** (PDF)
- Ako vidiš JSON sa greškom → backend vraća grešku umesto PDF-a

---

## 🔍 Korak 3: Proveri Backend Logs

### Railway Logs:

1. Idi na Railway Dashboard
2. Klikni na **BioVera** servis
3. Idi na **Deployments** tab
4. Klikni na najnoviji deployment
5. Klikni **"View Logs"**
6. Pokušaj da skineš prospekt ponovo
7. Proveri da li se pojavljuje greška u logs

### Moguće greške u logs:

#### A) `Cannot find module 'pdfkit'`
**Problem**: `pdfkit` nije instaliran u production

**Rešenje:**
1. Proveri `backend/package.json` - treba da ima `"pdfkit": "^0.14.0"`
2. Ako nema, dodaj:
   ```bash
   cd backend
   npm install pdfkit
   git add package.json package-lock.json
   git commit -m "fix: add pdfkit dependency"
   git push origin main
   ```

#### B) `Error generating prospect PDF: ...`
**Problem**: Greška pri generisanju PDF-a

**Rešenje:**
- Proveri backend service fajl (`growers.service.ts`, `suppliers.service.ts`, `logistics-partner.service.ts`)
- Možda nedostaje neki dependency ili ima greška u kodu

#### C) `ENOENT: no such file or directory`
**Problem**: Backend pokušava da učita logo fajl koji ne postoji

**Rešenje:**
- Ovo nije kritično - backend će koristiti text fallback
- Ali možeš dodati logo fajl u `web/public/logo1.png` ili `web/public/logo.png`

---

## 🔍 Korak 4: Testiraj Backend Direktno

### Test sa curl:

```bash
# Test Growers Prospect
curl -X GET https://biovera-production.up.railway.app/growers/prospect/download \
  -H "Accept: application/pdf" \
  --output test-grower-prospect.pdf

# Test Suppliers Prospect
curl -X GET https://biovera-production.up.railway.app/suppliers/prospect/download \
  -H "Accept: application/pdf" \
  --output test-supplier-prospect.pdf

# Test Logistics Partner Prospect
curl -X GET https://biovera-production.up.railway.app/logistics-partner/prospect/download \
  -H "Accept: application/pdf" \
  --output test-logistics-prospect.pdf
```

### Ako curl radi:
- Backend radi ✅
- Problem je u frontend-u ili CORS-u

### Ako curl ne radi:
- Backend ima problem ❌
- Proveri Railway logs

---

## 🔧 Rešenja

### Rešenje 1: Proveri API URL

**Frontend (`web/lib/api.ts`):**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';
```

**Proveri Vercel Environment Variables:**
1. Vercel Dashboard → tvoj projekat → Settings → Environment Variables
2. Proveri da li postoji `NEXT_PUBLIC_API_URL`
3. Proveri da li je vrednost tačna: `https://biovera-production.up.railway.app`
4. Ako nije, dodaj ili ažuriraj
5. Redeploy frontend

---

### Rešenje 2: Proveri CORS u Backend-u

**Backend (`backend/src/main.ts`):**
```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'https://bio-vera.vercel.app', // Dodaj tvoj Vercel URL
    'https://biovera.app', // Dodaj tvoj custom domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Ako nema tvoj Vercel URL:**
1. Dodaj ga u `origin` array
2. Git push
3. Railway automatski redeploy-uje

---

### Rešenje 3: Proveri da li Endpoint-i Trebaju Autentifikaciju

**Backend Controllers:**
- `backend/src/growers/growers.controller.ts`
- `backend/src/suppliers/suppliers.controller.ts`
- `backend/src/logistics-partner/logistics-partner.controller.ts`

**Proveri da li ima guard:**
```typescript
@Get('prospect/download')
@UseGuards(JwtAuthGuard) // ❌ OVO NE TREBA!
async downloadProspect(@Res() res: Response) {
  // ...
}
```

**Ako ima guard, ukloni ga:**
```typescript
@Get('prospect/download')
// @UseGuards(JwtAuthGuard) // ❌ Ukloni ovu liniju
async downloadProspect(@Res() res: Response) {
  // ...
}
```

---

### Rešenje 4: Proveri PDF Generisanje

**Backend Services:**
- `backend/src/growers/growers.service.ts`
- `backend/src/suppliers/suppliers.service.ts`
- `backend/src/logistics-partner/logistics-partner.service.ts`

**Proveri da li `generateProspectPDF()` vraća Buffer:**
```typescript
async generateProspectPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      // ... PDF generisanje ...
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer); // ✅ Treba da vrati Buffer
      });
    } catch (error) {
      reject(error);
    }
  });
}
```

---

## ✅ Checklist

- [ ] Proverio browser console za greške
- [ ] Proverio Network tab za response status
- [ ] Proverio Railway logs za backend greške
- [ ] Testirao backend direktno sa curl
- [ ] Proverio `NEXT_PUBLIC_API_URL` u Vercel
- [ ] Proverio CORS konfiguraciju u backend-u
- [ ] Proverio da li endpoint-i zahtevaju autentifikaciju
- [ ] Proverio da li `pdfkit` je instaliran

---

## 🆘 Ako i dalje ne radi

1. **Proveri Railway logs** - možda ima detaljnu grešku
2. **Proveri Vercel logs** - možda ima frontend grešku
3. **Testiraj lokalno** - pokreni backend i frontend lokalno i testiraj
4. **Kontaktiraj support** - ako ništa ne pomaže, pošalji:
   - Browser console greške
   - Network tab screenshot
   - Railway logs
   - Vercel logs

---

## 💡 Quick Fix

Ako žuriš, probaj:

1. **Proveri da li je backend aktivan:**
   ```bash
   curl https://biovera-production.up.railway.app/health
   ```
   Trebalo bi da vrati: `{"status":"healthy"}`

2. **Proveri da li endpoint radi:**
   ```bash
   curl https://biovera-production.up.railway.app/growers/prospect/download --output test.pdf
   ```
   Trebalo bi da kreira `test.pdf` fajl

3. **Ako oba rade:**
   - Problem je u frontend-u ili CORS-u
   - Proveri `NEXT_PUBLIC_API_URL` u Vercel
   - Proveri CORS u backend-u

4. **Ako ne rade:**
   - Problem je u backend-u
   - Proveri Railway logs
   - Proveri da li `pdfkit` je instaliran
