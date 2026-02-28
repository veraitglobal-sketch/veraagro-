# Blockchain (Polygon) – setup kako treba

## Šta je implementirano

- **Ugovor:** `BioVeraTrace.sol` (Polygon Amoy / Mainnet) – registracija batch-a, događaji (HARVEST → DELIVERY), verifikacija hash-a.
- **Backend:** Pri kreiranju batch-a automatski se poziva `registerBatch` na ugovoru; hash se računa od `batchId + estateId + harvestDate + productType`. Verifikacija normalizuje `harvestDate` na YYYY-MM-DD da se poklapa sa registracijom.
- **Web:** Na `/passport/[batchId]` i `/verify/[batchId]` prikazuje se **BlockchainVerification** (Verified on blockchain + link na tx / Polygonscan).

### Ujednačen tok događaja na chain-u (Product journey)

| Korak u aplikaciji | Chain event | Gde se poziva |
|--------------------|-------------|----------------|
| Kreiranje batch-a (farmer packuje) | `registerBatch` + **HARVEST** (datum berbe) + **PACKAGING** (sada) | `BatchesService.createBatch` |
| Batch prebačen u hub | **HANDOVER** (timestamp + hubId) | `BatchesService.moveToHub` |
| Digital handover završen (isporuka kupcu) | **DELIVERY** (timestamp) + batch status → DELIVERED | `DigitalHandoverService.completeHandover` |

Putem API-ja `GET /api/blockchain/batches/:batchId/journey` dobijaš sve događaje; frontend prikazuje „Registered on blockchain” pa redom Harvest → Packaging → Handover → Delivery.

---

## Checklist za produkciju

### 1. Deploy ugovora (već urađeno za Amoy)

```bash
cd blockchain/files
npm install
# .env: DEPLOYER_PRIVATE_KEY, za Amoy POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
npx hardhat compile
npx hardhat run deploy.js --network polygonAmoy
```

Sačuvaj ispisanu **CONTRACT_ADDRESS**.

### 2. Autorizacija backend wallet-a

Ugovor dozvoljava samo **owner** ili adrese dodate preko `addAuthorizedBackend(address)`.

- Ako u backendu koristiš **isti** privatni ključ kao pri deploy-u, ta adresa je već owner → ništa ne treba.
- Ako backend koristi **drugi** wallet: sa owner wallet-om (npr. MetaMask) pozovi na ugovoru:
  - `addAuthorizedBackend(BACKEND_WALLET_ADDRESS)`  
  Gde je `BACKEND_WALLET_ADDRESS` = adresa iz `BLOCKCHAIN_PRIVATE_KEY` u backendu.

### 3. Env varijable na backendu (Railway / production)

| Variable | Primer | Obavezno |
|----------|--------|----------|
| `POLYGON_RPC_URL` | `https://rpc-amoy.polygon.technology` (Amoy) ili `https://polygon-rpc.com` (mainnet) | da |
| `BLOCKCHAIN_PRIVATE_KEY` | Hex privatni ključ (0x...) | da |
| `CONTRACT_ADDRESS` | Adresa deploy-ovanog BioVeraTrace | da |
| `BLOCKCHAIN_NETWORK` | `polygonAmoy` ili `polygon` | da (za ispravan explorer link) |

Wallet iz `BLOCKCHAIN_PRIVATE_KEY` mora imati MALIC (Amoy) odnosno MATIC (mainnet) za gas.

### 4. Web (Vercel)

- `NEXT_PUBLIC_API_URL` = URL backend API-ja (npr. `https://api.biovera.app`).  
  BlockchainVerification poziva `${NEXT_PUBLIC_API_URL}/api/blockchain/batches/:batchId/verify` i `.../journey`.

### 5. Provera toka

1. Kreiraj batch (npr. Admin → Test batch) sa estate-om i harvest date-om.
2. Backend treba da zapiše batch u bazu i da pozove `registerBatch` na ugovoru; u bazi se popune `blockchainTxHash` i `blockchainRegisteredAt`.
3. Otvori `/passport/[batchId]` ili `/verify/[batchId]` – treba da piše „Verified on blockchain” i link „View transaction” (ili „Polygon”) ka Polygonscan-u.

---

## Ako verifikacija ne prolazi

- **„Not verified”** – proveri da li su `estateId`, `harvestDate` (kao YYYY-MM-DD), `productType` (productName) **identični** onima pri registraciji. Backend sada normalizuje `harvestDate` u verify na YYYY-MM-DD.
- **503 / Not configured** – nedostaju env varijable na backendu ili greška pri inicijalizaciji (pogledaj backend log).
- **Transaction reverted** – backend wallet nije autorizovan na ugovoru; dodaj ga preko `addAuthorizedBackend` sa owner naloga.

---

## Korisni linkovi

- [Polygon Amoy Faucet](https://faucet.polygon.technology/) (testnet MALIC)
- [Amoy Polygonscan](https://amoy.polygonscan.com/)
- Ugovor: `blockchain/files/contracts/BioVeraTrace.sol`
