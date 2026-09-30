# FIX 1 — Catalogue / marketplace / buyer journey: issues found in the local review

Context: Task 1 (`admin-catalog-plantings-orders.md` + `admin-catalog-ADDENDUM-stock-and-buyer-journey.md`) was verified locally step by step on 2026-09-27 (local DB, LOCAL-* accounts + a newly registered buyer). Steps 1–6, 8, 9 pass. Fix everything below **in this order**, then re-run the listed checks. Same rules as before (English base via i18n, identical styling, real data, tests green). Do **not** start ADDENDUM-2 Phase 2 until this file is done.

## A. Blocking (flow cannot finish)

### A1. Admin cannot confirm payment for catalogue orders
`web/app/admin/orders/page.tsx` ~line 434: the **"Confirm bank payment"** button is `disabled={… || order.stockReservation?.status !== 'RESERVED'}`. Catalogue orders never have a hub `stockReservation` (their reservation is the `ORDER_RESERVE` ledger movement), so the button is always disabled. The backend already accepts it (`POST /orders/admin/:id/confirm-bank-payment` → PAID / IN_ESCROW works).
- Fix: for orders with `catalogProductId`, treat an `ORDER_RESERVE` movement as reserved (expose e.g. `catalogReserved: true` / `catalogReservedKg` in `GET /orders/admin/all`) and enable the button.
- Same gating check for any other admin action that looks at `stockReservation` (approve, dispatch link).

### A2. Admin order row tells admin to allocate hub stock for catalogue orders
Catalogue orders show "Stock not allocated / Choose stock / Assign specific stock in the product column" (`OrderStockAllocation`) — contradicts the ledger and confuses admins.
- Fix: for catalogue orders hide `OrderStockAllocation` and show instead "Reserved from marketplace stock: 60 kg" (green) with a link to the product stock history.
- Buyer side (`web/app/buyer-portal/orders`, order detail, mobile order detail): don't show "Stock not allocated" for catalogue orders; show "Reserved for you".

### A3. Mobile cart breaks catalogue lines (checkout impossible)
Adding `2 × 5 kg (€42)` from the product screen results in a cart line "€4.80 per kg — This product is no longer listed. Remove it or choose another product.", total €9.60, and checkout does nothing.
- `mobile/hooks/useCartCatalogue.ts` line ~20 validates cart lines only against `inventoryAPI.getAvailableProducts()` → catalogue products are "unavailable". Also load `catalogAPI` products and validate catalogue lines against them (product published, option active, `packCount ≤ maxPacks`).
- Cart line display/total for catalogue lines must use the pack: `2 × 5 kg · €21.00 = €42.00` (not product.price per kg × quantity).
- Checkout must send `packOptionId` + `packCount` for these lines (verify in `BuyerCheckoutScreen.tsx`), and the created order must equal what the cart showed.

### A4. Catalogue orders can be linked to a mission that can never load
Admin → Dispatch lets admin link a catalogue order to a mission **without a lot**. Loading handover then fails forever ("Quality entry must be completed before loading").
- In `GET /deliveries/admin/link-options` and the Dispatch UI: for each mission show lot + quality status; **only allow linking** a catalogue order to a mission whose lot (batch) has a COMPLETED/VERIFIED quality entry and whose farm = the order's fulfilling farm (catalogue product `estateId`). Show a clear reason when no suitable mission exists ("No mission with a quality-checked lot from Test farm A — ask the grower to create the lot and request transport").
- Backend `linkMissionDelivery`: reject (400, clear message) linking a catalogue order to a mission without a quality-checked lot.
- Also let the order reference the lot it is fulfilled from (set `order_items.batchId` from the mission's batch on link) so traceability/passport works.

## B. Buyer account journey

### B1. Registration redirects to a 404
`web/app/register/buyer/page.tsx` line ~126 `router.push(loc('/login/buyer'))` → `/sr/login/buyer` = **404** (only `app/login/[type]` exists; `app/[locale]/login` has no `[type]`). Use a working path (`/login/buyer`) or add the localized route. Same for the link at line ~381.
Also `/register` (no type) is 404 — redirect it to `/register/buyer`.

### B2. After registering the buyer gets no explanation
Backend `registerBuyer` sets `PENDING_VERIFICATION` ("requires admin approval") and does not send a verification e-mail (by design). Then:
- After submit show a success page: "Thanks — your account is waiting for approval by Bio Vera. We'll e-mail you when it's active." (English base, i18n).
- Login with a pending account currently shows only "Account is not active". Return a specific error code from `/auth/login` (e.g. `ACCOUNT_PENDING_APPROVAL`) and show "Your account is waiting for approval by Bio Vera." on web and mobile.
- Tell the buyer their **partner code** or make it clear they can log in with their **e-mail** (the web login field says "Partner code" only — change label/placeholder to "E-mail or partner code", like mobile).

### B3. Admin is not told that a buyer registered; buyer is not told they were approved
- On buyer registration: in-app notification to all ADMIN/SUPER_ADMIN ("New buyer registration: E2E Market d.o.o. — Test Kupac — approve in Users") with link to `/admin/users?status=PENDING_VERIFICATION`.
- When admin approves (status → ACTIVE): notification + e-mail to the buyer ("Your Bio Vera buyer account is active — you can now order from the Marketplace").
- Admin dashboard: counter "Buyers waiting for approval".

### B4. Checkout address not prefilled
Marketplace order form (web) starts empty although the buyer entered company address at registration. Prefill street/city/postal code/country from the buyer's profile (`buyerCompanyProfile` / user address); same on mobile checkout.

## C. Correctness / UX

- **C1 Mobile product "You can add: 1000 kg"** (`mobile/app/product/[id].tsx` ~line 482, key `buyer.productDetail.remainingToAdd`): for catalogue products this shows the number of **packs** with unit "kg" (500 kg available → "1000 kg" for 500 g packs, "100 kg" for 5 kg packs). Show "You can add up to N packs (X kg)".
- **C2 Mobile shop cards** don't show "X kg available" and "Available until …" (required by the task). Add them. When a catalogue product and a hub-inventory product have the same name, label them clearly (e.g. "Marketplace · packs" vs "Farm stock") or hide the duplicate.
- **C3 Web marketplace card**: generic 🌱 instead of the crop emoji (reuse the same crop→emoji mapping as mobile `mobile/lib/product-emoji.ts`, e.g. port it to `web/lib/product-emoji.ts`); category shows the raw enum "FRUIT" → translated label ("Fruit"); show farm **city**; show pack chips (`500 g · €2.40`, …) on the card, not only "From €2.40".
- **C4 Pack-count stepper (web marketplace)**: only +/− buttons (100 packs = 100 clicks) and the buttons have no accessible label. Add a numeric input (clamped 1..maxPacks) and `aria-label`s.
- **C5 Buyer order status after admin reject** shows "Cancelled"; show **"Rejected"** (with the reason) when `rejectionReason` is set (web `web/lib/buyer-order-status.ts`, mobile order detail).
- **C6 Buyer order cards** show the internal text "Vera (platform — line seller, not a pickup point)" as the farm. For catalogue orders show the product's farm name (fulfilling estate) or "Bio Vera Marketplace".
- **C7 Admin → Products**: after "Save" the "New product" form stays open (close/reset it); "Publish" button is still shown for PUBLISHED products (show only relevant actions: Draft → Publish; Published → Archive; Archived → Publish again); add optional "source lot" + note on **Add stock** (task spec), show €/kg and max packs in the pack editor.
- **C8 Admin → Supply**: status column shows raw `PENDING` for a harvest plan whose lot is already harvested/delivered — show a derived status (Planned / Harvested / Lot created / In catalogue) instead of the raw value.
- **C9 Stale Serbian texts** in `web/locales/sr.json` → `adminPages.products` still say the catalogue is "coming soon / available after server implementation". Remove these stale `sr` keys (fall back to `en`) or update them; check other keys changed in Task 1 for stale `sr` values.

## D. Dev safety (important)
`backend/.env` has `DATABASE_URL` pointing to the **production** Railway database. Commands like `npx prisma migrate deploy` or `node dist/main` run from `backend/` hit production. (That is how `20260927200000_seed_production_pilot` got applied to production.)
- Do not change `.env` yourself, but in every instruction you give and every script you add, pass the local URL explicitly: `DATABASE_URL="postgresql://jovicamihajlovic@localhost:5432/biovera_db" …`.
- Add a guard: `backend/scripts/assert-local-db.cjs` that refuses to run migrations/seed scripts when `DATABASE_URL` host is not `localhost`/`127.0.0.1`, unless `ALLOW_REMOTE_DB=1`; wire it into any local helper npm scripts you add.

## Re-check after fixing (report each)
1. New buyer: register → sees "waiting for approval" page → admin gets notification → admin approves → buyer gets notification/e-mail → buyer logs in with e-mail → marketplace.
2. Order 12 × 5 kg (web) and 2 × 5 kg (mobile): cart/total/order identical; available stock drops accordingly.
3. Admin: accept → **Confirm bank payment enabled** → Paid → Dispatch shows only missions with a quality-checked lot from the same farm → link → loading handover → departure → transit → buyer receiving code → handover → buyer confirms → Completed; order item has `batchId`.
4. Reject shows "Rejected + reason" on web and mobile.
5. `backend: npx tsc --noEmit && npx jest && npm run test:integration`; `web: npx tsc --noEmit`; `mobile: npx tsc --noEmit && npm test` — all green.
