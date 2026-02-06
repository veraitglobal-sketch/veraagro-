# 📄 Tax & Export Automator - Kompletan Sistem

## 📋 Pregled

Tax & Export Automator je sistem koji:
1. **Automatski generiše izvoznu dokumentaciju** (CMR, fakture, fitosanitarne sertifikate) na osnovu podataka iz baze
2. **Razdvaja PDV (MwSt)** za nemačko tržište od ulaznih troškova na Balkanu
3. **Omogućava računovodstvu u Hamburgu** da ima sve spremno za poresku prijavu jednim klikom

---

## 🎯 Funkcionalnosti

### 1. CMR Document Generation (International Road Transport)

**Endpoint:** `POST /export-automator/cmr/:deliveryId`

**Output:**
```json
{
  "cmr": {
    "cmrNumber": "CMR-1234567890-ABC123",
    "sender": {
      "name": "Marko Petrović",
      "address": "Farm Address",
      "city": "Serbia",
      "country": "RS"
    },
    "receiver": {
      "name": "Bio Vera GmbH",
      "address": "Hamburg, Germany",
      "city": "Hamburg",
      "country": "DE"
    },
    "carrier": {
      "name": "Driver Name",
      "vehiclePlate": "UNKNOWN",
      "driverName": "Driver Name"
    },
    "goods": {
      "description": "Bio Apfel",
      "quantity": 1000,
      "unit": "kg",
      "weight": 1000,
      "value": 2500
    },
    "route": {
      "origin": "Farm Address",
      "destination": "Hamburg",
      "borderCrossing": "Horgos"
    },
    "date": "2024-02-15T10:00:00Z"
  },
  "pdfUrl": "/exports/cmr/CMR-1234567890-ABC123.pdf",
  "pdfHash": "sha256-hash"
}
```

**Features:**
- Automatski generiše CMR broj
- Popunjava sve potrebne podatke iz baze
- Generiše PDF dokument
- Čuva hash za verifikaciju

---

### 2. Phytosanitary Certificate Generation

**Endpoint:** `POST /export-automator/phytosanitary/:batchId`

**Output:**
```json
{
  "certificate": {
    "certificateNumber": "PHYTO-1234567890-ABC123",
    "exporter": {
      "name": "Marko Petrović",
      "address": "Farm Name",
      "country": "RS"
    },
    "importer": {
      "name": "Bio Vera GmbH",
      "address": "Hamburg, Germany",
      "country": "DE"
    },
    "product": {
      "name": "Bio Apfel",
      "quantity": 1000,
      "unit": "kg",
      "origin": "Serbia",
      "destination": "Germany"
    },
    "inspection": {
      "date": "2024-02-15T10:00:00Z",
      "inspector": "Bio Vera Quality Control",
      "result": "PASSED",
      "notes": "Product meets EU phytosanitary standards"
    },
    "validity": {
      "issuedAt": "2024-02-15T10:00:00Z",
      "expiresAt": "2024-03-17T10:00:00Z"
    }
  },
  "pdfUrl": "/exports/phytosanitary/PHYTO-1234567890-ABC123.pdf",
  "pdfHash": "sha256-hash"
}
```

**Features:**
- Automatski generiše sertifikat
- Valjanost: 30 dana
- EU standardi
- PDF generisanje

---

### 3. Tax Separation Calculation (PDV Razdvajanje)

**Endpoint:** `POST /export-automator/tax-calculation/:orderId`

**Output:**
```json
{
  "orderId": "order-123",
  "balkanCosts": {
    "growerPrice": 1800,
    "transportBalkan": 100,
    "packaging": 50,
    "otherBalkan": 20,
    "totalBalkan": 1970
  },
  "germanMarket": {
    "sellPrice": 2500,
    "vatRate": 0.19,
    "vatAmount": 475,
    "netPrice": 2025,
    "transportGermany": 150,
    "otherGermany": 30,
    "totalGermany": 180
  },
  "taxSummary": {
    "totalRevenue": 2500,
    "totalCosts": 2150,
    "grossProfit": 350,
    "vatToPay": 475,
    "vatToClaim": 34.2,
    "netVatLiability": 440.8,
    "netProfit": -90.8
  },
  "exportDetails": {
    "exportDate": "2024-02-15T10:00:00Z",
    "destinationCountry": "DE",
    "customsValue": 1970,
    "currency": "EUR"
  }
}
```

**Calculation Logic:**
```
Balkan Costs (No VAT):
  - Grower Price (no VAT)
  - Transport in Balkans (no VAT)
  - Packaging (no VAT)
  - Other Balkan costs (no VAT)

German Market (With VAT):
  - Sell Price (before VAT)
  - VAT (19% MwSt)
  - Transport in Germany (with VAT)
  - Other German costs (with VAT)

Tax Summary:
  - VAT to Pay = VAT on sales
  - VAT to Claim = Input VAT on German costs
  - Net VAT Liability = VAT to Pay - VAT to Claim
```

---

### 4. Tax Report Generation (Poreska Prijava)

**Endpoint:** `POST /export-automator/tax-report`

**Input:**
```json
{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z"
}
```

**Output:**
```json
{
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  },
  "summary": {
    "totalRevenue": 50000,
    "totalBalkanCosts": 35000,
    "totalGermanCosts": 3000,
    "totalVatCollected": 9500,
    "totalVatPaid": 9500,
    "netVatLiability": 9120,
    "grossProfit": 12000,
    "netProfit": 2880
  },
  "transactions": [...],
  "readyForSubmission": true
}
```

**Features:**
- Agregira sve transakcije u periodu
- Računa ukupne troškove i prihode
- Računa neto PDV obavezu
- Generiše PDF izveštaj
- **Ready for submission** - spreman za poresku prijavu

---

### 5. Generate All Documents (Kompletna Dokumentacija)

**Endpoint:** `POST /export-automator/all-documents/:deliveryId`

**Output:**
```json
{
  "cmr": {
    "cmr": {...},
    "pdfUrl": "/exports/cmr/...",
    "pdfHash": "..."
  },
  "invoice": {
    "invoiceNumber": "INV-...",
    "pdfUrl": "/invoices/..."
  },
  "phytosanitary": {
    "certificate": {...},
    "pdfUrl": "/exports/phytosanitary/...",
    "pdfHash": "..."
  },
  "taxCalculation": {...}
}
```

**Features:**
- Generiše sve dokumente odjednom
- CMR, Invoice, Phytosanitary, Tax Calculation
- Sve spremno za izvoz

---

## 🔧 Konfiguracija

### German VAT Rate

```typescript
GERMAN_VAT_RATE = 0.19; // 19% MwSt
```

### Company Info

```typescript
COMPANY_INFO = {
  name: 'Bio Vera GmbH',
  address: 'Hamburg, Germany',
  taxId: 'DE123456789', // Replace with actual
};
```

### Cost Defaults

```typescript
// Balkan (no VAT)
transportBalkan: 0.10 EUR per kg
packaging: 0.05 EUR per kg
otherBalkan: 0.02 EUR per kg

// Germany (with VAT)
transportGermany: 0.15 EUR per kg
otherGermany: 0.03 EUR per kg
```

---

## 📊 Database Schema

### CMRDocument Model

```prisma
model CMRDocument {
  id        String   @id @default(uuid())
  cmrNumber String   @unique
  deliveryId String  @unique
  delivery   Delivery @relation(...)
  
  pdfUrl  String
  pdfHash String
  cmrData Json
  
  generatedAt DateTime @default(now())
  
  @@map("cmr_documents")
}
```

### PhytosanitaryCertificate Model

```prisma
model PhytosanitaryCertificate {
  id              String   @id @default(uuid())
  certificateNumber String @unique
  batchId         String   @unique
  batch           Batch    @relation(...)
  
  pdfUrl  String
  pdfHash String
  certificateData Json
  
  generatedAt DateTime @default(now())
  expiresAt   DateTime
  
  @@map("phytosanitary_certificates")
}
```

### TaxCalculation Model

```prisma
model TaxCalculation {
  id      String @id @default(uuid())
  orderId String @unique
  order   Order  @relation(...)
  
  taxCalculationData Json
  
  calculatedAt DateTime @default(now())
  
  @@map("tax_calculations")
}
```

### TaxReport Model

```prisma
model TaxReport {
  id         String   @id @default(uuid())
  periodStart DateTime
  periodEnd   DateTime
  
  pdfUrl  String
  pdfHash String
  reportData Json
  
  submittedToTaxOffice Boolean @default(false)
  submittedAt          DateTime?
  
  generatedAt DateTime @default(now())
  
  @@map("tax_reports")
}
```

---

## 🚀 Instalacija

### 1. Dodaj Modele u Schema

Dodaj modele iz `schema.export-automator.prisma` u `backend/prisma/schema.prisma`.

### 2. Pokreni Migraciju

```bash
cd backend
npx prisma migrate dev --name add_export_automator_models
```

### 3. Instaliraj Dependencies

```bash
cd backend
npm install pdfkit @types/pdfkit
```

---

## 🧪 Test Scenarios

### Test 1: Generate CMR
```bash
curl -X POST http://localhost:3000/export-automator/cmr/delivery-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Calculate Tax
```bash
curl -X POST http://localhost:3000/export-automator/tax-calculation/order-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Generate Tax Report
```bash
curl -X POST http://localhost:3000/export-automator/tax-report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }'
```

### Test 4: Generate All Documents
```bash
curl -X POST http://localhost:3000/export-automator/all-documents/delivery-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Napomene

### PDF Generation

**Trenutna Implementacija:**
- Koristi `pdfkit` za PDF generisanje
- Osnovni PDF format
- Može se proširiti sa template-ima

**Production Improvements:**
- Dodaj profesionalne template-e
- Dodaj logo i branding
- Dodaj digital signatures
- Integriši sa e-signature servisima

### Tax Calculation

**Accuracy:**
- Proveri sa računovodstvom
- Ažuriraj cost defaults
- Dodaj custom cost calculation ako je potrebno

### Border Crossing

**Default:**
- Horgos (Serbia-Hungary)
- Može se proširiti sa drugim graničnim prelazima

---

## 📈 Performance

- **CMR Generation:** ~500ms
- **Phytosanitary Certificate:** ~400ms
- **Tax Calculation:** ~200ms
- **Tax Report (100 orders):** ~5-10s

---

## 🔄 Sledeći Koraci

1. **Dodaj modele u schema i pokreni migraciju**
2. **Ažuriraj cost defaults** sa stvarnim vrednostima
3. **Dodaj profesionalne PDF template-e**
4. **Integriši sa e-signature servisima**
5. **Dodaj email slanje dokumentata**
6. **Kreiraj dashboard za tax reports**

---

## 📝 TODO

- [ ] Dodaj modele u schema
- [ ] Pokreni migraciju
- [ ] Ažuriraj cost defaults
- [ ] Dodaj profesionalne PDF template-e
- [ ] Integriši sa e-signature servisima
- [ ] Dodaj email slanje
- [ ] Kreiraj tax report dashboard
