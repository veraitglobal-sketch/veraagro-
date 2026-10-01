# FIX 5 — Last items before the production release

Verified locally on 2026-10-01 after FIX-4 (commit 8633ebdc and later):
- ✅ `/passport/<batchId>` for a transported lot renders (route shown as text), "Seed origin" section present, passport PDF works.
- ✅ Producer certificate upload stored in `stored_documents`, served at `/documents/:id` as `application/pdf`, still available after a backend restart with an empty `uploads/` folder.
- ✅ Report summary matches the DB (labeled 56, produced 47, shipped 4, planted 8, recalled 23); planted parcel lists all lots.
- ✅ Mobile planting entry: wrong code shows a compact red row with × and reason; × removes it; save asks for GPS at save time; saved entry → summary card "Planted 1 bag(s) (5 kg) … lot NS2606, on Test njiva A · 1.75 ha"; parcel select shows the parcel/farm name.

Same rules as before (English base via i18n — add `sr` for any new keys, identical styling, local DB only, all suites green, commit locally, no push).

## 1. Field diary does not show saved entries (mobile)
`mobile/features/grower/field-log/FieldLogWizard.tsx` renders history only from `data.localHistory` (entries still queued on the device). Entries saved on the server (`GET /field-entries`, now persisted in `field_entries`) are never shown, so a grower can't see past planting/fertilizer/spraying records.
- Load `GET /field-entries` (farm/parcel filter, newest first, paginated 20) and show them in the history list together with pending local items (mark pending ones "Waiting to sync"; de-duplicate by `clientReference`).
- A SETVA entry with bags shows "Planting — 5 kg Bio Vera Raspberry seed (1 bag, lot NS2606)"; tap opens details (bags with serials, parcel, area, date, GPS, photo).
- "Open field diary" from the planting-entry success card must open this history view (not a new-entry wizard step 1).
- Admin → Grower control (or the grower detail page) shows the same server entries for that grower.

## 2. Report: "sold" must be cumulative
`GET /seed-production/reports/summary` → `byProductYear[].sold` is 1 while the supplier sold 2 bags (one of them was planted later). Per the FIX-4 definitions "sold to growers" = ever sold (count distinct bags with a `SOLD_TO_GROWER` custody event), same for "assigned directly by admin" (`ASSIGNED_TO_GROWER`). Keep "in supplier stock" and "at producer" as current-state numbers. Update the unit test.

## 3. Re-check
1. Grower saves a planting entry → it appears in the field diary history from the server (also after reinstalling the app / clearing storage); pending offline entry shows "Waiting to sync" and is not duplicated after sync.
2. Summary `sold` = 2 for the current local data.
3. All suites green; commit locally (no push); report.
