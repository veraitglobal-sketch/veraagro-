# FIX 2 — Seed production Phase 1: issues found in the local review

Context: ADDENDUM-2 Phase 1 was verified locally on 2026-09-27 (local DB, LOCAL-ADMIN / LOCAL-FARMER, run `NS2604`, 24 bags). Working: approved product + instructions tab, producer, run stepper, issue labels (24 unique serials), CSV (24 rows) + PDF sheet/roll, confirm production (22 / 2 voided), release, assign, grower scan rules (not ours / tampered / not yours / not released / already registered / recalled), custody with GPS, scan audit with error codes, public `/s/<serial>` with instructions and no personal data, `/verify/seed/…` redirect, recall + grower notification.

Fix the items below **in this order**. Same rules as before (English base via i18n, identical styling, real data, tests green). Do this before or together with Phase 2 — Phase 2 builds on these screens.

## A. Must fix before the first real print

### A1. Label layout: logo overlaps the product name (PDF sheet + roll)
`backend/src/seed-production/seed-labels.ts`: the logo image is drawn on top of the first text line ("Bio Vera Raspberry seed…"), and there is an extra green text "Bio Vera" above it. Result on every label: overlapping, unreadable header.
- Layout per label (70 × 37 mm): top row = logo (left, max 18 mm wide) + product name/variety to the right of the logo (wrapped, max 2 lines, font auto-shrink); no separate "Bio Vera" text. Then `Lot · Seed year · size`, `Best before`. Bottom: Code128 (left) + QR (right).
- Product name must not repeat the variety: currently "Raspberry seed – Willamette — Willamette". Print `name` once; append variety only if it is not already contained in the name.
- **QR size ≥ 15 mm** (currently ~12 mm) with a 2-module quiet zone; Code128 bar height ≥ 10 mm; keep 3 mm inner margin so nothing is cut when the sticker sheet is slightly misaligned.
- Add a unit test that renders one label and asserts text positions don't overlap (compare bounding boxes you compute), and regenerate a sample PDF in the report.

### A2. One parcel can only take ONE bag
Scanning a second bag on the same parcel fails with "Parcel is already linked to seed BV-…. Use that batch or contact support." (legacy `parcels.seedId` single link in `smart-lock.service.ts#ensureSeedLinkedToParcel`). A 1 ha raspberry field needs many 5 kg bags.
- For Bio Vera bags (`productionRunId` set): allow many bags per parcel (link via `seeds.plantedParcelId`), keep `parcels.seedId` = first bag (or the latest) only for legacy screens. Still forbid bags of a **different product/cropType** on the same parcel+planting unless admin overrides.
- Parcel detail (admin + mobile) lists all bags planted on it (count, total kg, lots).

### A3. Voided codes look "genuine"
`GET /public/seed/verify/:serial` and `/s/<serial>` for a `VOIDED` bag return `genuine: true` + full instructions. Extra printed labels could be misused.
- `VOIDED` (and bags of a run that is still `LABELS_ISSUED`, i.e. not produced) → `{ genuine: false, reason: 'NOT_ISSUED_FOR_SALE' }`, red page "This code was not issued for sale", no instructions.

### A4. Recall must not turn VOIDED bags into RECALLED
After recall the run shows "Recalled: 23" (21 unplanted + 2 voided). Keep VOIDED as VOIDED; recall only bags that were produced (AVAILABLE / ASSIGNED / IN_SUPPLIER_STOCK / SOLD).

## B. Admin UX required by the spec but missing

- **B1 Recall dialog** must show the impact **before** confirming: number of bags per status that will be recalled, list of growers holding bags, list of parcels already planted from this lot (links). After recall, keep that list visible on the run page ("Affected parcels").
- **B2 Assign bags dialog**: grower search by name / partner code (typeahead, not a bare text field) and a **preview** of the pasted serials (✓ valid & available / ✗ reason) before "Assign".
- **B3 Approved product form**: add the **Category** select (Seed / Fertilizer / Plant protection / Packaging / Other) — Phase 2's approved list needs it; only `SEED` products can be used for production runs.
- **B4 Confirm production**: certificates only as "URLs one per line". Add file upload (PDF/JPG) through the existing upload helper → durable URL (same as other document uploads in the backend), keep URL input as fallback.

## C. Scanning behaviour
- **C1** `POST /smart-lock/scan` **without** `parcelId` for a Bio Vera bag returns 201 and records `isValid:false` with an empty `validationError` (two such rows for bag 1). Make it explicit: without a parcel it is a validation-only scan → record `isValid:true, validationError:'VALIDATION_ONLY'` (or reject with "Choose the parcel you are planting on"), and the mobile app must always send the selected parcel when planting.
- **C2** The mobile "Genuine Bio Vera seed" card could not be verified in the web preview (camera only). Add a manual serial field on the seed registration screen (spec 1.5 "Manual entry field accepts the printed serial") so it can be tested and used when a label is damaged; the same result card must show for manual entry.

## Re-check after fixing (report each)
1. New sample PDF: no overlap, name without duplicate variety, QR ≥ 15 mm; scan QR + Code128 from the printed/zoomed PDF with the mobile app.
2. Plant 3 bags of the same lot on one parcel → all PLANTED; parcel shows 3 bags / 15 kg.
3. `/s/<voided serial>` → "not issued for sale"; recall keeps voided as VOIDED; recall dialog shows affected growers/parcels before confirm.
4. Manual serial entry on mobile shows the genuine card; scan without parcel is recorded as validation-only.
5. `backend: npx tsc --noEmit && npx jest && npm run test:integration`; `web: npx tsc --noEmit`; `mobile: npx tsc --noEmit && npm test` — all green.

## Dev safety (repeat)
`backend/.env` points to the **production** database. Always run local commands with `DATABASE_URL="postgresql://jovicamihajlovic@localhost:5432/biovera_db"`.
