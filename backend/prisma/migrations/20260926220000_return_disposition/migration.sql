ALTER TABLE "delivery_returns" ADD COLUMN "stockStatus" TEXT NOT NULL DEFAULT 'QUARANTINED', ADD COLUMN "stockRevision" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "return_dispositions" (
 "id" TEXT NOT NULL PRIMARY KEY, "returnId" TEXT NOT NULL, "revision" INTEGER NOT NULL,
 "action" TEXT NOT NULL, "quantity" DOUBLE PRECISION NOT NULL, "unit" TEXT NOT NULL, "notes" TEXT NOT NULL,
 "photos" TEXT[] DEFAULT ARRAY[]::TEXT[], "createdBy" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "requestHash" TEXT NOT NULL,
 "inventoryId" TEXT, "previousQuantity" DOUBLE PRECISION, "countedQuantity" DOUBLE PRECISION,
 "previousInventoryStatus" TEXT, "previousExpiresAt" TIMESTAMP(3), "restockExpiresAt" TIMESTAMP(3),
 CONSTRAINT "return_disposition_action" CHECK ("action" IN ('QUARANTINE', 'WRITE_OFF', 'RESTOCK')),
 CONSTRAINT "return_disposition_quantity" CHECK ("quantity" > 0 AND "quantity" < 'Infinity'::float8),
 CONSTRAINT "return_disposition_count" CHECK (("action" = 'RESTOCK' AND "inventoryId" IS NOT NULL AND "previousQuantity" IS NOT NULL AND "countedQuantity" IS NOT NULL AND "countedQuantity" >= "quantity" AND "countedQuantity" < 'Infinity'::float8 AND "restockExpiresAt" IS NOT NULL) OR ("action" <> 'RESTOCK' AND "inventoryId" IS NULL AND "previousQuantity" IS NULL AND "countedQuantity" IS NULL AND "restockExpiresAt" IS NULL)),
 CONSTRAINT "return_dispositions_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "delivery_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "return_dispositions_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "return_dispositions_returnId_revision_key" ON "return_dispositions"("returnId", "revision");
CREATE INDEX "return_dispositions_inventoryId_idx" ON "return_dispositions"("inventoryId");
