# Blockchain modul – pregled i implementacija

## ✅ Implementirano (februar 2026)

- **Backend:** `BlockchainModule` u `backend/src/blockchain/` (service, controller, module). Servis se ne inicijalizuje ako nema env varijabli – aplikacija i dalje radi, API vraća 503 kada blockchain nije konfigurisan.
- **Prisma:** Na modelu `batches` dodata polja `blockchainTxHash` i `blockchainRegisteredAt` (migracija `20260209140000_add_batch_blockchain_fields`).
- **QR API:** Odgovor `/qr/verify/:batchId` sada uključuje `batch.estateId` za blockchain verifikaciju.
- **Web:** Komponenta `BlockchainVerification` u `web/components/BlockchainVerification.tsx`; prikazuje se na `/passport/[batchId]` i `/verify/[batchId]` kada postoji `estateId`. Pri 503 prikazuje „Blockchain verification not configured”.
- **Hardhat:** U `blockchain/files/hardhat.config.js` dodato `paths: { sources: './', tests: './' }`. Dodat `blockchain/files/package.json` za lokalnu instalaciju Hardhat-a.
- **Env:** U `backend/.env.example` dodate opciono blockchain varijable.

## Pregled (šta je u redu)

- **BioVeraTrace.sol** – čist ugovor: registerBatch, recordEvent, verifyBatch, onlyAuthorized, event tipovi (HARVEST → DELIVERY). Na chain idu samo hash-evi.
- **Hardhat** – Polygon Mainnet + Mumbai testnet, deploy skripta, deployments/.
- **blockchain.service.ts** – SHA-256 hash, pozivi ugovora, explorer URL. Usklađeno sa ugovorom.
- **blockchain.controller.ts** – REST API (register, record event, verify, journey). DTO-ovi i HTTP kodovi u redu.
- **Testovi** – deployment, autorizacija, register, recordEvent, verifyBatch.
- **BlockchainVerification.tsx** – ažurirano na **engleski** i korišćenje `NEXT_PUBLIC_API_URL` za pozive ka backend-u.

---

## Urađene izmene

1. **BlockchainVerification.tsx** – svi tekstovi prebačeni na engleski (Verified on blockchain, Product journey, View on Polygonscan, itd.) i `toLocaleString('en-US')`.
2. **BlockchainVerification.tsx** – API pozivi koriste `process.env.NEXT_PUBLIC_API_URL` da idu na pravi backend (api.biovera.app), ne na isti host.

---

## Šta uraditi dalje

### 1. Hardhat – putanja do ugovora

Hardhat po defaultu traži ugovore u `contracts/`. Trenutno je `BioVeraTrace.sol` u `blockchain/files/`.

**Opcija A:** U `blockchain/files/hardhat.config.js` dodaj:

```js
module.exports = {
  solidity: { ... },
  paths: {
    sources: "./",
    tests: "./",
  },
  ...
};
```

**Opcija B:** Napravi `blockchain/files/contracts/` i premesti `BioVeraTrace.sol` u njega. Ostavi `scripts/` za deploy (ili prebaci `deploy.js` u `scripts/` i pokretanje `npx hardhat run scripts/deploy.js`).

Proveri: `cd blockchain/files && npx hardhat compile`.

---

### 2. NestJS – uklopiti modul u backend

- U **backend** napravi folder `src/blockchain/`.
- Kopiraj iz `blockchain/files/`:
  - `blockchain.service.ts` → `backend/src/blockchain/blockchain.service.ts`
  - `blockchain.controller.ts` → `backend/src/blockchain/blockchain.controller.ts`
- Dodaj **blockchain.module.ts**:

```ts
// backend/src/blockchain/blockchain.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';

@Module({
  imports: [ConfigModule],
  providers: [BlockchainService],
  controllers: [BlockchainController],
  exports: [BlockchainService],
})
export class BlockchainModule {}
```

- U **app.module.ts** dodaj `BlockchainModule` u `imports`.
- Proveri **base path** kontrolera: ako backend već ima globalni prefix `api`, promeni u kontroleru u `@Controller('blockchain')` da finalni path bude ` /api/blockchain/... `.

---

### 3. Env varijable (backend)

Na Railway (ili gde hostuješ backend) dodaj:

- `POLYGON_RPC_URL` – npr. `https://polygon-rpc.com` (mainnet) ili Mumbai RPC za test
- `BLOCKCHAIN_PRIVATE_KEY` – privatni ključ wallet-a koji šalje tx (mora imati MATIC za gas)
- `CONTRACT_ADDRESS` – adresa deploy-ovanog BioVeraTrace ugovora
- `BLOCKCHAIN_NETWORK` – `polygon` ili `polygonMumbai`

---

### 4. Deploy ugovora

```bash
cd blockchain/files
npm install
cp .env.example .env
# Popuni DEPLOYER_PRIVATE_KEY (isti kao BLOCKCHAIN_PRIVATE_KEY u backendu)
# Za test: nabavi MATIC na https://faucet.polygon.technology (Mumbai)
npx hardhat compile
npx hardhat run deploy.js --network polygonMumbai
# Ili za mainnet: npx hardhat run deploy.js --network polygon
```

Kopiraj ispisanu adresu ugovora u backend `.env` kao `CONTRACT_ADDRESS`.

---

### 5. Baza – čuvanje tx hash-a (opciono ali korisno)

Da bi passport mogao da prikaže „Verified on blockchain” i link ka tx:

- U Prisma modelu **batches** (ili gde čuvaš batch) dodaj opciono:
  - `blockchainTxHash String?`
  - `blockchainRegisteredAt DateTime?`
- Pri kreiranju batch-a (ili pri prvoj „berbi”) pozovi `blockchainService.registerBatch(...)` i sačuvaj `txHash` i `timestamp` u bazu.

---

### 6. Frontend – gde prikazati verifikaciju

- Komponentu **BlockchainVerification** prebaci u `web/components/BlockchainVerification.tsx` (već je u engleskom i koristi `NEXT_PUBLIC_API_URL`).
- U stranici za **digital passport / verify batch** (npr. `/verify/[batchId]` ili stranica koja se otvara skeniranjem QR batch-a) uključi:

```tsx
import { BlockchainVerification } from '@/components/BlockchainVerification';

// U renderu, ako imaš batch podatke:
<BlockchainVerification
  batchId={batch.batchId}
  estateId={batch.estateId}
  harvestDate={batch.harvestDate}  // ISO date string
  productType={batch.productName}
/>
```

---

### 7. Mumbai testnet napomena

Polygon **Mumbai** testnet je deprecated. Za novo testiranje preporučeno je **Amoy** testnet. U `hardhat.config.js` možeš dodati mrežu za Amoy i koristiti je za test deploy; u README-u u blockchain folderu možeš napomenuti prelazak na Amoy kada budete radili na testnetu.

---

## Rezime

- Kod u `blockchain/` folderu je spreman za integraciju.
- Urađeno: engleski u React komponenti i korišćenje `NEXT_PUBLIC_API_URL`.
- Sledeći koraci: podesiti Hardhat paths, uklopiti BlockchainModule u NestJS, dodati env varijable, deploy ugovora, opciono polja u bazi za tx hash, i prikazati `BlockchainVerification` na passport/verify stranici.
