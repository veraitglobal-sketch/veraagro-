# HACCP Implementation – Web (Phase 1)

## Overview

HACCP (Hazard Analysis Critical Control Points) monitoring for Bio Vera. Web implementation first; mobile (Daily Checklist for farmers) comes next.

---

## What was implemented

### 1. Backend – HACCP Module (`backend/src/haccp/`)

- **GET /haccp/admin/overview** (Admin auth required)
  - Returns table: Farmer | Batch | Load temp | Photos | HACCP Status
  - Uses: `batches`, `compliance_photos`, `distributor_arrivals`, `temperature_logs`, `bio_vera_standards`
  - Status: VERIFIED | PENDING | FAIL

- **GET /haccp/track/:batchId** (Public – no auth)
  - For buyers (e.g. Aldi) – track link: `app.biovera.de/track/BATCH-123`
  - Returns: product, farmer, HACCP status, load temp, compliance photos

### 2. Web Admin – HACCP Monitoring

- **Route:** `/admin/haccp`
- **Content:** Real-time table with refresh every 30s
- **Columns:** Farmer, Batch, Product, Load temp, Photos (x/y), HACCP status, Last updated
- **Actions:** Link to Farm Detail, Link to Track page
- **Nav:** Added "HACCP Monitoring" to admin sidebar

### 3. Web – Public Track Page

- **Route:** `/track/[batchId]`
- **Content:** Buyer-facing page
  - HACCP Status: Verified | Pending | Incomplete
  - Product, quantity, harvest date, producer
  - Load temperature (if available)
  - Compliance photos (thumbnails, click to open)
  - PDF download placeholder ("Coming soon")

### 4. API Client

- `haccpAPI.getOverview()` – Admin
- `haccpAPI.getTrackData(batchId)` – Public (used via fetch in track page to avoid auth)

---

## Data sources

| Source                 | Purpose                          |
|------------------------|----------------------------------|
| `batches`              | Product, farmer (via estate)     |
| `compliance_photos`    | Hygiene/packing photos           |
| `distributor_arrivals` | Load temperature at hub          |
| `temperature_logs`     | Cold chain temps                 |
| `bio_vera_standards`   | Temp min/max, required photo types |

---

## Next steps (Mobile – Phase 2)

1. **Daily Checklist** for farmers
   - UI name: "Daily Checklist" (no "HACCP")
   - Items: Toilet, handwash, first aid, crate photos
   - Farmer uploads photos → stored as `compliance_photos` or `field_entries`
   - Each item = one photo upload

2. **HACCP Plan PDF**
   - Admin Compliance section
   - Upload/store HACCP Plan PDF
   - Download for inspectors

3. **PDF certificate generation**
   - Per-batch HACCP certificate PDF
   - Replace "Coming soon" on track page with real download
