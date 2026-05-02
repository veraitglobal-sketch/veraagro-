# Follow-up backlog (detaljno) — posle grower UX, finansija i escroua

**Datum reference:** maj 2026 (nakon Faze E/F u `GROWER_WEB_MOBILE_PRIORITY_PLAN.md`).  
**Svrha:** Jedna **nova lista** koja na osnovu onoga što je urađeno u kodu eksplicitno kaže: *šta sada držimo kao istinu*, *gde su rupe*, *šta sledi* — sa prioritetima i kriterijumima „gotovo“.

**Povezano:** [GROWER_WEB_MOBILE_PRIORITY_PLAN.md](GROWER_WEB_MOBILE_PRIORITY_PLAN.md) · [PAGE_IMPROVEMENTS_AND_LINKING_BACKLOG.md](PAGE_IMPROVEMENTS_AND_LINKING_BACKLOG.md) · [WEB_MOBILE_CHANNEL_PARITY_PLAN.md](WEB_MOBILE_CHANNEL_PARITY_PLAN.md)

**Legenda prioriteta:** **P0** — bezbednost / pogrešna isplata / regresija · **P1** — poslovna ispravnost (finansije) · **P2** — paritet UI/API · **P3** — poliranje, i18n, dokumentacija

---

## 1. Šta je urađeno (sa čime se mora računati u nastavku)

### 1.1 Grower web — poruke o greškama (P4.2)

- **Obrazac:** `web/lib/grower-api-error.ts` — `growerApiErrorOrT` (wraps zajednički helper); **`web/lib/api-error.ts`** — `apiErrorOrT` / `axiosLikeMessage` za ostale web uloge (isti prioritet: telo odgovora → lokalizovan fallback).
- **Ključne izmene u sesiji:**
  - **`/grower/missions/create`:** `formatMissionCreateError` više ne lepi `HTTP …` + sirovi JSON; mreža → kratka lokalizovana poruka; ostatak → API `message` ili `grower.missionCreate.errSubmitFailed` (i18n u `en`/`sr`/`de`/`fr`/`ro`/`bg`/`es`).
  - **`/grower/batches`:** modal „Detalji partije“ pri grešci na `getOne` prikazuje **`growerPages.batchDetailsLoadFailed`** umesto tihe praznine.
  - **`/grower/profile`:** učitavanje profila koristi **`growerApiErrorOrT`** oko **`grower.profilePage.alertLoadFailed`**.
  - **`/grower/materials`:** prvi `catch` pri fetch-u kataloga koristi **`growerApiErrorOrT`**.
  - **Ostale uloge (web):** `apiErrorOrT` na admin (ukl. Vera Insights, estates, security, standards, supplier-stores, HACCP, farm detail, …), kompletan buyer-portal, logistics-partner (misije, handover, receiver, vozila, vozači, javna partner stranica), supplier (`dashboard`, `messages`, `orders`, `catalog`, `settings`, package-badges).
- **Implicacija:** **Admin / buyer-portal / logistics-partner / supplier** i **javni / producer / login** rutovi u `web/app` + **`QRScanner`** koriste **`apiErrorOrT`** na uobičajenim API / `fetch` greškama (vidi **§3 P2.2** i **`WEB_PUBLIC_API_ERROR_UX_BACKLOG.md`**).

### 1.2 Financial dashboard — podela grower vs platform (Faza F)

- **API:** `GET /financial-dashboard` (`FinancialDashboardController` + `FinancialDashboardService`).
- **Admin (`roles` sadrži `ADMIN`):** `userId` se ne prosleđuje → **`dashboardRole: 'PLATFORM'`**; zbir platform procena po **DELIVERED** partijama (seed/transport/pakovanje/sertifikat/osiguranje/Vera bonus model — i dalje **procene po kg**, ne knjiga).
- **Grower (ostali JWT):** **`dashboardRole: 'GROWER'`**; zbirovi **`payments.farmerAmount`** samo za porudžbine gde je **`getFarmerOwnerUserId(order)`** = taj korisnik; podela po **`PaymentStatus`**: `RELEASED` / `IN_ESCROW` / ostalo (`PENDING`, itd.).
- **Dodata polja u `summary` (grower):** `farmerOrderShareTotal`, `farmerShareReleased`, `farmerShareInEscrow`, `farmerSharePending`, `estimatedVeraBonusDeliveredLots` (+ kompatibilni ključevi gde je smisleno).
- **Web `/grower`:** podnaslov i kartice biraju se po `dashboardRole !== 'PLATFORM'`; grower vidi isplate/eskrou; admin koji otvori isti ekran sa **`PLATFORM`** odgovorom vidi staru platform mrežu kartica.
- **i18n:** `financialOverviewSub`, `financialOverviewSubGrower`, `farmerShare*`, `estimatedVeraBonus*` u sedam jezika (`web/locales/*.json`).

### 1.3 Escrow — `splitDetails` pri otpuštanju

- **`PaymentsService.releaseEscrowPayment`:** pri kreiranju uplate **`splitDetails.driver`** je kanon; kod je ranije upisivao **`splitDetails.users`** → **ispravljeno**; ostavljen **fallback** na legacy **`users`** u JSON-u.
- **Još uvek nije rešeno u ovom PR-u:** da li se pri **`include`** učitava **`delivery.mission`** sa potpisom / temperaturama — vidi §3.1.

### 1.4 Dokumentacija

- **`PAGE_IMPROVEMENTS…`:** P4.2 „Predlog“ kolona ažurirana (grower web batch).
- **`GROWER_WEB_MOBILE_PRIORITY_PLAN.md`:** Faza F (finansije/escrow) + prethodne faze.
- **`WEB_PUBLIC_API_ERROR_UX_BACKLOG.md`:** javni / producer / login web — `apiErrorOrT` (maj 2026).
- **`MOBILE_API_ERROR_UX_BACKLOG.md`:** predlog sledećeg vala za **mobilni** `catch` / API poruke.

---

## 2. Arhitekturna analiza (kratko, ali važno za planiranje)

| Tema | Stanje u kodu | Riziko |
|------|---------------|--------|
| **Izvor istine za „grower prihod“** | Order `payments.farmerAmount` + status; farmer određen **`getFarmerOwnerUserId`** | Više stavki na istoj porudžbini / deljene porudžbine — danas se ne proporcionalno deli po `order_items`; celokupan `farmerAmount` ide farmeru sa porudžbine (što odgovara trenutnom modelu jedne uplate po porudžbini). |
| **Platform marža na grower UI** | Uklonjena sa grower pogleda na dashboardu | Grower i dalje **ne vidi** seed margin / insurance commission kao svoj prihod (ispravno). |
| **Vera bonus na dashboardu** | I dalje **model** (€/kg × količina DELIVERED partije), ne obavezno knjiženo u `wallets` | Korisnik može pomisliti da je bonus već isplaćen — copy („estimate“) i opciono usklađivanje sa **`vera-bonus`** / wallet transakcijama. |
| **`FinancialDashboardService` (platform)** | Uplata `platformFee`, standards, inventar/stavke, total porudžbine gde postoje; ostatak heuristika (transport, sertifikacija) | Nema `InsurancePolicy` u šemi — osiguranje ostaje proxy; seme bez `SeedBatch` cena koristi inventar vs. linije ili €/kg fallback. |
| **Otpuštanje eskroua** | **`creditWalletTx`** za farmera i vozača u `$transaction`; **platform fee:** `PLATFORM_FEE` na wallet korisnika iz **`PLATFORM_WALLET_USER_ID`** (opciono env) | Bez env-a platformski deo nije u knjizi wallet-a (samo log upozorenja). |

---

## 3. Novi backlog (prioritetizovano)

### P0 — Integritet isplate i escroua

**Stanje u kodu (maj 2026):** `PaymentsService` sada učitava **`missions` + `temperature_logs`** i **`deliveries.digital_handovers`**; uklonjena je referenca na nepostojeće `mission.digitalSignatures`. Terminalni statusi isporuke: **`CONFIRMED` / `COMPLETED` / `DELIVERED`**. Za **`DELIVERED`** (digital handover putanja) zahtevan je **`digital_handovers`** u **`COMPLETED`** sa **`signature`** ili **`completedBy`**. Hladni lanac: bar jedan **`temperature_log`** na misiji ili **`temperature`** na završenom handoveru; opciono pravilo 80% trajanja puta ako postoje **`pickedUpAt`**, **`completedAt`** i ≥2 loga. Ako kupac potvrdi **QR** (`CONFIRMED`/`COMPLETED` + **`deliverySignature`** ili **`confirmedAt`**), release je dozvoljen i bez logova hladnog lanca. **`RELEASED`** → idempotentan odgovor bez ponovnog knjiženja. **`createEscrowPayment`** baca ako zbir env procenata nije ≈100% (tolerancija 0.02). **`creditWalletTx`** unutar **`prisma.$transaction`** zajedno sa **`payments.updateMany`** (samo red u **`IN_ESCROW`**). **Još otvoreno:** automatizovani smoke / unit testovi za concurrent release.

| ID | Zadatak | Zašto | Prihvatni kriterijumi |
|----|---------|------|------------------------|
| **P0.1** | **`releaseEscrowPayment`:** uveriti se da `order` uključuje podatke koje provera koristi | Izbegavati `undefined` i nemoguć release zbog pogrešnog modela | **Delom urađeno** (include + pravila); **ostaje** automatizovan smoke |
| **P0.2** | **Idempotentnost release-a** | Bez dvostrukog knjiženja | **Urađeno:** `updateMany` sa `status: IN_ESCROW` unutar **`$transaction`** + wallet koraci u istoj transakciji; drugi konkurentni poziv dobija `Payment already released` |
| **P0.3** | **Zbir procenta** env split | Ispravan escrow | **Urađeno** u `createEscrowPayment`; po želji unit test |

### P1 — Finansijska transparentnost i admin

| ID | Zadatak | Zašto | Prihvatni kriterijumi |
|----|---------|------|------------------------|
| **P1.1** | **Admin stranica ili sekcija** koja poziva **`GET /financial-dashboard`** bez grower filtera i prikazuje **`dashboardRole: PLATFORM`** metrike | Trenutno web admin nema dediciran ekran; operativa ne vidi isti JSON iz brauzera | **Urađeno:** `/admin/finance-overview` (ADMIN / SUPER_ADMIN). |
| **P1.2** | **Platform fee posle release-a** | Blueprint P4 kaže escrow split uključuje platformu | **Urađeno (maj 2026):** `WalletTransactionType.PLATFORM_FEE` + `creditWalletTx` u istoj `$transaction` kao farmer/vozač; `PLATFORM_WALLET_USER_ID` (UUID `users`) u env — ako nije setovan, farmer/vozač i dalje, platform deo samo **warn** u logu |
| **P1.3** | **Uskladiti `grower-portal` financial-status** sa `payments` | `getFinancialStatus` već koristi `farmerAmount` i statuse; proveriti edge slučajeve (više porudžbina po partiji, nema payment zapisa) | **Urađeno (maj 2026):** jedinstvene porudžbine po `orderId`, filtar **`getFarmerOwnerUserId === growerId`**, status iz **`Payment.status`** (RELEASED / IN_ESCROW / …), polja **`inEscrowAmount`**, **`pendingOtherAmount`**; web portal + mobilni blok koriste isti API odgovor |
| **P1.4** | **Zameniti procene u `FinancialDashboardService` (platform)** stvarnim podacima gde postoje tabele | Seed margin / insurance iz Prisma blueprint modela | **Delom urađeno (maj 2026):** `bio_vera_standards` (pakovanje, Vera bonus), marža semena kad postoji `inventory` + stavke porudžbine, osiguranje kao 2% od `orders.totalAmount`, `platformFeeBookedTotal` iz `payments.platformFee` (dedupe po porudžbini); transport i ušteda sertifikacije i dalje heuristika |

### P2 — Paritet kanala i grower iskustvo

| ID | Zadatak | Zašto | Prihvatni kriterijumi |
|----|---------|------|------------------------|
| **P2.1** | **Mobilni grower** — isti finansijski sažetak kao web (`/financial-dashboard` grower odgovor) | Wallet tab na mobilnom vs web blok; izbegnuti duple „izvore istine“ | **Urađeno (maj 2026):** Početna (`DashboardScreen`) + **Wallet** učitavaju `GET /financial-dashboard`; sekcija sa istim sumama kao web grower kartice (+ upozorenje ako je `dashboardRole: PLATFORM`) |
| **P2.2** | **P4.2 nastavak:** `apiErrorOrT` (`web/lib/api-error.ts`) na **supplier / logistics / admin / buyer** web | Konzistentan UX kao na grower | **Urađeno (maj 2026):** uloge (admin, buyer-portal, logistics-partner, supplier) + **javni / producer / login** (`WEB_PUBLIC_API_ERROR_UX_BACKLOG.md`); nema `catch (err: any)` u `web/`. |
| **P2.3** | **`/grower`:** kada backend ne šalje `dashboardRole` (stari deploy), UI tretira kao grower — prikazuje nove kartice sa 0 | Već ponašanje: `!== 'PLATFORM'`; dokumentovati potrebu za redeploy backend+web zajedno | Release notes ili feature flag opciono |

### P3 — UX, prazni tokovi, i18n

| ID | Zadatak | Zašto | Prihvatni kriterijumi |
|----|---------|------|------------------------|
| **P3.1** | **P4.1:** prazan state + primarni CTA na glavnim listama po ulozi | PAGE_IMPROVEMENTS i dalje 🔴 za P4.1 | Najmanje 3 uloge pokrivene (npr. buyer prazna korpa, logistics prazna lista, supplier prazne porudžbine) |
| **P3.2** | **Copy finansija:** jedna rečenica ispod kartica „Kako se računa“ → link na FAQ ili internu pomoć | Farmeri 60+; smanjiti zabunu eskrou vs „već primljeno“ | **Urađeno (maj 2026):** `grower.dashboard.financialExplainShort` + link na `/grower/portal` (sve web lokacije en/sr/de/fr/ro/bg/es) |
| **P3.3** | **regression E2E** (Playwright ili ručni script) za: login grower → `/grower` vidi grower kartice → `/grower/portal` finansijski segment | Sprečava povratak platform brojeva na grower pogledu | Checklist koji se može ponoviti pre release-a |

---

## 4. Tehnički dug (izvrstan za „sprint 0“)

1. **`OperationsService.getFinancialFlow`** — i dalje hardkodirane cene (`8.5`, `12.0` EUR/kg); nevezano za dashboard ali konflikt sa Blueprint „dinamičkim cenama“.
2. ~~**`payments.service` release**~~ — **(maj 2026):** usklađeno sa šemom + **interaktivna transakcija** za release; vidi §3 P0.
3. **Kontroler finansijskog dashboarda** — provera samo `roles?.includes('ADMIN')`; multi-role (**SUPER_ADMIN** bez stringa `ADMIN`?) edge case — uskladiti sa ostatkom auth-a.
4. **Konzistentnost `PaymentStatus`:** `createEscrow` postavlja `IN_ESCROW`; growerski rollup tretira `PENDING` kao „pending/other“ — dokumentovati životni ciklus.

---

## 5. Matrica testova (minimal smoke pre merge-a finansija)

| Korak | Akcija | Očekivano |
|-------|--------|-----------|
| 1 | JWT **grower**, `GET /financial-dashboard` | `dashboardRole === 'GROWER'`, numerička polja prisutna |
| 2 | JWT **admin**, isti endpoint | `dashboardRole === 'PLATFORM'`, nisu grower-specifična polja obavezna ili su 0 |
| 3 | Grower **bez** ikakvih `payments` | Sume 0, nema 500 |
| 4 | Web `/grower` sa odgovorom iz koraka 1 | Četiri kartice + Vera bonus blok; podnaslov `financialOverviewSubGrower` |
| 5 | Opciono: jedna porudžbina sa `payments` IN_ESCROW | `farmerShareInEscrow` > 0 |

---

## 6. Kako održavati ovu listu

1. Kada završite stavku — premestite je u **§1** (izvršeno) u ovom fajlu ili u Fazu G/H u `GROWER_WEB_MOBILE_PRIORITY_PLAN.md` i obrišite/redukujte red u **§3**.
2. Novi finansijski zahtevi iz `.cursorrules` (VAT, split, Vera bonus) — dodati red u **§3 P1** sa eksplicitnom vezom na model (`orders`, `payments`, `TaxCalculation`).
3. Ne duplirati ceo kanal parity — za socket/env/CI ostaviti `WEB_MOBILE_CHANNEL_PARITY_PLAN.md`.

---

*Kraj dokumenta — generisano kao operativni follow-up na analizu poslednjih izmena u repou.*
