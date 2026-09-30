# ADDENDUM to `admin-catalog-plantings-orders.md` — stock ledger + full buyer journey

Apply on top of the original task. Where this conflicts with the original, **this wins**.

## Why
Bio Vera builds the marketplace itself: admin decides what is on offer, how many kilos, which packaging, price and **until when**. Stock must be a real, auditable balance — admin adds and removes kilos, every order takes kilos off immediately, rejected/cancelled orders put them back. The buyer must be able to register, get into their panel, see the offer, order, and follow the status (accepted / rejected / paid / delivered).

## 1. Stock ledger (replaces "remaining = planned − ordered")

```prisma
enum CatalogStockMovementType {
  ADMIN_ADD        // admin puts kilos on offer
  ADMIN_REMOVE     // admin takes kilos off (spoilage, correction) — reason required
  ORDER_RESERVE    // buyer order took kilos (negative)
  ORDER_RELEASE    // order rejected / cancelled / refunded before dispatch (positive)
}

model catalog_stock_movements {
  id         String                   @id @default(uuid())
  productId  String
  type       CatalogStockMovementType
  quantityKg Float                    // signed: + adds, − takes away
  orderId    String?
  batchId    String?                  // optional source lot for ADMIN_ADD
  reason     String?
  actorId    String?
  createdAt  DateTime                 @default(now())
  product    catalog_products         @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@index([productId, createdAt])
  @@unique([orderId, type])           // idempotent reserve/release per order
}
```
Add `stockMovements catalog_stock_movements[]` to `catalog_products`.

- `availableKg` = **sum of movements** (must never go below 0 — enforce inside the transaction with `SELECT … FOR UPDATE` on the product row).
- `soldKg` = net kilos in live orders (−RESERVE + RELEASE).
- `plannedQuantityKg` stays as the **season plan** (info only). The shop sells `availableKg`, not planned.
- `maxPacks = floor(availableKg / packSizeKg)`.

## 2. Backend changes
New admin endpoints:
| POST | `/catalog/admin/products/:id/stock` | `{ type: 'ADMIN_ADD' \| 'ADMIN_REMOVE', quantityKg > 0, reason?, batchId? }` — REMOVE needs a reason, can't go below 0 |
| GET | `/catalog/admin/products/:id/stock` | history: date, type, kg, order number, lot, reason, who, running balance |

Changed rules:
- **Publish** requires ≥1 active pack option, `availableKg > 0`, and `availableUntil` in the future.
- `GET /catalog/products` (buyer) returns only PUBLISHED, inside the window, `availableKg > 0`; include `availableKg`, `availableUntil`, farm name + city, category, image, per option `maxPacks` + `pricePerKg`.
- **Checkout with pack:** in the same transaction as order creation insert `ORDER_RESERVE` (`−kg`, `orderId`). Reject with 400 if `kg > availableKg` (`"Only X kg left — max N packs of 5 kg"`).
- **Release** (`ORDER_RELEASE`, idempotent) when a catalogue order is rejected by admin, cancelled by the buyer (`POST /orders/:id/cancel`), cancelled by admin, or refunded before dispatch. Never after the goods left the farm.
- **Admin reject:** new `POST /orders/admin/:id/reject { reason }` for unpaid `PENDING`/`APPROVED` orders → `CANCELLED` + release + buyer notification with reason. Keep `POST /orders/admin/:id/approve`.
- Buyer notifications (English): `Order accepted` (+ "pay by bank transfer"), `Order rejected` (+ reason), `Payment received`, then the existing delivery ones.
- Catalogue orders do **not** use hub `inventory` reservation at checkout — the ledger is their stock. Make the existing `requireOrderStock` gate (approve / pay / dispatch) accept a catalogue order that has an `ORDER_RESERVE` movement. Non-catalogue orders keep the current hub-inventory path unchanged.

Tests to add: ledger math; REMOVE below 0 rejected; reserve on checkout; concurrent last-kilos → one wins; reject → release (second reject no-op); buyer cancel → release; accept → confirm-bank-payment → dispatch link works for a catalogue order.

## 3. Admin web changes
- **Products:** list shows planned / available / sold kg (progress bar) and "available until". Product page gets a **Stock panel**: Planned / On offer / Sold, buttons **Add stock** / **Remove stock** (kg, optional source lot from Supply, reason required for remove), movement history with running balance (order rows link to the order).
- **Orders:** for `PENDING` catalogue orders add **Accept** and **Reject (reason modal)**; row detail shows buyer company, delivery address, notes, pack (`12 × 5 kg`).

## 4. Buyer account + panel (web)
- Verify the full path: `/register` (buyer) → verification e-mail → `/verify-email` → login → lands on `/buyer-portal/dashboard` (`web/lib/post-login-redirect.ts` already routes BUYER there). Unverified login must say so clearly and offer "resend verification e-mail".
- **New page `/buyer-portal/marketplace`** and nav item **Marketplace** as the first entry in `web/lib/buyer-portal-nav.tsx` (it doesn't exist today). Product grid: image/emoji, name, farm + city, category filter, search, "X kg available", "Available until DD.MM.YYYY", pack chips (price per pack + €/kg). Product view: pack + count (≤ maxPacks), live total → delivery address (prefill from company profile) → confirm → open order detail.
- **Dashboard:** "On offer now" block linking to Marketplace; order counters by real status.
- **Orders + detail:** plain-word timeline Submitted → Accepted / Rejected (reason) → Paid → Preparing → In transit → Delivered → Receipt confirmed; pack info; Cancel for unpaid orders; payment instructions after acceptance (existing `PaymentInstructionsPanel`).
- Same styling as existing buyer-portal pages.

## 5. Buyer mobile
- Shop cards show "X kg available" + "Available until …".
- Order detail: same plain-word status timeline incl. Rejected + reason; push/in-app notification on accept/reject.
- Registration: `mobile/app/buyer-register.tsx` → e-mail verification → login lands in buyer tabs with the shop first.

## 6. Acceptance criteria (replace the original list)
1. Admin → Supply shows every planting/harvest plan from the mobile app; numbers match the DB.
2. Admin creates "Raspberry" (planned 1 000 kg), packs 500 g €2.40 / 5 kg €19 / 10 kg €35, **adds 600 kg stock**, sets available until, publishes.
3. **New buyer registers** on web, verifies e-mail, logs in → dashboard → **Marketplace** shows Raspberry, 600 kg, the date, 3 packs.
4. Buyer orders 12 × 5 kg → **Submitted**, €228.00, 60 kg → available drops to **540 kg** immediately (admin + shop).
5. Over-ordering is rejected with a clear message.
6. Admin rejects a 2nd order with reason → buyer sees **Rejected + reason**, kilos return. Buyer cancels a 3rd unpaid order → kilos return.
7. Admin accepts order 1 → buyer sees **Accepted** + payment instructions → admin confirms payment → **Paid** → Dispatch link → delivery flow → buyer confirms receipt → **Completed**, escrow released.
8. Admin **removes 40 kg** ("quality") → 500 kg; history shows every movement with running balance.
9. Changing the 5 kg price later doesn't change existing orders; archiving hides the product from both shops, orders stay.
10. The same flow works from the **mobile** buyer app.
11. All text English via i18n keys; styling identical to existing admin / buyer-portal pages.
12. `backend: npx jest && npm run test:integration`; `web: npx tsc --noEmit`; `mobile: npx tsc --noEmit && npm test` — all green.
