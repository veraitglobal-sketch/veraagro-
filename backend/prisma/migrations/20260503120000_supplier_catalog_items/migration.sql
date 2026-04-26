-- Partner store product catalog (seeds, inputs, packaging) — reference list for grower B2B orders
CREATE TABLE "supplier_catalog_items" (
    "id" TEXT NOT NULL,
    "supplierUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "listPrice" DOUBLE PRECISION,
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "supplier_catalog_items_supplierUserId_isActive_idx" ON "supplier_catalog_items"("supplierUserId", "isActive");
CREATE INDEX "supplier_catalog_items_supplierUserId_sortOrder_idx" ON "supplier_catalog_items"("supplierUserId", "sortOrder");

ALTER TABLE "supplier_catalog_items" ADD CONSTRAINT "supplier_catalog_items_supplierUserId_fkey" FOREIGN KEY ("supplierUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
