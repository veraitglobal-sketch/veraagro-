# 📋 BioVera Mobile – Semi-naredbe (growers)

Kopiraj **jednu po jednu** u chat; asistent izvršava i prati se po listi.

- **Naredbe 1–20 (Blok 1)** – quality-entry + materials refaktor, TS/build, MD. *(U praksi ~20–30 min.)*
- **Naredbe Blok 2 (ispod)** – teži zadaci za **~2h**: compliance-photos, estates, scanner, ESLint, liste, offline provera, build i dokumentacija.

---

## Naredbe 1–20 – Blok 1 (copy-paste jednu po jednu)

1. **Proveri da li u mobile/ ima TypeScript grešaka: pokreni `npx tsc --noEmit` u mobile i javi rezultat.**

2. **Otvori mobile/app/(producer)/quality-entry.tsx, pročitaj ga i napravi features/grower/quality-entry/useQualityEntryData.ts – izvuci sve podatke, state i API pozive iz quality-entry u ovaj hook.**

3. **U features/grower/quality-entry/ napravi komponentu QualityForm.tsx – forma za unos kvaliteta (iz quality-entry.tsx), koristi useQualityEntryData.**

4. **U features/grower/quality-entry/ napravi komponentu BatchSelector.tsx (izbor batch-a), ako postoji u quality-entry – izvuci je.**

5. **U features/grower/quality-entry/ napravi QualityEntryScreen.tsx koji koristi QualityForm, BatchSelector i useQualityEntryData.**

6. **Zameni sadržaj mobile/app/(producer)/quality-entry.tsx tako da bude tanki wrapper: samo import i render <QualityEntryScreen /> iz features/grower/quality-entry.**

7. **Proveri da quality-entry ruta i dalje radi: nema TS grešaka u quality-entry fajlovima (npx tsc --noEmit u mobile).**

8. **Otvori mobile/app/(producer)/materials.tsx, pročitaj ga i napravi features/grower/materials/useMaterialsData.ts – izvuci state i logiku u hook.**

9. **U features/grower/materials/ napravi MaterialList.tsx – lista materijala iz materials.tsx.**

10. **U features/grower/materials/ napravi WhitelistSearch.tsx (pretraga whitelist-a), ako postoji u materials – izvuci.**

11. **U features/grower/materials/ napravi MaterialsScreen.tsx koji koristi MaterialList, WhitelistSearch i useMaterialsData.**

12. **Zameni sadržaj mobile/app/(producer)/materials.tsx tako da bude tanki wrapper: samo import i render <MaterialsScreen />.**

13. **Proveri da materials ruta nema TS grešaka (npx tsc --noEmit u mobile).**

14. **U mobile pokreni ESLint nad app/(producer)/quality-entry.tsx i features/grower/quality-entry/ – ispravi sve što izbaci.**

15. **U mobile pokreni ESLint nad app/(producer)/materials.tsx i features/grower/materials/ – ispravi sve što izbaci.**

16. **U mobile pokreni `npx tsc --noEmit` – proveri da nema TypeScript grešaka u celom projektu.**

17. **U mobile pokreni `npx expo export --platform ios` (ili npm run build ako postoji) – proveri da build prolazi.**

18. **Ažuriraj MOBILE_GROWERS_URADJENO_I_OSTALO.md: u sekciji "Šta je urađeno" dodaj quality-entry i materials refaktor; u "Šta treba" prebaci ih u urađeno i obriši iz tabele refaktora.**

19. **Ažuriraj MOBILE_STA_OSTALO_I_DALJE.md: u 2.1 označi quality-entry i materials kao urađene (npr. ✅); u Fazi 2 označi 2.1 i 2.2 kao završene.**

20. **Napiši kratak rezime u MOBILE_NAREDBE_2H.md na dnu fajla: šta je urađeno u ovom bloku (quality-entry refaktor, materials refaktor, provera TS i build, ažuriranje MD fajlova).**

---

## Kako da koristiš

- Ubaci naredbu **1**, pa kad asistent završi – naredbu **2**, itd.
- Možeš reći i: *„Uradi naredbu 3“* ili *„Naredba 5“*.
- Ako nešto već postoji (npr. hook već napravljen), asistent može preskočiti ili prilagoditi.

---

## Rezime posle izvršenja (popuni asistent nakon naredbe 20)

- **Refaktor quality-entry:** Izvučeni `useQualityEntryData`, `QualityForm`, `BatchSelector`, `QualityEntryScreen` u `features/grower/quality-entry/`; `app/(producer)/quality-entry.tsx` je tanki wrapper.
- **Refaktor materials:** Izvučeni `useMaterialsData`, `MaterialList`, `WhitelistSearch`, `MaterialsScreen` u `features/grower/materials/`; `app/(producer)/materials.tsx` je tanki wrapper.
- **TS / build:** `npx tsc --noEmit` prolazi (uklonjen dupli import `Linking` u VeraAIChatbot.tsx). `npx expo export --platform ios` uspešan. ESLint u mobile nije konfigurisan – provera preko IDE linta, bez grešaka.
- **MD ažurirani:** MOBILE_GROWERS_URADJENO_I_OSTALO.md (quality-entry i materials u „Šta je urađeno“, uklonjeni iz „Šta treba“). MOBILE_STA_OSTALO_I_DALJE.md (2.1 tabela i Faza 2.1/2.2 označeni kao završeni).

---

## Naredbe za sledećih ~2h (Blok 2 – teži zadaci)

Ove naredbe su namenski veće (ceo refaktor ekrana, ESLint setup, provere flow-a). Jedna naredba ≈ 5–15 min. Kopiraj jednu po jednu.

---

**Refaktor compliance-photos**

1. **Otvori app/(producer)/compliance-photos.tsx, pročitaj ga u celosti. Napravi features/grower/compliance-photos/useCompliancePhotosData.ts – izvuci sav state, API pozive i logiku (lista, upload, refresh) u hook.**

2. **U features/grower/compliance-photos/ napravi komponentu PhotoUploadBlock.tsx (ili sličan naziv) – blok za dodavanje/slanje foto; koristi podatke iz hooka preko props. Izvuci iz compliance-photos.tsx.**

3. **U features/grower/compliance-photos/ napravi CompliancePhotosList.tsx – lista stavki/foto; prima filtered list i handlere iz hooka.**

4. **U features/grower/compliance-photos/ napravi CompliancePhotosScreen.tsx koji koristi useCompliancePhotosData, PhotoUploadBlock i CompliancePhotosList. Zameni app/(producer)/compliance-photos.tsx tankim wrapperom koji samo renderuje <CompliancePhotosScreen />. Proveri npx tsc --noEmit.**

---

**Refaktor estates**

5. **Otvori app/(producer)/estates.tsx i app/(producer)/estates/ (lista i detalj). Napravi features/grower/estates/useEstatesData.ts – izvuci učitavanje liste estate-a, state i API pozive u hook.**

6. **U features/grower/estates/ napravi EstateList.tsx – lista njiva (kartice); prima listu i handlere iz hooka. Ako postoji EstateDetail/Form u app/estates/, izvuci ih u features/grower/estates/ kao EstateDetail.tsx i EstateForm.tsx (ili jedan ekran za detalj).**

7. **Napravi EstatesScreen.tsx u features/grower/estates/ koji koristi useEstatesData i EstateList. Ako ima ruta estates/[id] i estates/new, ostavi ih u app/ ali neka delegiraju na feature komponente. Zameni app/(producer)/estates.tsx tankim wrapperom. Proveri tsc.**

---

**Scanner i ESLint**

8. **Otvori app/(producer)/scanner.tsx. Ili (A) podeli na features/grower/scanner/ScannerView.tsx (kamera/scan UI) i ResultHandler.tsx (šta se dešava posle skeniranja), ili (B) ostavi jedan fajl ali proveri da nema TS/theme grešaka. Uradi jednu od opcija i proveri npx tsc --noEmit.**

9. **U mobile dodaj ESLint: npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin. Napravi eslint.config.js (flat config) koji za .ts/.tsx u app i features koristi TypeScript parser i reasonable rules (npr. no-unused-vars, no-console warn). Napiši u MOBILE_STA_OSTALO_I_DALJE da je ESLint dodat.**

10. **Pokreni npx eslint "app/**/*.ts" "app/**/*.tsx" "features/**/*.ts" "features/**/*.tsx" u mobile i ispravi sve greške koje izbaci (maks 20–30 min). Ako ima previše, ispravi bar u app/(producer)/ i features/grower/.**

---

**Liste (batches, missions, orders) – refaktor u feature**

11. **Proveri broj linija u app/(producer)/batches.tsx. Ako je preko ~300, napravi features/grower/batches/BatchesListScreen.tsx (ili slično) i useBatchesListData.ts – izvuci listu batch-eva i state u hook, ekran u feature, app/(producer)/batches.tsx tanki wrapper. Isto uradi za missions.tsx ako prelazi ~300 linija.**

12. **Isto za app/(producer)/orders.tsx: ako prelazi ~300 linija, napravi features/grower/orders/OrdersListScreen.tsx i useOrdersListData.ts, tanki wrapper u app/. Proveri tsc.**

---

**Offline-first i funkcionalna provera**

13. **Proveri features/grower/field-log i offline: da li se field entries čuvaju u offlineStorage pre slanja na server? Otvori useFieldLogData i offline-storage/sync – napiši u MOBILE_STA_OSTALO_I_DALJE jednu rečenicu: „Field log: offline first da/ne“ i eventualno šta fali.**

14. **Proveri features/grower/quality-entry: da li quality entry šalje direktno na API ili ima offline queue? Ako nema offline, napiši u MOBILE_STA_OSTALO_I_DALJE pod 2.3 jednu rečenicu šta je stanje; ne moraš implementirati offline sada.**

15. **Proveri app/(producer)/compliance-photos ili features/grower/compliance-photos (ako si uradio refaktor): da li postoji pending queue za foto kao u field log? Napiši u MOBILE_STA_OSTALO_I_DALJE u 2.3 Compliance photos da li ima offline queue ili ne.**

---

**Build, dokumentacija, rezime**

16. **U mobile pokreni npx tsc --noEmit pa npx expo export --platform ios. Ako nešto pukne, ispravi. Javi da li build prolazi.**

17. **Ažuriraj MOBILE_GROWERS_URADJENO_I_OSTALO.md: u „Šta je urađeno“ dodaj compliance-photos i estates refaktor (ako urađen); u „Šta treba“ ukloni ili označi opciono. Ažuriraj MOBILE_STA_OSTALO_I_DALJE.md – Faza 2.3/2.4 i Faza 3 – šta je urađeno u ovom bloku.**

18. **Na dnu MOBILE_NAREDBE_2H.md u odeljku „Rezime Blok 2“ (ispod) napiši šta je urađeno: refaktor compliance-photos (da/ne), estates (da/ne), scanner (da/ne), ESLint (da/ne), liste batches/missions/orders (da/ne), offline provera (šta si zapisao), build (prošao/ne).**

---

## Rezime Blok 2 (popuni asistent nakon naredbe 18)

- **Refaktor compliance-photos:** da. useCompliancePhotosData, PhotoUploadBlock, CompliancePhotosList, CompliancePhotosScreen; tanki wrapper u `app/(producer)/compliance-photos.tsx`.
- **Refaktor estates:** da. useEstatesData, EstateList, EstatesScreen; tanki wrapper u `app/(producer)/estates.tsx`. Detalj/new/edit ostaju u app rute.
- **Scanner:** da (opcija B – jedan fajl, TS/theme već ok).
- **ESLint:** da. Dodati eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin, eslint.config.js. Ispravljeni neiskorišćeni importi u batches, missions, notifications, orders, scanner. Zapis u MOBILE_STA_OSTALO_I_DALJE.
- **Liste batches/missions/orders:** batches (289) i missions (292) ispod 300 – nisu refaktorisane. Orders (304) – da: useOrdersListData, OrdersListScreen, tanki wrapper.
- **Offline provera:** Field log – offline first da (savePendingEntry). Quality entry – šalje direktno na API, nema offline queue. Compliance photos – nema offline queue. Zapis u MOBILE_STA_OSTALO_I_DALJE 2.3.
- **Build:** prošao. `npx tsc --noEmit` i `npx expo export --platform ios` uspešni.
- **MD ažurirani:** MOBILE_GROWERS_URADJENO_I_OSTALO (compliance-photos, estates, orders lista u urađeno). MOBILE_STA_OSTALO_I_DALJE (Faza 2.3/2.4, estates, orders lista, 3.1 ESLint, 2.3 offline napomene).
