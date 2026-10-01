# Production release checklist

Use this runbook for deploying the seed-production / stored-documents release. **Do not skip the DB backup.** This document does not run deploys by itself.

**Production DB baseline:** migrations through `20260927200000_seed_production_pilot` are already applied.

---

## 0. Pre-flight (local)

- [ ] Branch is tested locally (`backend`, `web`, `mobile` builds green).
- [ ] Review pending migrations below (section 1).
- [ ] Confirm Railway and Vercel env vars (section 2).
- [ ] Fill universal-link placeholders if this release ships mobile deep links (section 3).
- [ ] Note current Railway deployment ID / Vercel deployment URL for rollback.

---

## 1. Pending Prisma migrations (production)

Apply **in order** via `cd backend && railway run npx prisma migrate deploy` after linking BioVera and confirming `railway status` (see Step 3). `railway run` injects production `DATABASE_URL` — **never** run migrate against production from a local `.env` unless intentionally using Railway CLI.

| Migration | What it does | Safety |
|-----------|--------------|--------|
| `20260927210000_seed_supplier_chain` | Adds nullable `approvedProductId` on `supplier_catalog_items` + index + FK (`ON DELETE SET NULL`) | ✅ Additive. Existing rows stay `NULL`. |
| `20260927220000_seed_phase3` | Adds `PARTIALLY_USED` to `SeedStatus`; nullable `quantityRemaining` on `seeds`; creates `field_entries` table + indexes | ✅ Additive. Uses `IF NOT EXISTS` for table/columns/indexes. **Note:** `CREATE UNIQUE INDEX field_entries_userId_clientReference_key` has no `IF NOT EXISTS` — safe on first run; would fail only if re-applied after partial failure. Enum value add is **irreversible** (PostgreSQL). |
| `20260927230000_seed_producer_role` | Adds `SEED_PRODUCER` to `UserRole` enum | ✅ Safe. Enum add is **irreversible**. |
| `20260927240000_stored_documents` | Creates `stored_documents` table (BYTEA payload) | ✅ Additive. **Ops:** DB size grows with uploaded certificates/PDFs; monitor storage. |

### Risk flags

| Item | Severity | Action |
|------|----------|--------|
| Enum additions (`PARTIALLY_USED`, `SEED_PRODUCER`) | Low | Cannot be rolled back with `migrate` alone; acceptable for this release. |
| `stored_documents.data` BYTEA | Low | Plan Railway Postgres disk; no automatic cleanup. |
| `field_entries` unique index not idempotent | Low | Only matters if a prior migrate failed mid-flight; check `_prisma_migrations` before retry. |
| Missing `SEED_LABEL_SECRET` before labels print | **High** | Set a dedicated secret **before** first label run; never rotate after print (see env section). |
| Missing `API_PUBLIC_URL` | Medium | Certificate URLs in emails/PDFs will be relative paths (`/documents/...`) instead of absolute HTTPS links. |

**Verify after migrate:**

```sql
SELECT migration_name, finished_at FROM _prisma_migrations
WHERE migration_name LIKE '202609272%'
ORDER BY migration_name;
```

Expect four rows, all finished.

---

## 2. Environment variables

### Railway (backend) — new or critical for this release

| Variable | Required | Purpose | Read in code |
|----------|----------|---------|--------------|
| `SEED_LABEL_SECRET` | **Yes** (before labels) | HMAC for seed bag serial QR/HMAC; fallback `JWT_SECRET` | `backend/src/seed-production/seed-serial.ts` |
| `API_PUBLIC_URL` | **Recommended** | Absolute URLs for stored certificates (`https://…/documents/:id`) | `backend/src/stored-documents/stored-documents.service.ts` |
| `WEB_PUBLIC_URL` | Optional | Producer invite link base (overrides `FRONTEND_URL`) | `backend/src/seed-production/seed-production.service.ts` |
| `FRONTEND_URL` | Yes (existing) | CORS, QR verify links, emails | `backend/src/main.ts`, `qr.service.ts`, `email.service.ts`, etc. |

Also ensure existing production vars remain set: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PORT`, SMTP/`EMAIL_*`, `ADMIN_EMAIL`.

Template: [`backend/.env.example`](../backend/.env.example).

### Vercel (web) — new for this release

No **new** required vars for seed-producer pages; they use the existing API client.

| Variable | Required | Purpose | Read in code |
|----------|----------|---------|--------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | All API calls (including `/seed-producer`, `/admin/seed-production`, passport, verify) | `web/lib/api-base.ts`, `web/lib/api.ts` |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URLs, metadata | `web/lib/site-url.ts` |
| `NEXT_PUBLIC_BASE_URL` | Recommended | Logout redirect | `web/app/api/logout/route.ts` |

Template: [`web/.env.example`](../web/.env.example).

---

## 3. Universal links (`.well-known`)

Files ship from `web/public/.well-known/` and are served at `https://biovera.app/.well-known/…` after Vercel deploy.

### Apple — `apple-app-site-association`

Replace placeholder:

```json
"appID": "TEAM_ID.com.biovera.app"
```

| Placeholder | Replace with |
|-------------|--------------|
| `TEAM_ID` | Your **Apple Developer Team ID** (10 characters, e.g. `ABCDE12345`). Full `appID` = `{TeamID}.com.biovera.app`. Must match iOS bundle ID `com.biovera.app` in `mobile/app.json`. |
| `paths` | Already `/s/*` — matches associated domains `applinks:biovera.app` and `applinks:www.biovera.app`. |

Find Team ID: [Apple Developer](https://developer.apple.com/account) → Membership → Team ID.

### Android — `assetlinks.json`

Replace placeholder:

```json
"sha256_cert_fingerprints": ["SHA256_FINGERPRINT_FROM_PLAY_CONSOLE"]
```

| Placeholder | Replace with |
|-------------|--------------|
| `SHA256_FINGERPRINT_FROM_PLAY_CONSOLE` | **SHA-256 certificate fingerprint** of the **release** signing key (Play App Signing → App integrity, or local release keystore via `keytool -list -v -keystore your-release.keystore -alias your-alias`). Format: colon-separated hex pairs, e.g. `AB:CD:EF:…:12`. |
| `package_name` | Already `com.biovera.app` — matches `mobile/app.json` → `android.package`. |

Add **both** Play App Signing and upload-key fingerprints if Google rotates keys.

---

## 4. Release order (exact sequence)

### Step 1 — Database backup

1. Railway Dashboard → PostgreSQL service → **Backups** (or manual `pg_dump`).
2. Confirm backup timestamp and restore procedure before continuing.

### Step 2 — Set environment variables

1. **Railway:** Set `SEED_LABEL_SECRET` (new dedicated value, ≥32 chars). Set `API_PUBLIC_URL` to public backend URL (e.g. `https://api.biovera.app`). Confirm `FRONTEND_URL=https://biovera.app`. **If startup logs show `assert-local-db` refusing `*.rlwy.net`**, set `ALLOW_REMOTE_DB=1` once (or redeploy after the Railway auto-detect fix in `assert-local-db.cjs`).
2. **Vercel:** Confirm `NEXT_PUBLIC_API_URL` points at the same Railway backend URL.
3. Redeploy is **not** required yet for env-only changes if you deploy in step 4–5 anyway.

### Step 3 — Link Railway CLI and run migrations (production DB)

Run from the **repo root**. The BioVera service has **Root Directory = `backend`** in Railway; `railway run` injects production `DATABASE_URL` from the linked service.

```bash
# Repo root — link to backend service (once per shell session)
railway link --project 68f2001e-878e-4888-9067-552842f58c25 --environment production --service BioVera
railway status
# MUST show project "satisfied-dedication" and service "BioVera" — NEVER "content-hope"

cd backend
railway run npx prisma migrate deploy
cd ..
```

- Expect **4** new migrations (see section 1).
- On failure: **stop**. Do not deploy app code. Inspect `_prisma_migrations` and Railway logs; restore from backup if schema is inconsistent.

### Step 4 — Deploy backend (Railway)

Run from the **repo root** — not `backend/`. BioVera’s Root Directory setting makes `railway up` from `backend/` deploy the wrong context.

```bash
# Repo root — confirm linked service before deploy
railway status
# MUST show project "satisfied-dedication" and service "BioVera" — NEVER "content-hope"

railway up --service BioVera --environment production --detach
```

- Wait for health: `GET https://<backend>/health` (or root) returns 200.
- Check logs for `SEED_LABEL_SECRET or JWT_SECRET must be set` — must **not** appear.

### Step 5 — Deploy web (Vercel production)

Run from the **repo root** — not `web/`. Vercel project **bio-vera-9lgm** has **Root Directory = `web`** and is linked at the repo root.

```bash
# Repo root
vercel deploy --prod --yes
```

- Confirm `.well-known` files are live (section 3 placeholders filled **before** this step if shipping universal links).

### Step 6 — Smoke tests

Replace hosts with your production URLs (`https://biovera.app`, `https://<railway-backend>`).

| # | URL / flow | Expected |
|---|------------|----------|
| 1 | `GET <backend>/health` | 200 OK |
| 2 | `https://biovera.app` | Home loads, no console API errors to localhost |
| 3 | Login (grower or admin) | JWT issued, dashboard loads |
| 4 | `https://biovera.app/admin/seed-production` | Admin seed production list (admin role) |
| 5 | `https://biovera.app/seed-producer` | Producer portal gate / login |
| 6 | `https://biovera.app/passport/<known-batchId>` | Passport renders; optimal route formatted (no crash) |
| 7 | `https://biovera.app/verify/<known-batchId>` | Verify page loads |
| 8 | Seed label flow (staging or one test bag) | Serial validates; custody events recorded |
| 9 | Certificate upload on seed run | Email/PDF contains absolute `https://<backend>/documents/<uuid>` when `API_PUBLIC_URL` set |
| 10 | `GET https://biovera.app/.well-known/apple-app-site-association` | JSON, no `TEAM_ID` placeholder — **skip if universal links are postponed to the next native app build (placeholders are harmless)** |
| 11 | `GET https://biovera.app/.well-known/assetlinks.json` | JSON, real SHA-256 fingerprint — **skip if universal links are postponed to the next native app build (placeholders are harmless)** |
| 12 | `https://biovera.app/s/<short-code>` (if configured) | Opens web or app via universal link |

Mobile (optional this release): planting entry save with GPS; seed scan from printed test label.

### Step 7 — Post-release

- [ ] Monitor Railway logs and Postgres disk for 24h.
- [ ] Confirm no failed `_prisma_migrations` rows.
- [ ] Tag release in git if using tags.

### Step 8 — Push

After smoke tests pass:

```bash
git push origin main
```

---

## 5. Production data cleanup (admin panel, after deploy)

Run these in the **admin panel** once production is live and smoke tests pass:

1. **Reopen legacy orders without delivery** — Two picked-up / in-transit orders have no linked delivery. Admin → **Orders** → **Reopen for dispatch** on each.
2. **Cancel duplicate missions** — Lot `BATCH-2026-1253` has duplicate missions. Admin → **Missions** → **Cancel run** on the duplicates (keep one active run).
3. **Fulfill paid orders** — For each paid order: set the **fulfilling farm**, **reserve stock**, then link the order in Admin → **Dispatch**.

---

## 6. Rollback

### Web (Vercel) — fast

1. Vercel Dashboard → Deployments → previous production deployment → **Promote to Production**.
2. Re-verify smoke tests #2, #4–#7.

### Backend (Railway) — fast

1. Railway → Deployments → redeploy **previous successful** deployment image.
2. Re-verify `GET <backend>/health` and API smoke tests.

**Note:** Rolling back **code** does not undo applied migrations. New columns/tables/enums remain in Postgres.

### Database — last resort

1. Restore from Step 1 backup (Railway restore or `pg_restore`).
2. Redeploy **previous** backend + web builds that match restored schema.
3. Only needed if migrate deploy corrupted data or wrong migration was applied.

### Migration-specific rollback (generally **not** recommended)

| Migration | Manual undo (destructive) |
|-----------|---------------------------|
| `20260927240000_stored_documents` | `DROP TABLE stored_documents;` — loses uploaded files |
| `20260927220000_seed_phase3` | `DROP TABLE field_entries;` + drop columns — loses field diary data |
| Enum values | Cannot remove enum labels in PostgreSQL without recreating types |

Prefer forward-fix over schema rollback.

---

## 7. Local production build verification

Run before every release (already verified for this checklist):

```bash
cd backend && npm run build
cd web && npx next build
cd mobile && npx tsc --noEmit
```

---

## Quick command reference

All deploy commands assume **repo root** as cwd. Railway BioVera and Vercel bio-vera-9lgm use Root Directory (`backend` / `web`) in the dashboard — do not `cd` into those folders for `railway up` or `vercel deploy`.

```bash
# Backup: use Railway UI or pg_dump — do not paste production DATABASE_URL into shell history

# Link + verify (project satisfied-dedication, service BioVera — NEVER content-hope)
railway link --project 68f2001e-878e-4888-9067-552842f58c25 --environment production --service BioVera
railway status

# Migrations (railway run injects production DATABASE_URL)
cd backend && railway run npx prisma migrate deploy && cd ..

# Backend deploy (repo root — BioVera Root Directory = backend)
railway status
railway up --service BioVera --environment production --detach

# Web deploy (repo root — bio-vera-9lgm Root Directory = web)
vercel deploy --prod --yes
```
