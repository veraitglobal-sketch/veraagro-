# Task: Admin catalogue with packaging, grower plantings overview, and packaging-aware orders

Monorepo: `backend/` (NestJS + Prisma + PostgreSQL), `web/` (Next.js App Router, admin + buyer portal), `mobile/` (Expo Router app for growers, buyers, logistics, suppliers).

## Goal (what the business needs) — one connected flow

**Bio Vera builds the marketplace itself.** Admin decides what is on offer, how much, in which packaging, at what price and until when. Stock is a real, auditable balance: admin adds and removes kilos, every order takes kilos off automatically, cancellations put them back.

End-to-end journey that must work without gaps:

1. **Grower** records plantings / harvest plans / lots in the mobile app → **Admin → Supply** shows all of it (what, where, how much, when).
2. **Admin → Products** creates a marketplace product (optionally from a planting), sets packaging options with prices (500 g / 5 kg / 10 kg …), an "available until" date, and **adds stock** (kg). Publishes it.
3. **Buyer registers** (mobile `buyer-register` or web `/register`), verifies e-mail (account becomes `ACTIVE` — existing `verify-email` flow), signs in and lands in **their buyer panel** (web `/buyer-portal/dashboard`, mobile buyer tabs).
4. In the buyer panel the buyer opens **Marketplace** and sees exactly what Bio Vera offers **right now**: product, farm/origin, packaging options with price per pack and €/kg, **kilos still available**, **available until**, delivery lead time.
5. Buyer picks packaging + number of packs → cart → checkout (delivery address). The order is created as **Submitted** and **the kilos are immediately taken off the available stock** (reserved), so nobody else can buy them.
6. **Admin → Orders** shows the order with packaging. Admin **accepts** or **rejects (with reason)**.
   - Accept → buyer sees **Accepted** + payment instructions (existing bank-transfer / escrow flow, `confirm-bank-payment`).
   - Reject / buyer cancels an unpaid order → kilos go **back** to the available stock automatically.
7. After payment admin assigns the fulfilling farm and links the order to a transport mission in **Admin → Dispatch** (existing). From there the existing delivery flow runs: carrier claims → loading handover → departure → transit → buyer receiving code → handover with photos + signature → buyer confirms receipt → escrow released.
8. At every step the buyer sees the current status in their panel (web + mobile) and gets a notification; admin sees the same order with full history.

## Hard rules

- **English is the base language.** Every new UI string goes through i18n keys with `en` as the source (`web/locales/en.json`, `mobile/i18n/locales/en.json`). Do not hardcode Serbian/German text anywhere (backend notification texts are English literals). Other locales fall back to `en`; translations come later.
- **Design must match the existing web admin exactly.** Use `SidebarLayout` + `useAdminNavItems()` + `AuthGuard requiredRoles={['SUPER_ADMIN','ADMIN']}` like every page in `web/app/admin/*`. Reuse `web/components/ui/Premium.tsx` (`PremiumCard`, `PremiumStatCard`, `PremiumPageTitle`, `PremiumButton`, `PremiumEyebrow`) and the existing Tailwind patterns from `web/app/admin/orders/page.tsx` and `web/app/admin/missions/page.tsx` (white cards, `border-gray-200`, brand green `#2D5A27` / hover `#23471f`, `text-sm`, tables with `divide-y`). No new design system, no new colors, no new fonts.
- Mobile screens follow the existing compact "enterprise" style: `mobile/lib/enterprise-ui.ts`, `mobile/design-system/*` (`EnterpriseNavSection`, `EnterpriseButton`, `EnterprisePageTitle`), `TouchableOpacity` (not `Pressable` with style functions — NativeWind breaks them).
- **Real data only.** No placeholders, no mock arrays, no fake numbers. Empty states must say what to do next.
- Never touch production DB. New Prisma migration in `backend/prisma/migrations/<timestamp>_catalog_products_packaging/`. Migrations are not run on deploy; they are applied with `railway run npx prisma migrate deploy` by the owner.
- Do not break existing flows: stock (`inventory`) products, market-price products, stock reservation, dispatch, delivery, receiving code, escrow. All existing tests must stay green.

## 1. Data model (Prisma, `backend/prisma/schema.prisma`)

```prisma
enum CatalogProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

/// Admin-managed marketplace product: planned season quantity sold in fixed packs.
model catalog_products {
  id                String                 @id @default(uuid())
  name              String                 // shown to buyers, e.g. "Raspberry – Willamette"
  category          String?                // FRUIT | VEGETABLE | GRAIN | OTHER (drives shop filters + icon)
  description       String?
  imageUrl          String?                // durable URL (reuse backend/src/common/durable-image.ts for uploads)
  estateId          String?                // supplying farm
  sourcePlantingId  String?                // optional link to the grower planting it comes from (harvest_announcements.id)
  plannedQuantityKg Float                  // total sellable quantity for this product
  availableFrom     DateTime?
  availableUntil    DateTime?
  status            CatalogProductStatus   @default(DRAFT)
  createdBy         String?
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  estate            estates?               @relation(fields: [estateId], references: [id])
  packOptions       catalog_pack_options[]
  orders            orders[]
  @@index([status])
  @@index([estateId])
}

/// A sellable packaging of a catalogue product (500 g, 5 kg, 10 kg …) with its own price.
model catalog_pack_options {
  id           String           @id @default(uuid())
  productId    String
  label        String           // "500 g", "5 kg crate"
  packSizeKg   Float            // 0.5, 5, 10
  pricePerPack Float            // EUR, gross price the buyer pays per pack
  isActive     Boolean          @default(true)
  sortOrder    Int              @default(0)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  product      catalog_products @relation(fields: [productId], references: [id], onDelete: Cascade)
  orders       orders[]
  @@index([productId])
}
```

**Stock ledger (required — this is how kilos go on and off the offer):**

```prisma
enum CatalogStockMovementType {
  ADMIN_ADD        // admin puts kilos on offer (harvest came in, new lot)
  ADMIN_REMOVE     // admin takes kilos off (spoilage, sold elsewhere, correction) — reason required
  ORDER_RESERVE    // buyer order took kilos (negative)
  ORDER_RELEASE    // order rejected / cancelled / refunded before dispatch (positive)
}

model catalog_stock_movements {
  id         String                   @id @default(uuid())
  productId  String
  type       CatalogStockMovementType
  quantityKg Float                    // signed: + adds to available, − takes away
  orderId    String?                  // for ORDER_* rows
  batchId    String?                  // optional: which lot the kilos came from (ADMIN_ADD)
  reason     String?
  actorId    String?
  createdAt  DateTime                 @default(now())
  product    catalog_products         @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@index([productId, createdAt])
  @@unique([orderId, type])           // one reserve + at most one release per order (idempotent)
}
```

`availableKg` for a product = **sum of `quantityKg` of its movements** (never negative — enforce in the transaction). `plannedQuantityKg` on the product stays as the *season plan* (information for admin, e.g. "planned 1 000 kg, 600 kg on offer now, 250 kg sold"); the shop sells only `availableKg`.

Add to `orders` (all nullable; existing orders stay valid):

```prisma
catalogProductId String?
packOptionId     String?
packLabel        String?   // snapshot at order time
packSizeKg       Float?    // snapshot
packCount        Int?
catalogProduct   catalog_products?     @relation(fields: [catalogProductId], references: [id])
packOption       catalog_pack_options? @relation(fields: [packOptionId], references: [id])
```

and the back-relation `catalog_products catalog_products[]` on `estates`.

Snapshot fields matter: if admin later changes a pack price/label, existing orders keep what the buyer saw.

**Derived numbers (compute in the service, don't store):**
- `availableKg` = sum of the product's stock movements.
- `soldKg` = −sum of `ORDER_RESERVE` + sum of `ORDER_RELEASE` (net kilos in live orders).
- per pack option: `maxPacks = floor(availableKg / packSizeKg)`; `pricePerKg = pricePerPack / packSizeKg`.
- Add `catalog_stock_movements catalog_stock_movements[]` to `catalog_products`.

## 2. Backend

New module `backend/src/catalog/` (`catalog.module.ts`, `catalog.controller.ts`, `catalog.service.ts`, `dto/*.ts`), registered in `app.module.ts`. Use class-validator DTOs (the global ValidationPipe has `whitelist + forbidNonWhitelisted`).

### Admin endpoints (`@UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN','SUPER_ADMIN')`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/catalog/admin/products` | all products incl. DRAFT/ARCHIVED, with packOptions, estate name, planned / available / sold kg, order count |
| GET | `/catalog/admin/products/:id` | one product + its orders (orderNumber, buyer, pack, count, kg, total, status) |
| POST | `/catalog/admin/products` | create (DRAFT) |
| PATCH | `/catalog/admin/products/:id` | edit fields (name, category, description, image, farm, planned kg, availability window) |
| POST | `/catalog/admin/products/:id/publish` | requires ≥1 active pack option, `availableKg > 0`, name, `availableUntil` in the future |
| POST | `/catalog/admin/products/:id/archive` | hides from shop; existing orders unaffected |
| POST | `/catalog/admin/products/:id/pack-options` | add option (`label`, `packSizeKg > 0`, `pricePerPack > 0`, `sortOrder`) |
| PATCH | `/catalog/admin/pack-options/:id` | edit/deactivate; if the option already has orders, only `isActive`, `sortOrder` and `pricePerPack` (future orders) may change — never delete it |
| GET | `/catalog/admin/supply` | grower supply overview (see §3) |
| POST | `/catalog/admin/products/:id/stock` | `{ type: 'ADMIN_ADD' \| 'ADMIN_REMOVE', quantityKg > 0, reason?, batchId? }` — REMOVE requires a reason and may not take available below 0 |
| GET | `/catalog/admin/products/:id/stock` | movement history (date, type, kg, order number, lot, reason, who) + running balance |

Write an `audit_trails` row for create/publish/archive/price change (same pattern as `backend/src/orders/order-stock.ts` `audit()`).

### Public/buyer endpoints (JWT not required for read)
| GET | `/catalog/products` | only `PUBLISHED`, inside availability window, with active options and `availableKg > 0`; returns `availableKg`, `availableUntil`, farm name/city, category, image, and per option `maxPacks` + `pricePerKg` |
| GET | `/catalog/products/:id` | same shape for one product; 404 if not published |

### Ordering with packaging (`backend/src/orders/`)
- `CreateOrderDto` gets optional `packOptionId?: string` and `packCount?: number` (`@IsInt() @Min(1)`). Include both in the idempotency `requestHash` in `orders.service.ts#create`.
- In `order-pricing.ts` add `resolveCatalogPackPrice(tx, data)` used when `packOptionId` is present:
  - `SELECT … FROM catalog_products WHERE id = … FOR UPDATE` (serialize concurrent buyers on the same product).
  - Product must be PUBLISHED and within its window; option active and belonging to it.
  - `kg = packCount × packSizeKg`; reject with a clear 400 if `kg > availableKg` (`"Only X kg left — max N packs of 5 kg"`).
  - Server is the price source of truth: `unitPrice = pricePerPack / packSizeKg` (per kg, 4 decimals), `totalAmount = packCount × pricePerPack` (2 decimals), `quantity = kg`, `unit = 'kg'`, `productName = product.name`, `fulfillingEstateId = product.estateId`, plus the pack snapshot fields and `catalogProductId`/`sourceCatalogId`.
  - In the **same transaction** insert the `ORDER_RESERVE` movement (`quantityKg = −kg`, `orderId`). This is what takes the kilos off the offer.
- **Release kilos back** (insert `ORDER_RELEASE`, idempotent via the unique `[orderId, type]`) whenever a catalogue order is: rejected by admin, cancelled by the buyer (`POST /orders/:id/cancel`, existing `cancelTx`), cancelled by admin, or refunded before dispatch. Never release after the goods left the farm.
- **Admin accept / reject:** keep `POST /orders/admin/:id/approve` (→ `APPROVED`); add `POST /orders/admin/:id/reject` `{ reason }` (only `PENDING`/`APPROVED` unpaid orders → `CANCELLED` + release + buyer notification with the reason). Buyer notifications (English): `Order accepted` (with "pay by bank transfer" hint), `Order rejected` (reason), `Payment received`, then the existing delivery notifications.
- Catalogue orders do **not** use the hub `inventory` reservation at checkout (the ledger is the stock). At dispatch time admin still sets the fulfilling farm; make the existing `requireOrderStock` check pass for catalogue orders that have an `ORDER_RESERVE` movement (treat that as their reservation) so approve → pay → dispatch works without a hub inventory row. Keep the hub-inventory path unchanged for non-catalogue orders.
- Include `catalogProduct { id, name }` and the pack fields in `GET /orders/admin/all`, buyer `GET /orders`, `GET /orders/:id`, and grower `GET /orders/grower` responses.
- Notify admins on a new catalogue order (English): title `New marketplace order`, message `ORDER-NO: 12 × 5 kg Raspberry (60 kg) — €228.00`.

### Tests (must add)
- `backend/src/catalog/catalog.service.spec.ts`: availableKg ledger math, ADMIN_REMOVE cannot go below 0 and needs a reason, publish validation, pack option with orders cannot be deleted.
- Extend `backend/test/orders.integration-spec.ts`: buyer orders packs → order has snapshot + correct totals and an `ORDER_RESERVE` movement; available drops; overselling rejected; two concurrent orders for the last kilos → exactly one succeeds; admin reject → `ORDER_RELEASE` and available restored (repeat reject is a no-op); buyer cancel of unpaid order → released; archived product → 400; accept → confirm payment → link mission in dispatch works for a catalogue order.
- Run: `cd backend && npx jest` and `npm run test:integration` (uses a disposable Postgres; needs `JWT_SECRET` set).

## 3. Admin web

Add nav items in `web/lib/admin-nav.tsx`: **Supply** (`/admin/supply`) and keep **Products** (`/admin/products`).

### 3a. `/admin/supply` — "What growers planted" (new page)
Source data already exists: `harvest_announcements` (announcementType `PLANTING` / `HARVEST`, `cropType`, `estimatedDate`, `estimatedQuantity`, `loadQuantityKg`, `marketChannel`, `qualityGrade`, `status`, `actualQuantity`, `parcelId`, `userId`), `parcels`, `estates`, `batches`, `growth_logs`. Existing partial views: `web/app/admin/harvest-plans/page.tsx`, `web/app/admin/grower-control/page.tsx` (tabs transport/growth/plantings/plans) — reuse their API helpers (`harvestAnnouncementsAPI`) and do not duplicate their edit actions; link to them.

`GET /catalog/admin/supply` returns one row per planting/harvest plan with: grower (name, partnerCode), farm, parcel (name, area, crop, BIO status), crop, planting date, expected harvest date, expected kg, harvested kg so far (sum of batches), lots (batchId, status, kg), latest growth photo date, plan status, and `catalogProductId` if a product was created from it.

Page layout:
- Stat cards (PremiumStatCard): total expected kg this season, harvested kg, kg already in published products, kg still unallocated.
- Filters: crop, grower, farm, harvest month, status; search.
- Table grouped by crop with subtotal rows; row click opens a side panel with parcel/lot/growth-photo details and links to Admin → Grower control and the lot.
- Row action **Create product from this** → opens the product form prefilled (name = crop, estate, sourcePlantingId, planned kg = expected kg minus kg already in products).

### 3b. `/admin/products` — replace the placeholder
Current file is an empty placeholder with a disabled button.
- List (table): image, name, category, farm, planned kg, available kg, sold kg (progress bar), available until, pack options summary (`500 g €2.40 · 5 kg €19.00`), status badge (Draft/Published/Archived), orders count, actions (Edit, Publish/Archive, View orders).
- Create/Edit form (modal or `/admin/products/[id]`): name, category, description, image upload, supplying farm (select from `estatesAPI`), source planting (optional select from supply), planned kg, availability from/until.
- **Packaging editor** inside the form: rows of label / pack size (kg, allow 0.5) / price per pack (€) / active toggle / order; shows computed €/kg and max packs; add/remove rows (remove only if no orders).
- Publish is disabled with an inline reason until requirements are met.
- **Stock panel** on the product: big numbers Planned / On offer (available) / Sold; buttons **Add stock** and **Remove stock** (kg, optional source lot from Supply, reason — required for remove); movement history table with running balance (order movements link to the order).
- Product detail shows its orders (links to Admin → Orders filtered to the order).

### 3c. `/admin/orders` — show packaging
- Product column: `Raspberry – Willamette` + `12 × 5 kg` (pack) + `60 kg`; total stays as today.
- Filter: "Marketplace (catalogue) orders".
- Row actions for `PENDING` catalogue orders: **Accept** and **Reject** (reason modal). Show the buyer's company, delivery address and notes in the row detail.
- Nothing else changes: fulfilling farm, `OrderStockAllocation`, reopen-for-dispatch, link to Dispatch keep working.

## 4. Buyer — mobile (`mobile/`)
- `mobile/features/buyer/shop/BuyerShopScreen.tsx` loads `inventoryAPI.getAvailableProducts()` today. Also load `GET /catalog/products` (new `catalogAPI` in `mobile/lib/api/`), show catalogue products first; keep inventory products working.
- Shop cards show "X kg available" and "Available until …".
- Product screen (`mobile/app/product/[id].tsx`): for catalogue products show a **packaging selector** (segmented chips: `500 g · €2.40`, `5 kg · €19.00`, `10 kg · €35.00`), a pack-count stepper capped at `maxPacks`, and a live line "`12 × 5 kg = 60 kg · €228.00`". Show "Only X kg left" when remaining is low.
- Cart (`mobile/hooks/useCart.tsx`, `useCartCatalogue.ts`): a cart line for a catalogue product stores `packOptionId`, `packLabel`, `packSizeKg`, `pricePerPack`, `packCount`. Same product with a different pack = separate line.
- Checkout (`mobile/features/buyer/checkout/BuyerCheckoutScreen.tsx`, `ordersAPI.create`): send `packOptionId` + `packCount` (plus quantity kg / unit 'kg' / unitPrice per kg / productName for compatibility). Keep the existing `clientRequestId` idempotency.
- Order detail shows the pack (`12 × 5 kg`) and the same plain-word status timeline as web (Submitted / Accepted / Rejected + reason / Paid / …); push + in-app notification on accept/reject.
- Registration: `mobile/app/buyer-register.tsx` → e-mail verification → login lands in the buyer tabs with the shop first. Check the whole path on the iOS simulator.
- Product emoji: reuse `mobile/lib/product-emoji.ts`.

## 5. Buyer — web (`web/app/buyer-portal/*`) and account

- **Registration → panel:** verify the whole path works: `/register` (buyer) → verification e-mail → `/verify-email` → login → `getPathAfterWebLogin` sends BUYER to `/buyer-portal/dashboard` (already fixed in `web/lib/post-login-redirect.ts`). If the account is not verified yet, the login error must say so clearly and offer "resend verification e-mail".
- **New `/buyer-portal/marketplace` page** + nav item **Marketplace** first in `web/lib/buyer-portal-nav.tsx` (the buyer panel has no marketplace entry today). Grid of published products: image/emoji, name, farm + city, category filter, search, "X kg available", "Available until DD.MM.YYYY", packaging chips with price per pack and €/kg. Product modal/page: choose packaging + pack count (capped at `maxPacks`), live total, "Order" → delivery address (prefill from company profile) → confirm → redirect to the order detail.
- Dashboard (`/buyer-portal/dashboard`): add a "Marketplace — on offer now" block (top products + link) and make the order counters use the real statuses (Submitted / Accepted / Paid / In delivery / Delivered).
- **Orders** (`/buyer-portal/orders` + detail): status timeline in plain words — Submitted → Accepted (or Rejected with reason) → Paid → Preparing → In transit → Delivered → Receipt confirmed; pack info (`12 × 5 kg`); "Cancel" for unpaid orders; payment instructions after acceptance (existing `PaymentInstructionsPanel`).
- Match the existing buyer-portal styling (`SidebarLayout`, same cards/typography as `buyer-portal/orders`).

## 6. Grower visibility (small)
In the grower order list (`GET /orders/grower`, mobile `ordersAPI.getForGrower`) show pack info for catalogue orders fulfilled by their farm.

## Acceptance criteria (verify each, locally, in this order)
1. Admin → Supply lists every planting/harvest plan entered in the mobile app with farm, parcel, crop, dates, expected/harvested kg — numbers match the DB.
2. Admin creates "Raspberry" from a planting (planned 1 000 kg), adds packs 500 g €2.40 / 5 kg €19 / 10 kg €35, **adds stock 600 kg**, sets available until, publishes.
3. A **new buyer registers** on web, verifies e-mail, logs in → lands on `/buyer-portal/dashboard` → **Marketplace** shows Raspberry with 600 kg available, the date and the 3 packs.
4. Buyer orders 12 × 5 kg → order **Submitted**, total €228.00, 60 kg → available in admin and in the shop drops to **540 kg** immediately.
5. Ordering more than available is rejected with a clear message.
6. Admin rejects a second test order with a reason → buyer sees **Rejected + reason**, kilos come back. Buyer cancels a third unpaid order → kilos come back.
7. Admin accepts the first order → buyer sees **Accepted** + payment instructions → admin confirms bank payment → **Paid** → admin links it to a mission in Dispatch → carrier/buyer delivery flow completes → buyer confirms receipt → order **Completed**, escrow released.
8. Admin **removes 40 kg** (reason "quality") → available 500 kg; the stock history shows every movement with running balance.
9. Changing the 5 kg price afterwards does not change the existing order. Archiving hides the product from both shops; its orders stay.
10. The same product/order flow works from the **mobile** buyer app (shop → pack → cart → checkout → status).
11. All UI text is English via i18n keys; admin and buyer-portal pages look identical in style to the existing pages.
12. `backend: npx jest`, `npm run test:integration`; `web: npx tsc --noEmit`; `mobile: npx tsc --noEmit && npm test` — all green.

## Local dev notes
- Node 22: `export PATH=$HOME/.nvm/versions/node/v22.23.2/bin:$PATH`.
- Local Postgres `postgresql://jovicamihajlovic@localhost:5432/biovera_db` (postgresql@14). Local test users `LOCAL-ADMIN/-FARMER/-BUYER/-LOGISTICS/-SUPPLIER` from `backend/scripts/seed-local-dev.cjs` (password in gitignored `backend/scripts/local-dev-users.json`).
- Backend: `cd backend && npm run build && PORT=3000 FRONTEND_URL=http://localhost:3001 node dist/main`. Web: `cd web && NEXT_PUBLIC_API_URL=http://localhost:3000 npx next dev -p 3001`.
