# TASK 5 — Web ↔ mobile harmony fixes + farmer order preparation flow

> Start **after TASK-4 is finished and reported** (TASK-4 adds `shared/i18n` labels, 7 languages, `preferredLanguage`, localized notifications — reuse all of it here, don't build a second system).
> Same base rules: English base via i18n (add all 7 locales for new keys), styling unchanged, real data only, **local DB only** (`DATABASE_URL="postgresql://jovicamihajlovic@localhost:5432/biovera_db"` — `backend/.env` points to production), never migrate production, all suites green, commit locally, no push.

Verified locally on 2026-10-01 (commit 15364c03, same order `BIOVERA-1790870876823-8271786D` / `MISSION-2026-0005-39FF` / `BATCH-2026-8448` opened as buyer, grower and logistics on web `localhost:3001` and on the mobile app). The full E2E flow works on the API side (order → payment → mission → loading checks → transport → dock receipt → buyer takeover → payout release). What follows are the places where web and mobile **show the same data differently** or where a step in the chain is **missing**.

## A. Buyer — same order must look the same

| # | Where | Web | Mobile | Fix |
|---|---|---|---|---|
| A1 | Order list line | `2 × 10 kg` + "Reserved for you · 20 kg" | only `20 kg · €70.00` | Mobile list shows the pack line `2 × 10 kg (20 kg) · €70.00` like the detail screen and web. |
| A2 | Unit price in detail | `Unit Price: €3.50 / kg` | `2 × 10 kg · €35.00` (pack price) | Both show **pack price and price per kg**: `2 × 10 kg · €35.00 / pack (€3.50 / kg)`. One formatter in `shared/` used by both. |
| A3 | Marketplace card | pack prices `500 g · €2.40, 5 kg · €21.00, 10 kg · €35.00` + farm name + category | `€4.80 / kg` (from smallest pack) only, no farm / category | Mobile shop card shows the same pack list (or "from €3.50 / kg" + packs) and the farm name + category exactly like web. |
| A4 | Dates | `01/10/2026`, `31 Dec 2026` | `10/1/2026`, `12/31/2026` | One date helper per app driven by the active language (TASK-4 §2). With `en` both apps must output the same string for the same value (use `en-GB` style day-month order for European users or `Intl` with the app language — pick one and use it in both). |
| A5 | Order progress steps | 7 steps: Submitted → Accepted → Paid → Preparing → In transit → Delivered → Receipt confirmed | 4 steps: Order placed → Confirmed & preparing → On the way → Delivered | Same step list on both (use the 7 web steps — buyer must see "Paid" separately). Labels from `shared/i18n` (`orderStatus.buyer.*`). |
| A6 | Shipment timeline wording | "Cold-chain transport booked for your line", "Carrier assigned to the pickup run", "Farm loading checks completed (temperature / cargo evidence)" … | "Mission opened", "Logistics assigned", "Loading inspection complete" … | One set of buyer-facing timeline labels in `shared/i18n` (`buyerTimeline.<eventType>`), used by both. Prefer the clearer web wording. |
| A7 | Duplicate progress block (web) | Detail modal shows the timeline **and** a second "Progress" block with Title Case labels ("Delivery Assigned", "Picked Up") | — | Remove the second block on web (or merge it into the timeline). |
| A8 | Invoice | `Invoice INV-… · Download PDF · All invoices` | not shown | Mobile order detail shows the invoice number + "Download PDF" (open the same PDF endpoint). |
| A9 | Payment info | raw enums `BANK_TRANSFER`, `RELEASED` | not shown | Web: translate (`Bank transfer`, `Paid out to grower` / buyer-facing "Payment confirmed"). Mobile: show payment method + payment status with the same labels. |
| A10 | Raw mission status (mobile) | — | `MISSION-2026-0005-39FF · COMPLETED` | Use `missionStatusLabel` from `shared/i18n`. Search both apps for any other place that prints a raw enum (`grep -rn "\.status}" …`) and replace. |
| A11 | Driver / delivery number | `Driver: Local Logistika`, `Delivery Number: DEL-…` | only delivery number | Show the same fields on both (driver/company name, delivery number). |

## B. Grower — same records on both

- **B1 Field diary on web shows nothing from the mobile app.** `web/app/grower/field-diary/page.tsx` and the dashboard card "Entry log — 0 synced entries" read `growthLogsAPI` (`growth_logs`), but the mobile app saves planting / fertiliser / spraying entries to `field_entries` (`GET /field-entries`). Local DB has a SETVA entry (5 kg Willamette, lot NS2606, Test njiva A) that is visible on mobile and **missing on web**. Fix: web field diary + dashboard count use `GET /field-entries` (same list, same row format as mobile FIX-5: "Planting — 5 kg Bio Vera Raspberry seed (1 bag, lot NS2606)", detail with bags/serials, parcel, area, date, GPS, photos). Keep growth logs (photo-only growth stage logs) as a second tab if they're still used, but the main diary = field entries. Admin → grower detail shows the same.
- **B2** Planting/parcel names: web lots list shows "Jabuka – Ajdared (Postojeći zasad)" — Serbian text stored as data in an English UI. Store the planting type as an enum (`EXISTING_ORCHARD`, …) and translate it in both apps; fix existing rows with a data migration.
- **B3** Check that the grower dashboard numbers are identical on web and mobile (estates, parcels, lots, active runs, escrow/released) — currently they match; add a small shared selector so they stay the same.

## C. Logistics — same mission, same words

- **C1** Web `/logistics-partner/missions` shows an `ASSIGNED` mission as **"At farm / loading"**; mobile shows **"Assigned"**. Use `missionStatusLabel` on both; "At farm / loading" only when the mission is actually in loading (`AT_PICKUP`/loading started).
- **C2** Web "Same city — possible one-truck run" lists **completed** missions (`MISSION-2026-0005-39FF … (COMPLETED)`). Only offer active, not-yet-departed missions.
- **C3** Mobile missions list: when a mission has no product yet it prints the mission number twice (title and subtitle) and does not show the destination. Show "Pre-harvest run · <crop if known>" as title and "From → To" (same as web card).
- **C4** Web shows "To · Delivery address not set — confirm with the grower." — mobile shows nothing. Show the same warning on mobile.

## D. Missing steps in the order chain (buyer → grower → packing → logistics → buyer)

Checked in the local `notifications` table for the E2E order above:

| Moment | Admin | Grower | Logistics | Buyer |
|---|---|---|---|---|
| Buyer places order | ✅ New marketplace order | ❌ **nothing** | — | ✅ Order accepted |
| Admin confirms payment | — | ❌ | — | ❌ **no "Payment received"** |
| Mission opened / pickup requested | ✅ | ✅ Transport status | ❌ **nothing** (available missions appear only if they open the app) | — |
| Loading / departed | — | ✅ | — | ✅ Farm loading checked / Truck has arrived |
| Receipt confirmed | ✅ | ✅ | ✅ | ✅ |

Implement:
1. **"Orders to prepare" for the grower** (web `/grower` dashboard + new page `/grower/orders`, mobile grower home card + screen): every paid/confirmed catalogue order whose stock comes from this grower's lot/listing: order number (no buyer personal data), product, **pack lines** (`2 × 10 kg`), total kg, requested delivery window, status, and the next action ("Prepare and pack" → link to packing / quality entry for that lot, "Request pickup"). Notification to the grower when such an order becomes paid/confirmed: "New order to prepare: 2 × 10 kg Jabuka – Ajdared".
2. **Packing tied to the order**: in the packing / quality-entry step let the grower record what was packed **per order** (pack size × count, total kg, crate/pallet badges) and block "Request pickup" if packed quantity < ordered quantity (with a clear message). Buyer and admin see "Packed: 2 × 10 kg" in the order timeline.
3. **Buyer notifications**: "Payment received — your order is being prepared" when payment is confirmed; "Packed and ready for pickup"; "On the way" when the mission departs (if not already sent as "Truck has arrived").
4. **Logistics notification** when a mission becomes available in their area (new pickup request approved) and when a mission is assigned to them by operations.
5. All new notifications use the TASK-4 template system (`templateKey` + params, recipient's language) and push.

## E. Acceptance (report each with screenshots or exact strings)
1. The order `BIOVERA-…-8271786D` shows identical status, steps, timeline labels, pack line, unit price, invoice and payment info on web buyer portal and mobile order detail (en + sr).
2. Grower web field diary lists the same entries as mobile (incl. the SETVA entry); dashboard count > 0.
3. Logistics web and mobile show the same status words for every mission; "Same city" lists no completed missions.
4. New E2E order: grower gets "New order to prepare" (web + mobile + push), sees the order in "Orders to prepare", records packing 2 × 10 kg, requests pickup; logistics gets a notification; buyer gets "Payment received", "Packed", "On the way", "Delivered" — check the `notifications` table and both UIs.
5. All suites green (backend tsc + jest + test:integration, web tsc, mobile tsc + test, `scripts/i18n-check.cjs`). Commit locally, no push. Report the list of every web↔mobile difference you fixed.
