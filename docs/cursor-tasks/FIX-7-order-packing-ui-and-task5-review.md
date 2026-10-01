# FIX 7 — Order packing UI (blocking) + issues found while verifying TASK-5

Verified locally on 2026-10-01 at commit 0e847c86 (local DB, LOCAL-* accounts, API + DB checks). **Do this before any production release** — item 1 blocks every new catalogue order.

Working: `GET /orders/grower?queue=prepare` returns paid/confirmed catalogue orders with `packLine` ("2 × 5 kg") and `nextAction`; on payment confirmation the buyer gets `buyer.paymentReceived` and the grower `grower.orderToPrepare` ("New order to prepare: 2 × 5 kg Jabuka – Ajdared (BIOVERA-…)"); admin "from order" mission now notifies logistics partners (`logistics.missionAvailable`, the mission appears in their pool); mission creation is refused while packing is incomplete; password reset (generic answer, 1 h single-use token, clears pending e-mail verification).

Same base rules (English base + all 7 locales with real translations, styling unchanged, local DB only — `backend/.env` points to production — all suites green, commit locally, no push).

## 1. 🔴 BLOCKER — there is no UI to record packing
`missions.service.ts` (`adminCreateMissionFromOrder`) now throws **"Packed 0 of 2 ordered packs. Record packing on the order before pickup."**, but neither app ever calls `PATCH /orders/grower/:id/packing` (`ordersAPI.recordPacking` in `web/lib/api.ts` has no caller; mobile has no API function at all). The "Prepare and pack" button on `/grower/orders` only links to the generic `/grower/quality-entry`. Result: **no new catalogue order can get a mission → nothing can be delivered.** Reproduced: order `BIOVERA-1790529482165-9550FCA6` (PAID, packed 0) → `POST /missions/admin/from-order` → 400.

Implement, identical on web and mobile:
- **Web `/grower/orders`** and **mobile grower orders** (`mobile/features/grower/orders/OrdersListScreen.tsx` must load `getForGrower('prepare')` for the "To prepare" tab; keep the full history as a second tab): each order card shows order number, product, pack line, total kg, status (glossary label), packed state ("Packed 2 of 2 · 10 kg · 1 Oct 21:22" or "Not packed yet").
- Button **"Record packing"** → form (web modal/inline, mobile bottom sheet): packs packed (number, default = ordered pack count, 1…ordered), pack size shown read-only from the order (e.g. 5 kg), total kg computed (editable only within ±5 % for weight tolerance; backend validates the same range), optional lot (select from the grower's lots of that product with quality done — store `packedBatchId` if you add the column; if you add it, the admin "from order" mission must use that lot), optional photo of the packed goods (reuse the compliance photo upload). Save → `PATCH /orders/grower/:id/packing`.
- After saving: card shows "Packed ✓" and the next action **"Request pickup"** (or "Waiting for operations to book transport" if pickup is booked by admin — use the existing flow, don't invent a second one; say in the report which one applies).
- Add "Orders to prepare (N)" card on the grower home in **both** apps (web dashboard + mobile `(producer)` home), linking to the list; N = `nextAction === 'PREPARE_AND_PACK'`.
- Admin → Orders: show packing state per catalogue order ("Packed 2/2 · 10 kg") and disable "Create mission" with a tooltip while packing is incomplete (instead of a raw 400).

## 2. 🔴 Packing allowed before acceptance/payment
`recordGrowerPacking` (`backend/src/orders/orders.service.ts`) does not check the order status: the grower packed order `BIOVERA-1790882542306-291C1187` while it was `PENDING` (not accepted, not paid) and the **buyer immediately got "Packed and ready for pickup"** before paying.
- Allow packing only when status ∈ `PAID`, `CONFIRMED` (same set as the prepare queue); otherwise 400 "This order is not paid yet — prepare it after payment is confirmed."
- Also refuse for `CANCELLED/REJECTED/REFUNDED` and once a mission for the order has departed.
- Add a validated DTO (`RecordPackingDto`: `packedPackCount` int ≥ 1, `packedKg` number > 0 optional) instead of the inline body type.
- Unit tests: PENDING → 400; PAID → 200 + one `buyer.orderPacked` notification; second save → no duplicate notification; over-pack → 400.

## 3. 🟡 Notification text glued together
`backend/src/notifications/templates/*.json`: `buyer.paymentReceived` and `buyer.orderPacked` render as "…is being prepared**2 × 5 kg**." and "…291C1187**2 × 5 kg**." (`{{packLine}}` appended without a separator, and empty when there is no pack line). Fix in all 7 languages, e.g. "Payment received — your order {{orderNumber}} ({{packLine}}) is being prepared." and pass a fallback (`{{quantity}} {{unit}}`) when `packLine` is empty; never render "()" or double spaces. Add a test that renders every template with and without `packLine`.

## 4. 🟡 Mobile grower orders
`mobile/features/grower/orders/useOrdersListData.ts` calls `getForGrower()` without `'prepare'`, shows no `packLine`/`nextAction`, and the grower home has no "orders to prepare" card. Covered by item 1 — make sure web and mobile show the same fields and the same words.

## 5. 🟡 Password reset hardening
- Store only a **SHA-256 hash** of the reset token in `password_reset_tokens.token` (look up by hash); the e-mail keeps the raw token.
- `@Throttle` on `POST /auth/forgot-password` (e.g. 5 per 15 min per IP) and `POST /auth/reset-password` (10 per 15 min); max 1 reset e-mail per user per 2 minutes (silently keep the generic answer).
- Keep the current behaviour that suspended/rejected accounts still can't log in after a reset (add a test).

## 6. Re-check (report each)
1. New catalogue order → admin approves → confirm bank payment → grower sees it under "Orders to prepare" (web + mobile) with a notification → records packing 2 × 5 kg (with lot) → buyer gets "Packed…" once → admin/grower books pickup → mission created → logistics notified → (existing flow) loading handover → depart → buyer gets "On the way" → delivery → receipt. Show the `notifications` rows for buyer / grower / logistics.
2. Packing a `PENDING` order → 400, no buyer notification.
3. Notification texts in en + sr + de read correctly (paste them).
4. All suites green (backend tsc + jest + test:integration, web tsc, mobile tsc + test, `scripts/i18n-check.cjs`). Commit locally, no push.
