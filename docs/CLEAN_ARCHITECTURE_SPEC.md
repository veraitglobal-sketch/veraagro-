# BioVera – Clean Architecture & Modular System

## Overview

Modular approach with clear separation of UI and business logic. Web and Mobile share the same backend service and shared services.

---

## Folder Structure

```
veraagrar/
├── shared/                    # Shared logic (Web + Mobile)
│   ├── services/
│   │   ├── phi-validation.service.ts     # Pre-Harvest Interval (PHI) validation
│   │   ├── payout-calculation.service.ts # Farmer payout calculation
│   │   └── globalgap-validation.service.ts # GlobalG.A.P. conditions validation
│   ├── lib/
│   │   └── backend-service.ts # Shared API client (no duplication)
│   └── index.ts
├── mobile/                    # React Native (Expo)
│   └── app/(producer)/packing-flow.tsx   # Wizard: Manual → Camera → GPS
├── web/                       # Next.js Admin
│   └── app/admin/farm/[id]/page.tsx      # Farm Detail View (farmer overview)
└── backend/                   # NestJS API
```

---

## Zadatak 1: Shared Services

### PHI Validation (`shared/services/phi-validation.service.ts`)
- Input: last treatment date, product phiDays
- Output: earliest harvest date, is allowed
- Used by: harvest announcements, treatment logs

### Payout Calculation (`shared/services/payout-calculation.service.ts`)
- Input: base price, quantity, transport split, Vera bonus, seed margin
- Output: farmer share, driver share, platform share
- Used by: order processing, wallet

### GlobalG.A.P. Validation (`shared/services/globalgap-validation.service.ts`)
- Input: field data, treatment logs, compliance status
- Output: checklist results, compliant / non-compliant
- Used by: admin audit, farmer dashboard

---

## Zadatak 2: Mobile UI – Packing Flow (Wizard)

**File:** `mobile/app/(producer)/packing-flow.tsx`

Step-by-step wizard:
1. **Step 1: Manual** – Packing instructions (text/video)
2. **Step 2: Camera** – Photo crates + Final quality check (top layer raspberry photo – no mold/foreign bodies)
3. **Step 3: GPS/Timestamp** – Automatic log (capture location + time)

**Additional:**
- Batch Sticker Scan: Bio Vera QR on pallet – farmer scans to confirm they packed it
- Final Quality Check: Photo of top raspberry layer in crate (no mold, no foreign bodies)

---

## Zadatak 3: Web Admin – Farm Detail View

**File:** `web/app/admin/farm/[id]/page.tsx`

Not just a table. Single farmer overview:
- Field photos (from growth_logs, compliance_photos)
- Lab results (labResultUrl, labTestDate)
- Sedex status (or equivalent audit/compliance status)
- Treatment logs, harvest announcements, batches
- KYC status, certificates

---

## Rule: Shared Backend Service

- `shared/lib/backend-service.ts` – single source of API calls
- Mobile and Web both import and use it
- Token storage injected: `getToken()` – AsyncStorage (mobile) vs localStorage (web)
- No duplicated API logic

---

## Dependency Flow (Clean Architecture)

```
UI (View Layer)
    ↓
Use Cases / Controllers
    ↓
Services (shared/services/*)
    ↓
Backend Service (shared/lib/backend-service.ts)
    ↓
Backend API (NestJS)
```
