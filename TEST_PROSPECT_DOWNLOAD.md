# 🧪 Test Prospect Download

## Brzi Test

### 1. Test Backend Direktno

Otvori terminal i pokreni:

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

**Ako curl kreira PDF fajlove:**
- ✅ Backend radi
- Problem je u frontend-u ili CORS-u

**Ako curl ne kreira PDF fajlove:**
- ❌ Backend ima problem
- Proveri Railway logs

---

### 2. Test u Browser-u

Otvori novi tab i idi na:

```
https://biovera-production.up.railway.app/growers/prospect/download
```

**Ako se PDF automatski skida:**
- ✅ Backend radi
- Problem je u frontend-u (možda API URL)

**Ako vidiš grešku:**
- ❌ Backend ima problem
- Proveri Railway logs

---

### 3. Proveri Frontend API URL

1. Otvori browser Developer Tools (F12)
2. Idi na **Console** tab
3. Unesi:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004')
   ```
4. Proveri da li je vrednost tačna

**Ako je `undefined` ili `http://localhost:3004`:**
- ❌ `NEXT_PUBLIC_API_URL` nije postavljen u Vercel
- Dodaj ga u Vercel Environment Variables
- Redeploy frontend

---

## 🔧 Najčešći Problem

**Problem**: `NEXT_PUBLIC_API_URL` nije postavljen u Vercel

**Rešenje**:
1. Vercel Dashboard → tvoj projekat → Settings → Environment Variables
2. Dodaj `NEXT_PUBLIC_API_URL` sa vrednošću: `https://biovera-production.up.railway.app`
3. Save
4. Redeploy frontend

---

## 📋 Checklist

- [ ] Testirao backend direktno sa curl
- [ ] Testirao backend direktno u browser-u
- [ ] Proverio `NEXT_PUBLIC_API_URL` u Vercel
- [ ] Proverio browser console za greške
- [ ] Proverio Network tab za response status
- [ ] Proverio Railway logs za backend greške
