-- Link new orders to explicit stock reservations; historical shipments are not backfilled.
ALTER TABLE "orders" ADD COLUMN "sourceCatalogId" TEXT;
CREATE TABLE "order_stock_reservations" (
 "id" TEXT NOT NULL PRIMARY KEY, "orderId" TEXT NOT NULL, "inventoryId" TEXT NOT NULL,
 "quantity" DOUBLE PRECISION NOT NULL, "unit" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'RESERVED',
 "reservedBy" TEXT NOT NULL, "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "issuedAt" TIMESTAMP(3), "releasedAt" TIMESTAMP(3),
 CONSTRAINT "order_stock_positive" CHECK ("quantity" > 0 AND "quantity" < 'Infinity'::float8),
 CONSTRAINT "order_stock_state" CHECK (("status" = 'RESERVED' AND "issuedAt" IS NULL AND "releasedAt" IS NULL) OR ("status" = 'ISSUED' AND "issuedAt" IS NOT NULL AND "releasedAt" IS NULL) OR ("status" = 'RELEASED' AND "issuedAt" IS NULL AND "releasedAt" IS NOT NULL)),
 CONSTRAINT "order_stock_reservations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "order_stock_reservations_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "order_stock_reservations_orderId_key" ON "order_stock_reservations"("orderId");
CREATE INDEX "order_stock_reservations_inventoryId_status_idx" ON "order_stock_reservations"("inventoryId", "status");
