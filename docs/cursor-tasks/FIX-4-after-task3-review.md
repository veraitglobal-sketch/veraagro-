# FIX 4 — Issues found while verifying TASK-3 (seed phase 3) + FIX-3

Verified locally on 2026-09-28 (local DB, LOCAL-* accounts, producer user for NS Seme). Working: field entries persisted + idempotent (`clientReference`), multi-bag planting with partial bag (PARTIALLY_USED → PLANTED, over-use rejected with a clear message), GPS geofence on parcel, producer invite (409 on second invite), producer login → `/seed-producer`, producer isolation (other factory's run → 404 for detail/labels/confirm), producer confirm with certificate upload + admin notification, `seedOrigin` in `GET /qr/verify/:batchId` with recall notice and no new personal data, `/verify/<batchId>` "Seed origin" section, reports summary / bags CSV / recall impact respond, buyer register returns `PENDING_APPROVAL` without a token, mobile planting-entry screen (manual serial, bag card with lot/year/producer, whole-bag default quantity, invalid code message).

Fix in this order. Same rules as before (English base via i18n, identical styling, real data, local DB only — `backend/.env` points to production — all suites green).

## A. Blocking / production risk

### A1. Public product passport crashes
`/passport/<batchId>` (e.g. `BATCH-2026-6395`, a lot that was transported by a mission) renders **"Something went wrong — Objects are not valid as a React child (found: object with keys {distance, duration, waypoints, destination, estimatedArrival})"**.
- Cause: `web/app/passport/[batchId]/page.tsx` renders `data.sustainability.route` (and `timeline.transport.route`) as text, but the API (`backend/src/qr/qr.service.ts`) returns the mission's `optimalRoute` **object** there.
- Fix both sides: backend returns `route` as a human string (e.g. "Test farm A → Novi Sad, 350 km") plus `routeDetail` object if needed; frontend never renders a non-string (guard with a formatter). Add a test that the passport page renders for a lot with a mission + optimalRoute, and check `/verify/<batchId>` and the passport PDF too.
- This is the page end customers scan — highest priority.

### A2. Certificates are stored on the server's local disk
`backend/src/common/durable-document.ts` writes producer certificates to `uploads/seed-certificates/…` and stores `/uploads/…` paths. On Railway the container disk is wiped on every deploy → all certificate links break after the next deploy.
- Store certificate files durably the same way the rest of the app stores files (e.g. in PostgreSQL like `durable-image.ts` does for images, or in the object storage the project already uses for other documents — check `quality-entry`, `logistics-drivers`, `b2b-suppliers` services). Serve them through an authenticated/public route with the right content type. Keep the size limit (≤ 10 MB) and type check (PDF/JPG/PNG).
- Migrate existing local `/uploads/seed-certificates` URLs is not needed (dev only), but make old URLs not crash.

### A3. Planting entry: one bad scan blocks the whole entry
`mobile/features/grower/planting-entry/PlantingEntryScreen.tsx`: a rejected bag stays in the list ("? / Lot ? · 0 · ? — This is not a Bio Vera seed code.") and **Save** is blocked by `fixBagsFirst`, but there is **no way to remove a bag** from the list. The grower has to leave the screen and start again.
- Add a remove (×) button on every bag row (valid and invalid). Show rejected bags as a compact red row with the scanned text and the reason (no "?" placeholders).
- Only valid bags count toward the total; Save stays disabled with a clear inline reason while a rejected bag is still in the list.

## B. Correctness

- **B1 Reports summary numbers** (`GET /seed-production/reports/summary`): `produced: 24` while the runs have produced 22 + 8 + 6 + 11 = 47 bags. Define every funnel column clearly and make them cumulative where it makes sense: **labeled** (all codes issued), **produced** (sum of `bagsProduced` of confirmed runs), **voided**, **at producer** (AVAILABLE, not shipped), **shipped to suppliers** (ever shipped — cumulative; currently "2" although 4 were shipped), **in supplier stock**, **sold to growers** (ever sold), **assigned directly by admin**, **planted** (PLANTED + PARTIALLY_USED), **recalled**. Add a unit test with a seeded scenario that checks every number. Show a tooltip with the definition of each column on the dashboard.
- **B2 plantedParcels** lists only one lot per parcel ("lot": "NS2606") although the parcel has bags from NS2604, NS2605 and NS2606 — return all lots (array) and the bag count per lot.
- **B3 Producer invite e-mail** uses `sendFarmerWelcomeEmail` (farmer text). Create a producer-specific e-mail: "You have access to the Bio Vera seed producer portal — sign in at …/seed-producer with …", with a password-set/reset link instead of a plain-text password if the app has a reset flow.

## C. UX / consistency (small)

- **C1 Product name repeats the variety** in several places: producer portal runs list ("Bio Vera Raspberry seed – Willamette — Willamette"), `/verify/<batchId>` seed origin, mobile planting entry bag card. Use one helper (`formatSeedProductName(name, variety)`) everywhere (it was fixed for the label PDF only).
- **C2 Raw statuses** in the producer portal ("LABELS_ISSUED", "RELEASED") — show labels ("Labels issued", "Released") and add the status stepper on the producer run page as in the spec (Planned → Labels issued → Produced → Released).
- **C3 Certificate file selection** in the producer confirm form shows nothing after choosing a file — show the selected file name(s) before submitting.
- **C4 Planting entry parcel select** shows "Jabuka – Ajdared (Postojeći zasad) (ff552998)" — show the parcel name / farm name, not an id fragment.
- **C5 Mobile planting entry needs GPS on open**; if location is not yet available when the user taps Save, request it again at Save time (and show "Getting location…"), instead of failing silently.

## Re-check (report each)
1. `/passport/BATCH-…` for a transported lot renders, including "Seed origin"; passport PDF works.
2. Upload a certificate, redeploy/restart with a clean `uploads/` folder → certificate link still works.
3. Planting entry: scan a wrong code, remove it with ×, save with the valid bag → field diary entry created.
4. Summary numbers match the DB for the scenario in the test; dashboard tooltips present.
5. All suites green (backend tsc + jest + test:integration, web tsc, mobile tsc + test).
