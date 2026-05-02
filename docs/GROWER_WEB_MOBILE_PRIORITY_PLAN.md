# Grower: web i mobilni — prioritet, paritet kanala, plan rada

**Svrha:** Jedan dokument koji drži fokus na **grower (proizvođač)** površinama: da **web** (`/grower/*`) i **mobilni** (`mobile/app/(producer)/*`) rade **bez grešaka**, da su **funkcionalno skladni** (isti backend kanal, isti tokovi gde ima smisla), i da imamo jasan redosled šta još treba uraditi.

**Povezano:** opšti kanal + CI/sockets — [`WEB_MOBILE_CHANNEL_PARITY_PLAN.md`](WEB_MOBILE_CHANNEL_PARITY_PLAN.md); linkovanje/rute — [`PAGE_IMPROVEMENTS_AND_LINKING_BACKLOG.md`](PAGE_IMPROVEMENTS_AND_LINKING_BACKLOG.md); **detaljan follow-up backlog (P0–P3, finansije, test matrica)** — [`FOLLOWUP_BACKLOG_DETAILED.md`](FOLLOWUP_BACKLOG_DETAILED.md).

**Legenda:** 🟢 radi / dogovoreno · 🟡 delimično / treba provera · 🔴 nedostaje ili često puca · **[Q]** obavezan smoke u uređaju ili browseru

---

## 0. Izvršeno (iteracija)

- **Faza A:** provereni `web/.env.example` i `mobile/.env.example` (isti API URL šablon); `npm run typecheck` čist na **web** i **mobile**; nema `TODO`/`FIXME` u grower/producer putanjama iz checkliste.
- **Faza B (dashboard — prvi korak):** web `/grower` — i18n za skorašnje misije (`grower.dashboard.recentMissions` / `viewAll`), `loc()` za rute (`season`, `profile`, `fields`, `portal`, kartice gazdinstava); prevod statusa misije u listi preko `adminPages.missions.statuses`. Mobilni `DashboardScreen` — uklonjen engleski „My Farm“, koristi `producer.dashboard.defaultFarmName` (en + sr-partial).
- **Faza B (web dashboard CTA):** `GrowerDashboardHomeWorkflow` na `/grower` — isti redosled sekcija kao mobilni `FarmerHomeSection` (uputstva → parcele → zasadi → dnevnik → materijali → dozvoljeno / zabranjeno / sertifikati → logistički blok → „Još“); linkovi kroz `loc()` i `/producer/field-entry` za sken.
- **Faza B (notifikacije + grower URL mapa):** mobilni `webGrowerPathToMobileHref` + `resolve-notification-action` — širi `/grower/*`, `?estate=` → `estates/[id]`, `/grower/portal?missionId=` → `mission/[id]`, `/producer/field-entry` → `scanner`.
- **Faza B (B2B thread + store deep link):** `b2b-thread/[threadId]` → `b2b-supplier?threadId=`; lista na `partner-orders`; `/grower/where-to-buy/store/:id` → `/b2b-supplier/:id`.
- **Faza C (UX — početni ekran growera):** mobilni `FarmerHomeSection` — veći redovi (`minHeight` 80), ikone 52×52, naslovi 17px / opisi 14px, logistika i „Još“ čipovi `minHeight` 56; web `GrowerDashboardHomeWorkflow` — `text-lg` / `text-base`, veće kartice, `focus-visible` prsten, tamniji opis (`gray-700`). **`NextStepCard` + `SyncQueueStrip`** — veći CTA (`minHeight` ~48–52), naslovi 16–17px. **Alerts kartica** na Početnoj — `minHeight` 72, tekst 14–15px; web **`GrowerPageHeader`** — opis stranice `text-base text-gray-700` (čitljivije na svim `/grower/*`). **`DashboardHeader`** (mob) — naslov gazdinstva 22px, partner linija 14px; web **`/grower`** — KPI labele `text-base`, kartica dnevnika `text-base` + CTA `min-h-[48px] text-base`.
- **Faza E (sinhronizacija 2026):** web **`/grower`** — prazne misije sa CTA (partije, zahtev transporta), finansijski blok uvek prikazan (`financialUnavailable*`), lokalizovani statusi gazdinstva (`estateStatuses`); web **`/grower/portal`** — prevod koraka putovanja (`portalMilestone_*`), finansijskih poruka sa API-ja (`portalFinancialMsg_*`), ETA naslov, greška učitavanja journey map, EUR format po jeziku, status misije preko `adminPages.missions.statuses`; mobilni **`partnerSignInHref()`** / **`/login?partner=1`** (alias `partner-login`); mobilni **missions-create** + **batches** — `getBatchStatusLabel` / `batch-status-i18n` uključujući `QUALITY_VERIFIED`; web **supplier** — `supplier.messagesPage` / `ordersPage` / `orderStatusB2B` za `de`/`fr`/`ro`/`bg`/`es`.
- **Faza F (finansije / escrow):** **`GET /financial-dashboard`** za ne-admin korisnika sada vraća **`dashboardRole: GROWER`** i zbir **`payments.farmerAmount`** po porudžbinama gde je `getFarmerOwnerUserId` = taj grower (released / IN_ESCROW / ostalo), umesto platform procena (seed/insurance marže) na grower dashboardu; **`releaseEscrowPayment`** ispravljen da ažurira **`splitDetails.driver`** (ranije pogrešno `users`). Admin i dalje dobija platformsku procenu (`dashboardRole: PLATFORM`). **Faza G (escrow release):** `releaseEscrowPayment` učitava **`missions` + `temperature_logs`** i **`digital_handovers`**; terminalni statusi isporuke **DELIVERED / CONFIRMED / COMPLETED**; hladni lanac ili buyer QR potvrda; idempotentan odgovor za **`RELEASED`**; validacija zbira procenata pri kreiranju eskroua; ispravni **`creditWallet`** argumenti; **`prisma.$transaction`** sa **`updateMany`** (uslov `IN_ESCROW`) + **`creditWalletTx`** (+ opcioni **`PLATFORM_FEE`** na trezor korisniku). **Mobilni:** Početna i Wallet učitavaju isti endpoint kao web `/grower` (sekcija **Financial overview**); admin JWT na mobilnom dobija kratko upozorenje (**`PLATFORM`** view).

## 1. Šta znači „isti kanal“ za growera

| Sloj | Zahtev |
|------|--------|
| **API** | Isti `NEXT_PUBLIC_API_URL` (web) i `EXPO_PUBLIC_API_URL` (mobilni) po okruženju; isti REST kontrakt za istu akciju. |
| **Realtime** | Gde grower dobija notifikacije / ažuriranja partija — isti model kao u planu pariteta (socket + fallback), ne različita ponašanja bez dokumentacije. |
| **Offline** | Web: lokalni outbox + banner (`GrowerOfflineOutboxBanner`); mobilni: red sinhronizacije (`SyncQueueStrip`). Isti **namera**: ništa iz terena se ne gubi; ponovni pokušaj kad ima mreže. |
| **Autentikacija** | Isti JWT / isti „scope“ uloga `FARMER`/`GROWER`; rute zaštićene konzistentno. |
| **Javni linkovi** | QR, profil, batch — isti URL šabloni gde je proizvod isti (vidi P4.3 u backlogu za javne rute). |

---

## 2. Matrica: web ruta ↔ mobilna ruta

**Web sidebar** (izvor istine za redosled modula): `web/lib/grower-nav.tsx`.

**Mobilni ulaz:** tabovi `/(producer)/(tabs)` (Početak, Koraci, Proizvodi, Profil); ostalo preko stack ekrana i deep linkova sa početne / koraka.

| Prioritet | Web (kanon) | Mobilni (Expo Router) | Napomena za paritet |
| :---: | --- | --- | --- |
| P0 | `/grower` | `/(producer)/(tabs)/index` | Iste CTA grupe kao `FarmerHomeSection`: web `GrowerDashboardHomeWorkflow` ispod offline bannera. 🟢 |
| P0 | `/grower/season` | `/(producer)/(tabs)/steps` | GrowerJourney; isti `shared/lib/grower-journey.ts`. 🟢 |
| P0 | `/grower/fields` | `/(producer)/estates`, `estates/new`, `estates/[id]` |„Polja“ vs „Njive“ copy; isti API; redirect `/producer/estates*`. 🟢 |
| P0 | `/grower/plantings` | `/(producer)/plantings` | 🟢 |
| P0 | `/grower/materials` | `/(producer)/materials` | 🟢 |
| P0 | `/grower/batches` | `/(producer)/batches` → `batch/[id]` | 🟢 |
| P0 | `/grower/field-diary` | `/(producer)/(tabs)/field-log` (hidden tab) ili push sa home | 🟢 |
| P0 | `/producer/field-entry` | `/(producer)/scanner` + formular terenskog unosa | Integrity guard na oba. 🟢 |
| P0 | `/grower/package-badges/scan` | `/(producer)/package-badges` / sken | 🟢 |
| P1 | `/grower/package-badges/print-order` | `/(producer)/package-badges-print-order` | Rute usklađene. 🟢 |
| P0 | `/grower/quality-entry` | `/(producer)/quality-entry` | 🟢 |
| P0 | `/grower/compliance-photos` | `/(producer)/compliance-photos` | 🟢 |
| P1 | `/grower/where-to-buy` (+ `messages`, `thread`, `store`) | `/(producer)/(tabs)/shop` → proizvodi, `partner-orders`, `b2b-thread/[id]`, `b2b-supplier/[userId]` | **messages** → lista partner-orders; **thread** → `b2b-thread`; **store/:id** → `b2b-supplier/:id`. 🟢 |
| P0 | `/grower/partner-orders` (+ thread) | `/(producer)/partner-orders`, `b2b-supplier` + `threadId` | Thread URL + `b2b-thread`. 🟢 |
| P0 | `/grower/missions/create` | `/(producer)/missions-create` | 🟢 |
| P0 | `/grower/portal` | `/(producer)/missions` + `mission/[id]` | 🟢 |
| P1 | — | `/(producer)/(tabs)/harvest` | **Mob-first tab** — namerno **bez obaveznog web pariteta**; na webu sličan sadržaj kroz **Zasadi** (`/grower/plantings`), **Dnevnik polja**, **Uputstva** (GrowerJourney). |
| P1 | — | `/(producer)/(tabs)/wallet` | **Mob-first** — nema dedicirane grower wallet stranice na webu; pregled transakcija je prioritet na telefonu, uz finansijski blok na `/grower` i misije u portalu. |
| P1 | — | `growth-journal`, `vera-insights`, … | **Mob-first** ili delimično na web sidebaru (npr. materijali, partije); nije obećan pun P0 paritet — vidi redom grower meni na web vs stack na mob. |
| P0 | `/grower/profile` | `/(producer)/(tabs)/profile`, `settings` | 🟢 |

*Tabela je živa:* nakon svake iteracije ažurirati kolonu „Napomena“ i oznake P0/P1.

---

## 3. Funkcionalni kriterijum: „bez grešaka“

Za **svaku** P0 stavku iz matrice:

1. **[Q] Učitavanje** — prazan nalog vs nalog sa podacima; nema nekontrolisanog crasha; poruka ako API padne.
2. **[Q] Validacija** — barkod / GPS / obavezna polja: isto ponašanje web vs mob (blokada + jasna poruka).
3. **[Q] Submit** — uspeh → osvežavanje liste ili redirect; neuspeh → čitljiva greška (ne samo „Error 500“ ako može prevod).
4. **[Q] Uloga** — korisnik bez grower uloge ne vidi grower shell (ili dobija jasan redirect).
5. **[Q] Offline** — barem jedan smoke: uključi airplane mode, unesi crtež/zapis, vratite mrežu, proveri da outbox isporuči.

---

## 4. Tehnički zadaci (redosled rada)

### Faza A — Osnova kanala (pre feature radova)

- [x] Provera env: isti API URL za web i mob u tom okruženju (vidi P0.1 u parity planu).
- [x] `npm run typecheck` u `web` i `mobile`; ispraviti sve što grower ekrani uvoze.
- [x] Brzi grep: `TODO|FIXME` unutar `web/app/grower`, `web/components/grower`, `mobile/features/grower`, `mobile/app/(producer)`.

### Faza B — P0 paritet po modulima (iterativno)

- [x] **Dashboard (prvi korak):** web — i18n misije + lokalizovani linkovi; mob — i18n podrazumevanog naziva farme.
- [x] **Dashboard (CTA matrica):** web — `GrowerDashboardHomeWorkflow` (paritet redosleda sa `FarmerHomeSection`).
- [x] **Njive / polja:** kanon `/grower/fields`, redirect `/producer/estates*`, mobilni `?estate=` + notifikacije; model `estate id` isti.
- [x] **Terenski unos (notifikacije):** `actionUrl` `/producer/field-entry` na mobilnom resolve-uje u `/(producer)/scanner` (UX razlike web PWA vs native ostaju).
- [x] **Misije (API):** `grower/portal` i `mission/[id]` već koriste iste `grower-portal` + `missions` endpoint-e; tracker deep link `?missionId=` i dalje kao i u web portalu.
- [x] **Partner / where-to-buy (thread + store + messages):** thread → `b2b-thread` + `b2b-supplier?threadId=`; **store** → `b2b-supplier/[id]`; **messages** (i ostali `where-to-buy/*` osim thread/store) → `partner-orders` preko prefiksa. Poseban mobilni inbox kao web `/messages` nije potreban — ista lista nitiju na partner-orders.

### Faza C — i18n i UX (farmer-friendly)

- [x] **Mapiranje ključeva (sažetak):** navigacija i kratki naslovi — web `grower.nav.*` (`web/locales/*.json` pod `grower.nav`) vs mob `navigation.*` + `producer.tabs.*` + `producer.dashboard.farmer.*`; workflow kartice na web dashboardu: `grower.dashboard.workflow.*` (paritet sa `producer.dashboard.farmer.*`). Novi zajednički tekstovi po potrebi u `shared/lib/grower-journey.ts` + JSON putovanja, ne treći komplet duplikata.
- [x] **Font / touch — grower početna + workflow:** vidi §0 Faza C; ostali grower ekrani po potrebi isti princip (≥44pt, copy ≥16px gde je glavni tekst).

### Faza D — Regresije i evidencija

- [x] **Evidencija:** matrica u ovom fajlu + grower smoke u [`WEB_MOBILE_CHANNEL_PARITY_PLAN.md`](WEB_MOBILE_CHANNEL_PARITY_PLAN.md) (sekcija „Smoke (grower)“).
- [x] **Redovno posle većih izmena:** osvežiti kolone u matrici (ovaj fajl ažuriran — P1 ekspliciran, print-order 🟢).

---

## 5. Brza audit komanda (grower scope)

```bash
# Web grower rute i komponente
rg "grower/" web/app/grower web/components/grower web/lib/grower-nav.tsx --glob '*.{tsx,ts}'

# Mobilni producer rute
rg "\\(producer\\)" mobile/app --glob '*.tsx' | head -60

# Mogući hardkodovani stringovi na mobilnom grower UI (grubo)
rg "<Text[^>]*>\\s*[A-Z]" mobile/features/grower --glob '*.tsx' | head -40
```

---

## 6. Definicija završetka (MVP za grower kanal)

- Svi **P0** redovi u matrici imaju 🟢 ili sviesno dokumentovano **izuzetak** (npr. „samo mobilno“).
- Nijedan P0 tok nema otvoren **bloker** (crash, pogrešan API, izgubljeni offline zapis u happy path-u).
- `WEB_MOBILE_CHANNEL_PARITY_PLAN.md` — grower deo (notifikacije, env) nije u kontradikciji sa stanjem u kodu.

---

## 7. Lista+ — backlog (šta još dodati ili produbiti)

**Lista+** znači: prioriteti, kratak opseg, i veza na kanal (vidi [WEB_MOBILE_CHANNEL_PARITY_PLAN.md](WEB_MOBILE_CHANNEL_PARITY_PLAN.md) — Q1–Q3, P2.3, P3.1). Označeno: 🔴 nema / veliki jaz · 🟡 delimično · tip **P** = proizvodni izbor (web vs app).

| # | Tema | Stanje | Šta uraditi (konkretno) |
|---|------|--------|-------------------------|
| L1 | **Wallet (novčanik) na webu** | 🟡 mob tab, web bez rute | **P:** ili `/grower/wallet` (ili pod `/grower/profile#wallet`) sa istim API-jem kao mobilni tab, ili zvanično „samo u aplikaciji“ + CTA ka store / deep link; ažurirati §2 matricu. |
| L2 | **Harvest tab ↔ web** | 🟡 mob `(tabs)/harvest`, web kroz plantings/dnevnik | **P:** dedicirana `/grower/harvest` (lite) ili jači CTA blok na `/grower` i `/grower/plantings` koji kopira mobilni sadržaj; smoke **[Q]** na oba. |
| L3 | **Growth journal / Vera insights** | 🔴 mob stack, web bez pandana | Inventar ekrana u `mobile/app/(producer)` → odluka po modulu: web stranica u sidebaru, embed u postojeću (npr. plantings), ili dokumentovati izuzetak. |
| L4 | **Offline / outbox UX** | 🟡 | Q2: **Urađeno (batch 2):** `GrowerOfflineOutboxBanner` — rasklopiva lista do 5 pending stavki + „+ još N“, povratna poruka posle „Sync now“ (`outboxSyncDone` / `outboxSyncPartial`), i18n za `outbox*` u `de`/`fr`/`ro`/`bg`/`es`. **Ostaje:** isti nivo na mobilnom / detaljnija istorija grešaka po zapisu. |
| L5 | **i18n — svi jezici** | 🟡 | **Urađeno (batch 1):** `fieldEntry*`, `smartLock*`, `fieldEntryOffline*`, `apiErrorGeneric` u `de`/`fr`/`ro`/`bg`/`es` + `en`/`sr`. Ostaje: ostali `growerPages` ključevi koji još padaju na fallback; grep hardkod EN po `/grower/*`. |
| L6 | **„Sirovi“ API tekstovi** | 🟡 | **Urađeno:** helper `growerApiErrorOrT`; glavne grower stranice; **batch 2:** misija create — kratka poruka (API `message` ako postoji, bez HTTP+JSON), profil učitavanje, materijali fetch, modal „Detalji partije“ pri grešci `GET` jedne partije; i18n `errSubmitFailed`, `batchDetailsLoadFailed`. Dalje: admin/buyer/logistics web po istom obrascu. |
| L7 | **Producer legacy rute** | 🟡 | `/producer/estates`, `/producer/scanner` — vizuelni i jezički paritet sa grower shellom (card tokens iz `.cursorrules`); razmotriti redirect ka `/grower/fields` gde nema razloga za poseban UI. |
| L8 | **Deep link / notifikacije** | 🟢 osnova | Periodično: novi `actionUrl` obrasci → `resolve-notification-action` + `webGrowerPathToMobileHref`; regresija iz [WEB_MOBILE_CHANNEL_PARITY_PLAN.md](WEB_MOBILE_CHANNEL_PARITY_PLAN.md) smoke § „Notifikacije“. |
| L9 | **Integrity guard paritet** | 🟡 proveriti | Barkod + GPS + whitelist đubriva: ista pravila i poruke web `OfflineEntryForm` / sync vs mobilni terenski tok; dokumentovati ograničenja PWA (npr. kamera). |
| L10 | **Admin / misije copy zajednički** | 🟢 delom | Gde grower vidi statuse misija, držati jedan skup ključeva (`adminPages.missions.statuses` ili zajednički `grower.missions.*`) da web i mob ne divergiraju. |
| L11 | **Javni URL-ovi (plot / passport / farmer)** | 🟡 | Kanon tabele + env napomena: [`PAGE_IMPROVEMENTS_AND_LINKING_BACKLOG.md`](PAGE_IMPROVEMENTS_AND_LINKING_BACKLOG.md) § *Javni URL šabloni*; grower **`/grower/fields`** već linkuje `/plot/{publicCode}`. |

### Predloženi redosled (sprint)

1. **L5 + L6** — brz dobitak, niski rizik.  
2. **L4** — smanjuje podršku i nedoumice oko offline.  
3. **L1** ili eksplicitan **„wallet samo u app“** — jedna odluka, pa implementacija.  
4. **L2 / L3** — posle produkt prioriteta.  
5. **L7 / L9** — kontinuirani hardening.

### Kriterijum „gotovo“ za stavku iz Liste+

- Izvorni kod + `tsc` za dirnute pakete; **[Q]** smoke za P0 tokove koje stavka dira.  
- Ako je **izuzetak** (samo mobilno / samo web): jedna rečenica u §2 matrici ili ovde u tabeli, bez kontradikcije sa sidebarom (`web/lib/grower-nav.tsx`).

---

## 8. Grower web — audit skladnosti (maj 2026)

Cilj: ista BioVera pravila (`.cursorrules`) — `#2D5A27`, `rounded-xl`, i18n na svim jezicima, nema „SR UI + EN poruka“, `growerApiErrorOrT` gde god API puca, manje `alert()`.

### P0 — jezik i greške (najveći jaz)

| Gde | Problem | Akcija |
|-----|---------|--------|
| `/grower/missions/create` | `GrowerPageHeader` hardcoded EN; success ekran i ceo blok uputstva (Before/After, split order); validacije (`Please select…`); `alert` za batches / geolocation; mnogo placeholdera na EN | Novi namespace `growerPages.requestTransport*` (ili `grower.missionsCreate.*`) za **sve** jezike; ukloniti `alert` → inline banner + `growerApiErrorOrT` |
| `/grower/batches` | `alert` sa EN: approval check, success, failure | Ključevi u locale + opciono toast/inline |
| `/grower/where-to-buy/store/[supplierUserId]` | EN: „Back to locations“, „Loading store…“, load/submit greške, invalid quantity string | Povezati na `growerPages.*`; fallback poruke kroz `t()`, ne literal |
| Ostale `/grower/*` catch blokovi | Delimično još „sirovi“ API tekst | Nastavak L6: grep `catch` u `web/app/grower` |

### P1 — vizuelni tokeni

- Primarni CTA: zameniti `bg-green-600` / `focus:ring-green-500` gde je primarna akcija sa **`#2D5A27`** i usklađenim `focus-visible` (missions/create, dashboard, portal, batches, quality-entry, materials, profile, compliance — vidi grep u repo-u).
- Sekundarne akcije (`bg-blue-600` na batches/compliance): eksplicitna odluka — zadržati kao „info“ ili preći na outline + jedna primarna zelena.

### P2 — UX obrasci

- **Profil**: više `alert()` za upload/sačuvaj — farmer-friendly **toast ili inline** (ne blokirajući dijalog).
- **Portal**: kopiranje sertifikata već koristi `t()`; uklopiti u isti toast sistem kad profil pređe sa `alert`.

### P3 — Stranica po stranici (brza kontrola stanja)

| Ruta | Status (kratko) |
|------|-----------------|
| `/grower` (dashboard) | i18n header; outbox banner; prazne misije → CTA partije + zahtev transporta; finansijski blok uvek vidljiv sa porukom ako API nije dostupan; status gazdinstva preveden (`estateStatuses`) |
| `/grower/plantings` | load/save kroz `growerApiErrorOrT` |
| `/grower/field-diary`, `/grower/fields`, `/grower/season` | headeri preko `t()` |
| `/grower/batches` | EN `alert`-i (P0) |
| `/grower/quality-entry` | `fk()` + zeleni token |
| `/grower/compliance-photos` | i18n; plavi sekundarni dugmići |
| `/grower/missions/create` | kritično EN (P0) |
| `/grower/portal` | i18n; mapa; koraci putovanja i finansijska poruka mapirani sa API (EN) na `growerPages.portalMilestone_*` / `portalFinancialMsg_*`; status misije i admin paritet; EUR format po jeziku; greška učitavanja journey map |
| `/grower/materials` | OK opis; input tokeni |
| `/grower/package-badges` (+ scan, print-order) | i18n u headerima |
| `/grower/profile` | `alert` obrasci (P2) |
| `/grower/where-to-buy` (+ messages, thread) | uglavnom `t()`; **store** podstranica EN (P0) |
| `/grower/partner-orders` (+ thread) | ponovo pokrenuti grep posle izmena drugih modula |

### Tehnička regresija (pri svakoj iteraciji)

- `npx tsc --noEmit` u `web`; po potrebi smoke na: plantings, transport create, batches approve, B2B store order.

---

*Kreiran za fokus na grower web + mobilni; ažurirati po sprintovima.*
