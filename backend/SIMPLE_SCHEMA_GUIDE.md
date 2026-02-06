# Bio Vera - Simplified Schema Guide

## 📋 Pregled

Ova pojednostavljena šema fokusira se na **osnovne entitete** koji povezuju seljake sa semenom koje su kupili.

## 🗄️ Modeli

### 1. User (Korisnik)

**Uloge:**
- `FARMER` - Seljak koji kupuje seme
- `ADMIN` - Administrator sistema
- `LOGISTIC` - Logistički partner
- `BUYER` - Kupac

**Polja:**
- `id` - UUID
- `email` - Email adresa (unique)
- `password` - Bcrypt hash
- `firstName`, `lastName` - Ime i prezime
- `phone` - Telefon (opciono)
- `role` - Uloga korisnika

**Relacije:**
- `farms` - Farme koje poseduje (1:N)
- `seedBatches` - Seme koje je kupio (1:N)

### 2. Farm (Farma)

**Polja:**
- `id` - UUID
- `name` - Naziv farme
- `ownerId` - ID vlasnika (Farmer)
- `coordinates` - JSON sa koordinatama (lat/lng ili polygon)
- `size` - Veličina u hektarima
- `soilType` - Tip zemljišta (CLAY, SANDY, LOAMY, itd.)

**Relacije:**
- `owner` - Vlasnik farme (User/Farmer)

### 3. SeedBatch (Serija Semena)

**Polja:**
- `id` - UUID
- `serialNumber` - Jedinstveni serijski broj
- `seedType` - Tip semena (WHEAT, CORN, SOYBEAN, itd.)
- `standardPrice` - Standardna cena
- `partnerPrice` - Cena za partnere (popust)
- `purchasedBy` - ID farmera koji je kupio (opciono)
- `purchasedAt` - Datum kupovine (opciono)

**Relacije:**
- `farmer` - Farmer koji je kupio seme
- `insurance` - Osiguranje za ovo seme (1:1)

### 4. InsurancePolicy (Polisa Osiguranja)

**Polja:**
- `id` - UUID
- `seedBatchId` - ID serije semena
- `status` - Status (ACTIVE, EXPIRED, CANCELLED, PENDING)
- `coverage` - Iznos pokrića
- `commission` - Provizija u procentima (npr. 5.5)
- `startDate`, `endDate` - Datumi važenja

**Relacije:**
- `seedBatch` - Serija semena koja je osigurana (1:1)

## 🔗 Relacije

```
User (Farmer)
  ├── farms (1:N) → Farm
  └── seedBatches (1:N) → SeedBatch
       └── insurance (1:1) → InsurancePolicy
```

## 📝 Primeri Upotrebe

### Kreiranje Farmera

```typescript
const farmer = await prisma.user.create({
  data: {
    email: 'farmer@example.com',
    password: hashedPassword,
    firstName: 'Marko',
    lastName: 'Petrović',
    role: 'FARMER',
  },
});
```

### Kreiranje Farme

```typescript
const farm = await prisma.farm.create({
  data: {
    name: 'Moja Farma',
    ownerId: farmer.id,
    coordinates: { lat: 44.7866, lng: 20.4489 }, // Belgrade
    size: 10.5, // hectares
    soilType: 'LOAMY',
  },
});
```

### Kreiranje Seed Batch-a

```typescript
const seedBatch = await prisma.seedBatch.create({
  data: {
    serialNumber: 'SB-2024-001',
    seedType: 'WHEAT',
    standardPrice: 5000,
    partnerPrice: 4500, // 10% popust za partnere
  },
});
```

### Kupovina Semena

```typescript
const purchasedSeed = await prisma.seedBatch.update({
  where: { id: seedBatch.id },
  data: {
    purchasedBy: farmer.id,
    purchasedAt: new Date(),
  },
});
```

### Kreiranje Osiguranja

```typescript
const insurance = await prisma.insurancePolicy.create({
  data: {
    seedBatchId: seedBatch.id,
    status: 'ACTIVE',
    coverage: 100000, // 100k RSD
    commission: 5.5, // 5.5%
    startDate: new Date(),
    endDate: new Date('2025-12-31'),
  },
});
```

### Query: Svi Farmeri sa njihovim Semenom

```typescript
const farmersWithSeeds = await prisma.user.findMany({
  where: { role: 'FARMER' },
  include: {
    seedBatches: {
      include: {
        insurance: true,
      },
    },
    farms: true,
  },
});
```

## 🚀 Migracija

### Korak 1: Backup Trenutne Šeme

```bash
cd backend
cp prisma/schema.prisma prisma/schema.complex.prisma.backup
```

### Korak 2: Zameni sa Novom Šemom

```bash
cp prisma/schema.simple.prisma prisma/schema.prisma
```

### Korak 3: Kreiraj Migraciju

```bash
npx prisma migrate dev --name simplified_schema
```

**⚠️ PAŽNJA:** Ovo će obrisati sve postojeće podatke! Koristi samo za novi projekat ili ako si siguran da želiš da resetuješ bazu.

## 🔄 Alternativa: Koristi Obe Šeme

Ako želiš da zadržiš kompleksnu šemu i dodaš jednostavnu:

1. Koristi `schema.simple.prisma` za novi projekat
2. Ili dodaj modele iz simple šeme u postojeću `schema.prisma`

## 📊 Tipovi Podataka

### SoilType (Tip Zemljišta)
- `CLAY` - Glina
- `SANDY` - Pesak
- `LOAMY` - Ilovača
- `PEATY` - Treset
- `CHALKY` - Krečnjak
- `SILTY` - Mulj

### SeedType (Tip Semena)
- `WHEAT` - Pšenica
- `CORN` - Kukuruz
- `SOYBEAN` - Soja
- `SUNFLOWER` - Suncokret
- `BARLEY` - Ječam
- `OATS` - Ovas
- `RYE` - Raž
- `OTHER` - Ostalo

### InsuranceStatus (Status Osiguranja)
- `ACTIVE` - Aktivan
- `EXPIRED` - Istekao
- `CANCELLED` - Otkazan
- `PENDING` - Na čekanju

## ✅ Prednosti Ove Šeme

1. **Jednostavnost** - Samo 4 modela
2. **Jasne relacije** - Farmer → Farm, Farmer → SeedBatch
3. **Lako razumevanje** - Čista logika bez komplikacija
4. **Brza implementacija** - Minimalan kod za osnovne operacije

## 🎯 Sledeći Koraci

1. **Kreiraj migraciju** sa novom šemom
2. **Testiraj osnovne CRUD operacije**
3. **Dodaj API endpoints** za svaki model
4. **Kreiraj frontend** za farmer dashboard
