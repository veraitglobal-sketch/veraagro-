# Bio Vera Standard – Master Architecture & Realization Plan

**Quality Control & Traceability System for EU Fruit Export**  
**Mobile App (Field) + Web Dashboard (Admin)**

---

## Executive Summary

This document proposes a technical architecture for the Bio Vera Standard system that digitalizes GlobalG.A.P. and HACCP protocols. It addresses the 11 control pillars, answers four critical design questions, and outlines implementation approaches for offline-first mobile and real-time web admin.

---

## Part 1: Answers to the Four Critical Questions

### Q1: How to implement offline-first data entry (no internet on fields)?

**Approach:** Local-first storage with background sync and conflict resolution.

| Layer | Solution | Rationale |
|-------|----------|-----------|
| **Mobile storage** | SQLite (via Expo SQLite or WatermelonDB) | Persistent, queryable, works fully offline. WatermelonDB is built for sync. |
| **Sync queue** | Outbox pattern: every create/update goes to local DB + sync queue | When online, queue is flushed in order. No data loss if app closes. |
| **Conflict resolution** | Last-write-wins with server timestamp authority | For field logs, first valid write wins. Server rejects duplicates (same batchId + timestamp). |
| **Photo/video** | Store file path locally, upload when online | Binary assets queue separately. Compress before upload to reduce bandwidth. |
| **UI** | Show "Saved locally – will sync when online" badge | User trusts data is safe. Sync status visible in settings/header. |

**Implementation sketch:**
- `FieldEntry`, `TreatmentLog`, `HygieneChecklist` etc. → local SQLite tables
- Sync service runs on app foreground/network change
- Server exposes `POST /sync/batch` accepting array of operations (create/update) with client timestamps
- Server validates, assigns server IDs, returns conflicts if any

---

### Q2: How to prevent farmers from faking GPS or timestamp of spraying entries?

**Approach:** Multi-layer anti-tampering.

| Mechanism | Implementation | Limitation |
|-----------|----------------|------------|
| **Device trust** | Capture GPS + timestamp at moment of submission (no "edit time" UI) | User could use emulator or rooted device |
| **GPS validation** | Server checks: (1) point inside registered parcel polygon, (2) accuracy &lt; 50 m | Rejects entries outside parcel or with poor accuracy |
| **Timestamp plausibility** | Server checks: entry time within ±15 min of "now" (server time) for real-time submissions | Offline entries: use "recorded at" from device, flag for audit |
| **Offline entries** | Allow past entries only with explicit "Late entry" reason + admin review flag | Reduces incentive to backdate; audit trail for exceptions |
| **Device fingerprint** | Send `deviceId` + optional `deviceInfo` with each submission | Detects same device used for multiple growers (investigation) |
| **Satellite consistency** | Periodically compare parcel polygon vs. satellite imagery | Detects if "parcel" moved or doesn't match real land |

**Practical rules:**
1. **Real-time mode:** GPS + timestamp captured at submit. Server rejects if &gt; 15 min before request time.
2. **Offline mode:** Store `clientTimestamp` and `clientRecordedAt`. On sync, server accepts but marks `needsAudit: true` if &gt; 24 h delay.
3. **Parcel check:** Every entry must pass point-in-polygon test against grower's parcels.

---

### Q3: What database and storage for images/documents with minimal cost (€0 start)?

**Approach:** Tiered storage with free tiers.

| Data type | Storage | Cost | Notes |
|-----------|---------|------|-------|
| **Structured data** | PostgreSQL (Supabase/Railway free tier) | €0 | Already in use. 500 MB–1 GB free. |
| **Images (KYC, hygiene, etc.)** | Supabase Storage or S3-compatible (Cloudflare R2) | €0 | Supabase: 1 GB free. R2: 10 GB free egress. |
| **Documents (PDF)** | Same as images | €0 | Small files, fit in free tier. |
| **Video (Lab SOP)** | Compress aggressively; store in same object storage | €0 at low volume | 1–2 min clips, H.264, &lt; 20 MB each. |

**Recommended stack for €0 start:**
- **Supabase:** PostgreSQL + Auth + Storage (1 GB). Single provider, simple.
- **Alternative:** Railway (Postgres) + Cloudflare R2 (S3-compatible, free egress) if you need more storage later.

**Optimization:**
- Resize images to max 1920 px before upload.
- Use WebP for photos (smaller than JPEG).
- Lazy-load images in dashboard; thumbnails for list views.

---

### Q4: How to connect mobile app and web dashboard in real-time?

**Approach:** Sync-first with optional real-time layer.

| Scenario | Solution | When to use |
|----------|----------|-------------|
| **Mobile → Server** | REST/HTTP sync on app foreground + push when online | Primary. Offline-first compatible. |
| **Server → Mobile** | Push notifications (Expo Push, FCM) | Alerts: "Batch blocked", "Lab result ready", "Admin message" |
| **Server → Web Dashboard** | Polling every 30–60 s OR WebSocket | Polling: simpler, works everywhere. WebSocket: true real-time for live ops. |
| **Mobile ↔ Web** | No direct P2P. Both talk to same backend. | Single source of truth = backend DB. |

**Recommended real-time stack:**
- **Option A (simple):** Web dashboard polls `GET /admin/updates?since=timestamp` every 30 s. Good for start.
- **Option B (modern):** Supabase Realtime (Postgres changefeed). Web subscribes to `batch`, `security_alerts` tables. Real-time without extra service.
- **Option C:** Dedicated WebSocket server (Socket.io, etc.) if you need sub-second updates and custom events.

**For Bio Vera at start:** Option A (polling) or Supabase Realtime. Add WebSocket later if needed.

---

## Part 2: Architecture for the 11 Control Pillars

### Pillar 1: Legal Core
**Registracija, KYC, GPS parcela**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Registration | Form + email verify | – | `POST /auth/register/grower` |
| KYC (ID photos) | Camera + upload | View/approve | `users`, `kyc_documents` table; Supabase Storage |
| Parcel GPS | Map drawing (polygon) | View/edit | `estates`, `parcels`; PostGIS or point-in-polygon |
| Verification | – | Admin approves KYC, parcel | Status: `pending` → `verified` |

---

### Pillar 2: Phyto-Log
**Dnevnik prskanja, Bela lista, karenca**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Whitelist | Dropdown filtered by crop | CRUD catalogue | `bio_white_list`; extend with PHI, MRL |
| Treatment entry | Form + GPS + timestamp | View logs | `field_entries` or `treatment_logs`; offline sync |
| PHI (karenca) | Block Harvest until date | Show countdown | Compute `lastSprayDate + PHI days`; block harvest API |

---

### Pillar 3: Field HACCP
**Kontrolne liste higijene (slike toaleta, prva pomoć, pranje ruku)**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Daily checklist | Photo upload per item | View/audit | `hygiene_checklists`; `compliance_photos` |
| Items | Toilet, handwash, first aid | Configure checklist template | JSON config or `checklist_templates` |

---

### Pillar 4: Cold Chain
**Temperatura transporta, logistika gajbica**

| Component | Mobile / Device | Web | Backend |
|-----------|-----------------|-----|---------|
| Temp log | Driver app or IoT device | Dashboard map + charts | `temperature_logs`; link to `deliveries` |
| Crate tracking | Scan QR at handover | Batch view | `batches`, `location_logs`; UUID per crate |

---

### Pillar 5: Eco-Safety
**Pranje ambalaže, upravljanje otpadom (slični dokazi)**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Wash log | Photo + date + notes | View | `eco_safety_logs`; reuse `compliance_photos` pattern |
| Waste | Optional form | – | Extend schema if needed |

---

### Pillar 6: Crisis MGMT
**Blokada batch-a na loš lab nalaz**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Block batch | – | Admin action | `batches.status = BLOCKED`; `batch_blocks` table for reason |
| Notify | Push to grower | Alert in dashboard | Notification + audit log |
| Unblock | – | Admin with reason | Status change + log |

---

### Pillar 7: Social Ethics
**Evidencija radnika (berača), uslovi rada**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Worker list | Add name, role (optional) | View | `harvest_workers` or `worker_declarations` |
| Conditions | Checklist or photo | Audit | Same pattern as hygiene |

---

### Pillar 8: Equipment
**Kalibracija prskalica, održavanje alata**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Calibration log | Date, photo, notes | View | `equipment_calibrations` |
| Schedule | – | Reminder config | Optional: next calibration due |

---

### Pillar 9: Anti-Fraud
**Segregacija Bio Vera parcela, UUID gajbice**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Parcel flag | Only Bio Vera parcels in app | Map overlay | `parcels.bioVeraCertified = true` |
| Crate UUID | Generate at packing; print QR | Track in batch | `batches.batchId` = UUID; immutable |
| Satellite check | – | Automated job | Compare parcel polygon vs. imagery; flag mismatch |

---

### Pillar 10: Lab SOP
**Video verifikacija uzorkovanja, PDF rezultati za turu**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Sample video | Record at sampling | View | Store in object storage; link in `lab_samples` |
| PDF results | – | Upload by admin/lab | `lab_results` table; file in Storage |
| Link to batch | Select batch/tour | – | `lab_results.batchId` or `deliveryId` |

---

### Pillar 11: Reporting
**Generisanje Bio Vera Certificate PDF**

| Component | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| Trigger | – | "Generate certificate" for batch | `POST /reports/certificate` |
| Data | – | Aggregate from all pillars | Join growers, parcels, treatments, hygiene, cold chain, lab |
| Output | Download PDF | Download / email | PDFkit or similar; template with Bio Vera branding |

---

## Part 3: Proposed Tech Stack (Summary)

| Layer | Technology | Notes |
|-------|------------|-------|
| **Mobile** | React Native (Expo) | Existing. Add SQLite/WatermelonDB for offline. |
| **Web Dashboard** | Next.js | Existing admin. Add real-time (polling or Supabase Realtime). |
| **Backend** | NestJS + Prisma | Existing. Add sync API, validation rules. |
| **Database** | PostgreSQL (Supabase/Railway) | Existing. Add new tables per pillars. |
| **File storage** | Supabase Storage or Cloudflare R2 | Images, PDFs, video. |
| **Offline sync** | Custom sync service or WatermelonDB sync | Depends on chosen offline DB. |
| **Real-time** | Polling or Supabase Realtime | Start simple. |
| **PDF** | PDFKit or Puppeteer | Certificate generation. |

---

## Part 4: Implementation Order

1. **Phase 1 – Legal & Phyto**
   - KYC document upload and storage
   - Extend `bio_white_list` with PHI
   - Treatment log with offline support and GPS validation
   - PHI-based harvest blocking

2. **Phase 2 – Field HACCP & Eco**
   - Hygiene checklist + photo upload
   - Eco-safety (crate wash) log

3. **Phase 3 – Cold Chain & Equipment**
   - Temperature log API and driver UI
   - Equipment calibration log

4. **Phase 4 – Crisis, Lab, Reporting**
   - Batch block/unblock
   - Lab result upload and link
   - Certificate PDF generator

5. **Phase 5 – Anti-Fraud & Social**
   - Parcel certification flag
   - Worker declarations
   - Satellite validation (optional)

---

## Part 5: Database Collections (Logical View)

```
Growers (Pillar 1)
├── users, kyc_documents, estates, parcels

FieldOperations (Pillars 2, 3, 5, 7, 8)
├── treatment_logs, hygiene_checklists, compliance_photos
├── eco_safety_logs, harvest_workers, equipment_calibrations

Logistics (Pillar 4)
├── deliveries, temperature_logs, batches, location_logs

Crisis & Lab (Pillars 6, 10)
├── batch_blocks, lab_samples, lab_results

Reporting (Pillar 11)
└── ReportGenerator (function) – aggregates and produces PDF
```

---

*This document serves as the functional and architectural reference for Bio Vera Standard implementation. Technical details (schemas, APIs, sync protocol) can be elaborated in follow-up specs.*
