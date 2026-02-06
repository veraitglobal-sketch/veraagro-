# 🌾 Farmer Field Management - Kompletan Sistem

## 📋 Pregled

Ovaj sistem omogućava farmeru da:
1. **Kreira njivu (Estate)** i parcele
2. **Unosi materijale** (pesticidi, đubrivo, seme) sa QR kodovima
3. **Najavi branje/sadnicu** unapred
4. **Prati sve aktivnosti** na njivi

---

## 🏗️ 1. Kreiranje Njive i Parcela

### Backend Endpoints (Već Postoje)

```typescript
// Kreiranje Estate-a
POST /estates
{
  "name": "Moja Prva Njiva",
  "polygonCoordinates": [
    { lat: 44.7866, lng: 20.4489 },
    { lat: 44.7876, lng: 20.4499 },
    { lat: 44.7886, lng: 20.4509 },
    { lat: 44.7896, lng: 20.4519 }
  ]
}

// Kreiranje Parcele
POST /parcels
{
  "estateId": "estate-uuid",
  "polygonCoordinates": [...],
  "cropType": "Raspberry"
}
```

### Frontend (Mobilna/Web)

**Mobilna:** `mobile/app/(producer)/estates/new.tsx` ✅ Postoji
**Web:** Treba kreirati `/grower/estates/new`

---

## 📦 2. Unos Materijala sa QR Kodovima

### Flow:

```
Farmer skenira QR kod → Integrity Guard validira → Snima se u Compliance Log
```

### Materijali koje farmer može da unese:

1. **Seme (SEED)**
   - QR kod = `serialNumber` iz `seeds` tabele
   - Validacija: Da li seed postoji i da li je dodeljen farmeru

2. **Đubrivo (FERTILIZER)**
   - QR kod = `barcode` iz `bioWhiteList` tabele
   - Validacija: Da li je na Bio-White-List

3. **Pesticidi (FERTILIZER)**
   - QR kod = `barcode` iz `bioWhiteList` tabele
   - Validacija: Da li je na Bio-White-List

### Backend Endpoint (Već Postoji)

```typescript
POST /field-entries
{
  "estateId": "estate-uuid",
  "parcelId": "parcel-uuid", // Optional
  "entryType": "SETVA" | "PRSKANJE" | "BERBA",
  "seedSerialNumber": "SEED-2024-001", // Za seme
  "fertilizerBarcode": "FERT-12345", // Za đubrivo/pesticide
  "gpsLatitude": 44.7866,
  "gpsLongitude": 20.4489,
  "photos": ["url1", "url2"]
}
```

**Integrity Guard automatski:**
- ✅ Validira barcode
- ✅ Proverava GPS (da li je unutar farm boundaries)
- ✅ Blokira neautorizovane hemikalije
- ✅ Kreira security alert ako je potrebno

---

## 🧪 3. Test QR Kodovi

### Kreiranje Test QR Kodova

#### A. Test Seme

```typescript
// Backend: Kreirati test seed
POST /seeds/test/create
{
  "name": "Test Raspberry Seed",
  "type": "RASPBERRY",
  "batchNumber": "TEST-SEED-001",
  "quantity": 10,
  "areaCoverage": 1.0 // hectares
}

// Response:
{
  "id": "seed-uuid",
  "serialNumber": "SEED-TEST-001", // ← Ovo je QR kod!
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

#### B. Test Đubrivo

```typescript
// Backend: Dodati u Bio-White-List
POST /compliance/white-list
{
  "barcode": "TEST-FERT-001",
  "productName": "Test Organic Fertilizer",
  "manufacturer": "Test Company",
  "description": "Test fertilizer for development"
}

// Response:
{
  "barcode": "TEST-FERT-001", // ← Ovo je QR kod!
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

### QR Code Generator Endpoint

```typescript
// Generiše QR kod za bilo koji barcode/serialNumber
GET /qr/generate?type=SEED&value=SEED-TEST-001
GET /qr/generate?type=FERTILIZER&value=TEST-FERT-001

// Response:
{
  "qrCodeDataUrl": "data:image/png;base64,...",
  "value": "SEED-TEST-001",
  "type": "SEED"
}
```

---

## 📅 4. Najava Branja/Sadnice

### Novi Backend Endpoint

```typescript
POST /harvest-announcements
{
  "parcelId": "parcel-uuid",
  "cropType": "Raspberry",
  "announcementType": "HARVEST" | "PLANTING",
  "estimatedDate": "2024-08-15",
  "estimatedQuantity": 500, // kg
  "notes": "Očekujem dobru berbu"
}

// Response:
{
  "id": "announcement-uuid",
  "status": "PENDING",
  "notifiedAt": "2024-08-10T10:00:00Z", // Kada je admin obavešten
  "estimatedDate": "2024-08-15",
  "estimatedQuantity": 500
}
```

### Admin Notifikacija

Kada farmer najavi branje:
1. ✅ Kreira se `harvest_announcements` entry
2. ✅ Admin dobija notifikaciju
3. ✅ Admin može da vidi najave u `/admin/harvest-announcements`
4. ✅ Admin može da planira logistiku unapred

### Frontend (Farmer)

```typescript
// Farmer najavljuje branje
POST /harvest-announcements
{
  "parcelId": "parcel-uuid",
  "announcementType": "HARVEST",
  "estimatedDate": "2024-08-15",
  "estimatedQuantity": 500
}
```

---

## 🗄️ Database Schema

### Nova Tabela: `harvest_announcements`

```prisma
model harvest_announcements {
  id                String   @id @default(uuid())
  parcelId          String
  parcel            parcels  @relation(fields: [parcelId], references: [id])
  
  userId            String
  user              users    @relation(fields: [userId], references: [id])
  
  announcementType  String   // "HARVEST" | "PLANTING"
  cropType          String
  estimatedDate     DateTime
  estimatedQuantity Float?   // kg
  actualDate        DateTime? // Popunjava se kada se desi
  actualQuantity    Float?    // Popunjava se kada se desi
  
  status            String   @default("PENDING") // "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
  notes             String?
  
  notifiedAt        DateTime? // Kada je admin obavešten
  confirmedAt       DateTime? // Kada je admin potvrdio
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([parcelId])
  @@index([userId])
  @@index([estimatedDate])
  @@index([status])
  @@map("harvest_announcements")
}
```

---

## 🔄 Kompletan Flow

### Scenario 1: Farmer kreira njivu i unosi seme

```
1. Farmer kreira Estate
   POST /estates
   → Estate kreiran

2. Farmer kreira Parcel
   POST /parcels
   → Parcel kreiran

3. Farmer skenira QR kod semena
   POST /field-entries
   {
     "entryType": "SETVA",
     "seedSerialNumber": "SEED-2024-001",
     "parcelId": "parcel-uuid"
   }
   → Integrity Guard validira
   → Compliance log kreiran
   → Parcel status = "VALID" (ako je seed validan)
```

### Scenario 2: Farmer unosi đubrivo

```
1. Farmer skenira QR kod đubriva
   POST /field-entries
   {
     "entryType": "PRSKANJE",
     "fertilizerBarcode": "FERT-12345",
     "parcelId": "parcel-uuid"
   }
   → Integrity Guard proverava Bio-White-List
   → Ako nije na listi → BLOKIRANO + Security Alert
   → Ako je na listi → Compliance log kreiran
```

### Scenario 3: Farmer najavljuje branje

```
1. Farmer najavljuje branje
   POST /harvest-announcements
   {
     "parcelId": "parcel-uuid",
     "announcementType": "HARVEST",
     "estimatedDate": "2024-08-15",
     "estimatedQuantity": 500
   }
   → Harvest announcement kreiran
   → Admin dobija notifikaciju
   → Admin može da planira logistiku
```

---

## 🛠️ Implementacija

### Korak 1: Kreirati Harvest Announcements Backend

**Fajl:** `backend/src/harvest-announcements/harvest-announcements.service.ts`

```typescript
@Injectable()
export class HarvestAnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateHarvestAnnouncementDto) {
    // 1. Verifikuj parcel ownership
    const parcel = await this.prisma.parcels.findFirst({
      where: {
        id: dto.parcelId,
        estates: {
          ownerId: userId,
        },
      },
    });

    if (!parcel) {
      throw new ForbiddenException('Parcel not found or access denied');
    }

    // 2. Kreiraj announcement
    const announcement = await this.prisma.harvest_announcements.create({
      data: {
        id: crypto.randomUUID(),
        parcelId: dto.parcelId,
        userId,
        announcementType: dto.announcementType,
        cropType: dto.cropType,
        estimatedDate: new Date(dto.estimatedDate),
        estimatedQuantity: dto.estimatedQuantity,
        notes: dto.notes,
        status: 'PENDING',
      },
    });

    // 3. Obavesti admin-e
    await this.notifyAdmins(announcement);

    return announcement;
  }

  private async notifyAdmins(announcement: any) {
    const admins = await this.prisma.users.findMany({
      where: {
        roles: {
          has: 'ADMIN',
        },
      },
    });

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'HARVEST_ANNOUNCEMENT',
        title: 'Nova najava branja',
        message: `Farmer je najavio branje: ${announcement.cropType} - ${announcement.estimatedDate}`,
        actionUrl: `/admin/harvest-announcements/${announcement.id}`,
      });
    }
  }
}
```

### Korak 2: Kreirati QR Code Generator Endpoint

**Fajl:** `backend/src/qr/qr.controller.ts` (dodati)

```typescript
@Get('generate')
async generateQR(
  @Query('type') type: 'SEED' | 'FERTILIZER',
  @Query('value') value: string,
) {
  return this.qrService.generateTestQR(type, value);
}
```

**Fajl:** `backend/src/qr/qr.service.ts` (dodati metodu)

```typescript
async generateTestQR(type: 'SEED' | 'FERTILIZER', value: string) {
  const qrData = `${type}:${value}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
  });

  return {
    qrCodeDataUrl,
    value,
    type,
    qrData, // Za testiranje
  };
}
```

### Korak 3: Kreirati Test Data Script

**Fajl:** `backend/scripts/create-test-qr-codes.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as QRCode from 'qrcode';

const prisma = new PrismaClient();

async function createTestQRCodes() {
  console.log('Creating test QR codes...');

  // 1. Kreiraj test seed
  const testSeed = await prisma.seeds.create({
    data: {
      id: crypto.randomUUID(),
      serialNumber: 'SEED-TEST-001',
      type: 'RASPBERRY',
      name: 'Test Raspberry Seed',
      batchNumber: 'TEST-BATCH-001',
      quantity: 10,
      areaCoverage: 1.0,
      status: 'AVAILABLE',
      manufacturedAt: new Date(),
    },
  });

  console.log('✅ Test seed created:', testSeed.serialNumber);

  // 2. Dodaj test fertilizer u Bio-White-List
  const testFertilizer = await (prisma as any).bioWhiteList.create({
    data: {
      id: crypto.randomUUID(),
      barcode: 'TEST-FERT-001',
      productName: 'Test Organic Fertilizer',
      manufacturer: 'Test Company',
      description: 'Test fertilizer for development',
      isActive: true,
    },
  });

  console.log('✅ Test fertilizer created:', testFertilizer.barcode);

  // 3. Generiši QR kodove
  const seedQR = await QRCode.toDataURL(`SEED:${testSeed.serialNumber}`, {
    errorCorrectionLevel: 'H',
    width: 300,
  });

  const fertQR = await QRCode.toDataURL(`FERTILIZER:${testFertilizer.barcode}`, {
    errorCorrectionLevel: 'H',
    width: 300,
  });

  console.log('\n📱 QR Codes Generated:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Seed QR:', testSeed.serialNumber);
  console.log('Fertilizer QR:', testFertilizer.barcode);
  console.log('\n💡 Save these QR codes as images for testing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Save QR codes to files (optional)
  // await fs.writeFile('test-seed-qr.png', seedQR.split(',')[1], 'base64');
  // await fs.writeFile('test-fert-qr.png', fertQR.split(',')[1], 'base64');
}

createTestQRCodes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Korak 4: Frontend - Farmer Panel

**Fajl:** `web/app/grower/field-management/page.tsx` (NOVO)

```typescript
'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Scanner, Package, Calendar } from 'lucide-react';

export default function FieldManagementPage() {
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');

  const handleScan = async (barcode: string, type: 'SEED' | 'FERTILIZER') => {
    try {
      const response = await fetch('/api/field-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode,
          barcodeType: type,
          entryType: type === 'SEED' ? 'SETVA' : 'PRSKANJE',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.reason || 'Greška pri unosu');
        return;
      }

      alert('Uspešno uneseno!');
      setScannedCode('');
    } catch (error) {
      alert('Greška: ' + error.message);
    }
  };

  return (
    <SidebarLayout title="Upravljanje Njivom" navItems={[]}>
      <div className="space-y-6">
        {/* Scan Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Skeniraj Materijal</h2>
          <button
            onClick={() => setScanning(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center gap-2"
          >
            <Scanner className="w-5 h-5" />
            Otvori Scanner
          </button>
        </div>

        {/* Harvest Announcement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Najavi Branje</h2>
          <HarvestAnnouncementForm />
        </div>
      </div>
    </SidebarLayout>
  );
}
```

---

## ✅ Checklist za Implementaciju

### Backend
- [ ] Kreirati `harvest_announcements` tabelu (migration)
- [ ] Kreirati `HarvestAnnouncementsService`
- [ ] Kreirati `HarvestAnnouncementsController`
- [ ] Dodati QR code generator endpoint
- [ ] Kreirati test data script

### Frontend
- [ ] Kreirati `/grower/field-management` stranicu
- [ ] Implementirati QR scanner
- [ ] Implementirati harvest announcement form
- [ ] Dodati prikaz svih najava

### Admin Panel
- [ ] Kreirati `/admin/harvest-announcements` stranicu
- [ ] Prikazati sve najave
- [ ] Omogućiti potvrdu najave

---

## 🧪 Testiranje

### Test 1: Kreiranje Test QR Kodova

```bash
cd backend
npm run script:create-test-qr-codes
```

### Test 2: Skeniranje QR Koda

1. Otvori farmer panel
2. Klikni "Skeniraj Materijal"
3. Skeniraj test QR kod
4. Proveri da li je unos uspešan

### Test 3: Najava Branja

1. Otvori farmer panel
2. Klikni "Najavi Branje"
3. Unesi podatke
4. Proveri da li admin dobija notifikaciju

---

## 📚 Povezani Dokumenti

- `ADMIN_FARMER_CORRELATION.md` - Korelacija admin-farmer
- `PRODUCT_MANAGEMENT_SYSTEM.md` - Product catalog
- `BIO_VERA_ENGINE.md` - Business logic
