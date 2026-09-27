# VeraTransparency Module - Sledljivost Sistema

## 📋 Pregled

VeraTransparency modul rešava kompletnu sledljivost proizvoda od njive do kupca (Aldi), omogućavajući:
- **Batch Manager**: Grupisanje proizvoda po Sorti i Farmeru sa validacijom
- **QR Code Generator**: Generisanje QR kodova za svaki batch
- **Deep Dive Screen**: Detaljan prikaz za kupce sa mapom, sortom, foto-galerijom

---

## 🏗️ Arhitektura

### Backend Modul

**Lokacija**: `backend/src/vera-transparency/`

**Komponente**:
- `vera-transparency.service.ts` - Glavna business logika
- `vera-transparency.controller.ts` - API endpoints
- `vera-transparency.module.ts` - NestJS modul

### Frontend Komponente

**Lokacija**: `web/app/transparency/batch/[batchId]/page.tsx`
- Deep Dive Screen za kupce
- Public endpoint (dostupan preko QR koda)

**Lokacija**: `web/components/QRScanner.tsx`
- QR Code scanner komponenta za menadžere

---

## 🔧 Funkcionalnosti

### 1. Batch Manager

**Endpoint**: `POST /vera-transparency/batch-manager/group`

**Funkcionalnost**:
- Grupiše batch-ove po Sorti i Farmeru
- **Blokira mešanje različitih sorti** u istoj digitalnoj isporuci
- **Blokira mešanje batch-ova od različitih farmera**

**Primer zahteva**:
```json
{
  "batchIds": ["batch-1", "batch-2", "batch-3"]
}
```

**Primer odgovora**:
```json
{
  "grouped": [
    {
      "variety": "Heritage",
      "farmerId": "farmer-123",
      "farmerName": "Marko Petrović",
      "farmerCode": "VP001",
      "estateId": "estate-456",
      "estateName": "Petrović Farm",
      "batches": [...]
    }
  ],
  "summary": {
    "totalBatches": 3,
    "variety": "Heritage",
    "farmer": "Marko Petrović",
    "canProceed": true
  }
}
```

**Validacija**:
- Ako se pokuša mešanje različitih sorti → `BadRequestException`
- Ako se pokuša mešanje batch-ova od različitih farmera → `BadRequestException`

### 2. QR Code Generator

**Endpoint**: `GET /vera-transparency/batch/:batchId/qr-code`

**Funkcionalnost**:
- Generiše QR kod za batch
- QR kod sadrži deep dive URL
- Vraća QR kod kao data URL (base64)

**Primer odgovora**:
```json
{
  "qrCode": "BATCH-12345",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "deepDiveUrl": "http://localhost:3001/transparency/batch/BATCH-12345"
}
```

### 3. Deep Dive Screen

**Endpoint**: `GET /vera-transparency/batch/:batchId/deep-dive`

**Funkcionalnost**:
- **Public endpoint** - dostupan bez autentifikacije (za QR skeniranje)
- Vraća kompletan prikaz batch-a:
  - **Mapa**: Tačna lokacija njive (Google Maps embed)
  - **Sorta**: Jasno istaknuta (npr. "Variety: Heritage - Organic")
  - **Foto-galerija**: Slike koje je farmer postavio (posebno istaknute one iz poslednjeg sata)
  - **Journey Timeline**: Kompletan put proizvoda (Harvested → Packed → In Hub → In Transit → Delivered)
  - **Freshness Tracking**: Preostalo vreme trajanja
  - **Temperature Log**: Poslednjih 10 merenja temperature

**Primer odgovora**:
```json
{
  "batchId": "BATCH-12345",
  "productName": "Raspberry - Heritage - Organic",
  "variety": {
    "name": "Heritage",
    "display": "Heritage - Organic",
    "type": "Organic",
    "organic": true
  },
  "farm": {
    "id": "estate-456",
    "name": "Petrović Farm",
    "farmer": {
      "name": "Marko Petrović",
      "code": "VP001"
    },
    "location": {
      "coordinates": [...],
      "center": {
        "lat": 43.8563,
        "lng": 18.4131
      }
    }
  },
  "photos": {
    "all": [...],
    "recent": [...] // Photos from last hour
  },
  "traceability": {
    "harvestDate": "2024-01-15T10:00:00Z",
    "quantity": 100,
    "unit": "kg",
    "status": "IN_TRANSIT",
    "timeline": [...],
    "seed": {...},
    "freshness": {...},
    "temperature": [...]
  },
  "qrCode": {...}
}
```

---

## 🎨 Frontend - Deep Dive Screen

**URL**: `/transparency/batch/[batchId]`

**Funkcionalnosti**:
1. **Variety Badge**: Veliki, istaknut prikaz sorte (npr. "Heritage - Organic")
2. **Mapa**: Google Maps embed sa tačnom lokacijom njive
3. **Farm Information**: Ime farme, farmer, seed info, harvest date
4. **Photo Gallery**: 
   - Grid prikaz svih fotografija
   - Badge za "new in last hour"
   - Click za full-screen prikaz
5. **Journey Timeline**: Vizuelni prikaz puta proizvoda
6. **Freshness Tracking**: Progress bar sa preostalim vremenom
7. **Temperature Log**: Lista poslednjih merenja

---

## 📱 QR Code Scanner

**Komponenta**: `web/components/QRScanner.tsx`

**Funkcionalnosti**:
- Kamera pristup za skeniranje QR kodova
- Manual input fallback (ako kamera ne radi)
- Automatsko preusmeravanje na Deep Dive screen nakon skeniranja

**Korišćenje**:
```tsx
import QRScanner from '@/components/QRScanner';

<QRScanner
  onScan={(batchId) => {
    router.push(`/transparency/batch/${batchId}`);
  }}
  onClose={() => setShowScanner(false)}
/>
```

---

## 🔐 Autentifikacija & Autorizacija

### Public Endpoints (bez autentifikacije):
- `GET /vera-transparency/batch/:batchId/deep-dive` - Za QR skeniranje

### Protected Endpoints (zahteva autentifikaciju):
- `POST /vera-transparency/batch-manager/group` - ADMIN, SUPER_ADMIN, LOGISTICS_PARTNER
- `POST /vera-transparency/batch-manager/validate` - ADMIN, SUPER_ADMIN, LOGISTICS_PARTNER
- `GET /vera-transparency/batch/:batchId/qr-code` - Svi autentifikovani korisnici

---

## 🚀 Kako Koristiti

### 1. Validacija Batch Grupisanja

```typescript
import { veraTransparencyAPI } from '@/lib/api';

// Pre kreiranja isporuke, validiraj batch-ove
const result = await veraTransparencyAPI.validateGrouping([
  'batch-1',
  'batch-2',
  'batch-3'
]);

if (result.valid) {
  // Može se kreirati isporuka
  console.log('All batches are from same variety and farmer');
} else {
  // Ne može se kreirati isporuka
  console.error(result.message);
}
```

### 2. Generisanje QR Koda

```typescript
const qrData = await veraTransparencyAPI.generateQRCode('BATCH-12345');
// qrData.qrCodeUrl - base64 data URL za prikaz
// qrData.deepDiveUrl - URL za Deep Dive screen
```

### 3. Prikaz Deep Dive Screen-a

**Preko QR koda**:
1. Menadžer u Hamburgu skenira QR kod
2. Automatski se otvara `/transparency/batch/[batchId]`
3. Prikazuje se kompletan Deep Dive screen

**Direktno**:
- Navigiraj na `/transparency/batch/[batchId]`

---

## 📊 Varijanta (Sorta) Ekstrakcija

Sistem automatski ekstraktuje varijantu iz:
1. **productName** format: `"Raspberry - Heritage - Organic"`
   - Prvi deo: Proizvod (Raspberry)
   - Drugi deo: Varijanta (Heritage)
   - Treći deo: Tip (Organic)
2. **Fallback**: Seed name iz `parcels.seeds.name`
3. **Fallback**: Crop type iz `parcels.cropType`

---

## ✅ Validacija Mešanja

Sistem **strogo blokira**:
- ❌ Mešanje različitih sorti (npr. Heritage + Tulameen)
- ❌ Mešanje batch-ova od različitih farmera

**Primer greške**:
```json
{
  "statusCode": 400,
  "message": "Cannot mix different varieties in same delivery. Found varieties: Heritage, Tulameen"
}
```

---

## 🔄 Integracija sa Drugim Modulima

### Digital Passports
- Deep Dive koristi podatke iz digital passports modula
- Journey timeline se gradi iz `locationHistory`

### Compliance Photos
- Foto-galerija koristi `compliance_photos` tabelu
- Prikazuje se badge za "recent" fotografije (poslednji sat)

### Freshness Tracking
- Integrisano sa `freshness_trackers` modulom
- Prikazuje preostalo vreme trajanja

### Temperature Logs
- Integrisano sa `temperature_logs` modulom
- Prikazuje poslednjih 10 merenja

---

## 🎯 Use Cases

### Use Case 1: Menadžer u Hamburgu skenira QR kod
1. Menadžer skenira QR kod sa batch-a
2. Otvara se Deep Dive screen
3. Vidi tačnu lokaciju njive na mapi
4. Vidi sortu (Heritage - Organic)
5. Vidi fotografije koje je farmer postavio pre sat vremena
6. Vidi kompletan journey timeline

### Use Case 2: Validacija pre kreiranja isporuke
1. Admin pokušava da kreira isporuku sa batch-ovima
2. Sistem validira da su svi batch-ovi iste sorte i istog farmera
3. Ako nisu → greška, isporuka se ne može kreirati
4. Ako jesu → isporuka se kreira uspešno

---

## 📝 Napomene

- QR kod se generiše automatski za svaki batch
- Deep Dive screen je **public** - dostupan bez autentifikacije (za QR skeniranje)
- Foto-galerija prikazuje posebno istaknute fotografije iz poslednjeg sata
- Mapa koristi Google Maps embed (potreban API key u env varijablama)

---

## 🔧 Environment Variables

```env
FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## ✅ Status

- ✅ Batch Manager sa grupisanjem
- ✅ Validacija mešanja sorti i farmera
- ✅ QR Code Generator
- ✅ Deep Dive API endpoint
- ✅ Frontend Deep Dive Screen
- ✅ QR Code Scanner komponenta
- ✅ Integracija sa drugim modulima

---

**Modul je spreman za produkciju!** 🚀
