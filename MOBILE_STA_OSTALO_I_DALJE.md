# 📋 BioVera Mobile – Šta je ostalo i šta radimo dalje

Ovaj dokument je **jedna lista** – šta je završeno, šta ostaje, i **prioritet za naredne korake**. Referenca za glavnu arhitekturu: `MOBILE_ARCHITECTURE_PLAN.md`.

---

## 1. Šta je urađeno (kratko)

- **Offline + sync:** pending proizvodi, troškovi, certificate photos, field entries; SyncStatus u headeru.
- **Tabovi growers:** Moji proizvodi, Kalkulator troškova, Sertifikacije, Zabranjena sredstva; Shop uklonjen (redirect).
- **Refaktor u feature module:** Dashboard, plot-mapper, mission/[id], field-log, vera-insights, growth-journal, **orders/[id], batch/[id], harvest** – svi tanki wrapperi u `app/`, logika u `features/grower/...`.
- **Ostalo:** Estates, batches, missions, orders liste; certifications, banned-substances, products, cost-calculator, wallet, vera-bag – sve delegira na feature ili je već u redu.

---

## 2. Šta je ostalo (sve u jednom mestu)

### 2.1 Refaktor – preveliki / preko ~300 linija

| Fajl | Linije | Prioritet | Akcija |
|------|--------|-----------|--------|
| `(producer)/quality-entry.tsx` | ~403 | **1** | Izvući u `features/grower/quality-entry/` (QualityForm, BatchSelector, hook). |
| `(producer)/materials.tsx` | ~375 | **2** | Izvući u `features/grower/materials/` (MaterialList, WhitelistSearch, hook). |
| `(producer)/compliance-photos.tsx` | ~333 | 3 | Opciono: izvući u `features/grower/compliance-photos/`. |
| `(producer)/estates.tsx` | ~337 | 4 | Opciono: izvući u feature ako raste. |
| `(producer)/scanner.tsx` | ~346 | 5 | Ili mala podela (ScannerView + ResultHandler), ili ostaviti + ispraviti TS (theme.colors.text.inverse). |

Liste **batches.tsx** (~289), **missions.tsx** (~292), **orders.tsx** (~304), **notifications.tsx** (~313) su na granici; refaktor po potrebi.

### 2.2 TypeScript / build greške (mora da se reši za čist build)

| Fajl | Greška | Šta uraditi |
|------|--------|-------------|
| `app/(buyer)/dashboard.tsx` | `EnhancedProduct` – `harvestDate` tip | Dovesti u sklad sa `Product` (npr. `harvestDate?: string` ili obavezno). |
| `app/(buyer)/shop.tsx` | `"xl"` nije u tipu spacing | Zameniti sa `"lg"` ili dodati `xl` u theme spacing tip. |
| `app/(producer)/scanner.tsx` | `theme.colors.text.inverse` ne postoji | Dodati `inverse` u `lib/theme.ts` (text) ili koristiti `theme.colors.background` / drugo. |
| `app/buyer-register.tsx` | `import { api }` – nema export `api` | Koristiti default import ili pravi export iz `lib/api`. |
| `app/index.tsx` | `"xl"` spacing | Isto kao buyer shop – `xl` u theme ili zameniti. |
| `app/login.tsx` | Parameter `role` ima tip `any` | Dodati tip npr. `(role: string)` ili odgovarajući tip. |
| `app/partner-login.tsx` | Isto – `role` any | Dodati tip. |
| `app/products.tsx` | `PepperHot` ne postoji u lucide-react-native | Ukloniti ili zameniti drugom ikonom. |
| `components/ProductPassport.tsx` | `LatLng[]` – null nije dozvoljen | Filtrirati null ili proširiti tip. |
| `components/ui/Card.tsx` | Spread types samo iz object | Ispraviti tip (ne spread-ovati non-object). |
| `features/grower/field-log/useFieldLogData.ts` | ~~`validateMaterial` used before declaration~~ | ✅ Ispravljeno: `validateMaterial` premestjen iznad useEffect-a. |

**Naredba:** *„Proveri build i greške“* ili *„Ispravi sve TypeScript greške u mobile“* – rešiti redom da `npx tsc --noEmit` prođe.

### 2.3 Growers – funkcionalno šta još može da fali

- **Compliance photos** – da li ima offline queue kao field log? Ako treba konzistentno, dodati pending + sync.
- **Quality entry** – pored refaktora, proveriti da li šalje na backend / offline-first po potrebi.
- **Materials (whitelist)** – već ima offline cache; samo refaktor u feature.
- **Estates lista/detalj** – provera da li sve radi; refaktor liste ako pređe 300 linija.
- **Notifications** – lista i “mark as read”; bez velikih izmena ako je već ok.

### 2.4 Buyer aplikacija (posebna tema)

- **Refaktor / konzistentnost:** Buyer dashboard, shop, cart, orders, checkout, profile – po istim pravilima (tanki screen, feature moduli) kad budemo radili na buyeru.
- **Bugovi:** dashboard (EnhancedProduct), shop (spacing xl), buyer-register (api import) – rešiti u okviru “build i greške”.

### 2.5 Driver / Manager

- Ekrani postoje (`driver/handover-initiate`, `manager/handover-complete`). Kasnije: proširenje po potrebi, ista pravila (feature-based, tanki app).

### 2.6 Opciono / kasnije

- **Wallet** – detaljniji prikaz transakcija i isplata.
- **Vera insights / Vera bag** – dodatne growers funkcije po potrebi.
- **Admin** – ostaje pretežno web.

---

## 3. Šta radimo dalje – prioritet po fazama

### Faza 1 – Hitno (build i stabilnost)

| Red | Šta | Kako |
|-----|-----|------|
| 1.1 | ~~Ispraviti TS u `useFieldLogData.ts`~~ | ✅ Već urađeno. |
| 1.2 | Ispraviti sve ostale TypeScript greške iz 2.2 | Redom po fajlu da `npx tsc --noEmit` prođe u `mobile/`. |
| 1.3 | Provera builda | `cd mobile && npx expo export` (ili odgovarajuća skripta) – dok ne prođe. |

**Naredba:** *„Ispravi preostale TypeScript greške u mobile i proveri build.“*

### Faza 2 – Refaktor preostalih growers ekrana

| Red | Šta | Kako |
|-----|-----|------|
| 2.1 | quality-entry | Napraviti `features/grower/quality-entry/` (QualityForm, BatchSelector, useQualityEntryData), tanki `app/(producer)/quality-entry.tsx`. |
| 2.2 | materials | Napraviti `features/grower/materials/` (MaterialList, WhitelistSearch, hook), tanki `app/(producer)/materials.tsx`. |
| 2.3 | scanner | Ili mala podela (ScannerView + ResultHandler), ili samo ispraviti TS (text.inverse) i ostaviti jedan fajl. |
| 2.4 | compliance-photos (opciono) | Ako želimo konzistentnost – izvući u feature; eventualno offline queue. |

**Naredba:** *„Uradi refaktor quality-entry i materials (Faza 2.1 i 2.2).“*

### Faza 3 – Provera i čišćenje

| Red | Šta | Kako |
|-----|-----|------|
| 3.1 | Linter | ESLint u celom `mobile/` – ispraviti sve. |
| 3.2 | Liste (estates, batches, missions, orders) | Proveriti da nisu prevelike; ako jesu, izvući u feature. |
| 3.3 | Offline-first provera | Field log, harvest, products, cost-calculator, certifications – sve što ima unos da prvo ide u lokalno pa sync. |

### Faza 4 – Buyer i ostalo (kasnije)

- Buyer: refaktor po istim pravilima, ispravljeni bugovi (dashboard, shop, register).
- Driver/Manager: minimalno za handover.
- Wallet detaljniji, compliance photos offline – po potrebi.

---

## 4. Naredbe koje možeš da daš

- *„Ispravi TypeScript greške u mobile“* – rešavam sve iz 2.2 + useFieldLogData.
- *„Proveri build“* – pokrećem build, ispravljam dok ne prođe.
- *„Uradi refaktor quality-entry“* – Faza 2.1.
- *„Uradi refaktor materials“* – Faza 2.2.
- *„Uradi Fazu 1“* – sve TS i build.
- *„Uradi Fazu 2“* – refaktor quality-entry i materials (i opciono scanner).
- *„Šta je sledeći korak?“* – gledam ovaj dokument i predlažem sledeći red u fazi.

---

## 5. Procena “koliko još posla”

| Kategorija | Procena | Napomena |
|------------|---------|----------|
| TS + build (Faza 1) | 1–2h | ~15 grešaka, većinom male izmene. |
| Refaktor quality-entry + materials (Faza 2.1–2.2) | 1–2h | Dva ekrana, isti obrazac kao orders/batch/harvest. |
| Scanner + compliance (Faza 2.3–2.4) | 0.5–1h | Opciono. |
| Linter + provera (Faza 3) | 0.5h | Ako nema puno novih upozorenja. |
| Buyer refaktor + bugovi (Faza 4) | 2–4h | Kad pređemo na buyer fokus. |

**Ukupno za “growers gotovo + čist build”:** reda **3–5h** (Faza 1 + Faza 2 + Faza 3). Ostalo je onda čišćenje, buyer, i opciona proširenja.

---

*Poslednje ažuriranje: u skladu sa stanjem nakon refaktora orders, batch, harvest i nove liste po fazama u MOBILE_ARCHITECTURE_PLAN.md.*
