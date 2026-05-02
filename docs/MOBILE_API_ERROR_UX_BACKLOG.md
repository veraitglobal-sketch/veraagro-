# Mobilni klijent — API poruke grešaka (paritet sa web `apiErrorOrT`)

**Cilj:** Isti princip kao na webu: iz Axios odgovora uzeti `response.data.message` (string ili niz), inače lokalizovan ili fiksni fallback.

**Stanje (maj 2026):** Web (`web/lib/api-error.ts`) je potpuno pokriven. **`mobile/lib/api-error.ts`** sada uključuje i **`isLikelyNetworkError`**, **`axiosResponseStatus`** (pored `axiosLikeMessage` / `apiErrorMessage`). Sledeći ekrani/servisi koriste `unknown` + ove helper-e tamo gde je to korisnički vidljivo ili gde se gradi tihi fallback (prazni nizovi).

## Predlog — red rada

1. ~~**`mobile/lib/api-error.ts`**~~ — **urađeno** (+ mreža / HTTP status helperi).
2. ~~**`mobile/contexts/AuthContext.tsx`**~~ — **urađeno** (završna Axios poruka kroz `axiosLikeMessage`).
3. ~~**`mobile/app/buyer-login.tsx`**~~ — **urađeno** (`unknown` + `Error.message`).
4. ~~**`mobile/app/buyer-register.tsx`**, **`mobile/app/register.tsx`**, **`mobile/app/seed-registration.tsx`**~~ — **urađeno**.
5. ~~**Grower hookovi:** `useFieldLogData.ts`, `useGrowthJournalData.ts`, `useMaterialCompliance.ts`, `useHarvestData.ts`, `useVeraInsightsData.ts`~~ — **urađeno**.
6. ~~**`mobile/lib/api.ts`**~~ — **urađeno** (`catch` blokovi sa `isLikelyNetworkError` / `axiosResponseStatus` / `apiErrorMessage`).
7. ~~**`mobile/lib/sync-service.ts`**, **`mobile/lib/integrity-guard.ts`**~~ — **urađeno**.
8. ~~Ostalo: **`app/products.tsx`**, **`b2b-supplier/[userId].tsx`**, **`manager/handover-complete`**, **`driver/handover-initiate`**, **`producer/estates/new|edit`**, **`producer/missions-create`**~~ — **urađeno**.

## Kriterijum „gotovo“

- `rg 'catch \\(.*: any\\)' mobile` → 0 u korisnički-vidljivim tokovima ( ili eksplicitno opravdani `unknown` + helper ).

---

## Web (isti princip, maj 2026)

- **`web/lib/api-error.ts`:** `isLikelyNetworkError`, `axiosResponseStatus` (uz postojeće `axiosLikeMessage` / `apiErrorOrT`).
- **`web/lib/api.ts`:** `inventoryAPI` i svi `catch` oko PDF download-a — `unknown` + helperi gde treba.
- **`web/app/[locale]/contact/page.tsx`**, **`web/lib/offline/compliance.ts`**, **`web/lib/image-upload.ts`:** `catch (error: unknown)` umesto `any`.
- Provera: `rg 'catch \\(.*: any\\)' web --glob '*.{ts,tsx}'` → 0.

---

## Backend (NestJS, maj 2026)

- **`src/main.ts`**, **`missions`**, **`orders`**, **`sync`**, **`pricing/discount-quota`**, **`health`**, **`inventory`**, **`email`**, **`market-scraper`**, **`vera-transparency`**, skripta **`scripts/create-test-products.ts`:** `catch (…: unknown)` + `instanceof Error` / bezbedno čitanje Prisma `code` gde treba.
- Provera: `rg 'catch \\(.*: any\\)' backend --glob '*.ts'` → 0.
