# Bio Vera Blockchain Module 🔗

Blockchain modul za imutabilni dokaz porekla i putanje proizvoda.
**Stack:** Solidity + Polygon + NestJS + Next.js

---

## Arhitektura

```
Bio Vera Backend (NestJS)
    │
    ├── blockchain.service.ts  →  šalje tx na Polygon
    ├── blockchain.controller.ts  →  REST API
    │
    ▼
BioVeraTrace.sol (Polygon)
    │
    ├── registerBatch()   ←  Nova berba
    ├── recordEvent()     ←  Svaki korak u lancu
    └── verifyBatch()     ←  QR verifikacija
    
    ▼
Polygonscan (javni explorer)
    │
    └── Kupac/Retailer vidi dokaz ✅
```

## Šta se čuva na blockchainu

**NE čuvamo:** GPS koordinate, imena, lične podatke, cene  
**Čuvamo samo:** SHA-256 hash od `{batchId + estateId + harvestDate + productType}`

Jedan hash = 32 bajta = ~0.0001$ na Polygon-u.

---

## Brzi start

### 1. Instaliraj zavisnosti

```bash
cd biovera-blockchain
npm install
```

### 2. Konfiguriši .env

```bash
cp .env.example .env
# Popuni POLYGON_RPC_URL i BLOCKCHAIN_PRIVATE_KEY
```

### 3. Nabavi testnet MATIC (besplatno)

Idi na: https://faucet.polygon.technology  
Unesi adresu svog wallet-a → dobijaš besplatni MATIC za testiranje.

### 4. Kompajliraj i testiraj

```bash
npm run compile
npm test
```

### 5. Deploy na testnet (Mumbai)

```bash
npm run deploy:mumbai
```

Dobićeš:
```
✅ BioVeraTrace deployed to: 0x1234...
```

Kopiraj adresu u `.env` kao `CONTRACT_ADDRESS`.

### 6. Deploy na Polygon mainnet (produkcija)

```bash
npm run deploy:polygon
```

---

## REST API Endpoints

### Registruj batch

```http
POST /api/blockchain/batches
Content-Type: application/json

{
  "batchId": "VERA-2026-001",
  "estateId": "ESTATE-RS-001",
  "harvestDate": "2026-06-15",
  "productType": "Organic Raspberry"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "VERA-2026-001",
    "txHash": "0xabc123...",
    "blockNumber": 12345678,
    "explorerUrl": "https://mumbai.polygonscan.com/tx/0xabc123...",
    "timestamp": "2026-06-15T10:00:00.000Z"
  }
}
```

### Zabeleži korak u lancu

```http
POST /api/blockchain/batches/VERA-2026-001/events
Content-Type: application/json

{
  "eventType": "HARVEST",
  "timestamp": "2026-06-15T08:00:00Z",
  "locationCode": "RS-NS-001"
}
```

Dostupni `eventType` vrednosti:
- `HARVEST` - Berba
- `PACKAGING` - Pakovanje  
- `HANDOVER` - Predaja logistici
- `DELIVERY` - Isporuka kupcu
- `CERTIFICATION` - EU sertifikacija

### Verifikacija (QR skeniranje)

```http
POST /api/blockchain/batches/VERA-2026-001/verify
Content-Type: application/json

{
  "estateId": "ESTATE-RS-001",
  "harvestDate": "2026-06-15",
  "productType": "Organic Raspberry"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "data": {
    "isVerified": true,
    "registeredAt": "2026-06-15T10:00:00.000Z",
    "eventCount": 4,
    "explorerUrl": "https://mumbai.polygonscan.com/address/0x..."
  }
}
```

### Putanja proizvoda (za digital passport)

```http
GET /api/blockchain/batches/VERA-2026-001/journey
```

---

## Integracija sa postojećim sistemom

### NestJS modul

```typescript
// src/app.module.ts
import { BlockchainModule } from './blockchain/blockchain.module';

@Module({
  imports: [
    BlockchainModule,
    // ... ostali moduli
  ],
})
export class AppModule {}
```

```typescript
// src/blockchain/blockchain.module.ts
import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';

@Module({
  providers: [BlockchainService],
  controllers: [BlockchainController],
  exports: [BlockchainService],
})
export class BlockchainModule {}
```

### Upotreba u harvesting service-u

```typescript
// Kada farmer registruje novu berbu:
const result = await this.blockchainService.registerBatch({
  batchId: batch.id,
  estateId: batch.estateId,
  harvestDate: batch.harvestDate.toISOString().split('T')[0],
  productType: batch.productType,
});

// Sačuvaj txHash u PostgreSQL:
await this.batchRepository.update(batch.id, {
  blockchainTxHash: result.txHash,
  blockchainExplorerUrl: result.explorerUrl,
  blockchainRegisteredAt: result.timestamp,
});
```

### Frontend React komponenta

```tsx
// Na QR verifikacijskoj stranici:
import { BlockchainVerification } from '@/components/BlockchainVerification';

export function ProductPassportPage({ batch }) {
  return (
    <div>
      <h1>{batch.productType}</h1>
      {/* ... ostali podaci ... */}
      
      <BlockchainVerification
        batchId={batch.id}
        estateId={batch.estateId}
        harvestDate={batch.harvestDate}
        productType={batch.productType}
      />
    </div>
  );
}
```

---

## Troškovi (Polygon Mainnet)

| Akcija | Gas | Cena (~$0.0001/gas) |
|--------|-----|---------------------|
| registerBatch | ~60,000 | ~$0.006 |
| recordEvent | ~45,000 | ~$0.0045 |
| Mesečno (100 batcheva × 4 eventi) | - | ~**$2.46/mesec** |

---

## Sigurnost

- Samo Bio Vera backend wallet može pisati na kontrakt
- Privatni ključ nikad ne izlazi iz `.env`
- Na chain idu samo hash-evi, bez osetljivih podataka
- Owner može dodavati/uklanjati autorizovane backend-e

---

## Fajlovi

```
biovera-blockchain/
├── contracts/
│   └── BioVeraTrace.sol          # Smart contract
├── scripts/
│   └── deploy.js                 # Deploy skripta
├── test/
│   └── BioVeraTrace.test.js      # Test suite
├── backend/
│   ├── blockchain.service.ts     # NestJS service
│   └── blockchain.controller.ts  # REST API
├── frontend/
│   └── BlockchainVerification.tsx # React komponenta
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```
