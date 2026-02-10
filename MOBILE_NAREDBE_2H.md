# 📋 BioVera Mobile – Semi-naredbe za ~2h posla (growers)

Kopiraj **jednu po jednu** u chat; asistent izvršava i prati se po ovoj listi. Redosled je namenski – refaktor pa provera pa build.

---

## Naredbe 1–20 (copy-paste jednu po jednu)

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

*(Ostavljeno prazno – asistent upisuje nakon naredbe 20.)*

- Refaktor quality-entry: …
- Refaktor materials: …
- TS / build: …
- MD ažurirani: …
