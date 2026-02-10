# 📱 BioVera Mobile – Plan arhitekture (Growers first)

**Cilj:** Savršena, podeljena arhitektura bez zapetljavanja – bez hiljada linija u jednoj stranici, planski kao kod iskusnih arhitekata.  
**Fokus:** Mobilna aplikacija sa više rola (cross); za početak **samo rola Growers (producer)**.  
**Dodavanje:** Po fazama – prvo ono što je **najneophodnije** za growers.  
**Važno:** Growers **nema Shop** – ima **svoju posebnu arhitekturu** (unos proizvoda, kalkulator troškova, zabranjena sredstva, sertifikacije).

---

## Za farmere: kako da se svako snadje

Aplikacija mora biti **toliko jednostavna** da svaki farmer može da je koristi bez objašnjenja. Tri stvari su dovoljne da zna:

1. **Šta da uradi**  
   Veliki dugmići, jasni nazivi: **Moji proizvodi** (dodaj QR ili ručno), **Troškovi** (dodaj iznos), **Sertifikati** (fotografija), **Zabranjeno** (lista šta ne sme). Bez tehničkih reči.

2. **Da može bez interneta**  
   Na njivi često nema mreže. Sve što unese (proizvod, trošak, foto) **prvo se čuva u telefonu**. Kada dođe gde ima internet (kuća, kancelarija), aplikacija **sama pošalje** sve na server. Farmer samo vidi: **„Sačuvano“** (kad nema neta) i **„Poslato“** (kad je sve prosleđeno).

3. **Gde šta da traži**  
   Jedan glavni ekran (početak) sa **3–4 velika dugmeta**: Moji proizvodi, Troškovi, Sertifikati, Zabranjeno. Ostalo (podešavanja, profil) u meniju, ne na prvom planu.

**Pravilo za dizajn:** Ako farmer od 60+ godina ne može da uradi nešto u 2–3 klika, pojednostaviti ili premestiti.

---

## 1. Growers – posebna arhitektura (šta poljoprivrednik zaista koristi)

Aplikacija za poljoprivrednike treba da bude **jednostavna**. Ovo je jezgro:

### 1.1 Unos proizvoda (naši proizvodi – šta proizvod sadrži)

- **QR kod za naše proizvode (BioVera)**  
  Skeniranje QR-a unosi proizvod u evidenciju; podaci o proizvodu (šta sadrži) dolaze iz sistema ili se dopunjavaju.
- **Ručni unos**  
  Ako nema QR-a – korisnik ručno upisuje proizvod i šta sadrži (naziv, sastav, količina, parcela/njiva, datum, itd.).
- **Jedan zajednički “dnevnik” / lista**  
  Svi uneti proizvodi (QR + ručni) idu u **jedan deo gde se upisuju podaci šta sve sadrži proizvod** – to je centralno mesto za “naše proizvode”.

**Flow:** Scan QR ili Ručni unos → forma “šta proizvod sadrži” → snimi → pojavi se u listi proizvoda.

### 1.2 Kalkulator troškova (praćenje troškova)

- **Prenos iz unosa proizvoda**  
  Uneti proizvodi (iz QR/ručnog unosa) **prebacuju se** u deo **Kalkulator troškova** – tamo su vidljivi kao stavke (proizvod, količina, eventualno cena ako je uneta).
- **Korisnik sam dodaje iznose**  
  U kalkulatoru poljoprivrednik **sam dodaje iznose troškova** (gorivo, đubrivo, rad, najam, itd.) kako želi – **praćenje troškova** po sezoni / parceli / proizvodu.
- **Pregled**  
  Lista troškova, ukupno, po kategorijama (opciono kasnije).

**Flow:** Proizvodi iz “Unos proizvoda” → vidljivi u “Kalkulator troškova” + korisnik dodaje dodatne troškove i iznose.

### 1.3 Zabranjena sredstva i sertifikacije

- **Zabranjena sredstva**  
  Jednostavna lista / check: šta je zabranjeno (iz whitelist-a / compliance). Ako je potrebno za sertifikat – da bude na jednom mestu, da poljoprivrednik vidi da ne koristi zabranjena sredstva.
- **Sertifikacije – obavezne stavke iz admin panela**  
  - **Admin** u admin panelu **dodaje šta je obavezno** (npr. “Sertifikat X”, “Obuka Y”) – šta od njih tražimo da završe.
  - **Grower** vidi listu: šta je obavezno, šta je završeno / nije završeno (check).
  - **Završetak:** Grower **šalje fotografiju** da je dobio sertifikat (ili dokaz); **mi (admin) potvrđujemo** – onda se na njegovom profilu / dashboardu prikaže da je ta stavka završena (check).
- **Check “završeno”**  
  Jednostavno stanje: Nije završeno → Čeka potvrdu → Završeno (potvrđeno od strane admina).

**Flow:** Admin definiše obavezne sertifikate → Grower vidi listu → šalje foto → Admin potvrđuje → status “završeno”.

### 1.4 Growers nema Shop

- **Shop (nabavka semena, inputa)** **nije deo growers aplikacije** u ovoj arhitekturi.
- Growers ima: **Unos proizvoda (QR + ručni)**, **Kalkulator troškova**, **Zabranjena sredstva**, **Sertifikacije**, plus postojeći: dashboard, field log, harvest, njive (estates), batch-evi, misije, compliance fotke, notifikacije, profil, podešavanja, itd.

### 1.5 Šta još možemo imati za growers (predlozi)

- **Jednostavan pregled “Moji proizvodi”** – lista svega što je uneo (QR + ručno), filter po datumu / parceli.
- **Berba (harvest)** – već u planu; povezivanje berbe sa proizvodima i parcelom.
- **Compliance fotografije** – dokaz korišćenja dozvoljenih sredstava / stanja useva; sa GPS-om.
- **Notifikacije** – obaveštenja od platforme (novi zahtev za sertifikat, podsetnik, potvrda).
- **Profil + Trust score** – pregled statusa (koliko sertifikata završeno, da li sve u redu sa zabranjenim sredstvima).
- **Offline-first** – sve što je unos (proizvodi, troškovi, foto) radi bez interneta; sync kada ima mreže.

---

## 2. Offline i internet: kako to radi i kako izvesti

**Zašto je bitno:** Na njivi farmeri često **nemaju interneta**. Sve što rade mora da radi **bez mreže**. Kada jednom uđu na internet, **sve što su uradili offline** mora da se **prosledi na server**. Ovo je obavezno uvesti za sve unose (proizvodi, troškovi, field log, fotografije sertifikata).

### 2.1 Šta farmer vidi (jednostavno)

| Situacija | Šta farmer vidi | Šta to znači |
|-----------|------------------|--------------|
| Nema interneta, uneo nešto | **„Sačuvano u telefonu“** (ili ikona oblaka sa X) | Podaci su bezbedno u aplikaciji; ništa nije izgubljeno. |
| Ima internet, aplikacija šalje podatke | **„Šaljem podatke…“** (kratko) | Aplikacija prosleđuje sve što je bilo sačuvano offline. |
| Sve je poslato | **„Sve poslato“** / **„Sinhronizovano“** (ili ikona kvačice) | Server ima sve; može da radi i dalje. |
| Greška pri slanju | **„Nije moglo da se pošalje. Pokušaću opet.“** | Ostaje u telefonu; ponovo će pokušati kad opet ima net. |

**Pravilo:** Nikad ne prikazivati tehničke poruke („Network error“, „Sync failed“). Samo kratke, jasne rečenice na srpskom.

### 2.2 Kako to radi (jedan obrazac za sve)

1. **Bez obzira da li ima interneta**  
   Kad farmer nešto unese (proizvod, trošak, rad na njivi, foto sertifikata) → aplikacija to **odmah upisuje u memoriju telefona** (lokalno). To je uvek prvi korak.
2. **Ako nema interneta**  
   Na ekranu se prikaže da je **„Sačuvano u telefonu“**. Nema slanja na server u tom trenutku.
3. **Kada se pojavi internet**  
   Aplikacija **automatski** proverava da li ima neposlanih podataka. Ako ima – šalje ih na server (jedan po jedan ili u paketu, kako backend dozvoli).
4. **Posle uspešnog slanja**  
   Lokalna kopija može da ostane kao „poslato“ ili da se obriše (da ne zauzima prostor). Farmer vidi **„Sve poslato“** ili broj „X stavki poslato“.

**Jedan te isti obrazac** koristiti za:
- unos proizvoda (QR + ručni),
- kalkulator troškova (stavke i iznosi),
- field log (radovi na njivi),
- fotografije sertifikata,
- (opciono) compliance fotografije.

### 2.3 Kako to izvesti u kodu

- **Lokalna memorija**  
  Koristiti **AsyncStorage** (ili SQLite za veće količine) za sve „pending“ (neposlane) stavke. Već postoji `mobile/lib/offline-storage.ts` za field entries – isti princip proširiti na:
  - **Proizvodi:** `pending_products` – lista unetih proizvoda (QR + ručni) dok nisu poslati.
  - **Troškovi:** `pending_costs` – stavke troškova koje farmer doda.
  - **Sertifikati (foto):** `pending_certificate_photos` – putanja do slike + id sertifikata, dok admin ne potvrdi (slanje na server kad ima neta).
- **Sync servis**  
  Već postoji `mobile/lib/sync-service.ts` – šalje field entries kada je mreža dostupna. **Proširiti ga** (ili napraviti jedan centralni sync orchestrator) da:
  - proverava da li ima interneta (npr. `NetInfo` ili pokušaj poziva API-ja);
  - redom šalje: prvo field entries, pa proizvode, pa troškove, pa certificate photos;
  - nakon uspešnog slanja označi stavke kao „synced“ ili ih ukloni iz lokalne liste;
  - pri grešci ne briše podatke – pokuša ponovo kasnije.
- **Šta farmer mora da vidi**  
  Jedan mali indikator na glavnom ekranu (ili u headeru): **„Sačuvano u telefonu: X“** (broj neposlanih) ili **„Sve poslato“**. Klik na to može otvoriti kratak ekran „Status slanja“ (opciono): koliko stavki čeka, da li se trenutno šalje, da li je bilo greške (u ljudskom jeziku).

**Rezime:**  
Sve što farmer uradi **prvo se čuva lokalno**. Kada ima internet, **jedan sync servis** sve to šalje na backend. Farmer vidi samo **„Sačuvano“** / **„Poslato“** bez tehničkih detalja.

---

## 3. Principi arhitekture

| Princip | Pravilo |
|--------|--------|
| **Jedna odgovornost** | Jedan ekran = jedna glavna stvar (npr. lista, detalj, forma). |
| **Ograničenje veličine** | **Maksimalno ~250–300 linija po screen fajlu.** Sve preko toga ide u komponente ili feature modul. |
| **Feature-based** | Kod grupišemo po domenu (grower, auth, shared), ne po tipu (sve komponente na gomilu). |
| **Stranice vs. komponente** | Stranica = routing + layout + poziv feature komponenti. Logika i UI u feature/shared. |
| **Offline-first** | Svi growers flow-ovi rade bez mreže; sve se čuva lokalno, a kada ima interneta sync servis prosleđuje na server (v. sekcija 2). |
| **Integrity** | Barcode + GPS validacija na granici (unos), ne rasuta po ekranima. |

---

## 4. Trenutno stanje – šta treba popraviti

### 4.1 Preveliki screen fajlovi (refaktor u fazama)

| Fajl | Linije | Akcija |
|------|--------|--------|
| `(producer)/(tabs)/index.tsx` | **~945** | Podeliti: DashboardLayout + komponente (TrustScore, QuickActions, RecentActivity, FinancialSummary, ActiveMissions, ActiveBatches). |
| `(producer)/plot-mapper.tsx` | **~719** | Izvući: MapView, PlotList, PlotEditor u `features/grower/plot-mapper/`. |
| `(producer)/mission/[id].tsx` | **~567** | Izvući: MissionHeader, JourneyMap, Timeline, ConsumerFeedback u feature. |
| `(producer)/(tabs)/field-log.tsx` | **~539** | Izvući: EntryForm, EntryList, FilterBar u `features/grower/field-log/`. |
| `(producer)/orders/[id].tsx` | **~509** | Izvući: OrderHeader, OrderLines, DeliveryBlock, PaymentStatus. |
| `(producer)/vera-insights.tsx` | **~436** | Izvući: InsightCards, Charts u feature komponente. |
| `(producer)/batch/[id].tsx` | **~424** | Izvući: BatchHeader, TraceabilityBlock, LocationHistory. |
| `(producer)/growth-journal.tsx` | **~398** | Izvući: JournalFilters, JournalTimeline. |
| `(producer)/(tabs)/harvest.tsx` | **~379** | Izvući: HarvestForm, HarvestList. |
| `(producer)/quality-entry.tsx` | **~384** | Izvući: QualityForm, BatchSelector. |
| `(producer)/materials.tsx` | **~360** | Izvući: MaterialList, WhitelistSearch. |
| `(producer)/scanner.tsx` | **~346** | Ostaje ili mala podela (ScannerView + ResultHandler). |

Ostali fajlovi su u prihvatljivom opsegu ili već manji; prioritet refaktora: **index (dashboard)** i **plot-mapper**, pa **mission/[id]** i **field-log**.

### 4.2 Struktura ruta (Expo Router) – šta već postoji

- **Auth:** `(auth)/` – login.
- **Grower (Producer):** `(producer)/` – tabs + stack za detalje (estates, batches, missions, orders, itd.).
- **Buyer:** `(buyer)/` – shop, cart, orders, profile (na stranu dok je fokus na growers).
- **Driver / Manager:** po jedan ekran – kasnije.

Cilj: **ne menjati routing drastično**, već unutar `(producer)` uvesti **feature foldere** i **komponente** tako da screen fajlovi ostaju tanki.

---

## 5. Ciljna struktura projekta (mobile)

```
mobile/
├── app/                          # Samo routing i layout (Expo Router)
│   ├── _layout.tsx               # Root layout, provideri
│   ├── index.tsx                 # Landing / role redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (producer)/               # GROWERS – fokus
│   │   ├── _layout.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # → <DashboardScreen />
│   │   │   ├── products.tsx      # Unos proizvoda (QR + ručni) – šta sadrži
│   │   │   ├── cost-calculator.tsx  # Kalkulator troškova (prenos iz products + ručni iznosi)
│   │   │   ├── field-log.tsx     # → <FieldLogScreen />
│   │   │   ├── harvest.tsx       # → <HarvestScreen />
│   │   │   ├── certifications.tsx   # Sertifikacije (lista, šalji foto, status)
│   │   │   ├── banned-substances.tsx  # Zabranjena sredstva (pregled, check)
│   │   │   ├── profile.tsx
│   │   │   ├── settings.tsx
│   │   │   └── wallet.tsx
│   │   ├── dashboard.tsx         # (ako van tabova)
│   │   ├── estates/
│   │   │   ├── index.tsx         # lista
│   │   │   ├── new.tsx
│   │   │   └── [id]/
│   │   │       ├── index.tsx     # detalj
│   │   │       └── edit.tsx
│   │   ├── batches/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── missions/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── scanner.tsx           # QR za naše proizvode (otvara se iz products ili dashboard)
│   │   ├── compliance-photos.tsx
│   │   ├── quality-entry.tsx
│   │   ├── materials.tsx
│   │   ├── growth-journal.tsx
│   │   ├── notifications.tsx
│   │   ├── vera-bag.tsx
│   │   ├── vera-insights.tsx
│   │   └── plot-mapper.tsx
│   ├── (buyer)/                  # Kasnije – isto princip
│   └── ...
│
├── features/                     # Feature moduli (logika + UI)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── grower/                   # GROWERS – sve što je producer
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx      # glavni ekran
│   │   │   ├── TrustScoreWidget.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   ├── FinancialSummary.tsx
│   │   │   ├── ActiveMissions.tsx
│   │   │   ├── ActiveBatches.tsx
│   │   │   └── hooks/
│   │   │       └── useDashboardData.ts
│   │   ├── products/                    # Unos proizvoda (QR + ručni) – šta sadrži
│   │   │   ├── ProductsScreen.tsx
│   │   │   ├── ProductEntryForm.tsx      # forma "šta proizvod sadrži"
│   │   │   ├── ProductList.tsx
│   │   │   └── hooks/
│   │   ├── cost-calculator/             # Kalkulator troškova
│   │   │   ├── CostCalculatorScreen.tsx
│   │   │   ├── CostEntryForm.tsx         # dodavanje iznosa troškova
│   │   │   ├── CostList.tsx              # stavke iz products + ručni troškovi
│   │   │   └── hooks/
│   │   ├── certifications/              # Sertifikacije (lista, foto, admin potvrda)
│   │   │   ├── CertificationsScreen.tsx
│   │   │   ├── CertificatePhotoUpload.tsx
│   │   │   └── hooks/
│   │   ├── banned-substances/           # Zabranjena sredstva (pregled, check)
│   │   │   ├── BannedSubstancesScreen.tsx
│   │   │   └── hooks/
│   │   ├── field-log/
│   │   │   ├── FieldLogScreen.tsx
│   │   │   ├── EntryForm.tsx
│   │   │   ├── EntryList.tsx
│   │   │   └── hooks/
│   │   ├── estates/
│   │   │   ├── EstateList.tsx
│   │   │   ├── EstateDetail.tsx
│   │   │   ├── EstateForm.tsx
│   │   │   └── hooks/
│   │   ├── batches/
│   │   ├── missions/
│   │   ├── harvest/
│   │   ├── plot-mapper/
│   │   ├── compliance-photos/
│   │   ├── quality-entry/
│   │   ├── materials/
│   │   └── ...
│   └── buyer/                    # Kasnije
│       └── ...
│
├── shared/                       # Zajedničko za sve role
│   ├── components/               # UI primitives, layout
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── SyncStatus.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useSocket.ts
│   ├── services/                 # API, sync, offline
│   │   ├── api.ts
│   │   ├── sync-service.ts
│   │   └── offline-storage.ts
│   ├── lib/                      # theme, integrity-guard, types
│   └── types/
│
└── components/                   # Privremeno – migracija u features/shared
    └── AuthGuard.tsx
```

**Pravilo:** U `app/(producer)/**` ostaje samo:

- import feature komponente (npr. `DashboardScreen`),
- eventualno `useLocalSearchParams` / `useRouter` i prosleđivanje u feature.

Sva logika (useState, useEffect, API pozivi) i složeni JSX žive u `features/grower/...` ili `shared/`.

---

## 6. Mapiranje stranica i podstranica (Growers)

### 6.1 Tabovi (glavna navigacija) – **bez Shop-a**

| Tab | Stranica | Feature modul | Opis |
|-----|----------|----------------|------|
| Home | `(tabs)/index.tsx` | `grower/dashboard` | Pregled: trust score, brzi akcije (Scan, Unos proizvoda, Troškovi), aktivnosti, sertifikati status. |
| Moji proizvodi | `(tabs)/products.tsx` | `grower/products` | Unos putem QR (naši proizvodi) + ručni unos; upis šta proizvod sadrži; lista unetih. |
| Kalkulator troškova | `(tabs)/cost-calculator.tsx` | `grower/cost-calculator` | Prenos iz “Moji proizvodi” + korisnik dodaje iznose troškova; praćenje troškova. |
| Field log | `(tabs)/field-log.tsx` | `grower/field-log` | Unos radova na njivi (offline-first). |
| Berba | `(tabs)/harvest.tsx` | `grower/harvest` | Prijava berbe. |
| Sertifikacije | `(tabs)/certifications.tsx` | `grower/certifications` | Lista obaveznih (iz admina); šalji foto; status (čeka potvrdu / završeno). |
| Zabranjena sredstva | `(tabs)/banned-substances.tsx` | `grower/banned-substances` | Pregled zabranjenih; check da nije korišćeno (povezato sa compliance). |
| Profile | `(tabs)/profile.tsx` | `grower/profile` | Profil, Trust score, link ka Settings. |
| Podešavanja | `(tabs)/settings.tsx` | `grower/settings` | Notifikacije, auto-sync, GPS. |
| Novčanik | `(tabs)/wallet.tsx` ili iz Profile | `grower/wallet` | Transakcije, isplate. |

### 6.2 Stack – liste i detalji

| Grupa | Stranica | Podstranice | Feature modul |
|-------|----------|-------------|----------------|
| Estates | `estates.tsx` → `estates/index.tsx` | `estates/new.tsx`, `estates/[id]/index.tsx`, `estates/[id]/edit.tsx` | `grower/estates` |
| Batches | `batches.tsx` → `batches/index.tsx` | `batches/[id].tsx` | `grower/batches` |
| Missions | `missions.tsx` → `missions/index.tsx` | `missions/[id].tsx` | `grower/missions` |
| Orders | `orders.tsx` → `orders/index.tsx` | `orders/[id].tsx` | `grower/orders` |

### 6.3 Ostale growers stranice (jedan nivo ili modal)

| Stranica | Feature modul | Napomena |
|----------|----------------|----------|
| `scanner.tsx` | `grower/scanner` ili `shared/scanner` | QR/Barcode; može ostati manji fajl. |
| `compliance-photos.tsx` | `grower/compliance-photos` | Upload sa GPS validacijom. |
| `quality-entry.tsx` | `grower/quality-entry` | Unos kvaliteta, povezivanje sa batch-om. |
| `materials.tsx` | `grower/materials` | Whitelist, pretraga. |
| `growth-journal.tsx` | `grower/growth-journal` | Hronologija growth logova. |
| `notifications.tsx` | `shared/notifications` ili `grower/notifications` | Lista, mark as read. |
| `vera-bag.tsx` | `grower/vera-bag` | Vera bag funkcionalnost. |
| `vera-insights.tsx` | `grower/vera-insights` | Insights / preporuke. |
| `plot-mapper.tsx` | `grower/plot-mapper` | Mapa parcela, granice. |
| `dashboard.tsx` (van tabova) | `grower/dashboard` | Ako postoji poseban entry point. |

Ovo je cela mapa stranica i podstranica za growers; ništa ne mora biti u jednom ogromnom fajlu – svaki ekran delegira u jedan glavni feature screen + komponente.

---

## 7. Role roadmap (kratko)

- **Faza 1–3 (ovaj dokument):** Samo **Growers** – od dashboarda do plot-mapper, po prioritetu ispod.
- **Kasnije:** Buyer (shop, cart, orders) – ista pravila: `app/(buyer)/**` + `features/buyer/`.
- **Zatim:** Driver, Manager – minimalno potrebno za handover i osnovne taskove.
- **Opciono:** Admin (može ostati pretežno web).

---

## 8. Faze implementacije – šta je najneophodnije za Growers

### Faza 1 – Minimum: identitet + unos proizvoda + kalkulator troškova

1. **Auth i role**
   - Login, JWT, čuvanje sesije, redirect na `(producer)` za growers.
   - AuthGuard za `(producer)` (već postoji).
2. **Dashboard (pojednostavljen)**
   - Trust score, brze akcije: **Scan (QR)**, **Unos proizvoda**, **Kalkulator troškova**, Sync status.
   - Refaktor: izvući komponente u `features/grower/dashboard/`.
3. **Unos proizvoda (Moji proizvodi)**
   - **QR za naše proizvode:** skeniranje → unos u evidenciju; forma “šta proizvod sadrži” (naziv, sastav, količina, parcela, datum).
   - **Ručni unos:** ista forma bez skeniranja.
   - Lista unetih proizvoda; offline-first.
4. **Scanner (za proizvode)**
   - Skeniranje QR naših proizvoda; provera u sistemu; rezultat → otvara formu unosa ili dopune “šta sadrži”.
5. **Kalkulator troškova**
   - Uneti proizvodi (iz “Moji proizvodi”) prebacuju se ovde kao stavke.
   - Korisnik **sam dodaje iznose troškova** (gorivo, đubrivo, rad, itd.) – praćenje troškova.
   - Lista troškova, ukupno; offline-first.
6. **Estates – lista i osnovni detalj**
   - Lista njiva; detalj (naziv, lokacija, površina). Opciono u ovoj fazi.

**Ishod faze 1:** Grower se uloguje, unosi proizvode (QR + ručno) sa podacima šta sadrži, prebacuje ih u kalkulator i dodaje troškove za praćenje.

---

### Faza 2 – Zabranjena sredstva i sertifikacije

7. **Zabranjena sredstva**
   - Pregled liste zabranjenih sredstava (iz admin/whitelist); jednostavan “check” da poljoprivrednik vidi šta ne sme; povezano sa compliance.
8. **Sertifikacije**
   - **Admin panel:** definiše obavezne sertifikate / obuke (šta tražimo od growera).
   - **Grower app:** lista obaveznih; status (Nije završeno / Čeka potvrdu / Završeno).
   - **Grower šalje fotografiju** sertifikata (ili dokaz); **admin potvrđuje** → status “završeno”.
   - Check na dashboardu / profilu: koliko je završeno.
9. **Field log (unos radova)**
   - Unos sa GPS-om; offline first; Integrity Guard na submit.
10. **Scanner (proširen)** – provera barcode prema whitelist (zabranjena sredstva).

**Ishod faze 2:** Grower vidi zabranjena sredstva, šalje foto sertifikata, admin potvrđuje; field log i skener za compliance.

---

### Faza 3 – Berba, batch, kvalitet i porudžbine

11. **Harvest**
    - Prijava berbe; povezivanje sa parcelom/batch-om; offline + sync.
12. **Batches – lista i detalj**
    - Lista batch-eva; detalj (batch ID, status, traceability).
13. **Missions – lista i detalj**
    - Lista misija; detalj (status, put do kupca).
14. **Compliance photos**
    - Upload slika sa GPS validacijom; offline queue + sync.
15. **Quality entry**
    - Unos kvaliteta za batch; status (Draft / Submitted).
16. **Materials (whitelist)**
    - Pregled dozvoljenih materijala; pretraga po barcodu; offline cache.
17. **Orders (producer view)**
    - Lista porudžbina; detalj (kupac, količina, status).
18. **Notifications**
    - Lista, označavanje kao pročitano.

**Ishod faze 3:** Pun growers flow – berba, batch-evi, misije, compliance, kvalitet, materijali, porudžbine.

---

### Faza 4 – Napredno (kad je osnova stabilna)

19. **Plot mapper**
    - Mapa parcela, granice, edit; refaktor u `features/grower/plot-mapper/`.
20. **Growth journal**
    - Hronologija, filteri; izvući u feature komponente.
21. **Vera insights / Vera bag**
    - Preporuke i dodatne growers funkcije po potrebi.
22. **Wallet**
    - Detaljniji prikaz transakcija i isplata.

---

## 9. Pravila za nove fajlove

- **Novi screen:** U `app/` samo wrapper koji renderuje jedan feature screen; bez velike logike.
- **Nova “stranica” u smislu UI:** U `features/grower/<feature>/` kao komponenta; screen u `app/` je tanak.
- **Zajednička logika (API, sync, auth):** U `shared/` (hooks, services, lib).
- **Max veličina:** Težiti ka **≤250–300 linija** po fajlu; preko toga – podeliti na manje komponente ili hook-ove.

---

## 10. Kratak checklist pre svake faze

- [ ] Nove rute u `app/` samo delegiraju na feature screen.
- [ ] Nema ekrana preko ~300 linija bez plana za podelu.
- [ ] Field/offline podaci: **uvek prvo lokalno**, pa sync kada ima interneta (sekcija 2).
- [ ] Unos sa terena: GPS i barcode provera na granici (Integrity Guard).
- [ ] Tipovi: zajednički tipovi u `shared/types` ili iz backend kontrakta.

---

## 11. Naredbe koje treba da mi daš – redosled za 100% sigurnu implementaciju

Da bismo celu arhitekturu odradili **u pravom redu**, možeš mi davati naredbe po ovim koracima. Svaki korak je jedna jasna naredba; uradi jedan po jedan, pa reci „Sledeći“ ili „Korak X“.

### Faza 1 – Offline + Unos proizvoda + Kalkulator troškova

| # | Naredba (šta da kažeš) | Šta će biti urađeno |
|---|------------------------|----------------------|
| **1** | *„Proširi offline-storage i sync-service za proizvode i troškove.“* | U `offline-storage.ts`: pending proizvodi i pending troškovi. U `sync-service.ts`: slanje tih stavki kada ima interneta. |
| **2** | *„Dodaj indikator Sačuvano / Poslato na glavni ekran (ili u header).“* | Jedan mali UI koji pokazuje broj neposlanih stavki ili „Sve poslato“. |
| **3** | *„Napravi feature Moji proizvodi: lista + forma (QR + ručni unos), šta proizvod sadrži, sve offline-first.“* | `features/grower/products/` (ProductsScreen, ProductEntryForm, ProductList, hook), tanki `app/(producer)/(tabs)/products.tsx`. |
| **4** | *„Dodaj tab/rupu Moji proizvodi u growers tab navigaciju.“* | U `(tabs)/_layout.tsx` dodati products, ukloniti shop ako je još tu. |
| **5** | *„Napravi feature Kalkulator troškova: prenos iz proizvoda + ručno dodavanje iznosa, offline-first.“* | `features/grower/cost-calculator/` (CostCalculatorScreen, CostEntryForm, CostList), `app/(producer)/(tabs)/cost-calculator.tsx`. |
| **6** | *„Dodaj tab Kalkulator troškova u growers tab navigaciju.“* | Tab u layoutu. |
| **7** | *„Scanner da otvara formu unosa proizvoda (naši proizvodi) kad skeniraš QR.“* | Povezati scanner sa products flow-om – rezultat skeniranja → forma „šta sadrži“ ili dopuna. |
| **8** | *„Dashboard (početak) da ima 3–4 velika dugmeta: Moji proizvodi, Kalkulator troškova, Sertifikati, Zabranjeno – bez Shop-a.“* | Pojednostaviti dashboard; brze akcije prema sekciji „Za farmere“. |

### Faza 2 – Zabranjena sredstva + Sertifikacije

| # | Naredba (šta da kažeš) | Šta će biti urađeno |
|---|------------------------|----------------------|
| **9** | *„Napravi ekran Zabranjena sredstva: lista šta je zabranjeno, samo pregled (offline cache ako treba).“* | `features/grower/banned-substances/`, tab ili stack stranica. |
| **10** | *„Napravi ekran Sertifikacije: lista obaveznih (iz API-ja), status Nije završeno / Čeka potvrdu / Završeno, upload fotografije sertifikata (offline pa sync).“* | `features/grower/certifications/` + pending certificate photos u offline-storage i sync. |
| **11** | *„Dodaj tabove/links za Sertifikacije i Zabranjena sredstva u growers navigaciju.“* | Tabovi ili stavke u meniju. |

### Faza 3 – Refaktor velikih ekrana + ostalo (po želji)

| # | Naredba (šta da kažeš) | Šta će biti urađeno |
|---|------------------------|----------------------|
| **12** | *„Refaktoruj dashboard (index) u feature komponente da ima ispod 300 linija.“* | Izvući TrustScore, QuickActions, RecentActivity itd. u `features/grower/dashboard/`. |
| **13** | *„Field log, Harvest, Batches, Missions, Orders – proveri da sve koristi offline-first gde ima unosa.“* | Konsistentno: unos → lokalno → sync kada ima neta. |
| **14** | *„Ukloni Shop iz growers aplikacije ako je još negde prikazan.“* | Nijedan tab/link ka shop-u za grower role. |

### Kako da koristiš

- Reci npr.: **„Kreni od Koraka 1“** ili **„Uradi Korak 1“** – uradiću samo taj korak.
- Zatim: **„Sledeći“** ili **„Korak 2“** – nastavljamo redom.
- Možeš i: **„Uradi korake 1 do 4“** ako želiš blok; ja ću ih raditi u tom redosledu.

Ovim redosledom smo **100% sigurni** da prvo imamo offline + sync, pa unos proizvoda i kalkulator, pa zabranjena sredstva i sertifikacije, pa čišćenje i refaktor – bez zapetljavanja.

---

### Naredbe za proveru builda i grešaka (da ništa ne zaboravimo)

**Ove naredbe treba da mi daš redovno** – posle pojedinačnog koraka ili posle bloka koraka – da proverim da sve radi i da ništa ne preskočimo.

| Naredba (šta da kažeš) | Šta ću uraditi |
|------------------------|----------------|
| **„Proveri build.“** | Pokrenuću build mobilne aplikacije (`cd mobile && npx expo export` ili `npm run build` / odgovarajuću skriptu). Ako padne – ispravljam dok ne prođe. |
| **„Proveri greške / linter.“** | Proveriću linter (npr. ESLint, TypeScript) u izmenjenim fajlovima ili u celom `mobile/`. Ispravljam sve što nađem. |
| **„Proveri build i greške.“** | Uradiću oba: prvo linter, pa build. Ispravljam sve dok oba ne budu čista. |
| **„Pre nego što kažeš da je korak gotov, proveri build i linter.“** | Posle svakog koraka koji zatražiš, neću reći „gotovo“ dok ne pokrenem build i linter i ne ispravim sve greške. |

**Preporuka kako da mi narediš:**

- Posle **jednog koraka**: *„Uradi Korak 3. Kad završiš, proveri build i greške.“*
- Posle **bloka koraka**: *„Uradi korake 1 do 4. Na kraju proveri build i linter i ispravi sve.“*
- Možeš i unapred reći: *„Od sada, pre nego što kažeš da je nešto gotovo, uvek proveri build i linter.“* – onda ću to primenjivati na sve naredne korake dok ne kažeš drugačije.

Tako **nećemo zaboraviti** da proverimo build i greške – ti mi to eksplicitno narediš, a ja to uradim pre nego što potvrdim da je gotovo.

---

**Zaključak:** Aplikacija za farmere mora biti **jednostavna** (svako se snadje) i **offline-first** (na njivi nema interneta – sve se čuva u telefonu, a kad ima mreže sve se prosleđuje na server; v. sekcija 2). Growers ima svoju arhitekturu (sekcija 1): Unos proizvoda (QR + ručni) → Kalkulator troškova; Zabranjena sredstva i Sertifikacije. Shop nije deo growers aplikacije. Stranice i faze su u sekcijama 6 i 8; velike stranice se refaktorisu u feature module.
