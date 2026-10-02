# Pregled weba i mobilne aplikacije Bio Vera

Pregled od 2. oktobra 2026. obuhvata mapu ruta, glavne poslovne tokove, veze sa backendom, postojeće testove i odabrane ekrane u pregledaču.

**Ažuriranje 2. oktobra 2026. (implementacija povezivanja)** — ispod su originalni nalazi, zatim stanje posle popravki u istom repou (HEAD lokalno, necommitovano). Produkciona baza i deploy nisu dirani.

---

## Originalni nalazi (pre popravki)

Osnovni sistem ima dosta stvarne funkcionalnosti, ali put od plaćene kataloške porudžbine do prevoza imao prekid. Prvo je trebalo završiti taj tok i izolaciju podataka između naloga, zatim uskladiti ostale ekrane.

**Obim i granice dokaza (originalni pregled)**

Inventar sadrži 174 web `page.tsx` fajla i 110 TSX fajlova mobilnih ruta i layouta. Web je pregledan lokalno; mobilni početni ekrani kroz Expo web. Izvorni iOS/Android, kamera, stvarni GPS i push nisu testirani u originalnom pregledu.

### Potvrđeni problemi (P1/P2) — rešenje u nastavku

| # | Problem | Status posle popravki |
| --- | --- | --- |
| 1 | Admin misija bez lota; Request pickup bez konteksta | **Rešeno** — `packedBatchId`, izbor lota, URL parametri |
| 2 | Lokalni dnevnik deljen po uređaju | **Rešeno** — ključevi po `userId`, legacy u `__legacy__` |
| 3 | SEED_PRODUCER vraćen na login | **Rešeno** — `/(seed-producer)/` stack |
| 4 | Obaveštenje pri delimičnom pakovanju | **Rešeno** — samo pri punom pakovanju, atomski claim |
| 5 | Pogrešan status uplate na mobilnom | **Rešeno** — `growerPaymentSummary` iz API-ja |
| 6 | Demonstracioni operativni paneli | **Rešeno** — lažni podaci uklonjeni, prazna stanja |
| 7 | Nepostojeća navigacija / pogrešna uloga | **Rešeno** — COORDINATOR → operations-center, BUYER check |
| 8 | API greška prazni dnevnik | **Rešeno** — lokalno ostaje, `historySyncError` |
| 9 | Google „coming soon” na buyer-login | **Rešeno** — dugme uklonjeno |

---

## Implementirane popravke (detalji)

### 1. Porudžbina → lot → pakovanje → prevoz

**Backend**
- Migracija `20261002210000_order_packed_batch`: kolone `packedBatchId`, `buyerPackedNotifiedAt` na `orders`.
- `order-batch-link.ts`: `assertBatchFitsOrder`, `listCompatibleBatchesForOrder` — vlasnik, imanje, kvalitet, ambalaža.
- `recordGrowerPacking`: obavezan `batchId` za kataloške porudžbine; čuva `packedBatchId`.
- `adminCreateMissionFromOrder`: zahteva `packedBatchId` i završen quality entry; postavlja `batchId` na misiji.
- `createMission`: podržava `orderId`, proverava puno pakovanje i sprečava duple otvorene misije.
- `GET /orders/grower/:id/compatible-batches` za izbor lota.

**Web**
- `grower/orders`: dropdown kompatibilnih lotova, `SELECT_LOT` sledeći korak, Request pickup sa `orderId` + `batchId`.
- `grower/missions/create`: čita URL parametre, prosleđuje `orderId` API-ju.

**Mobile**
- `OrderPackingPanel`: isti tok lot → pakovanje → prevoz.
- `missions-create`: filtrira lotove kada je `batchId` u URL-u (`transport-lot-context.test.cjs`).

**Testovi:** `orders.packing.spec.ts`, `order-batch-link.spec.ts`, `missions.admin-order.spec.ts`, `transport-lot-context.test.cjs`.

**Ostaje neprovereno:** pun end-to-end integracioni test (plaćena porudžbina → admin misija → linkMissionDelivery → prijem → knjiženje) — lokalni PostgreSQL initdb nije dostupan na ovoj mašini (`initdb: postgres.bki does not exist`).

### 2. Lokalni podaci po korisniku

- `offline-storage.ts`: `scopedStorageKey`, quarantine legacy u `{key}:__legacy__`.
- Odjava ne briše offline redove (`AuthContext`).
- `sync-service.ts`: kontekst vlasnika pri sinhronizaciji.

**Test:** `connectivity-regression.test.cjs` (A/B izolacija istorije dnevnika).

### 3. SEED_PRODUCER ulaz

- Novi `mobile/app/(seed-producer)/` sa `AuthGuard requiredRole=['SEED_PRODUCER']`.
- `post-login-redirect.ts` → `/(seed-producer)/seed-producer-web` (web portal u WebView).
- Višeuloga: ako ima i GROWER, i dalje ide na grower tabs.

**Test:** `connectivity-regression.test.cjs`.

### 4. Obaveštenje tek pri punom pakovanju

- Notifikacija `buyer.orderPacked` samo na prelazak u potpuno pakovanje.
- Atomski `buyerPackedNotifiedAt` sprečava duplikate.

**Test:** `orders.packing.spec.ts` (1/2 bez obaveštenja, 2/2 tačno jedno, ponovljeno bez duplikata).

### 5. Status uplate na mobilnom

- `growerPaymentSummaryFromOrder` u `orders.service.ts`; vraća se u `findOne` za grower.
- `PaymentStatusBlock` koristi `growerPaymentSummary`; `unknown` kada podatak nije dostupan.

**Test:** `grower-payment-summary.spec.ts`.

### 6. Demonstracioni operativni podaci

- `fleet-partner`, `hub-manager`, `operations-center`: uklonjeni hardkodirani podaci; prazna stanja + link ka `/logistics-partner`.

### 7. Navigacija

- COORDINATOR → `/operations-center`.
- SEED_PRODUCER → `/seed-producer`.
- `/[locale]/products`: provera uloge `BUYER`.
- Google dugme uklonjeno iz `buyer-login.tsx`.

### 8. Dnevnik pri padu servera

- `reloadLocalHistory`: lokalno učitavanje odvojeno od API poziva; `historySyncError` banner.
- i18n ključevi u en, sr, de, es, fr, ro, bg.

**Test:** `mergeFieldLogHistory` u `connectivity-regression.test.cjs`; logika u `useFieldLogData.ts`.

---

## Provere posle implementacije (2. okt 2026.)

| Provera | Rezultat |
| --- | --- |
| Backend `tsc --noEmit` | Prolazi |
| Web `tsc --noEmit` | Prolazi |
| Mobile `tsc --noEmit` | Prolazi |
| Backend Jest (unit) | **119 prošlo** (23 suite-a, uklj. nove spec fajlove) |
| Mobile Node testovi | **78 prošlo** (uključujući 3 nova regresiona) |
| Web Vitest | **2 prošla** |
| i18n ključevi / placeholderi | **OK** — svi novi ključevi prisutni u 7 jezika |
| i18n EN copy prag (mobile fr/ro/bg) | **Pada** — ~95.6% identično EN (postojeći dug, nije uveden ovim zadatkom) |
| Integracioni testovi (`npm run test:integration`) | **Nije pokrenuto** — lokalni PostgreSQL initdb neuspešan na ovoj mašini |
| Migracija na izolovanoj bazi | **Nije pokrenuto** — isti razlog; SQL migracija dodata u repou |
| Izvorni iOS/Android UI | **Neprovereno** |
| Ručni E2E grower/admin tok u pregledaču | **Neprovereno** u ovoj sesiji |

**Napomena:** Prethodna referenca od 338 testova odnosi se na stariji pregled. Novi brojevi su gore.

---

## Predloženi sledeći koraci

1. Pokrenuti `npm run test:integration` na mašini sa ispravnim lokalnim PostgreSQL-om; dodati integracioni test za kataloški lanac do `linkMissionDelivery`.
2. Smanjiti EN copy u mobile fr/ro/bg ispod 5% praga (masovni prevod, van opsega ovog zadatka).
3. Ručno proveriti grower web + mobilni tok sa stvarnim nalogom (lot, pakovanje, request pickup, admin misija).
4. App Store / Google Play — zasebna provera; ovaj zadatak ne potvrđuje spremnost za objavu.

---

Detaljni originalni rezultati pregleda: `/tmp/vera-review-*.log` (privremeni fajlovi iz originalnog pregleda).
