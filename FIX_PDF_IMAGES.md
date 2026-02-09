# 🔧 Rešavanje Problema sa Slikama u PDF-u

## ❌ Problem

**Backend pokušava da učita slike sa putanje:**
```typescript
path.join(process.cwd(), '..', 'web', 'public', 'logo1.png')
```

**U production-u (Railway):**
- Backend i frontend su odvojeni
- Backend ne može da pristupi `web/public/` folderu
- Slike se ne učitavaju u PDF-u

---

## ✅ Rešenje: Kopiraj Slike u Backend

### Korak 1: Kreiraj `backend/public` Folder

```bash
cd backend
mkdir -p public
```

### Korak 2: Kopiraj Potrebne Slike

Kopiraj sledeće slike iz `web/public/` u `backend/public/`:

**Logo:**
- `logo1.png` (ili `logo.png`)

**Za Growers Prospect:**
- `apples-retail.jpg` (ili `apples-retail.png`)
- `retail-box.jpg` (ili `retail-box.png`)
- `apples-pallet.jpg` (ili `apples-pallet.png`)
- `apples-bulk.jpg` (ili `apples-bulk.png`)
- `branding-example.jpg` (ili `box-branding.jpg`)

**Za Suppliers Prospect:**
- `bio-grow.jpg` (ili `bottle.jpg`, `fertilizer.jpg`)
- `cucumber-seeds.jpg` (ili `seeds.jpg`)
- `wholesale-box.jpg` (ili `box.jpg`)
- `truck-cerada.jpg` (ili `truck-cerada.png`)

**Za Logistics Partner Prospect:**
- `truck-cerada.jpg` (ili `truck-cerada.png`)

---

## 🔧 Korak 3: Ažuriraj Backend Kod

Treba da promenimo putanje u backend servisima da traže slike u `backend/public/` umesto `../web/public/`.

### Fajlovi koje treba ažurirati:

1. `backend/src/growers/growers.service.ts`
2. `backend/src/suppliers/suppliers.service.ts`
3. `backend/src/logistics-partner/logistics-partner.service.ts`

### Promena:

**Staro:**
```typescript
const logoPath1 = path.join(process.cwd(), '..', 'web', 'public', 'logo1.png');
```

**Novo:**
```typescript
const logoPath1 = path.join(process.cwd(), 'public', 'logo1.png');
```

---

## 📋 Checklist Slika

### Logo (za sve PDF-ove):
- [ ] `logo1.png` (ili `logo.png`)

### Growers Prospect:
- [ ] `apples-retail.jpg`
- [ ] `retail-box.jpg`
- [ ] `apples-pallet.jpg`
- [ ] `apples-bulk.jpg`
- [ ] `branding-example.jpg` (ili `box-branding.jpg`)

### Suppliers Prospect:
- [ ] `bio-grow.jpg` (ili `bottle.jpg`, `fertilizer.jpg`)
- [ ] `cucumber-seeds.jpg` (ili `seeds.jpg`)
- [ ] `wholesale-box.jpg` (ili `box.jpg`)
- [ ] `truck-cerada.jpg`

### Logistics Partner Prospect:
- [ ] `truck-cerada.jpg` (ili `truck-cerada.png`)

---

## 🚀 Alternativno Rešenje: Koristi URL-ove

Ako ne želiš da kopiraš slike, možeš koristiti URL-ove sa frontend-a:

```typescript
// Umesto lokalne putanje
const logoUrl = `${process.env.FRONTEND_URL || 'https://bio-vera.vercel.app'}/logo1.png`;

// Download image sa URL-a
const response = await fetch(logoUrl);
const imageBuffer = await response.arrayBuffer();
doc.image(Buffer.from(imageBuffer), 50, 20, { width: 300, height: 90 });
```

**Mane:**
- Zahteva internet konekciju
- Sporije je (mora da download-uje svaki put)
- Može da padne ako frontend nije dostupan

**Prednosti:**
- Ne treba kopirati slike
- Slike se automatski ažuriraju na frontend-u

---

## 💡 Preporuka

**Koristi kopiranje slika u backend** - brže je i ne zavisi od frontend-a.

---

## 🔧 Quick Fix

1. **Kreiraj `backend/public` folder**
2. **Kopiraj potrebne slike**
3. **Ažuriraj putanje u backend servisima**
4. **Git push**
5. **Railway automatski redeploy-uje**

Hajde da uradim ovo sada! 🚀
