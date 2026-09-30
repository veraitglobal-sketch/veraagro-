-- CreateEnum
CREATE TYPE "CatalogStockMovementType" AS ENUM ('ADMIN_ADD', 'ADMIN_REMOVE', 'ORDER_RESERVE', 'ORDER_RELEASE');

-- CreateTable
CREATE TABLE "catalog_stock_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "CatalogStockMovementType" NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT,
    "batchId" TEXT,
    "reason" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_stock_movements_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "catalog_stock_movements_productId_createdAt_idx" ON "catalog_stock_movements"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_stock_movements_orderId_type_key" ON "catalog_stock_movements"("orderId", "type");

-- AddForeignKey
ALTER TABLE "catalog_stock_movements" ADD CONSTRAINT "catalog_stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
