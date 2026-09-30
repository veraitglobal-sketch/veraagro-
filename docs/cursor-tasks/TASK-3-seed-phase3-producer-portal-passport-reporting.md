# TASK 3 — Seed Phase 3: producer (factory) portal, seed origin in the product passport, reporting

> Start only after FIX-1 and FIX-2 are done and reported. Read this whole file first. This replaces the short "PHASE 3" section of `ADDENDUM-2-approved-products-biovera-seed-traceability.md` (where they differ, this file wins). Implement in the order of the sections (0 → 1 → 2 → 3), finish each section completely (code + migration + tests + manual check), then report.

## 0. Rules (same as before)
- English base language — every new UI string via i18n keys (`web/locales/en.json`, `mobile/i18n/locales/en.json`); backend texts English literals.
- Styling identical to existing pages: admin = `AuthGuard` + `SidebarLayout` + `useAdminNavItems()` + `components/ui/Premium.tsx`; the new producer portal copies the supplier portal shell (`web/app/supplier/layout.tsx`, `SupplierHeader.tsx`) with its own nav.
- Real data only; empty states say what to do next.
- **Never touch production.** `backend/.env` points to the production DB — run every local command with `DATABASE_URL="postgresql://jovicamihajlovic@localhost:5432/biovera_db"`. New migration folder `backend/prisma/migrations/<YYYYMMDDHHMMSS>_seed_phase3/`.
- No personal data on public endpoints/pages (no grower/supplier names, e-mails, phones, parcel coordinates).
- All suites green at the end: backend `npx tsc --noEmit && npx jest && npm run test:integration`; web `npx tsc --noEmit`; mobile `npx tsc --noEmit && npm test`.

## What exists after Phases 1–2 (build on it)
- Models: `approved_products` (+ `instructions` JSON), `seed_producers` (`userId String? @unique` already present), `seed_production_runs`, `seeds` (bags; `productionRunId`, `plantedParcelId`, `plantedAt`, `plantingId`, `supplierUserId`, `soldToGrowerId`), `seed_custody_events`.
- Backend module `backend/src/seed-production/` (admin API under `/seed-production/*`, public `/public/seed/verify/:serial`), supplier bag endpoints in `backend/src/b2b-suppliers/`.
- Lot passport data: `GET /qr/verify/:batchId` in `backend/src/qr/qr.controller.ts` / `qr.service.ts` (already loads `batch.parcels` and legacy `parcels.seeds`), rendered by `web/app/passport/[batchId]/page.tsx` and `web/app/verify/[batchId]/page.tsx`; PDF `GET /qr/verify/:batchId/pdf`.
- Post-login routing: `web/lib/post-login-redirect.ts`.
- Admin supply overview (Task 1): `/admin/supply` + `GET /catalog/admin/supply`.

---

## 0. FIRST: in the mobile app, scanning a bag = recording the material input (planting entry)

**Business rule.** The same QR on the bag behaves differently:
- **Phone camera / web** → `/s/<serial>` = usage instructions + authenticity (done in Phase 1, keep as is).
- **Bio Vera mobile app (grower)** → it is a **material input entry**: "I planted/sowed this seed (this bag, this lot), on this parcel, this much, on this date". It must end up in the grower's field diary, in the bag's custody history, in admin Supply, and later in the lot passport.

**Problem found:** `backend/src/field-entries/field-entries.service.ts` `create()` does **not persist anything** — after validation it returns a fake object (`id: entry_${Date.now()}` with a "placeholder" comment). Every field-diary / material entry from the app (SETVA, fertilizer, spraying…) is lost.

### 0.1 Persist field entries (all types)
- New model (migration in the same `_seed_phase3` folder):
```prisma
model field_entries {
  id               String   @id @default(uuid())
  userId           String
  farmId           String            // estates.id
  parcelId         String?
  plantingId       String?           // harvest_announcements (PLANTING) if chosen
  type             String            // existing entry types used by the app (SETVA, PRIHRANA, ZASTITA, …) — keep the current values
  occurredAt       DateTime
  materialName     String?
  materialQuantity Float?
  materialUnit     String?           // kg | g | l | ml | pcs | bag
  areaHa           Float?
  seedSerialNumber String?           // Bio Vera bag serial if scanned
  seedId           String?           // seeds.id (bag)
  fertilizerBarcode String?
  lat              Float?
  lng              Float?
  notes            String?
  photos           String[]          // durable URLs (existing image upload interceptor)
  data             Json               // keep the full original payload for backward compatibility
  clientReference  String?           // offline idempotency key from the device
  createdAt        DateTime @default(now())
  @@unique([userId, clientReference])
  @@index([userId, occurredAt])
  @@index([parcelId])
  @@index([seedId])
}
```
- `create()` stores the row (idempotent on `clientReference`), keeps all current validations (`materialBarcodeValidation`, `smartLockService.ensureSeedLinkedToParcel`) and returns the saved row. `GET /field-entries` reads from this table (filters: farm, parcel, type, date range) so `mobile/features/grower/field-log/*` history shows real saved entries.
- Backfill nothing (old entries were never stored); say so in the report.

### 0.2 Scan → "Planting entry" screen (mobile grower)
- When a grower scans a Bio Vera bag in the app (seed registration scanner, field-log scanner, `mobile/app/s/[serial].tsx`, `biovera://seed/<serial>`), after the genuine check open a **Planting entry** form prefilled from the bag: product, variety, lot, seed year, bag size (e.g. 5 kg), producer.
- Fields: **Parcel** (required, grower's parcels; preselect the parcel of the open PLANTING plan for this crop if exactly one), **Planting plan** (optional select), **Date** (default today), **Quantity used** (default = whole bag; allow partial: kg with the bag size as max) , **Area sown (ha)** (optional, default from parcel area), notes, optional photo. GPS captured automatically.
- **Several bags at once:** "Scan another bag" adds bags to the same entry (list with ✓ per bag); total quantity = sum. Each bag is validated individually (same rules as Phase 1).
- Save → one `field_entries` row (type `SETVA`, material = product name, quantity + unit, area, seedSerialNumber of the first bag + `data.bags[]` with all serials and quantities) **and** for each bag: status `PLANTED` (or new `PARTIALLY_USED` when quantity < bag size — then the remaining kg can be planted later with another entry; `PLANTED` when fully used), `plantedParcelId`, `plantedAt`, `plantingId`, custody `PLANTED` with GPS and quantity in `note`.
- Offline: the whole entry (with all bags) is queued with a `clientReference` and synced later (reuse `offlineStorage` / `sync-service.ts`), UI says "Saved — will sync when online".
- After save show a summary card: "Planted 3 bags (15 kg) of Bio Vera Raspberry seed – Willamette, lot NS2604, on Test farm A · 0.4 ha" with link to the parcel and to the field diary.
- Field diary (mobile + admin grower control) shows these entries with the seed origin.
- **Other materials:** the same scanner in the field-log for fertilizer / plant protection barcodes (existing `fertilizerBarcode` validation) opens the matching entry type prefilled (material name from `approved_products`/supplier catalogue if linked), quantity + unit + area — stored in the same table.

### 0.3 Tests (section 0)
- Field entry is persisted and returned by `GET /field-entries`; idempotent on `clientReference`.
- Planting entry with 3 bags (one partial 2 kg of 5 kg) → 1 field entry; bags PLANTED/PARTIALLY_USED; custody rows with GPS; second entry can use the remaining 3 kg of the partial bag, not more.
- Scanning an invalid/recalled/not-yours bag in the multi-bag list rejects only that bag with its message.

### Acceptance (section 0)
1. Grower scans a bag QR **in the app** → planting form with product/lot prefilled (not the website).
2. Adds 2 more bags by scanning, chooses parcel, saves → field diary shows "Planting — 15 kg Bio Vera Raspberry seed (3 bags, lot NS2604) — Test farm A"; admin Supply + bag lookup show it.
3. Same QR scanned with the iPhone Camera app → website with instructions (unchanged).
4. Offline save → synced when back online, no duplicates.

---

## 1. Producer (factory) portal

### 1.1 Role & account
- Add `SEED_PRODUCER` to `enum UserRole` (migration). Keep all existing roles.
- Admin → Seed production → Producers → producer detail gets **"Invite portal user"**: form (first name, last name, e-mail). Backend `POST /seed-production/producers/:id/invite { firstName, lastName, email }`:
  - creates a `users` row with `roles: ['SEED_PRODUCER']`, `status: ACTIVE`, generated `partnerCode` (`PROD-<short>`), links `seed_producers.userId`;
  - sends the existing account/password-setup e-mail flow (reuse whatever the app uses for invited users / password reset — do **not** invent a new mechanism; if only password reset exists, create the user with a random password and send a reset link);
  - one user per producer (409 if already linked); admin can **Unlink / deactivate** (sets user SUSPENDED, clears link).
- `web/lib/post-login-redirect.ts`: `SEED_PRODUCER` → `/seed-producer`. Mobile: a producer logging in to the mobile app sees a simple screen "Use the Bio Vera web portal for production runs" with a link (no mobile portal in this task).

### 1.2 Backend (producer scope)
New controller `backend/src/seed-production/seed-producer.controller.ts`, route prefix `/seed-producer`, `@Roles('SEED_PRODUCER')`. Resolve the producer by `seed_producers.userId = req.user.id`; every query is filtered to that producer — a producer must never see another producer's runs (add tests).
| Method & path | Purpose |
|---|---|
| `GET /seed-producer/me` | producer profile (name, city, licence) |
| `GET /seed-producer/runs` | own runs: lot, product, seed year, planned/produced, status, dates |
| `GET /seed-producer/runs/:id` | run detail (no grower/supplier data — only counts per bag status) |
| `GET /seed-producer/runs/:id/labels.csv` / `labels.pdf?format=sheet\|roll` | same generator as admin; only when `LABELS_ISSUED` or later |
| `POST /seed-producer/runs/:id/confirm-production` | same DTO & rules as admin confirm (bagsProduced ≤ planned, productionDate, germination/purity, certificates upload); only from `LABELS_ISSUED` |
| `POST /seed-producer/runs/:id/certificates` | upload certificate file (PDF/JPG, ≤ 10 MB) → durable URL appended to `certificateUrls` |
- Producers can **not**: create runs, issue labels, release, ship, assign, recall (admin only).
- Audit every producer action (`audit_trails`, actor = producer user) and notify admins: `Production confirmed by NS Seme — lot NS2604: 22 of 24 bags` (English).

### 1.3 Web portal `/seed-producer`
Files: `web/app/seed-producer/layout.tsx` (shell like supplier: logo, producer name, nav **My runs**, **Profile**, logout), `page.tsx` (runs list), `runs/[id]/page.tsx`.
- **My runs:** table — lot, product/variety, seed year, bags planned/produced, status badge, "Labels ready" indicator. Empty state: "Bio Vera will create a production run and issue labels for you."
- **Run detail:** status stepper (same component look as admin run page), buttons **Download labels (sticker sheet PDF)**, **Download labels (roll PDF)**, **Download CSV**, a short printing guide (sheet size A4 3×8 70×37 mm, roll 100×60 mm, "print exactly these codes, one per bag, do not duplicate"), and the **Confirm production** form (bags produced, production date, germination %, purity %, certificate upload with file list). After confirm: read-only summary + "Waiting for Bio Vera to release the lot".
- **Profile:** read-only producer data + contact Bio Vera.

### 1.4 Tests (section 1)
- Unit/integration: producer A cannot read/confirm producer B's run (403/404); producer cannot call admin endpoints; confirm rules identical to admin; invite creates user + link, second invite → 409; post-login redirect maps `SEED_PRODUCER`.

### Acceptance (section 1)
1. Admin invites `production@nsseme.example.test` for NS Seme → user can sign in → lands on `/seed-producer`.
2. Producer sees only NS Seme runs; downloads PDF/CSV for a `LABELS_ISSUED` run; confirms 22 of 24 with germination/purity and a PDF certificate upload.
3. Admin gets the notification; admin run page shows the confirmation (who/when) and the certificate.

---

## 2. Seed origin in the product passport (field → shelf)

### 2.1 Backend
In `backend/src/qr/qr.service.ts` (the service behind `GET /qr/verify/:batchId` and its PDF):
- Find Bio Vera bags linked to the lot: `seeds` where `plantedParcelId = batch.parcelId` **and** (`plantingId` = the batch's planting/harvest plan chain if known, else `plantedAt` within the same season window already used in `qr.service.ts` for materials). Group by production run.
- Return `seedOrigin: [{ product, variety, lotNumber, seedCropYear, producer: { name, city, country }, productionDate, germinationPct, purityPct, certificateUrls, bagsPlanted, plantedFrom, plantedTo, recalled: boolean }]` (empty array if none; keep legacy `parcels.seeds` output unchanged for old data).
- If any linked run is `RECALLED`, include `recalled: true` + recall date (no reason text publicly if it contains internal notes — use a generic "This seed lot was recalled by Bio Vera").
- Include the same section in the lot passport PDF.

### 2.2 Web
- `web/app/passport/[batchId]/page.tsx` and `web/app/verify/[batchId]/page.tsx`: new section **"Seed origin"** (after the field/parcel section): per run a card — product + variety, `Lot NS2604 · Seed year 2026`, producer + city, production date, germination/purity, certificate links, "Planted: 3 bags, 12–14 Apr 2026", link "Verify a seed bag" → `/s/<one serial>`… **no**: do not expose serials publicly; link to a generic explanation page instead. Recalled → amber notice.
- Admin → Supply (`/admin/supply`): badge **"Bio Vera seed"** on plantings/plans whose parcel has planted Bio Vera bags, with lot + bag count; side panel lists the bags (serials visible to admin).
- Mobile grower parcel detail: "Seed origin" card (same data) for their own parcels.

### 2.3 Tests (section 2)
- Integration: create run → release → assign → plant 2 bags on parcel P → create harvest lot on P → `GET /qr/verify/:batchId` returns `seedOrigin` with the run and `bagsPlanted: 2`; no personal data in the response; recalled run flagged; lot on a parcel without Bio Vera bags → `seedOrigin: []`.

### Acceptance (section 2)
Grower plants 2 Bio Vera bags on parcel P → later a harvest lot is created on P → the public passport of that lot shows "Seed origin: Bio Vera Raspberry seed – Willamette, lot NS2604, 2026, NS Seme, Novi Sad, germination 92%"; admin Supply shows the "Bio Vera seed" badge.

---

## 3. Reporting

### 3.1 Backend
- `GET /seed-production/reports/summary?year=&productId=` → per approved product and seed year: labeled, produced, voided, at producer (AVAILABLE not shipped), shipped to suppliers, in supplier stock, sold to growers, planted, recalled; plus per supplier: received / in stock / sold; plus parcels planted with Bio Vera seed (count + ha if parcel area known).
- `GET /seed-production/reports/bags.csv?runId=&status=&supplierUserId=` → bag register: serial, lot, product, seed year, status, supplier (name/partner code), grower partner code, parcel id, sold at, planted at, last event. Admin only. Stream large exports.
- `GET /seed-production/reports/recall-impact/:runId` → growers (name, partner code, phone for admin), parcels, bags per status — used by the recall dialog (FIX-2 B1) and the run page.

### 3.2 Admin web
- `/admin/seed-production` dashboard: year + product filters; stat cards (produced / in supplier stock / sold / planted / recalled); table per product & year with the funnel columns; table per supplier; **Export bag register (CSV)** button; list "Parcels planted with Bio Vera seed" (grower partner code, parcel, bags, lot, planted date) with links.
- Run page: "Recall impact" panel using the endpoint (also after recall).

### 3.3 Tests (section 3)
- Summary numbers match a seeded scenario exactly (unit or integration); CSV row count = bags; recall-impact lists the right growers/parcels.

### Acceptance (section 3)
Dashboard funnel numbers for NS2604 match the database; CSV export opens in Excel with one row per bag; recall impact shows the correct growers/parcels.

---

## Final report (after all 3 sections)
- Files changed, new endpoints, migration name(s) to run in production **later, together with the backend deploy** (`railway run npx prisma migrate deploy` — do not run it from `backend/` with `.env`), new env vars (none expected), how each acceptance step was verified, test results.
